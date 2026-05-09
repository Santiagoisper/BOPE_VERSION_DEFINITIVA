import { randomUUID } from "node:crypto";
import { sql, nextTaskId } from "@/lib/db";
import type { SoldierId } from "@/lib/types";
import { buildJohnPlan } from "./planner";
import { defaultModelFor, executeWithEngine } from "./engines";
import type { MissionRuntimeContext, RuntimePlan, RuntimeTaskPlan, RuntimeTaskRecord } from "./types";

const DEFAULT_TASK_TIMEOUT_MS = 120_000;
const FAST_TASK_TIMEOUT_MS = 75_000;

function soldierSystemPrompt(agent: SoldierId, goal: string): string {
  return `Eres ${agent} dentro del batallon BOPE.
Trabajas sobre una mision activa de software.
Responde en espanol, operativo y conciso.
Objetivo principal: ${goal}
Si te bloqueas, dilo con claridad.
Si necesitas ayuda lateral, indicarlo explicitamente.
Entrega:
- resumen breve de trabajo
- hallazgos
- cambios o pasos ejecutados
- riesgos pendientes`;
}

function summarizeChunk(chunk: string): string[] {
  return chunk
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.length > 240 ? `${line.slice(0, 237)}...` : line)
    .slice(-4);
}

async function insertMessage(input: {
  missionUuid: string;
  taskUuid?: string;
  from: string;
  to: string;
  direction: "DOWN" | "UP" | "LATERAL";
  kind: "ORDER" | "REPORT" | "SUGGESTION" | "REQUEST_HELP" | "TOOL_CALL" | "TOOL_RESULT" | "APPROVAL_REQUEST";
  priority: string;
  status?: string;
  summary?: string;
  payload?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
  requiresApproval?: boolean;
}) {
  await sql`
    INSERT INTO bope_messages (
      mission_id, task_id, from_agent, to_agent,
      direction, kind, priority, status, summary,
      payload, evidence, requires_approval
    ) VALUES (
      ${input.missionUuid}::uuid,
      ${input.taskUuid ?? null}::uuid,
      ${input.from},
      ${input.to},
      ${input.direction},
      ${input.kind},
      ${input.priority},
      ${input.status ?? null},
      ${input.summary ?? null},
      ${JSON.stringify(input.payload ?? {})},
      ${JSON.stringify(input.evidence ?? {})},
      ${input.requiresApproval ?? false}
    )
  `;
}

async function createTask(missionUuid: string, task: RuntimeTaskPlan): Promise<{ id: string; task_id: string }> {
  const taskId = await nextTaskId();
  const rows = await sql`
    INSERT INTO bope_tasks (
      task_id, mission_id, owner, status, description, escalation_to, evidence
    ) VALUES (
      ${taskId},
      ${missionUuid}::uuid,
      ${task.agent},
      'PENDING',
      ${task.goal},
      'RAMBO',
      ${JSON.stringify({
        engine: task.engine,
        channel: task.channel,
        depends_on: task.depends_on,
        allow_lateral_help: task.allow_lateral_help,
        help_targets: task.help_targets,
      })}
    )
    RETURNING id, task_id
  `;

  return {
    id: rows[0].id as string,
    task_id: rows[0].task_id as string,
  };
}

async function updateTaskStatus(taskUuid: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED" | "CANCELLED", result?: string) {
  await sql`
    UPDATE bope_tasks
    SET status = ${status}, result = ${result ?? null}, updated_at = NOW()
    WHERE id = ${taskUuid}::uuid
  `;
}

async function executeTaskRecord(
  context: MissionRuntimeContext,
  task: RuntimeTaskRecord,
  priority: string,
): Promise<"completed" | "blocked"> {
  return executeSingleTask(context, task, task.id, task.task_id, priority);
}

async function markMissionAgents(missionUuid: string, agents: SoldierId[]) {
  await sql`
    UPDATE bope_missions
    SET active_agents = ${agents},
        updated_at = NOW()
    WHERE id = ${missionUuid}::uuid
  `;
}

