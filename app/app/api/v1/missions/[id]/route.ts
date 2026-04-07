export const dynamic = 'force-dynamic';
// GET /api/v1/missions/[id] — estado completo de una misión
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    // Buscar por UUID o por mission_id legible (e.g. M-2026-04-07-00001)
    const isUUID = /^[0-9a-f-]{36}$/.test(id);

    const missions = isUUID
      ? await sql`SELECT * FROM bope_missions WHERE id = ${id}::uuid`
      : await sql`SELECT * FROM bope_missions WHERE mission_id = ${id}`;

    if (missions.length === 0) {
      return NextResponse.json({ ok: false, error: 'Misión no encontrada' }, { status: 404 });
    }

    const mission = missions[0];
    const mId = mission.id as string;

    // Cargar tareas, mensajes recientes y costos en paralelo
    const [tasks, messages, costs, approvals] = await Promise.all([
      sql`
        SELECT * FROM bope_tasks
        WHERE mission_id = ${mId}::uuid
        ORDER BY created_at ASC
      `,
      sql`
        SELECT * FROM bope_messages
        WHERE mission_id = ${mId}::uuid
        ORDER BY created_at DESC
        LIMIT 50
      `,
      sql`
        SELECT
          agent, provider, model,
          SUM(tokens_input)  AS tokens_input,
          SUM(tokens_output) AS tokens_output,
          SUM(cost_total_usd) AS cost_total_usd
        FROM bope_costs
        WHERE mission_id = ${mId}::uuid
        GROUP BY agent, provider, model
        ORDER BY cost_total_usd DESC
      `,
      sql`
        SELECT * FROM bope_approvals
        WHERE mission_id = ${mId}::uuid
        ORDER BY requested_at DESC
      `,
    ]);

    const total_cost_usd = (costs as { cost_total_usd: number }[])
      .reduce((s, r) => s + Number(r.cost_total_usd), 0);

    return NextResponse.json({
      ok: true,
      data: {
        mission,
        tasks,
        messages,
        costs,
        approvals,
        total_cost_usd: Math.round(total_cost_usd * 1e6) / 1e6,
      },
    });
  } catch (err) {
    console.error('[GET /missions/:id]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
