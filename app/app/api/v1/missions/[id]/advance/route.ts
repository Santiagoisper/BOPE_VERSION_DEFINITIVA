export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { runMissionRuntime } from "@/lib/runtime/runner";
import type { MissionRuntimeContext } from "@/lib/runtime/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const missions = await sql`
      SELECT * FROM bope_missions
      WHERE id = ${id}::uuid OR mission_id = ${id}
    `;

    if (missions.length === 0) {
      return NextResponse.json({ ok: false, error: "Misión no encontrada" }, { status: 404 });
    }

    const mission = missions[0];
    if (mission.status === "COMPLETED" || mission.status === "CANCELLED") {
      return NextResponse.json(
        { ok: false, error: `Misión en estado ${mission.status}` },
        { status: 409 },
      );
    }

    const [tasks, recentMessages] = await Promise.all([
      sql`
        SELECT id, task_id, owner, status, description, result
        FROM bope_tasks
        WHERE mission_id = ${mission.id}::uuid
        ORDER BY created_at ASC
      `,
      sql`
        SELECT from_agent, to_agent, kind, status, summary, created_at
        FROM bope_messages
        WHERE mission_id = ${mission.id}::uuid
        ORDER BY created_at DESC
        LIMIT 24
      `,
    ]);

    const context: MissionRuntimeContext = {
      missionUuid: mission.id as string,
      missionSlug: mission.mission_id as string,
      intent: mission.intent as string,
      priority: mission.priority as string,
      status: mission.status as string,
      loco_state: mission.loco_state as string,
      budget_usd: Number(mission.budget_usd),
      tasks: tasks as MissionRuntimeContext["tasks"],
      recentMessages: recentMessages as MissionRuntimeContext["recentMessages"],
    };

    const result = await runMissionRuntime(context);

    return NextResponse.json({
      ok: true,
      data: {
        mission_id: context.missionSlug,
        execution_id: result.execution_id,
        plan: result.plan,
      },
    });
  } catch (err) {
    console.error("[POST /missions/:id/advance]", err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}
