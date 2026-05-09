export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const tasks = await sql`
      SELECT t.*, m.id AS mission_uuid, m.priority
      FROM bope_tasks t
      JOIN bope_missions m ON m.id = t.mission_id
      WHERE t.id = ${id}::uuid OR t.task_id = ${id}
    `;

    if (tasks.length === 0) {
      return NextResponse.json({ ok: false, error: "Task no encontrada" }, { status: 404 });
    }

    const task = tasks[0];

    await sql`
      UPDATE bope_tasks
      SET status = 'CANCELLED', updated_at = NOW(), result = COALESCE(result, 'Cancelada por operador')
      WHERE id = ${task.id}::uuid
    `;

    await sql`
      INSERT INTO bope_messages (
        mission_id, task_id, from_agent, to_agent,
        direction, kind, priority, status, summary, payload, evidence, requires_approval
      ) VALUES (
        ${task.mission_id}::uuid,
        ${task.id}::uuid,
        'RAMBO', ${task.owner},
        'DOWN', 'ORDER', ${task.priority},
        'CANCELLED', ${`Task ${task.task_id} cancelada por operador`},
        ${JSON.stringify({ cancel: true })},
        ${JSON.stringify({})},
        false
      )
    `;

    return NextResponse.json({ ok: true, data: { task_id: task.task_id, status: "CANCELLED" } });
  } catch (err) {
    console.error("[POST /tasks/:id/cancel]", err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
