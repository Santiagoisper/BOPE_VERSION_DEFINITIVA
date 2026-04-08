import type {
  AgentRank,
  AgentStatus,
  EngineRole,
  EventType,
  MedalType,
  MissionPriority,
  MissionStatus,
  SanctionSeverity,
} from "./shared/types.js";

export interface AgentRecord {
  id: string;
  codename: string;
  fullName?: string;
  role: string;
  specialization: string;
  preferredEngine: "codex" | "claude" | "hybrid";
  status: AgentStatus;
  rank: AgentRank;
  bio: string;
  skills: string[];
  joinedAt: string;
  lastActive: string;
  availability: "available" | "restricted" | "offline";
  clearanceLevel: "standard" | "elevated" | "command";
  isCommand: boolean;
  updatedAt: string;
}

export interface AgentPerformanceRecord {
  agentId: string;
  trustScore: number;
  historicalCost: number;
  missionsCompleted: number;
  missionsFailed: number;
  updatedAt: string;
}

export interface MissionBudgetRecord {
  estimated: number;
  approved: number;
  actual: number;
  currency: string;
  byProvider: Record<string, number>;
}

export interface MissionRecord {
  id: string;
  codename: string;
  title: string;
  objective: string;
  status: MissionStatus;
  priority: MissionPriority;
  leadAgent: string;
  assignedAgents: string[];
  startedAt?: string;
  completedAt?: string;
  estimatedDuration: number;
  budget: MissionBudgetRecord;
  outcome?: string;
  tags: string[];
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

export interface MissionEventRecord {
  id: string;
  missionId: string;
  timestamp: string;
  type: EventType;
  agentId?: string;
  providerId?: string;
  toolId?: string;
  engineId?: string;
  severity: "info" | "warning" | "critical";
  message: string;
  costImpact: number;
  source: "seed" | "system" | "operator";
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface MedalAwardRecord {
  id: string;
  agentId: string;
  missionId?: string;
  type: MedalType;
  label: string;
  description: string;
  awardedAt: string;
  awardedBy: string;
  status: "active" | "revoked";
}

export interface SanctionRecord {
  id: string;
  agentId: string;
  missionId?: string;
  severity: SanctionSeverity;
  reason: string;
  details: string;
  issuedAt: string;
  issuedBy: string;
  resolved: boolean;
  resolvedAt?: string;
  resolutionNote?: string;
}

export interface ProviderRecord {
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
  updatedAt: string;
}

export interface ProviderConfigRecord {
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

export interface ProviderGovernanceRecord {
  globalKillSwitchActive: boolean;
  defaultMissionBudgetLimit: number;
  defaultRequestsPerMission: number;
  periodLabel: "minute";
  notes: string;
  updatedAt: string;
}

export interface ToolRecord {
  id: string;
  name: string;
  type: string;
  category: "vcs" | "deploy" | "database" | "monitoring" | "payments" | "automation";
  status: "connected" | "disconnected" | "error";
  usageCount: number;
  providerId?: string;
  lastUsed?: string;
  healthStatus: "healthy" | "degraded" | "offline";
  auditRequired: boolean;
}

export interface BudgetPolicyRecord {
  annualBudget: number;
  monthlyTarget: number;
  currency: string;
  warningThreshold: number;
  criticalThreshold: number;
}

export interface BudgetAlertRecord {
  id: string;
  key: string;
  scope: "global" | "provider" | "mission";
  scopeId: string;
  metric: "annual" | "monthly" | "mission";
  level: "warning" | "critical";
  message: string;
  currentValue: number;
  thresholdValue: number;
  createdAt: string;
  active: boolean;
}

export interface AuditLogRecord {
  id: string;
  timestamp: string;
  category: "auth" | "mission" | "budget" | "system" | "order" | "provider";
  level: "info" | "warning" | "critical";
  actorId?: string;
  actorLabel: string;
  message: string;
  context?: string;
  metadata?: Record<string, unknown>;
}

export interface DirectOrderRecord {
  id: string;
  agentId: string;
  message: string;
  priority: MissionPriority;
  issuedAt: string;
  issuedBy: string;
}

export interface AuthConfigRecord {
  username: string;
  passwordHash: string;
  salt: string;
  iterations: number;
  createdAt: string;
  lastPasswordChangeAt: string;
  failedAttempts: number;
  lockUntil?: string;
}

export interface SessionRecord {
  username: string;
  loginAt: string;
  expiresAt: string;
}

export interface CommandCenterState {
  schemaVersion: number;
  agents: AgentRecord[];
  agentPerformance: AgentPerformanceRecord[];
  missions: MissionRecord[];
  missionEvents: MissionEventRecord[];
  medals: MedalAwardRecord[];
  sanctions: SanctionRecord[];
  providers: ProviderRecord[];
  providerConfigs: ProviderConfigRecord[];
  providerGovernance: ProviderGovernanceRecord;
  tools: ToolRecord[];
  directOrders: DirectOrderRecord[];
  budgetPolicy: BudgetPolicyRecord;
  budgetAlerts: BudgetAlertRecord[];
  auditLog: AuditLogRecord[];
  authConfig: AuthConfigRecord | null;
  meta: {
    seededAt: string;
    updatedAt: string;
    activeBudgetAlertKeys: string[];
  };
}

export interface StoredSessionRecord extends SessionRecord {
  id: string;
  tokenHash: string;
}

export interface PersistedStore {
  state: CommandCenterState;
  sessions: StoredSessionRecord[];
}

export interface BudgetPolicyUpdateInput {
  annualBudget: number;
  monthlyTarget: number;
  providerBudgets: Array<{
    id: string;
    annualBudget: number;
    monthlyBudget: number;
  }>;
  reason: string;
  actorLabel: string;
}

export interface ProviderControlUpdateInput {
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
  actorLabel: string;
}

export interface ProviderGovernanceUpdateInput {
  globalKillSwitchActive: boolean;
  defaultMissionBudgetLimit: number;
  defaultRequestsPerMission: number;
  notes: string;
  reason: string;
  actorLabel: string;
}
