import type {
  Agent,
  AuditLogEntry,
  Budget,
  BudgetAlert,
  DirectOrder,
  Mission,
  ModelProvider,
  SystemStatus,
  ToolConnection,
} from "@/types";
import type {
  AgentPerformanceRecord,
  AuditLogRecord,
  BudgetAlertRecord,
  CommandCenterState,
  MissionEventRecord,
  MissionRecord,
} from "@/domain/models";

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function findPerformance(
  performance: AgentPerformanceRecord[],
  agentId: string,
): AgentPerformanceRecord {
  return (
    performance.find((entry) => entry.agentId === agentId) ?? {
      agentId,
      trustScore: 0,
      historicalCost: 0,
      missionsCompleted: 0,
      missionsFailed: 0,
      updatedAt: nowIso(),
    }
  );
}

export function mapAgents(state: CommandCenterState): Agent[] {
  return state.agents.map((agent) => {
    const performance = findPerformance(state.agentPerformance, agent.id);

    return {
      id: agent.id,
      codename: agent.codename,
      fullName: agent.fullName,
      role: agent.role,
      specialization: agent.specialization,
      preferredEngine: agent.preferredEngine,
      status: agent.status,
      rank: agent.rank,
      trustScore: performance.trustScore,
      historicalCost: performance.historicalCost,
      missionsCompleted: performance.missionsCompleted,
      missionsFailed: performance.missionsFailed,
      medals: state.medals.filter((medal) => medal.agentId === agent.id && medal.status === "active"),
      sanctions: state.sanctions.filter((sanction) => sanction.agentId === agent.id),
      lastActive: agent.lastActive,
      bio: agent.bio,
      skills: agent.skills,
    };
  });
}

export function mapMissions(state: CommandCenterState): Mission[] {
  return state.missions.map((mission) => ({
    id: mission.id,
    title: mission.title,
    codename: mission.codename,
    status: mission.status,
    priority: mission.priority,
    objective: mission.objective,
    assignedAgents: mission.assignedAgents,
    leadAgent: mission.leadAgent,
    startedAt: mission.startedAt,
    completedAt: mission.completedAt,
    estimatedDuration: mission.estimatedDuration,
    cost: {
      estimated: mission.budget.estimated,
      actual: mission.budget.actual,
      byProvider: mission.budget.byProvider,
    },
    events: state.missionEvents
      .filter((event) => event.missionId === mission.id)
      .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime())
      .map((event) => ({
        id: event.id,
        timestamp: event.timestamp,
        type: event.type,
        agentId: event.agentId,
        engineId: event.engineId,
        message: event.message,
        cost: event.costImpact,
        metadata: event.metadata,
      })),
    medals: state.medals.filter((medal) => medal.missionId === mission.id && medal.status === "active"),
    sanctions: state.sanctions.filter((sanction) => sanction.missionId === mission.id),
    tags: mission.tags,
    outcome: mission.outcome,
  }));
}

export function mapProviders(state: CommandCenterState): ModelProvider[] {
  return state.providers.map((provider) => ({
    id: provider.id,
    name: provider.name,
    shortName: provider.shortName,
    role: provider.role,
    isPrimary: provider.isPrimary,
    status: provider.status,
    annualBudget: provider.annualBudget,
    monthlyBudget: provider.monthlyBudget,
    accumulatedCost: provider.accumulatedCost,
    monthlySpend: provider.monthlySpend,
    requestsThisMonth: provider.requestsThisMonth,
    tokensThisMonth: provider.tokensThisMonth,
    description: provider.description,
    capabilities: provider.capabilities,
  }));
}

export function mapTools(state: CommandCenterState): ToolConnection[] {
  return state.tools.map((tool) => ({
    id: tool.id,
    name: tool.name,
    type: tool.type,
    status: tool.status,
    lastUsed: tool.lastUsed,
    usageCount: tool.usageCount,
  }));
}

export function buildGlobalBudget(state: CommandCenterState): Budget {
  const accumulatedSpend = state.providers.reduce((sum, provider) => sum + provider.accumulatedCost, 0);
  const currentMonthSpend = state.providers.reduce((sum, provider) => sum + provider.monthlySpend, 0);
  const byProvider = Object.fromEntries(
    state.providers.map((provider) => [provider.id, provider.accumulatedCost]),
  );

  return {
    annual: state.budgetPolicy.annualBudget,
    monthlyTarget: state.budgetPolicy.monthlyTarget,
    accumulatedSpend,
    currentMonthSpend,
    remainingAnnual: state.budgetPolicy.annualBudget - accumulatedSpend,
    remainingMonthly: state.budgetPolicy.monthlyTarget - currentMonthSpend,
    thresholdWarning: state.budgetPolicy.annualBudget * state.budgetPolicy.warningThreshold,
    thresholdCritical: state.budgetPolicy.annualBudget * state.budgetPolicy.criticalThreshold,
    byProvider,
  };
}

