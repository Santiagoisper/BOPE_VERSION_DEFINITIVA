export type AgentStatus = "active" | "standby" | "offline" | "sanctioned" | "on_mission";
export type MissionStatus = "planning" | "active" | "completed" | "failed" | "aborted";
export type MissionPriority = "low" | "medium" | "high" | "critical";
export type EngineRole = "execution" | "architecture" | "review" | "support";
export type SanctionSeverity = "minor" | "major" | "critical";
export type EventType = "mission_start" | "checkpoint" | "tool_call" | "cost_alert" | "completion" | "error" | "review" | "handoff";

export type MedalType =
  | "medal_of_honor"
  | "navy_cross"
  | "silver_star"
  | "bronze_star"
  | "purple_heart"
  | "meritorious_service"
  | "commendation"
  | "achievement"
  | "good_conduct";

export type AgentRank =
  | "private"
  | "private_first_class"
  | "lance_corporal"
  | "corporal"
  | "sergeant"
  | "staff_sergeant"
  | "gunnery_sergeant"
  | "master_sergeant"
  | "first_sergeant"
  | "master_gunnery_sergeant"
  | "sergeant_major";

export interface Medal {
  id: string;
  type: MedalType;
  label: string;
  description: string;
  awardedAt: string;
  missionId?: string;
}

export interface Sanction {
  id: string;
  severity: SanctionSeverity;
  reason: string;
  details: string;
  issuedAt: string;
  missionId?: string;
  resolved: boolean;
}

export interface Agent {
  id: string;
  codename: string;
  fullName?: string;
  role: string;
  specialization: string;
  preferredEngine: "codex" | "claude" | "hybrid";
  status: AgentStatus;
  rank: AgentRank;
  trustScore: number;
  historicalCost: number;
  missionsCompleted: number;
  missionsFailed: number;
  medals: Medal[];
  sanctions: Sanction[];
  lastActive: string;
  bio: string;
  skills: string[];
  systemPrompt?: string;
  modelPreference?: "haiku" | "sonnet";
}

export interface MissionEvent {
  id: string;
  timestamp: string;
  type: EventType;
  agentId?: string;
  engineId?: string;
  message: string;
  cost?: number;
  metadata?: Record<string, unknown>;
}

export interface MissionCost {
  estimated: number;
  actual: number;
  byProvider: Record<string, number>;
}

export interface Mission {
  id: string;
  title: string;
  codename: string;
  status: MissionStatus;
  priority: MissionPriority;
  objective: string;
  assignedAgents: string[];
  leadAgent: string;
  startedAt?: string;
  completedAt?: string;
  estimatedDuration: number;
  cost: MissionCost;
  events: MissionEvent[];
  medals: Medal[];
  sanctions: Sanction[];
  tags: string[];
  outcome?: string;
}

export interface ModelProvider {
  id: string;
  name: string;
  shortName: string;
  role: EngineRole;
  isPrimary: boolean;
  status: "active" | "maintenance" | "limited";
  annualBudget: number;
  monthlyBudget: number;
  accumulatedCost: number;
  monthlySpend: number;
  requestsThisMonth: number;
  tokensThisMonth: number;
  description: string;
  capabilities: string[];
}

export interface ProviderControl {
  providerId: string;
  mode: "disabled" | "shadow" | "armed";
  enabled: boolean;
  killSwitchActive: boolean;
  monthlyHardLimit: number;
  annualHardLimit: number;
  maxTokensPerRequest: number;
  maxRequestsPerMinute: number;
  maxRequestsPerMission: number;
  maxMissionBudget: number;
  traceLevel: "standard" | "verbose";
  notes: string;
  updatedAt: string;
}

export interface ProviderGovernance {
  globalKillSwitchActive: boolean;
  defaultMissionBudgetLimit: number;
  defaultRequestsPerMission: number;
  periodLabel: "minute";
  notes: string;
  updatedAt: string;
}

export interface ToolConnection {
  id: string;
  name: string;
  type: string;
  status: "connected" | "disconnected" | "error";
  lastUsed?: string;
  usageCount: number;
}

export interface Budget {
  annual: number;
  monthlyTarget: number;
  accumulatedSpend: number;
  currentMonthSpend: number;
  remainingAnnual: number;
  remainingMonthly: number;
  thresholdWarning: number;
  thresholdCritical: number;
  byProvider: Record<string, number>;
}

export interface SystemStatus {
  operational: boolean;
  activeAgents: number;
  activeMissions: number;
  lastUpdate: string;
  alerts: string[];
}

export interface DirectOrder {
  id: string;
  agentId: string;
  message: string;
  priority: MissionPriority;
  issuedAt: string;
}

export interface BudgetAlert {
  id: string;
  scope: "global" | "provider" | "mission";
  scopeId: string;
  metric: "annual" | "monthly" | "mission";
  level: "warning" | "critical";
  message: string;
  currentValue: number;
  thresholdValue: number;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  category: "auth" | "mission" | "budget" | "system" | "order" | "provider";
  level: "info" | "warning" | "critical";
  actorLabel: string;
  message: string;
  context?: string;
}

export interface BudgetPolicySnapshot {
  annualBudget: number;
  monthlyTarget: number;
  currency: string;
  warningThreshold: number;
  criticalThreshold: number;
}

export interface ProviderBudgetInput {
  id: string;
  annualBudget: number;
  monthlyBudget: number;
}
