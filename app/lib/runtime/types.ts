import type { SoldierId } from "@/lib/types";

export type RuntimeEngine = "claude" | "codex";
export type RuntimeChannel = "cli" | "api";
export type RuntimeTopology = "solo" | "sequential" | "parallel";
export type RuntimeRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RuntimeTaskPlan {
  agent: SoldierId;
  goal: string;
  engine: RuntimeEngine;
  channel: RuntimeChannel;
  depends_on: string[];
  allow_lateral_help: boolean;
  help_targets: SoldierId[];
  max_tokens?: number;
}

export interface RuntimeTaskRecord extends RuntimeTaskPlan {
  id: string;
  task_id: string;
  status?: string;
}

export interface RuntimePlan {
  assessment: string;
  rationale: string;
  topology: RuntimeTopology;
  max_concurrency: number;
  risk_level: RuntimeRisk;
  tasks: RuntimeTaskPlan[];
}

export interface MissionRuntimeContext {
  missionUuid: string;
  missionSlug: string;
  intent: string;
  priority: string;
  status: string;
  loco_state: string;
  budget_usd: number;
  tasks: Array<{
    id: string;
    task_id: string;
    owner: string;
    status: string;
    description: string;
    result?: string | null;
  }>;
  recentMessages: Array<{
    from_agent: string;
    to_agent: string;
    kind: string;
    status?: string | null;
    summary?: string | null;
    created_at: string;
  }>;
}

export interface EngineExecutionInput {
  missionUuid: string;
  taskUuid?: string;
  agent: SoldierId;
  engine: RuntimeEngine;
  channel: RuntimeChannel;
  model: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  timeoutMs?: number;
  onChunk?: (chunk: string) => Promise<void> | void;
}

export interface EngineExecutionResult {
  content: string;
  model: string;
  engine: RuntimeEngine;
  channel: RuntimeChannel;
  via: string;
  costUsd: number;
}