export function mapAuditLog(state: CommandCenterState, limit = 12): AuditLogEntry[] {
  return [...state.auditLog]
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, limit)
    .map((entry) => ({
      id: entry.id,
      timestamp: entry.timestamp,
      category: entry.category,
      level: entry.level,
      actorLabel: entry.actorLabel,
      message: entry.message,
      context: entry.context,
    }));
}

export function mapBudgetAlerts(state: CommandCenterState): BudgetAlert[] {
  return state.budgetAlerts
    .filter((alert) => alert.active)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .map((alert) => ({
      id: alert.id,
      scope: alert.scope,
      scopeId: alert.scopeId,
      metric: alert.metric,
      level: alert.level,
      message: alert.message,
      currentValue: alert.currentValue,
      thresholdValue: alert.thresholdValue,
      createdAt: alert.createdAt,
    }));
}

export function buildSystemStatus(state: CommandCenterState): SystemStatus {
  const activeAlerts = state.budgetAlerts.filter((alert) => alert.active);

  return {
    operational: activeAlerts.filter((alert) => alert.level === "critical").length === 0,
    activeAgents: state.agents.filter((agent) => agent.status === "active" || agent.status === "on_mission").length,
    activeMissions: state.missions.filter((mission) => mission.status === "active").length,
    lastUpdate: state.meta.updatedAt,
    alerts: activeAlerts.map((alert) => alert.message),
  };
}

function createAuditLog(
  category: AuditLogRecord["category"],
  actorLabel: string,
  message: string,
  level: AuditLogRecord["level"] = "info",
  context?: string,
  actorId?: string,
  metadata?: Record<string, unknown>,
): AuditLogRecord {
  return {
    id: makeId("audit"),
    timestamp: nowIso(),
    category,
    level,
    actorId,
    actorLabel,
    message,
    context,
    metadata,
  };
}

function createBudgetAlert(
  key: string,
  scope: BudgetAlertRecord["scope"],
  scopeId: string,
  metric: BudgetAlertRecord["metric"],
  level: BudgetAlertRecord["level"],
  message: string,
  currentValue: number,
  thresholdValue: number,
): BudgetAlertRecord {
  return {
    id: makeId("budget-alert"),
    key,
    scope,
    scopeId,
    metric,
    level,
    message,
    currentValue,
    thresholdValue,
    createdAt: nowIso(),
    active: true,
  };
}

function evaluateBudgetAlerts(state: CommandCenterState): BudgetAlertRecord[] {
  const globalBudget = buildGlobalBudget(state);
  const alerts: BudgetAlertRecord[] = [];
  const warningAnnual = state.budgetPolicy.warningThreshold * state.budgetPolicy.annualBudget;
  const criticalAnnual = state.budgetPolicy.criticalThreshold * state.budgetPolicy.annualBudget;
  const warningMonthly = state.budgetPolicy.warningThreshold * state.budgetPolicy.monthlyTarget;
  const criticalMonthly = state.budgetPolicy.criticalThreshold * state.budgetPolicy.monthlyTarget;

  if (globalBudget.accumulatedSpend >= warningAnnual) {
    alerts.push(
      createBudgetAlert(
        "global-annual-warning",
        "global",
        "global",
        "annual",
        globalBudget.accumulatedSpend >= criticalAnnual ? "critical" : "warning",
        `Presupuesto anual global en ${Math.round((globalBudget.accumulatedSpend / state.budgetPolicy.annualBudget) * 100)}%.`,
        globalBudget.accumulatedSpend,
        globalBudget.accumulatedSpend >= criticalAnnual ? criticalAnnual : warningAnnual,
      ),
    );
  }

  if (globalBudget.currentMonthSpend >= warningMonthly) {
    alerts.push(
      createBudgetAlert(
        "global-monthly-warning",
        "global",
        "global",
        "monthly",
        globalBudget.currentMonthSpend >= criticalMonthly ? "critical" : "warning",
        `Consumo mensual global en ${Math.round((globalBudget.currentMonthSpend / state.budgetPolicy.monthlyTarget) * 100)}%.`,
        globalBudget.currentMonthSpend,
        globalBudget.currentMonthSpend >= criticalMonthly ? criticalMonthly : warningMonthly,
      ),
    );
  }

  state.providers.forEach((provider) => {
    const providerAnnualWarning = provider.annualBudget * state.budgetPolicy.warningThreshold;
    const providerAnnualCritical = provider.annualBudget * state.budgetPolicy.criticalThreshold;
    if (provider.accumulatedCost >= providerAnnualWarning) {
      alerts.push(
        createBudgetAlert(
          `provider-${provider.id}-annual`,
          "provider",
          provider.id,
          "annual",
          provider.accumulatedCost >= providerAnnualCritical ? "critical" : "warning",
          `${provider.shortName} supera el umbral anual de gasto.`,
          provider.accumulatedCost,
          provider.accumulatedCost >= providerAnnualCritical ? providerAnnualCritical : providerAnnualWarning,
        ),
      );
    }

    const providerMonthlyWarning = provider.monthlyBudget * state.budgetPolicy.warningThreshold;
    const providerMonthlyCritical = provider.monthlyBudget * state.budgetPolicy.criticalThreshold;
    if (provider.monthlySpend >= providerMonthlyWarning) {
      alerts.push(
        createBudgetAlert(
          `provider-${provider.id}-monthly`,
          "provider",
          provider.id,
          "monthly",
          provider.monthlySpend >= providerMonthlyCritical ? "critical" : "warning",
          `${provider.shortName} supera el umbral mensual de gasto.`,
          provider.monthlySpend,
          provider.monthlySpend >= providerMonthlyCritical ? providerMonthlyCritical : providerMonthlyWarning,
        ),
      );
    }
  });

  state.missions.forEach((mission) => {
    if (mission.budget.actual > mission.budget.approved) {
      alerts.push(
        createBudgetAlert(
          `mission-${mission.id}-budget`,
          "mission",
          mission.id,
          "mission",
          mission.budget.actual > mission.budget.approved * 1.1 ? "critical" : "warning",
          `La mision ${mission.codename} supero su presupuesto aprobado.`,
          mission.budget.actual,
          mission.budget.approved,
        ),
      );
    }
  });

  return alerts;
}

