import { AGENTS } from "@/data/agents";
import type { Agent, AgentStatus } from "@/types";

export function getAgents(): Agent[] {
  return AGENTS;
}

export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find((a) => a.id === id);
}

export function getAgentsByStatus(status: AgentStatus): Agent[] {
  return AGENTS.filter((a) => a.status === status);
}

export function getAgentsSortedByTrust(): Agent[] {
  return [...AGENTS].sort((a, b) => b.trustScore - a.trustScore);
}
