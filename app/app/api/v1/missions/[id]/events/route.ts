export const dynamic = 'force-dynamic';
// POST /api/v1/missions/[id]/events — registrar evento en la misión
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql } from '@/lib/db';

const EventSchema = z.object({
  task_id:     z.string().uuid().optional(),
  from_agent:  z.string(),
  to_agent:    z.string(),
  direction:   z.enum(['DOWN', 'UP', 'LATERAL']),
  kind:        z.enum(['ORDER','REPORT','SUGGESTION','REQUEST_HELP','TOOL_CALL','TOOL_RESULT','APPROVAL_REQUEST']),
  priority:    z.enum(['P0','P1','P2','P3']).default('P2'),
  status:      z.enum(['PENDING','IN_PROGRESS','COMPLETED','BLOCKED','CANCELLED']).optional(),
  summary:     z.string().optional(),
  payload:     z.record(z.string(), z.unknown()).default({}),
  evidence:    z.record(z.string(), z.unknown()).default({}),
  requires_approval: z.boolean().default(false),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body   = await req.json();
    const parsed = EventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const missions = await sql`
      SELECT id FROM bope_missions
      WHERE id = ${id}::uuid OR mission_id = ${id}
    `;
    if (missions.length === 0) {
      return NextResponse.json({ ok: false, error: 'Misión no encontrada' }, { status: 404 });
    }

    const mission_id = missions[0].id as string;
    const e = parsed.data;

    // Si el evento actualiza el estado de una tarea, hacerlo
    if (e.task_id && e.status) {
      await sql`
        UPDATE bope_tasks
        SET status = ${e.status}, updated_at = NOW()
        WHERE id = ${e.task_id}::uuid
          AND mission_id = ${mission_id}::uuid
      `;
    }

    // Si la tarea se completa, actualizar la misión
    if (e.kind === 'REPORT' && e.status === 'COMPLETED') {
      const [pendingTasks] = await sql`
        SELECT COUNT(*) AS cnt FROM bope_tasks
        WHERE mission_id = ${mission_id}::uuid
          AND status NOT IN ('COMPLETED','CANCELLED')
      `;
      if (Number(pendingTasks.cnt) === 0) {
        await sql`
          UPDATE bope_missions
          SET status = 'COMPLETED', closed_at = NOW(), updated_at = NOW()
          WHERE id = ${mission_id}::uuid
        `;
      }
    }

    const msgRows = await sql`
      INSERT INTO bope_messages (
        mission_id, task_id, from_agent, to_agent,
        direction, kind, priority, status,
        summary, payload, evidence, requires_approval
      ) VALUES (
        ${mission_id}::uuid,
        ${e.task_id ?? null}::uuid,
        ${e.from_agent}, ${e.to_agent},
        ${e.direction}, ${e.kind},
        ${e.priority}, ${e.status ?? null},
        ${e.summary ?? null},
        ${JSON.stringify(e.payload)},
        ${JSON.stringify(e.evidence)},
        ${e.requires_approval}
      )
      RETURNING *
    `;

    return NextResponse.json({ ok: true, data: msgRows[0] }, { status: 201 });
  } catch (err) {
    console.error('[POST /missions/:id/events]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
