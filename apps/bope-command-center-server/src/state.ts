import { randomUUID } from "node:crypto";
import type { MissionPriority } from "../../bope-command-center/src/types/index.js";
import type {
  AgentPerformanceRecord,
  AuditLogRecord,
  BudgetAlertRecord,
  BudgetPolicyUpdateInput,
  CommandCenterState,
  MissionEventRecord,
  MissionRecord,
  ProviderRecord,
} from "./domain.js";

function makeId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function findPerformance(performance: AgentPerformanceRecord[], agentId: string): AgentPerformanceRecord {
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
  const alerts: BudgetAlertRecord[] = [];
  const annualSpend = state.providers.reduce((sum, provider) => sum + provider.accumulatedCost, 0);
  const monthlySpend = state.providers.reduce((sum, provider) => sum + provider.monthlySpend, 0);

  const globalAnnualWarning = state.budgetPolicy.warningThreshold * state.budgetPolicy.annualBudget;
  const globalAnnualCritical = state.budgetPolicy.criticalThreshold * state.budgetPolicy.annualBudget;
  const globalMonthlyWarning = state.budgetPolicy.warningThreshold * state.budgetPolicy.monthlyTarget;
  const globalMonthlyCritical = state.budgetPolicy.criticalThreshold * state.budgetPolicy.monthlyTarget;

  if (annualSpend >= globalAnnualWarning) {
    alerts.push(
      createBudgetAlert(
        "global-annual",
        "global",
        "global",
        "annual",
        annualSpend >= globalAnnualCritical ? "critical" : "warning",
        `Presupuesto anual global en ${Math.round((annualSpend / state.budgetPolicy.annualBudget) * 100)}%.`,
        annualSpend,
        annualSpend >= globalAnnualCritical ? globalAnnualCritical : globalAnnualWarning,
      ),
    );
  }

  if (monthlySpend >= globalMonthlyWarning) {
    alerts.push(
      createBudgetAlert(
        "global-monthly",
        "global",
        "global",
        "monthly",
        monthlySpend >= globalMonthlyCritical ? "critical" : "warning",
        `Consumo mensual global en ${Math.round((monthlySpend / state.budgetPolicy.monthlyTarget) * 100)}%.`,
        monthlySpend,
        monthlySpend >= globalMonthlyCritical ? globalMonthlyCritical : globalMonthlyWarning,
      ),
    );
  }

  state.providers.forEach((provider) => {
    const annualWarning = provider.annualBudget * state.budgetPolicy.warningThreshold;
    const annualCritical = provider.annualBudget * state.budgetPolicy.criticalThreshold;
    const monthlyWarning = provider.monthlyBudget * state.budgetPolicy.warningThreshold;
    const monthlyCritical = provider.monthlyBudget * state.budgetPolicy.criticalThreshold;

    if (provider.accumulatedCost >= annualWarning) {
      alerts.push(
        createBudgetAlert(
          `provider-${provider.id}-annual`,
          "provider",
          provider.id,
          "annual",
          provider.accumulatedCost >= annualCritical ? "critical" : "warning",
          `${provider.shortName} supera el umbral anual de gasto.`,
          provider.accumulatedCost,
          provider.accumulatedCost >= annualCritical ? annualCritical : annualWarning,
        ),
      );
    }

    if (provider.monthlySpend >= monthlyWarning) {
      alerts.push(
        createBudgetAlert(
          `provider-${provider.id}-monthly`,
          "provider",
          provider.id,
          "monthly",
          provider.monthlySpend >= monthlyCritical ? "critical" : "warning",
          `${provider.shortName} supera el umbral mensual de gasto.`,
          provider.monthlySpend,
          provider.monthlySpend >= monthlyCritical ? monthlyCritical : monthlyWarning,
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

export function sanitizeState(state: CommandCenterState): CommandCenterState {
  return {
    ...state,
    authConfig: state.authConfig
      ? {
          ...state.authConfig,
          passwordHash: "",
          salt: "",
          iterations: 0,
        }
      : null,
  };
}

export function createMissionInState(
  state: CommandCenterState,
  input: {
    codename: string;
    title: string;
    objective: string;
    priority: MissionPriority;
    leadAgent: string;
    assignedAgents: string[];
    estimatedBudget: number;
    actorLabel: string;
  },
): CommandCenterState {
  const createdAt = nowIso();
  const missionId = makeId("mission");
  const performance = findPerformance(state.agentPerformance, input.leadAgent);

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
    createdBy: input.actorLabel,
  };

  return synchronizeState({
    ...state,
    missions: [missionRecord, ...state.missions],
    missionEvents: [event, ...state.missionEvents],
    agentPerformance: state.agentPerformance.map((entry) =>
      entry.agentId === input.leadAgent
        ? { ...performance, updatedAt: createdAt }
        : entry,
    ),
    auditLog: [
      ...state.auditLog,
      createAuditLog("mission", input.actorLabel, `Mision ${input.codename} creada.`, "info", missionId, input.leadAgent, {
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
    priority: MissionPriority;
    actorLabel: string;
  },
): CommandCenterState {
  const issuedAt = nowIso();
  const target = state.agents.find((agent) => agent.id === input.agentId);

  return synchronizeState({
    ...state,
    directOrders: [
      {
        id: makeId("direct-order"),
        agentId: input.agentId,
        message: input.message,
        priority: input.priority,
        issuedAt,
        issuedBy: input.actorLabel,
      },
      ...state.directOrders,
    ],
    auditLog: [
      ...state.auditLog,
      createAuditLog(
        "order",
        input.actorLabel,
        `Orden directa emitida para ${target?.codename ?? input.agentId}.`,
        input.priority === "critical" ? "warning" : "info",
        input.agentId,
        input.agentId,
        { priority: input.priority },
      ),
    ],
  });
}

export function updateBudgetPolicyInState(
  state: CommandCenterState,
  input: BudgetPolicyUpdateInput,
): CommandCenterState {
  const previousPolicy = state.budgetPolicy;
  const nextProviders: ProviderRecord[] = state.providers.map((provider) => {
    const update = input.providerBudgets.find((item) => item.id === provider.id);
    if (!update) {
      return provider;
    }

    return {
      ...provider,
      annualBudget: update.annualBudget,
      monthlyBudget: update.monthlyBudget,
      updatedAt: nowIso(),
    };
  });

  const nextProviderConfigs = state.providerConfigs.map((config) => {
    const update = input.providerBudgets.find((item) => item.id === config.providerId);
    if (!update) {
      return config;
    }

    return {
      ...config,
      annualHardLimit: update.annualBudget,
      monthlyHardLimit: update.monthlyBudget,
      updatedAt: nowIso(),
    };
  });

  return synchronizeState({
    ...state,
    providers: nextProviders,
    providerConfigs: nextProviderConfigs,
    budgetPolicy: {
      ...state.budgetPolicy,
      annualBudget: input.annualBudget,
      monthlyTarget: input.monthlyTarget,
    },
    auditLog: [
      ...state.auditLog,
      createAuditLog("budget", input.actorLabel, "Politica presupuestaria central actualizada.", "warning", "budget-policy", undefined, {
        reason: input.reason,
        before: previousPolicy,
        after: {
          annualBudget: input.annualBudget,
          monthlyTarget: input.monthlyTarget,
          providerBudgets: input.providerBudgets,
        },
      }),
    ],
  });
}
