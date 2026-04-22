export const dynamic = 'force-dynamic';
// POST /api/mission/[slug]/agent/result — El agente entrega el resultado de su tarea
// Actualiza estado en DB, registra métricas y ejecuta handoff si corresponde.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql, nextTaskId } from '@/lib/db';
import type { SoldierId } from '@/lib/types';

const ResultSchema = z.object({
  taskId: z.string().uuid(),
  status: z.enum(['completed', 'failed']),
  result: z.string(),
  nextAgent: z.string().optional(),
  usage: z
    .object({
      tokensIn: z.number().int().nonnegative(),
      tokensOut: z.number().int().nonnegative(),
    })
    .optional(),
});

interface TaskRow {
  id: string;
  task_id: string;
  mission_id: string;
  owner: string;
}

interface MissionRow {
  id: string;
  mission_id: string;
  priority: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const body = await req.json();
    const parsed = ResultSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { taskId, status, result, nextAgent, usage } = parsed.data;

    // Resolver misión
    const missions = await sql`
      SELECT id, mission_id, priority FROM bope_missions
      WHERE id = ${slug}::uuid OR mission_id = ${slug}
    `;

    if (missions.length === 0) {
      return NextResponse.json({ ok: false, error: 'Misión no encontrada' }, { status: 404 });
    }

    const mission = missions[0] as MissionRow;

    // Obtener tarea
    const tasks = await sql`
      SELECT id, task_id, mission_id, owner FROM bope_tasks
      WHERE id = ${taskId}::uuid AND mission_id = ${mission.id}::uuid
    `;

    if (tasks.length === 0) {
      return NextResponse.json({ ok: false, error: 'Tarea no encontrada' }, { status: 404 });
    }

    const task = tasks[0] as TaskRow;
    const taskStatus = status === 'completed' ? 'COMPLETED' : 'BLOCKED';

    // Actualizar tarea
    await sql`
      UPDATE bope_tasks
      SET status = ${taskStatus},
          result = ${result},
          updated_at = NOW()
      WHERE id = ${task.id}::uuid
    `;

    // Registrar resultado como mensaje REPORT (SSE lo emitirá como AGENT_REPLIED)
    await sql`
      INSERT INTO bope_messages (
        mission_id, task_id, from_agent, to_agent,
        direction, kind, priority, status, summary, payload, requires_approval
      ) VALUES (
        ${mission.id}::uuid,
        ${task.id}::uuid,
        ${task.owner}, 'RAMBO',
        'UP', 'REPORT',
        ${mission.priority},
        ${taskStatus},
        ${result.slice(0, 500)},
        ${JSON.stringify({ taskId, status, result, usage: usage ?? null })},
        false
      )
    `;

    // Handoff: si hay nextAgent y no es COMMANDER, crear nueva tarea
    let newTaskData: { task_id: string; taskUUID: string } | null = null;

    const upperNext = nextAgent?.toUpperCase();
    if (upperNext && upperNext !== 'COMMANDER' && upperNext !== 'SANTI') {
      const newTaskId = await nextTaskId();

      const newTaskRows = await sql`
        INSERT INTO bope_tasks (
          task_id, mission_id, owner, status, description, escalation_to
        ) VALUES (
          ${newTaskId},
          ${mission.id}::uuid,
          ${upperNext as SoldierId},
          'PENDING',
          ${`Handoff desde ${task.owner}: ${result.slice(0, 300)}`},
          'RAMBO'
        )
        RETURNING id, task_id
      `;

      const newTask = newTaskRows[0] as { id: string; task_id: string };

      // Registrar handoff como ORDER (SSE lo emitirá como HANDOFF_INITIATED)
      await sql`
        INSERT INTO bope_messages (
          mission_id, task_id, from_agent, to_agent,
          direction, kind, priority, summary, payload, requires_approval
        ) VALUES (
          ${mission.id}::uuid,
          ${newTask.id}::uuid,
          'RAMBO', ${upperNext},
          'DOWN', 'ORDER',
          ${mission.priority},
          ${`Handoff desde ${task.owner} → ${upperNext}`},
          ${JSON.stringify({ from: task.owner, to: upperNext, reason: result.slice(0, 300) })},
          false
        )
      `;

      newTaskData = { task_id: newTask.task_id, taskUUID: newTask.id };
    }

    return NextResponse.json({
      ok: true,
      data: {
        taskId,
        status: taskStatus,
        ...(newTaskData ? { handoffTask: newTaskData } : {}),
      },
    });
  } catch (err) {
    console.error('[POST /mission/:slug/agent/result]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