async function executeSingleTask(
  context: MissionRuntimeContext,
  task: RuntimeTaskPlan,
  taskUuid: string,
  taskCode: string,
  priority: string,
): Promise<"completed" | "blocked"> {
  await updateTaskStatus(taskUuid, "IN_PROGRESS");
  await insertMessage({
    missionUuid: context.missionUuid,
    taskUuid,
    from: "RAMBO",
    to: task.agent,
    direction: "DOWN",
    kind: "ORDER",
    priority,
    status: "IN_PROGRESS",
    summary: `[${taskCode}] ${task.goal}`,
    payload: {
      engine: task.engine,
      channel: task.channel,
      lateral_help: task.allow_lateral_help,
      help_targets: task.help_targets,
    },
  });

  if (task.allow_lateral_help) {
    for (const helper of task.help_targets) {
      await insertMessage({
        missionUuid: context.missionUuid,
        taskUuid,
        from: task.agent,
        to: helper,
        direction: "LATERAL",
        kind: "REQUEST_HELP",
        priority,
        summary: `${task.agent} solicita apoyo lateral a ${helper}`,
        payload: { related_task: task.goal },
      });
    }
  }

  try {
    const seenChunkFingerprints = new Set<string>();
    const timeoutMs = task.agent === "LOCO" || task.agent === "BLADE" ? FAST_TASK_TIMEOUT_MS : DEFAULT_TASK_TIMEOUT_MS;
    const result = await executeWithEngine({
      missionUuid: context.missionUuid,
      taskUuid,
      agent: task.agent,
      engine: task.engine,
      channel: task.channel,
      model: defaultModelFor(task.agent, task.engine),
      system: soldierSystemPrompt(task.agent, task.goal),
      timeoutMs,
      prompt: `Mision: ${context.intent}
Prioridad: ${context.priority}
Topologia: ${task.depends_on.length > 0 ? "dependiente" : "libre"}
Tarea: ${task.goal}
Mensajes recientes:
${context.recentMessages.slice(0, 8).map((msg) => `${msg.from_agent} -> ${msg.to_agent}: ${msg.summary ?? msg.kind}`).join("\n")}

Resuelve tu frente y reporta de forma operativa.`,
      maxTokens: task.max_tokens,
      onChunk: async (chunk) => {
        for (const line of summarizeChunk(chunk)) {
          const fingerprint = `${task.agent}:${line}`;
          if (seenChunkFingerprints.has(fingerprint)) {
            continue;
          }
          seenChunkFingerprints.add(fingerprint);
          await insertMessage({
            missionUuid: context.missionUuid,
            taskUuid,
            from: task.agent,
            to: "RAMBO",
            direction: "UP",
            kind: "REPORT",
            priority,
            status: "IN_PROGRESS",
            summary: line,
            payload: {
              stream: true,
              engine: task.engine,
              channel: task.channel,
            },
          });
        }
      },
    });

    await updateTaskStatus(taskUuid, "COMPLETED", result.content.slice(0, 4000));
    await insertMessage({
      missionUuid: context.missionUuid,
      taskUuid,
      from: task.agent,
      to: "RAMBO",
      direction: "UP",
      kind: "REPORT",
      priority,
      status: "COMPLETED",
      summary: `${task.agent} completo su frente via ${result.via}`,
      payload: {
        result: result.content.slice(0, 4000),
        engine: result.engine,
        channel: result.channel,
        model: result.model,
        cost_usd: result.costUsd,
        timeout_ms: timeoutMs,
      },
    });
    return "completed";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateTaskStatus(taskUuid, "BLOCKED", message.slice(0, 4000));
    await insertMessage({
      missionUuid: context.missionUuid,
      taskUuid,
      from: task.agent,
      to: "RAMBO",
      direction: "UP",
      kind: "REPORT",
      priority,
      status: "BLOCKED",
      summary: `${task.agent} quedo bloqueado`,
      payload: { error: message, engine: task.engine, channel: task.channel },
    });
    return "blocked";
  }
}