export function synchronizeState(state: CommandCenterState): CommandCenterState {
  const nextState: CommandCenterState = {
    ...state,
    meta: {
      ...state.meta,
      updatedAt: nowIso(),
    },
  };

  const evaluatedAlerts = evaluateBudgetAlerts(nextState);
  const newKeys = new Set(evaluatedAlerts.map((alert) => alert.key));
  const previousKeys = new Set(nextState.meta.activeBudgetAlertKeys);
  const newlyTriggered = evaluatedAlerts.filter((alert) => !previousKeys.has(alert.key));

  nextState.budgetAlerts = evaluatedAlerts;
  nextState.meta.activeBudgetAlertKeys = Array.from(newKeys);

  if (newlyTriggered.length > 0) {
    nextState.auditLog = [
      ...nextState.auditLog,
      ...newlyTriggered.map((alert) =>
        createAuditLog("budget", "SYSTEM", alert.message, alert.level, alert.scopeId, undefined, {
          scope: alert.scope,
          metric: alert.metric,
          currentValue: alert.currentValue,
          thresholdValue: alert.thresholdValue,
        }),
      ),
    ];
  }

  return nextState;
}

export function createMissionInState(
  state: CommandCenterState,
  input: {
    codename: string;
    title: string;
    objective: string;
    priority: Mission["priority"];
    leadAgent: string;
    assignedAgents: string[];
    estimatedBudget: number;
  },
): CommandCenterState {
  const createdAt = nowIso();
  const missionId = makeId("mission");
  const missionRecord: MissionRecord = {
    id: missionId,
    codename: input.codename,
    title: input.title,
    objective: input.objective,
    status: "planning",
    priority: input.priority,
    leadAgent: input.leadAgent,
    assignedAgents: input.assignedAgents,
    estimatedDuration: 0,
    budget: {
      estimated: input.estimatedBudget,
      approved: input.estimatedBudget,
      actual: 0,
      currency: state.budgetPolicy.currency,
      byProvider: {},
    },
    tags: [],
    progressPercent: 15,
    createdAt,
    updatedAt: createdAt,
  };

  const event: MissionEventRecord = {
    id: makeId("mission-event"),
    missionId,
    timestamp: createdAt,
    type: "mission_start",
    agentId: input.leadAgent,
    severity: "info",
    message: `Mision ${input.codename} creada y registrada en planificacion.`,
    costImpact: 0,
    source: "operator",
    createdBy: "operator",
  };

  return synchronizeState({
    ...state,
    missions: [missionRecord, ...state.missions],
    missionEvents: [event, ...state.missionEvents],
    auditLog: [
      ...state.auditLog,
      createAuditLog("mission", "OPERADOR", `Mision ${input.codename} creada.`, "info", missionId, input.leadAgent, {
        assignedAgents: input.assignedAgents,
        estimatedBudget: input.estimatedBudget,
      }),
    ],
  });
}

export function createDirectOrderInState(
  state: CommandCenterState,
  input: {
    agentId: string;
    message: string;
    priority: DirectOrder["priority"];
  },
): CommandCenterState {
  const issuedAt = nowIso();
  const order = {
    id: makeId("direct-order"),
    agentId: input.agentId,
    message: input.message,
    priority: input.priority,
    issuedAt,
    issuedBy: "operator",
  };

  const target = state.agents.find((agent) => agent.id === input.agentId);

  return synchronizeState({
    ...state,
    directOrders: [order, ...state.directOrders],
    auditLog: [
      ...state.auditLog,
      createAuditLog(
        "order",
        "OPERADOR",
        `Orden directa emitida para ${target?.codename ?? input.agentId}.`,
        input.priority === "critical" ? "warning" : "info",
        input.agentId,
        input.agentId,
        { priority: input.priority },
      ),
    ],
  });
}
