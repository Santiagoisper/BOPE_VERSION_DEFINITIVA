export type AgentId = 'CLAUDE' | 'CODEX' | 'GEMINI';

export type RouterId = AgentId | 'COMMANDER' | 'CC' | 'DEEPSEEK';

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'awaiting_commander';

export type EventType =
  | 'handoff'
  | 'reasoning'
  | 'agent_response'
  | 'error'
  | 'system_log';

export interface NormalizedHistoryEvent {
  agent: RouterId;
  content: string;
}

export interface NormalizedInput {
  mission: {
    slug: string;
    objective: string;
    metadata: Record<string, unknown>;
  };
  task: {
    id: string;
    payload: Record<string, unknown>;
    history: NormalizedHistoryEvent[];
  };
}

export interface NormalizedOutput {
  reasoning: string;
  status: 'completed' | 'failed' | 'handoff';
  nextAgent: RouterId;
  result: string;
  tokens: {
    in: number;
    out: number;
  };
  latencyMs: number;
}
