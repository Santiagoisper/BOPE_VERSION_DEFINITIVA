export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { retryTaskRuntime } from "@/lib/runtime/runner";
import type { MissionRuntimeContext, RuntimeTaskRecord } from "@/lib/runtime/types";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const tasks = await sql`
      SELECT t.*, m.id AS mission_uuid, m.mission_id, m.intent, m.priority, m.status AS mission_status, m.loco_state, m.budget_usd
      FROM bope_tasks t
      JOIN bope_missions m ON m.id = t.mission_id
      WHERE t.id = ${id}::uuid OR t.task_id = ${id}
    `;

    if (tasks.length === 0) {
      return NextResponse.json({ ok: false, error: "Task no encontrada" }, { status: 404 });
    }

    const task = tasks[0];
    const [missionTasks, recentMessages] = await Promise.all([
      sql`
        SELECT id, task_id, owner, status, description, result
        FROM bope_tasks
        WHERE mission_id = ${task.mission_id}::uuid
        ORDER BY created_at ASC
      `,
      sql`
        SELECT from_agent, to_agent, kind, status, summary, created_at
        FROM bope_messages
        WHERE mission_id = ${task.mission_id}::uuid
        ORDER BY created_at DESC
        LIMIT 24
      `,
    ]);

    await sql`
      UPDATE bope_tasks
      SET status = 'PENDING', updated_at = NOW()
      WHERE id = ${task.id}::uuid
    `;

    const context: MissionRuntimeContext = {
      missionUuid: task.mission_uuid as string,
      missionSlug: task.mission_id as string,
      intent: task.intent as string,
      priority: task.priority as string,
      status: task.mission_status as string,
      loco_state: task.loco_state as string,
      budget_usd: Number(task.budget_usd),
      tasks: missionTasks as MissionRuntimeContext["tasks"],
      recentMessages: recentMessages as MissionRuntimeContext["recentMessages"],
    };

    const taskRecord: RuntimeTaskRecord = {
      id: task.id as string,
      task_id: task.task_id as string,
      agent: task.owner as RuntimeTaskRecord["agent"],
      goal: task.description as string,
      engine: ((task.evidence as Record<string, unknown>)?.engine as RuntimeTaskRecord["engine"]) ?? "claude",
      channel: ((task.evidence as Record<string, unknown>)?.channel as RuntimeTaskRecord["channel"]) ?? "cli",
      depends_on: (((task.evidence as Record<string, unknown>)?.depends_on as string[]) ?? []),
      allow_lateral_help: Boolean((task.evidence as Record<string, unknown>)?.allow_lateral_help),
      help_targets: (((task.evidence as Record<string, unknown>)?.help_targets as RuntimeTaskRecord["help_targets"]) ?? []),
      max_tokens: ((task.evidence as Record<string, unknown>)?.max_tokens as number | undefined),
      status: task.status as string,
    };

    const result = await retryTaskRuntime(context, taskRecord);
    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    console.error("[POST /tasks/:id/retry]", err);
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 });
  }
}

