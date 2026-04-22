export const dynamic = 'force-dynamic';
// POST /api/mission/[slug]/agent/handoff — Traspaso formal entre agentes
// Completa la tarea actual y crea la nueva tarea para el agente receptor.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql, nextTaskId } from '@/lib/db';
import type { SoldierId } from '@/lib/types';

const HandoffSchema = z.object({
  taskId: z.string().uuid(),
  reason: z.string().min(5),
  to: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
});

interface TaskRow {
  id: string;
  task_id: string;
  mission_id: string;
  owner: string;
  description: string;
}

interface MissionRow {
  id: string;
  mission_id: string;
  priority: string;
  status: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  try {
    const body = await req.json();
    const parsed = HandoffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { taskId, reason, to, payload = {} } = parsed.data;

    // Resolver misión
    const missions = await sql`
      SELECT id, mission_id, priority, status FROM bope_missions
      WHERE id = ${slug}::uuid OR mission_id = ${slug}
    `;

    if (missions.length === 0) {
      return NextResponse.json({ ok: false, error: 'Misión no encontrada' }, { status: 404 });
    }

    const mission = missions[0] as MissionRow;

    if (mission.status === 'COMPLETED' || mission.status === 'CANCELLED') {
      return NextResponse.json(
        { ok: false, error: `Misión en estado ${mission.status} — handoff no permitido` },
        { status: 409 },
      );
    }

    // Obtener tarea origen
    const tasks = await sql`
      SELECT id, task_id, mission_id, owner, description FROM bope_tasks
      WHERE id = ${taskId}::uuid AND mission_id = ${mission.id}::uuid
    `;

    if (tasks.length === 0) {
      return NextResponse.json({ ok: false, error: 'Tarea origen no encontrada' }, { status: 404 });
    }

    const task = tasks[0] as TaskRow;
    const toAgent = to.toUpperCase() as SoldierId;

    // Completar tarea origen
    await sql`
      UPDATE bope_tasks
      SET status = 'COMPLETED',
          result = ${reason},
          updated_at = NOW()
      WHERE id = ${task.id}::uuid
    `;

    // Crear nueva tarea para el agente receptor
    const newTaskId = await nextTaskId();

    const newTaskRows = await sql`
      INSERT INTO bope_tasks (
        task_id, mission_id, owner, status, description, escalation_to, evidence
      ) VALUES (
        ${newTaskId},
        ${mission.id}::uuid,
        ${toAgent},
        'PENDING',
        ${task.description},
        'RAMBO',
        ${JSON.stringify({ handoff_from: task.owner, reason, payload })}
      )
      RETURNING id, task_id
    `;

    const newTask = newTaskRows[0] as { id: string; task_id: string };

    // Registrar handoff como par de mensajes: REPORT (origen) + ORDER (destino)
    // El SSE emitirá AGENT_REPLIED para REPORT y HANDOFF_INITIATED para ORDER

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
        'COMPLETED',
        ${`[HANDOFF] ${task.owner} → ${toAgent}: ${reason}`},
        ${JSON.stringify({ taskId, reason, to: toAgent })},
        false
      )
    `;

    await sql`
      INSERT INTO bope_messages (
        mission_id, task_id, from_agent, to_agent,
        direction, kind, priority, summary, payload, requires_approval
      ) VALUES (
        ${mission.id}::uuid,
        ${newTask.id}::uuid,
        'RAMBO', ${toAgent},
        'DOWN', 'ORDER',
        ${mission.priority},
        ${`Traspaso desde ${task.owner}: ${reason}`},
        ${JSON.stringify({ from: task.owner, to: toAgent, reason, payload })},
        false
      )
    `;

    return NextResponse.json({
      ok: true,
      data: {
        from: { taskId, agent: task.owner },
        to: {
          task_id: newTask.task_id,
          taskUUID: newTask.id,
          agent: toAgent,
        },
        reason,
      },
    });
  } catch (err) {
    console.error('[POST /mission/:slug/agent/handoff]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
