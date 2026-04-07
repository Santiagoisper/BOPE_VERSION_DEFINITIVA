export const dynamic = 'force-dynamic';
// POST /api/v1/missions/[id]/dispatch — RAMBO despacha órdenes a soldados
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql, nextTaskId } from '@/lib/db';
import { BOPE_CONFIG } from '@/lib/config';
import type { SoldierId, BopePriority } from '@/lib/types';

const OrderSchema = z.object({
  to:          z.string(),
  task:        z.string().min(5),
  priority:    z.enum(['P0','P1','P2','P3']).optional(),
  deadline_at: z.string().datetime().optional(),
  evidence:    z.record(z.string(), z.unknown()).optional(),
});

const DispatchSchema = z.object({
  orders: z.array(OrderSchema).min(1).max(10),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body   = await req.json();
    const parsed = DispatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Resolver misión
    const missions = await sql`
      SELECT * FROM bope_missions
      WHERE id = ${id}::uuid OR mission_id = ${id}
    `;
    if (missions.length === 0) {
      return NextResponse.json({ ok: false, error: 'Misión no encontrada' }, { status: 404 });
    }

    const mission = missions[0];
    if (mission.status === 'COMPLETED' || mission.status === 'CANCELLED') {
      return NextResponse.json(
        { ok: false, error: `Misión en estado ${mission.status} — no se puede despachar` },
        { status: 409 }
      );
    }

    const { orders } = parsed.data;
    const createdTasks = [];

    for (const order of orders) {
      const agent = order.to.toUpperCase() as SoldierId;

      // Verificar si el agente requiere OpenAI (no disponible aún)
      const { SOLDIERS } = await import('@/lib/types');
      const profile = SOLDIERS[agent];
      if (profile?.provider === 'openai' && !process.env.OPENAI_API_KEY) {
        createdTasks.push({
          agent,
          status: 'BLOCKED',
          reason: 'OpenAI API key no configurada — agente en espera',
        });
        continue;
      }

      // Control LOCO
      if (agent === 'LOCO' && mission.loco_state === 'HOLD') {
        // Crear aprobación automática para LOCO en HOLD
        createdTasks.push({
          agent: 'LOCO',
          status: 'BLOCKED',
          reason: 'LOCO en estado HOLD — requiere autorización de RAMBO/SANTI',
        });
        continue;
      }

      const task_id = await nextTaskId();
      const priority = (order.priority ?? mission.priority) as BopePriority;

      // Verificar si la acción requiere aprobación
      const needs_approval = BOPE_CONFIG.approval_required_for.some(a =>
        order.task.toLowerCase().includes(a.replace(/_/g, ' ').toLowerCase())
      );

      const taskRows = await sql`
        INSERT INTO bope_tasks (
          task_id, mission_id, owner, status, description,
          deadline_at, escalation_to, evidence
        ) VALUES (
          ${task_id},
          ${mission.id}::uuid,
          ${agent},
          ${needs_approval ? 'PENDING' : 'IN_PROGRESS'},
          ${order.task},
          ${order.deadline_at ?? null},
          'RAMBO',
          ${JSON.stringify(order.evidence ?? {})}
        )
        RETURNING *
      `;

      const task = taskRows[0];

      // Registrar el mensaje de orden
      await sql`
        INSERT INTO bope_messages (
          mission_id, task_id, from_agent, to_agent,
          direction, kind, priority, summary,
          payload, requires_approval
        ) VALUES (
          ${mission.id}::uuid,
          ${task.id}::uuid,
          'RAMBO', ${agent},
          'DOWN', 'ORDER',
          ${priority},
          ${`[${task_id}] ${order.task}`},
          ${JSON.stringify({ task_id, order: order.task })},
          ${needs_approval}
        )
      `;

      // Actualizar active_agents en la misión
      await sql`
        UPDATE bope_missions
        SET active_agents = array_append(
          CASE WHEN ${agent} = ANY(active_agents) THEN active_agents
               ELSE active_agents END,
          ${agent}
        ),
        updated_at = NOW()
        WHERE id = ${mission.id}::uuid
          AND NOT (${agent} = ANY(active_agents))
      `;

      createdTasks.push({ ...task, needs_approval });
    }

    return NextResponse.json({ ok: true, data: { mission_id: id, tasks: createdTasks } });
  } catch (err) {
    console.error('[POST /missions/:id/dispatch]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
