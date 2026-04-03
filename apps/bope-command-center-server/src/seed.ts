import { AGENTS } from "../../bope-command-center/src/data/agents.js";
import { MODEL_PROVIDERS, TOOL_CONNECTIONS } from "../../bope-command-center/src/data/arsenal.js";
import { MISSIONS } from "../../bope-command-center/src/data/missions.js";
import type {
  AgentPerformanceRecord,
  AgentRecord,
  AuditLogRecord,
  CommandCenterState,
  MedalAwardRecord,
  MissionEventRecord,
  MissionRecord,
  ProviderRecord,
  SanctionRecord,
  ToolRecord,
} from "./domain.js";

const BOOTSTRAP_TIMESTAMP = "2026-04-02T17:00:00Z";

export function createBootstrapState(): CommandCenterState {
  const agents: AgentRecord[] = AGENTS.map((agent) => ({
    id: agent.id,
    codename: agent.codename,
    fullName: agent.fullName,
    role: agent.role,
    specialization: agent.specialization,
    preferredEngine: agent.preferredEngine,
    status: agent.status,
    rank: agent.rank,
    bio: agent.bio,
    skills: agent.skills,
    joinedAt: "2025-01-01T00:00:00Z",
    lastActive: agent.lastActive,
    availability:
      agent.status === "offline"
        ? "offline"
        : agent.status === "sanctioned"
          ? "restricted"
          : "available",
    clearanceLevel:
      agent.id === "santiago" || agent.id === "winston" || agent.id === "marco-aurelio"
        ? "command"
        : "elevated",
    isCommand: agent.id === "santiago" || agent.id === "john-rambo",
    updatedAt: BOOTSTRAP_TIMESTAMP,
  }));

  const agentPerformance: AgentPerformanceRecord[] = AGENTS.map((agent) => ({
    agentId: agent.id,
    trustScore: agent.trustScore,
    historicalCost: agent.historicalCost,
    missionsCompleted: agent.missionsCompleted,
    missionsFailed: agent.missionsFailed,
    updatedAt: BOOTSTRAP_TIMESTAMP,
  }));

  const missions: MissionRecord[] = MISSIONS.map((mission) => ({
    id: mission.id,
    codename: mission.codename,
    title: mission.title,
    objective: mission.objective,
    status: mission.status,
    priority: mission.priority,
    leadAgent: mission.leadAgent,
    assignedAgents: mission.assignedAgents,
    startedAt: mission.startedAt,
    completedAt: mission.completedAt,
    estimatedDuration: mission.estimatedDuration,
    budget: {
      estimated: mission.cost.estimated,
      approved: mission.cost.estimated,
      actual: mission.cost.actual,
      currency: "USD",
      byProvider: mission.cost.byProvider,
    },
    outcome: mission.outcome,
    tags: mission.tags,
    progressPercent:
      mission.status === "completed"
        ? 100
        : mission.status === "failed" || mission.status === "aborted"
          ? 0
          : mission.status === "active"
            ? 62
            : 15,
    createdAt: mission.startedAt ?? BOOTSTRAP_TIMESTAMP,
    updatedAt: mission.completedAt ?? mission.startedAt ?? BOOTSTRAP_TIMESTAMP,
  }));

  const missionEvents: MissionEventRecord[] = MISSIONS.flatMap((mission) =>
    mission.events.map((event: (typeof mission.events)[number]) => ({
      id: event.id,
      missionId: mission.id,
      timestamp: event.timestamp,
      type: event.type,
      agentId: event.agentId,
      providerId: event.engineId,
      toolId: undefined,
      engineId: event.engineId,
      severity:
        event.type === "error"
          ? "critical"
          : event.type === "cost_alert"
            ? "warning"
            : "info",
      message: event.message,
      costImpact: event.cost ?? 0,
      source: "seed",
      createdBy: event.agentId ?? "system",
      metadata: event.metadata,
    })),
  );

  const medals: MedalAwardRecord[] = [
    ...AGENTS.flatMap((agent) =>
      agent.medals.map((medal: (typeof agent.medals)[number]) => ({
        id: `agent-${medal.id}`,
        agentId: agent.id,
        missionId: medal.missionId,
        type: medal.type,
        label: medal.label,
        description: medal.description,
        awardedAt: medal.awardedAt,
        awardedBy: "seed-import",
        status: "active" as const,
      })),
    ),
    ...MISSIONS.flatMap((mission) =>
      mission.medals.map((medal: (typeof mission.medals)[number]) => ({
        id: `mission-${medal.id}`,
        agentId: mission.leadAgent,
        missionId: mission.id,
        type: medal.type,
        label: medal.label,
        description: medal.description,
        awardedAt: medal.awardedAt,
        awardedBy: "seed-import",
        status: "active" as const,
      })),
    ),
  ];

  const sanctions: SanctionRecord[] = [
    ...AGENTS.flatMap((agent) =>
      agent.sanctions.map((sanction: (typeof agent.sanctions)[number]) => ({
        id: `agent-${sanction.id}`,
        agentId: agent.id,
        missionId: sanction.missionId,
        severity: sanction.severity,
        reason: sanction.reason,
        details: sanction.details,
        issuedAt: sanction.issuedAt,
        issuedBy: "seed-import",
        resolved: sanction.resolved,
        resolvedAt: sanction.resolved ? sanction.issuedAt : undefined,
        resolutionNote: sanction.resolved ? "Registrada como resuelta en semilla inicial." : undefined,
      })),
    ),
    ...MISSIONS.flatMap((mission) =>
      mission.sanctions.map((sanction: (typeof mission.sanctions)[number]) => ({
        id: `mission-${sanction.id}`,
        agentId: mission.leadAgent,
        missionId: mission.id,
        severity: sanction.severity,
        reason: sanction.reason,
        details: sanction.details,
        issuedAt: sanction.issuedAt,
        issuedBy: "seed-import",
        resolved: sanction.resolved,
        resolvedAt: sanction.resolved ? sanction.issuedAt : undefined,
        resolutionNote: sanction.resolved ? "Registrada como resuelta en semilla inicial." : undefined,
      })),
    ),
  ];

  const providers: ProviderRecord[] = MODEL_PROVIDERS.map((provider) => ({
    ...provider,
    updatedAt: BOOTSTRAP_TIMESTAMP,
  }));

  const tools: ToolRecord[] = TOOL_CONNECTIONS.map((tool) => ({
    ...tool,
    category:
      tool.type === "VCS"
        ? "vcs"
        : tool.type === "Deploy"
          ? "deploy"
          : tool.type === "Database"
            ? "database"
            : tool.type === "Monitoring"
              ? "monitoring"
              : tool.type === "Payments"
                ? "payments"
                : "automation",
    providerId:
      tool.id === "github"
        ? "codex"
        : tool.id === "vercel"
          ? "codex"
          : tool.id === "postgres"
            ? "claude"
            : undefined,
    healthStatus:
      tool.status === "connected"
        ? "healthy"
        : tool.status === "error"
          ? "degraded"
          : "offline",
    auditRequired: tool.type === "Payments" || tool.type === "Database",
  }));

  const accumulatedSpend = providers.reduce((sum, provider) => sum + provider.accumulatedCost, 0);
  const monthlySpend = providers.reduce((sum, provider) => sum + provider.monthlySpend, 0);

  const auditLog: AuditLogRecord[] = [
    {
      id: "seed-system-initialized",
      timestamp: BOOTSTRAP_TIMESTAMP,
      category: "system",
      level: "info",
      actorLabel: "SYSTEM",
      message: "Command Center remoto inicializado con semilla operativa canonica.",
      context: "bootstrap",
    },
    ...missionEvents.slice(-12).map((event): AuditLogRecord => ({
      id: `audit-${event.id}`,
      timestamp: event.timestamp,
      category: event.type === "cost_alert" ? "budget" : "mission",
      level: event.severity,
      actorId: event.agentId,
      actorLabel:
        AGENTS.find((agent) => agent.id === event.agentId)?.codename ?? "SYSTEM",
      message: event.message,
      context: event.missionId,
      metadata: {
        missionId: event.missionId,
        providerId: event.providerId,
        costImpact: event.costImpact,
      },
    })),
  ];

  return {
    schemaVersion: 2,
    agents,
    agentPerformance,
    missions,
    missionEvents,
    medals,
    sanctions,
    providers,
    tools,
    directOrders: [],
    budgetPolicy: {
      annualBudget: accumulatedSpend + 1039,
      monthlyTarget: monthlySpend + 7.23,
      currency: "USD",
      warningThreshold: 0.75,
      criticalThreshold: 0.9,
    },
    budgetAlerts: [],
    auditLog,
    authConfig: null,
    meta: {
      seededAt: BOOTSTRAP_TIMESTAMP,
      updatedAt: BOOTSTRAP_TIMESTAMP,
      activeBudgetAlertKeys: [],
    },
  };
}
