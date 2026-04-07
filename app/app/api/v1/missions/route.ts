export const dynamic = 'force-dynamic';
// POST /api/v1/missions — crear misión
// GET  /api/v1/missions — listar misiones
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sql, nextMissionId } from '@/lib/db';
import { n8nMissionCreated } from '@/lib/adapters/n8n';
import type { BopePriority } from '@/lib/types';

const CreateMissionSchema = z.object({
  intent:      z.string().min(10, 'La intención debe describir la misión'),
  priority:    z.enum(['P0', 'P1', 'P2', 'P3']).default('P2'),
  constraints: z.record(z.string(), z.unknown()).default({}),
  budget_usd:  z.number().positive().default(75),
});

// POST /api/v1/missions
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = CreateMissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { intent, priority, constraints, budget_usd } = parsed.data;
    const mission_id = await nextMissionId();

    const rows = await sql`
      INSERT INTO bope_missions (
        mission_id, intent, priority, status,
        constraints, budget_usd, loco_state, active_agents
      ) VALUES (
        ${mission_id},
        ${intent},
        ${priority as BopePriority},
        'ACTIVE',
        ${JSON.stringify(constraints)},
        ${budget_usd},
        'HOLD',
        '{}'
      )
      RETURNING *
    `;

    const mission = rows[0];

    // Registrar mensaje inicial del sistema
    await sql`
      INSERT INTO bope_messages (
        mission_id, from_agent, to_agent, direction, kind,
        priority, summary, payload, requires_approval
      ) VALUES (
        ${mission.id}::uuid,
        'SANTI', 'RAMBO', 'DOWN', 'ORDER',
        ${priority as BopePriority},
        ${`Nueva misión creada: ${mission_id}`},
        ${JSON.stringify({ intent, mission_id })},
        false
      )
    `;

    // Notificar n8n (fire-and-forget — no bloquea la respuesta)
    n8nMissionCreated({
      mission_id: mission.mission_id,
      intent:     mission.intent,
      priority:   mission.priority,
      budget_usd: Number(mission.budget_usd),
    }).catch(() => {});

    return NextResponse.json({ ok: true, data: mission }, { status: 201 });
  } catch (err) {
    console.error('[POST /missions]', err);
    return NextResponse.json(
      { ok: false, error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// GET /api/v1/missions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status  = searchParams.get('status');
    const limit   = Math.min(Number(searchParams.get('limit')  ?? 20), 100);
    const offset  = Number(searchParams.get('offset') ?? 0);

    const missions = status
      ? await sql`
          SELECT m.*,
            (SELECT COUNT(*) FROM bope_tasks   t WHERE t.mission_id = m.id) AS task_count,
            (SELECT COALESCE(SUM(cost_total_usd),0) FROM bope_costs c WHERE c.mission_id = m.id) AS total_cost_usd
          FROM bope_missions m
          WHERE m.status = ${status}
          ORDER BY m.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `
      : await sql`
          SELECT m.*,
            (SELECT COUNT(*) FROM bope_tasks   t WHERE t.mission_id = m.id) AS task_count,
            (SELECT COALESCE(SUM(cost_total_usd),0) FROM bope_costs c WHERE c.mission_id = m.id) AS total_cost_usd
          FROM bope_missions m
          ORDER BY m.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

    return NextResponse.json({ ok: true, data: missions });
  } catch (err) {
    console.error('[GET /missions]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
