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
