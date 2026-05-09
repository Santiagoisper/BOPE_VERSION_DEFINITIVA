import type { CommandCenterState, SessionRecord } from "@/domain/models";
import type { MissionPriority, ProviderBudgetInput } from "@/types";

interface CommandCenterStateResponse {
  session: SessionRecord;
  state: CommandCenterState;
}

interface AuthSessionResponse {
  session: SessionRecord;
}

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? `HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

export function getBootstrapStatus() {
  return requestJson<{ bootstrapped: boolean; authenticated: boolean }>("/api/bootstrap-status");
}

export interface EngineStatus {
  claude: { mode: "cli" | "api" | "unavailable"; cliAvailable: boolean; apiKeySet: boolean };
  codex: { mode: "cli" | "api" | "unavailable"; cliAvailable: boolean; apiKeySet: boolean };
  preferApi: boolean;
}

export function getEngineStatusRequest() {
  return requestJson<EngineStatus>("/api/engine-status");
}

export function bootstrapAuth(username: string, password: string) {
  return requestJson<CommandCenterStateResponse>("/api/auth/bootstrap", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function login(username: string, password: string) {
  return requestJson<CommandCenterStateResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export function logout() {
  return requestJson<{ ok: boolean }>("/api/auth/logout", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function getSession() {
  return requestJson<AuthSessionResponse>("/api/auth/me");
}

export function getCommandCenterState() {
  return requestJson<CommandCenterStateResponse>("/api/command-center/state");
}

export function createMissionRequest(input: {
  codename: string;
  title: string;
  objective: string;
  priority: MissionPriority;
  leadAgent: string;
  assignedAgents: string[];
  estimatedBudget: number;
}) {
  return requestJson<{ state: CommandCenterState }>("/api/missions", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createDirectOrderRequest(input: {
  agentId: string;
  message: string;
  priority: MissionPriority;
}) {
  return requestJson<{ state: CommandCenterState }>("/api/orders/direct", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateBudgetPolicyRequest(input: {
  annualBudget: number;
  monthlyTarget: number;
  providerBudgets: ProviderBudgetInput[];
  reason: string;
}) {
  return requestJson<{ state: CommandCenterState }>("/api/budget/policy", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateProviderGovernanceRequest(input: {
  globalKillSwitchActive: boolean;
  defaultMissionBudgetLimit: number;
  defaultRequestsPerMission: number;
  notes: string;
  reason: string;
}) {
  return requestJson<{ state: CommandCenterState }>("/api/providers/governance", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function updateProviderControlRequest(input: {
  providerId: string;
  enabled: boolean;
  mode: "disabled" | "shadow" | "armed";
  killSwitchActive: boolean;
  monthlyHardLimit: number;
  annualHardLimit: number;
  maxTokensPerRequest: number;
  maxRequestsPerMinute: number;
  maxRequestsPerMission: number;
  maxMissionBudget: number;
  notes: string;
  reason: string;
}) {
  return requestJson<{ state: CommandCenterState }>("/api/providers/control", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function recordProviderAttemptRequest(input: {
  providerId: string;
  missionId?: string;
  requestedTokens: number;
  estimatedCost: number;
}) {
  return requestJson<{ allowed: boolean; state: CommandCenterState }>("/api/providers/attempt", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export interface ExecuteOrderInput {
  order: string;
  provider: "claude" | "codex" | "auto";
  agentId?: string;
  projectPath?: string;
  maxTokens?: number;
}

export interface ExecuteOrderResult {
  id: string;
  output: string;
  provider: string;
  model: string;
  agentId: string;
  costUSD: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  viaCliTool: boolean;
}

export function executeOrderRequest(input: ExecuteOrderInput) {
  return requestJson<ExecuteOrderResult>("/api/execute", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getBudgetLive() {
  return requestJson<{
    annualLimit: number;
    monthlyLimit: number;
    annualSpent: number;
    monthlySpent: number;
    annualRemaining: number;
    monthlyRemaining: number;
    byProvider: Record<string, number>;
    executionCount: number;
    status: "ok" | "warning" | "critical";
  }>("/api/budget/live");
}

export function openEventStream(onEvent: (event: { type: string; data: unknown }) => void): () => void {
  const es = new EventSource("/api/events", { withCredentials: true });

  es.addEventListener("execution", (e) => {
    try {
      onEvent({ type: "execution", data: JSON.parse(e.data) });
    } catch {}
  });

  es.onerror = () => {
    // Reconnect is handled automatically by EventSource
  };

  return () => es.close();
}

export interface ExecutionRecordDto {
  id: string;
  agentId: string;
  provider: "claude" | "codex";
  model: string;
  order: string;
  output: string;
  costUSD: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  viaCliTool: boolean;
  status: "completed" | "failed" | "shadow";
  timestamp: string;
}

export function getHealthzRequest() {
  return requestJson<{ ok: boolean; db: "connected" | "error"; version: string }>("/api/healthz");
}

export function getExecutionsRequest(limit = 50, offset = 0) {
  const q = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  return requestJson<{ rows: ExecutionRecordDto[]; total: number }>(`/api/executions?${q}`);
}

export function getExecutionByIdRequest(id: string) {
  return requestJson<ExecutionRecordDto>(`/api/executions/${encodeURIComponent(id)}`);
}