async function runPlan(context: MissionRuntimeContext, plan: RuntimePlan): Promise<void> {
  const createdTasks = await Promise.all(plan.tasks.map(async (task) => ({
    plan: task,
    task: await createTask(context.missionUuid, task),
  })));

  await markMissionAgents(context.missionUuid, plan.tasks.map((task) => task.agent));

  const byAgent = new Map(createdTasks.map((entry) => [entry.plan.agent, entry]));
  const pending = new Set(plan.tasks.map((task) => task.agent));
  const completed = new Set<string>();

  while (pending.size > 0) {
    const ready = plan.tasks.filter((task) => pending.has(task.agent) && task.depends_on.every((dep) => completed.has(dep)));
    if (ready.length === 0) {
      break;
    }

    const wave = plan.topology === "parallel"
      ? ready.slice(0, Math.max(1, plan.max_concurrency))
      : ready.slice(0, 1);

    await Promise.all(wave.map(async (task) => {
      const taskRef = byAgent.get(task.agent);
      if (!taskRef) {
        return;
      }
      const status = await executeSingleTask(context, task, taskRef.task.id, taskRef.task.task_id, context.priority);
      pending.delete(task.agent);
      if (status === "completed") {
        completed.add(task.agent);
      }
    }));
  }
}

export async function runMissionRuntime(context: MissionRuntimeContext): Promise<{ plan: RuntimePlan; execution_id: string }> {
  const executionId = randomUUID();
  const plan = await buildJohnPlan(context);

  await insertMessage({
    missionUuid: context.missionUuid,
    from: "RAMBO",
    to: "SANTI",
    direction: "UP",
    kind: "REPORT",
    priority: context.priority,
    summary: plan.assessment,
    payload: {
      execution_id: executionId,
      plan,
      rationale: plan.rationale,
    },
  });

  await runPlan(context, plan);

  const [pendingCount] = await sql`
    SELECT COUNT(*)::int AS count
    FROM bope_tasks
    WHERE mission_id = ${context.missionUuid}::uuid
      AND status NOT IN ('COMPLETED', 'CANCELLED')
  `;

  if (Number(pendingCount.count) === 0) {
    await sql`
      UPDATE bope_missions
      SET status = 'COMPLETED',
          closed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${context.missionUuid}::uuid
    `;
  }

  await insertMessage({
    missionUuid: context.missionUuid,
    from: "RAMBO",
    to: "SANTI",
    direction: "UP",
    kind: "REPORT",
    priority: context.priority,
    status: "COMPLETED",
    summary: "Runtime BOPE completo la oleada operativa actual.",
    payload: { execution_id: executionId },
  });

  return { plan, execution_id: executionId };
}

export async function retryTaskRuntime(
  context: MissionRuntimeContext,
  task: RuntimeTaskRecord,
): Promise<{ execution_id: string; task_id: string }> {
  const executionId = randomUUID();

  await insertMessage({
    missionUuid: context.missionUuid,
    taskUuid: task.id,
    from: "RAMBO",
    to: task.agent,
    direction: "DOWN",
    kind: "ORDER",
    priority: context.priority,
    status: "PENDING",
    summary: `Reintento manual del frente ${task.task_id}`,
    payload: { execution_id: executionId, retry: true },
  });

  const status = await executeTaskRecord(context, task, context.priority);

  await insertMessage({
    missionUuid: context.missionUuid,
    taskUuid: task.id,
    from: "RAMBO",
    to: "SANTI",
    direction: "UP",
    kind: "REPORT",
    priority: context.priority,
    status: status === "completed" ? "COMPLETED" : "BLOCKED",
    summary: `Reintento ${task.task_id} finalizado en estado ${status.toUpperCase()}`,
    payload: { execution_id: executionId, task_id: task.task_id },
  });

  return { execution_id: executionId, task_id: task.task_id };
}
