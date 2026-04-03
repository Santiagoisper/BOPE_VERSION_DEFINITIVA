import type { PoolClient } from "pg";
import { filterActiveSessions } from "./auth.js";
import { withClient, withTransaction } from "./db.js";
import type {
  AgentPerformanceRecord,
  AgentRecord,
  AuditLogRecord,
  AuthConfigRecord,
  BudgetAlertRecord,
  BudgetPolicyRecord,
  CommandCenterState,
  DirectOrderRecord,
  MedalAwardRecord,
  MissionEventRecord,
  MissionRecord,
  PersistedStore,
  ProviderConfigRecord,
  ProviderRecord,
  SanctionRecord,
  StoredSessionRecord,
  ToolRecord,
} from "./domain.js";
import { migrateDatabase } from "./migrations.js";
import { createBootstrapState } from "./seed.js";
import { synchronizeState } from "./state.js";

const STORE_LOCK_ID = 812_260_401;

let initialized = false;

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }
  return value as T;
}

function toIso(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

async function lockStore(client: PoolClient): Promise<void> {
  await client.query("SELECT pg_advisory_xact_lock($1)", [STORE_LOCK_ID]);
}

function mapAgents(rows: Array<Record<string, unknown>>): AgentRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    codename: String(row.codename),
    fullName: row.full_name ? String(row.full_name) : undefined,
    role: String(row.role),
    specialization: String(row.specialization),
    preferredEngine: row.preferred_engine as AgentRecord["preferredEngine"],
    status: row.status as AgentRecord["status"],
    rank: row.rank as AgentRecord["rank"],
    bio: String(row.bio),
    skills: parseJson<string[]>(row.skills, []),
    joinedAt: toIso(row.joined_at),
    lastActive: toIso(row.last_active),
    availability: row.availability as AgentRecord["availability"],
    clearanceLevel: row.clearance_level as AgentRecord["clearanceLevel"],
    isCommand: Boolean(row.is_command),
    updatedAt: toIso(row.updated_at),
  }));
}

function mapAgentPerformance(rows: Array<Record<string, unknown>>): AgentPerformanceRecord[] {
  return rows.map((row) => ({
    agentId: String(row.agent_id),
    trustScore: Number(row.trust_score),
    historicalCost: Number(row.historical_cost),
    missionsCompleted: Number(row.missions_completed),
    missionsFailed: Number(row.missions_failed),
    updatedAt: toIso(row.updated_at),
  }));
}

function mapMissions(rows: Array<Record<string, unknown>>): MissionRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    codename: String(row.codename),
    title: String(row.title),
    objective: String(row.objective),
    status: row.status as MissionRecord["status"],
    priority: row.priority as MissionRecord["priority"],
    leadAgent: String(row.lead_agent),
    assignedAgents: parseJson<string[]>(row.assigned_agents, []),
    startedAt: row.started_at ? toIso(row.started_at) : undefined,
    completedAt: row.completed_at ? toIso(row.completed_at) : undefined,
    estimatedDuration: Number(row.estimated_duration),
    budget: {
      estimated: Number(row.budget_estimated),
      approved: Number(row.budget_approved),
      actual: Number(row.budget_actual),
      currency: String(row.budget_currency),
      byProvider: parseJson<Record<string, number>>(row.budget_by_provider, {}),
    },
    outcome: row.outcome ? String(row.outcome) : undefined,
    tags: parseJson<string[]>(row.tags, []),
    progressPercent: Number(row.progress_percent),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  }));
}

function mapMissionEvents(rows: Array<Record<string, unknown>>): MissionEventRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    missionId: String(row.mission_id),
    timestamp: toIso(row.event_timestamp),
    type: row.type as MissionEventRecord["type"],
    agentId: row.agent_id ? String(row.agent_id) : undefined,
    providerId: row.provider_id ? String(row.provider_id) : undefined,
    toolId: row.tool_id ? String(row.tool_id) : undefined,
    engineId: row.engine_id ? String(row.engine_id) : undefined,
    severity: row.severity as MissionEventRecord["severity"],
    message: String(row.message),
    costImpact: Number(row.cost_impact),
    source: row.source as MissionEventRecord["source"],
    createdBy: String(row.created_by),
    metadata: parseJson<Record<string, unknown> | undefined>(row.metadata, undefined),
  }));
}

function mapMedals(rows: Array<Record<string, unknown>>): MedalAwardRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    agentId: String(row.agent_id),
    missionId: row.mission_id ? String(row.mission_id) : undefined,
    type: row.type as MedalAwardRecord["type"],
    label: String(row.label),
    description: String(row.description),
    awardedAt: toIso(row.awarded_at),
    awardedBy: String(row.awarded_by),
    status: row.status as MedalAwardRecord["status"],
  }));
}

function mapSanctions(rows: Array<Record<string, unknown>>): SanctionRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    agentId: String(row.agent_id),
    missionId: row.mission_id ? String(row.mission_id) : undefined,
    severity: row.severity as SanctionRecord["severity"],
    reason: String(row.reason),
    details: String(row.details),
    issuedAt: toIso(row.issued_at),
    issuedBy: String(row.issued_by),
    resolved: Boolean(row.resolved),
    resolvedAt: row.resolved_at ? toIso(row.resolved_at) : undefined,
    resolutionNote: row.resolution_note ? String(row.resolution_note) : undefined,
  }));
}

function mapBudgetPolicy(row: Record<string, unknown>): BudgetPolicyRecord {
  return {
    annualBudget: Number(row.annual_budget),
    monthlyTarget: Number(row.monthly_target),
    currency: String(row.currency),
    warningThreshold: Number(row.warning_threshold),
    criticalThreshold: Number(row.critical_threshold),
  };
}

function mapProviders(rows: Array<Record<string, unknown>>): ProviderRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    shortName: String(row.short_name),
    role: row.role as ProviderRecord["role"],
    isPrimary: Boolean(row.is_primary),
    status: row.status as ProviderRecord["status"],
    annualBudget: Number(row.annual_budget),
    monthlyBudget: Number(row.monthly_budget),
    accumulatedCost: Number(row.accumulated_cost),
    monthlySpend: Number(row.monthly_spend),
    requestsThisMonth: Number(row.requests_this_month),
    tokensThisMonth: Number(row.tokens_this_month),
    description: String(row.description),
    capabilities: parseJson<string[]>(row.capabilities, []),
    updatedAt: toIso(row.updated_at),
  }));
}

function mapProviderConfigs(rows: Array<Record<string, unknown>>): ProviderConfigRecord[] {
  return rows.map((row) => ({
    providerId: String(row.provider_id),
    mode: row.mode as ProviderConfigRecord["mode"],
    enabled: Boolean(row.enabled),
    killSwitchActive: Boolean(row.kill_switch_active),
    monthlyHardLimit: Number(row.monthly_hard_limit),
    annualHardLimit: Number(row.annual_hard_limit),
    maxTokensPerRequest: Number(row.max_tokens_per_request),
    maxRequestsPerMinute: Number(row.max_requests_per_minute),
    traceLevel: row.trace_level as ProviderConfigRecord["traceLevel"],
    notes: String(row.notes),
    updatedAt: toIso(row.updated_at),
  }));
}

function mapTools(rows: Array<Record<string, unknown>>): ToolRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    type: String(row.type),
    category: row.category as ToolRecord["category"],
    status: row.status as ToolRecord["status"],
    usageCount: Number(row.usage_count),
    providerId: row.provider_id ? String(row.provider_id) : undefined,
    lastUsed: row.last_used ? toIso(row.last_used) : undefined,
    healthStatus: row.health_status as ToolRecord["healthStatus"],
    auditRequired: Boolean(row.audit_required),
  }));
}

function mapDirectOrders(rows: Array<Record<string, unknown>>): DirectOrderRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    agentId: String(row.agent_id),
    message: String(row.message),
    priority: row.priority as DirectOrderRecord["priority"],
    issuedAt: toIso(row.issued_at),
    issuedBy: String(row.issued_by),
  }));
}

function mapBudgetAlerts(rows: Array<Record<string, unknown>>): BudgetAlertRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    key: String(row.alert_key),
    scope: row.scope as BudgetAlertRecord["scope"],
    scopeId: String(row.scope_id),
    metric: row.metric as BudgetAlertRecord["metric"],
    level: row.level as BudgetAlertRecord["level"],
    message: String(row.message),
    currentValue: Number(row.current_value),
    thresholdValue: Number(row.threshold_value),
    createdAt: toIso(row.created_at),
    active: Boolean(row.active),
  }));
}

function mapAuditLogs(rows: Array<Record<string, unknown>>): AuditLogRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    timestamp: toIso(row.event_timestamp),
    category: row.category as AuditLogRecord["category"],
    level: row.level as AuditLogRecord["level"],
    actorId: row.actor_id ? String(row.actor_id) : undefined,
    actorLabel: String(row.actor_label),
    message: String(row.message),
    context: row.context ? String(row.context) : undefined,
    metadata: parseJson<Record<string, unknown> | undefined>(row.metadata, undefined),
  }));
}

function mapAuthConfig(row?: Record<string, unknown>): AuthConfigRecord | null {
  if (!row) {
    return null;
  }
  return {
    username: String(row.username),
    passwordHash: String(row.password_hash),
    salt: String(row.salt),
    iterations: Number(row.iterations),
    createdAt: toIso(row.created_at),
    lastPasswordChangeAt: toIso(row.last_password_change_at),
    failedAttempts: Number(row.failed_attempts),
    lockUntil: row.lock_until ? toIso(row.lock_until) : undefined,
  };
}

function mapSessions(rows: Array<Record<string, unknown>>): StoredSessionRecord[] {
  return rows.map((row) => ({
    id: String(row.id),
    username: String(row.username),
    loginAt: toIso(row.login_at),
    expiresAt: toIso(row.expires_at),
    tokenHash: String(row.token_hash),
  }));
}

async function readStoreFromClient(client: PoolClient): Promise<PersistedStore | null> {
  const metaResult = await client.query("SELECT * FROM bope_meta WHERE singleton_key = 'meta'");
  if (!metaResult.rowCount) {
    return null;
  }

  const [
    authResult,
    agentRows,
    performanceRows,
    missionRows,
    eventRows,
    medalRows,
    sanctionRows,
    budgetPolicyRows,
    providerRows,
    providerConfigRows,
    toolRows,
    directOrderRows,
    budgetAlertRows,
    auditRows,
    sessionRows,
  ] = await Promise.all([
    client.query("SELECT * FROM bope_auth_config WHERE singleton_key = 'auth'"),
    client.query("SELECT * FROM bope_agents ORDER BY codename ASC"),
    client.query("SELECT * FROM bope_agent_performance ORDER BY agent_id ASC"),
    client.query("SELECT * FROM bope_missions ORDER BY created_at DESC"),
    client.query("SELECT * FROM bope_mission_events ORDER BY event_timestamp DESC"),
    client.query("SELECT * FROM bope_medals ORDER BY awarded_at DESC"),
    client.query("SELECT * FROM bope_sanctions ORDER BY issued_at DESC"),
    client.query("SELECT * FROM bope_budget_policy WHERE singleton_key = 'budget-policy'"),
    client.query("SELECT * FROM bope_providers ORDER BY id ASC"),
    client.query("SELECT * FROM bope_provider_configs ORDER BY provider_id ASC"),
    client.query("SELECT * FROM bope_tools ORDER BY name ASC"),
    client.query("SELECT * FROM bope_direct_orders ORDER BY issued_at DESC"),
    client.query("SELECT * FROM bope_budget_alerts ORDER BY created_at DESC"),
    client.query("SELECT * FROM bope_audit_logs ORDER BY event_timestamp DESC"),
    client.query("SELECT * FROM bope_sessions ORDER BY login_at DESC"),
  ]);

  const state: CommandCenterState = synchronizeState({
    schemaVersion: Number(metaResult.rows[0].schema_version),
    agents: mapAgents(agentRows.rows),
    agentPerformance: mapAgentPerformance(performanceRows.rows),
    missions: mapMissions(missionRows.rows),
    missionEvents: mapMissionEvents(eventRows.rows),
    medals: mapMedals(medalRows.rows),
    sanctions: mapSanctions(sanctionRows.rows),
    providers: mapProviders(providerRows.rows),
    providerConfigs: mapProviderConfigs(providerConfigRows.rows),
    tools: mapTools(toolRows.rows),
    directOrders: mapDirectOrders(directOrderRows.rows),
    budgetPolicy: mapBudgetPolicy(budgetPolicyRows.rows[0]),
    budgetAlerts: mapBudgetAlerts(budgetAlertRows.rows),
    auditLog: mapAuditLogs(auditRows.rows),
    authConfig: mapAuthConfig(authResult.rows[0]),
    meta: {
      seededAt: toIso(metaResult.rows[0].seeded_at),
      updatedAt: toIso(metaResult.rows[0].updated_at),
      activeBudgetAlertKeys: parseJson<string[]>(metaResult.rows[0].active_budget_alert_keys, []),
    },
  });

  return {
    state,
    sessions: filterActiveSessions(mapSessions(sessionRows.rows)),
  };
}

async function writeStoreToClient(client: PoolClient, store: PersistedStore): Promise<void> {
  const normalized: PersistedStore = {
    state: synchronizeState(store.state),
    sessions: filterActiveSessions(store.sessions),
  };

  await client.query("DELETE FROM bope_sessions");
  await client.query("DELETE FROM bope_budget_alerts");
  await client.query("DELETE FROM bope_direct_orders");
  await client.query("DELETE FROM bope_tools");
  await client.query("DELETE FROM bope_provider_configs");
  await client.query("DELETE FROM bope_providers");
  await client.query("DELETE FROM bope_budget_policy");
  await client.query("DELETE FROM bope_sanctions");
  await client.query("DELETE FROM bope_medals");
  await client.query("DELETE FROM bope_mission_events");
  await client.query("DELETE FROM bope_missions");
  await client.query("DELETE FROM bope_agent_performance");
  await client.query("DELETE FROM bope_agents");
  await client.query("DELETE FROM bope_audit_logs");
  await client.query("DELETE FROM bope_auth_config");
  await client.query("DELETE FROM bope_meta");

  await client.query(
    `INSERT INTO bope_meta (singleton_key, schema_version, seeded_at, updated_at, active_budget_alert_keys)
     VALUES ('meta', $1, $2, $3, $4::jsonb)`,
    [
      normalized.state.schemaVersion,
      normalized.state.meta.seededAt,
      normalized.state.meta.updatedAt,
      JSON.stringify(normalized.state.meta.activeBudgetAlertKeys),
    ],
  );

  if (normalized.state.authConfig) {
    await client.query(
      `INSERT INTO bope_auth_config
       (singleton_key, username, password_hash, salt, iterations, created_at, last_password_change_at, failed_attempts, lock_until)
       VALUES ('auth', $1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        normalized.state.authConfig.username,
        normalized.state.authConfig.passwordHash,
        normalized.state.authConfig.salt,
        normalized.state.authConfig.iterations,
        normalized.state.authConfig.createdAt,
        normalized.state.authConfig.lastPasswordChangeAt,
        normalized.state.authConfig.failedAttempts,
        normalized.state.authConfig.lockUntil ?? null,
      ],
    );
  }

  for (const agent of normalized.state.agents) {
    await client.query(
      `INSERT INTO bope_agents
       (id, codename, full_name, role, specialization, preferred_engine, status, rank, bio, skills, joined_at, last_active, availability, clearance_level, is_command, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14, $15, $16)`,
      [
        agent.id,
        agent.codename,
        agent.fullName ?? null,
        agent.role,
        agent.specialization,
        agent.preferredEngine,
        agent.status,
        agent.rank,
        agent.bio,
        JSON.stringify(agent.skills),
        agent.joinedAt,
        agent.lastActive,
        agent.availability,
        agent.clearanceLevel,
        agent.isCommand,
        agent.updatedAt,
      ],
    );
  }

  for (const entry of normalized.state.agentPerformance) {
    await client.query(
      `INSERT INTO bope_agent_performance
       (agent_id, trust_score, historical_cost, missions_completed, missions_failed, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.agentId,
        entry.trustScore,
        entry.historicalCost,
        entry.missionsCompleted,
        entry.missionsFailed,
        entry.updatedAt,
      ],
    );
  }

  for (const mission of normalized.state.missions) {
    await client.query(
      `INSERT INTO bope_missions
       (id, codename, title, objective, status, priority, lead_agent, assigned_agents, started_at, completed_at, estimated_duration, budget_estimated, budget_approved, budget_actual, budget_currency, budget_by_provider, outcome, tags, progress_percent, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17, $18::jsonb, $19, $20, $21)`,
      [
        mission.id,
        mission.codename,
        mission.title,
        mission.objective,
        mission.status,
        mission.priority,
        mission.leadAgent,
        JSON.stringify(mission.assignedAgents),
        mission.startedAt ?? null,
        mission.completedAt ?? null,
        mission.estimatedDuration,
        mission.budget.estimated,
        mission.budget.approved,
        mission.budget.actual,
        mission.budget.currency,
        JSON.stringify(mission.budget.byProvider),
        mission.outcome ?? null,
        JSON.stringify(mission.tags),
        mission.progressPercent,
        mission.createdAt,
        mission.updatedAt,
      ],
    );
  }

  for (const event of normalized.state.missionEvents) {
    await client.query(
      `INSERT INTO bope_mission_events
       (id, mission_id, event_timestamp, type, agent_id, provider_id, tool_id, engine_id, severity, message, cost_impact, source, created_by, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)`,
      [
        event.id,
        event.missionId,
        event.timestamp,
        event.type,
        event.agentId ?? null,
        event.providerId ?? null,
        event.toolId ?? null,
        event.engineId ?? null,
        event.severity,
        event.message,
        event.costImpact,
        event.source,
        event.createdBy,
        event.metadata ? JSON.stringify(event.metadata) : null,
      ],
    );
  }

  for (const medal of normalized.state.medals) {
    await client.query(
      `INSERT INTO bope_medals
       (id, agent_id, mission_id, type, label, description, awarded_at, awarded_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        medal.id,
        medal.agentId,
        medal.missionId ?? null,
        medal.type,
        medal.label,
        medal.description,
        medal.awardedAt,
        medal.awardedBy,
        medal.status,
      ],
    );
  }

  for (const sanction of normalized.state.sanctions) {
    await client.query(
      `INSERT INTO bope_sanctions
       (id, agent_id, mission_id, severity, reason, details, issued_at, issued_by, resolved, resolved_at, resolution_note)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        sanction.id,
        sanction.agentId,
        sanction.missionId ?? null,
        sanction.severity,
        sanction.reason,
        sanction.details,
        sanction.issuedAt,
        sanction.issuedBy,
        sanction.resolved,
        sanction.resolvedAt ?? null,
        sanction.resolutionNote ?? null,
      ],
    );
  }

  await client.query(
    `INSERT INTO bope_budget_policy
     (singleton_key, annual_budget, monthly_target, currency, warning_threshold, critical_threshold)
     VALUES ('budget-policy', $1, $2, $3, $4, $5)`,
    [
      normalized.state.budgetPolicy.annualBudget,
      normalized.state.budgetPolicy.monthlyTarget,
      normalized.state.budgetPolicy.currency,
      normalized.state.budgetPolicy.warningThreshold,
      normalized.state.budgetPolicy.criticalThreshold,
    ],
  );

  for (const provider of normalized.state.providers) {
    await client.query(
      `INSERT INTO bope_providers
       (id, name, short_name, role, is_primary, status, annual_budget, monthly_budget, accumulated_cost, monthly_spend, requests_this_month, tokens_this_month, description, capabilities, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15)`,
      [
        provider.id,
        provider.name,
        provider.shortName,
        provider.role,
        provider.isPrimary,
        provider.status,
        provider.annualBudget,
        provider.monthlyBudget,
        provider.accumulatedCost,
        provider.monthlySpend,
        provider.requestsThisMonth,
        provider.tokensThisMonth,
        provider.description,
        JSON.stringify(provider.capabilities),
        provider.updatedAt,
      ],
    );
  }

  for (const config of normalized.state.providerConfigs) {
    await client.query(
      `INSERT INTO bope_provider_configs
       (provider_id, mode, enabled, kill_switch_active, monthly_hard_limit, annual_hard_limit, max_tokens_per_request, max_requests_per_minute, trace_level, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        config.providerId,
        config.mode,
        config.enabled,
        config.killSwitchActive,
        config.monthlyHardLimit,
        config.annualHardLimit,
        config.maxTokensPerRequest,
        config.maxRequestsPerMinute,
        config.traceLevel,
        config.notes,
        config.updatedAt,
      ],
    );
  }

  for (const tool of normalized.state.tools) {
    await client.query(
      `INSERT INTO bope_tools
       (id, name, type, category, status, usage_count, provider_id, last_used, health_status, audit_required)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tool.id,
        tool.name,
        tool.type,
        tool.category,
        tool.status,
        tool.usageCount,
        tool.providerId ?? null,
        tool.lastUsed ?? null,
        tool.healthStatus,
        tool.auditRequired,
      ],
    );
  }

  for (const order of normalized.state.directOrders) {
    await client.query(
      `INSERT INTO bope_direct_orders
       (id, agent_id, message, priority, issued_at, issued_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        order.id,
        order.agentId,
        order.message,
        order.priority,
        order.issuedAt,
        order.issuedBy,
      ],
    );
  }

  for (const alert of normalized.state.budgetAlerts) {
    await client.query(
      `INSERT INTO bope_budget_alerts
       (id, alert_key, scope, scope_id, metric, level, message, current_value, threshold_value, created_at, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        alert.id,
        alert.key,
        alert.scope,
        alert.scopeId,
        alert.metric,
        alert.level,
        alert.message,
        alert.currentValue,
        alert.thresholdValue,
        alert.createdAt,
        alert.active,
      ],
    );
  }

  for (const entry of normalized.state.auditLog) {
    await client.query(
      `INSERT INTO bope_audit_logs
       (id, event_timestamp, category, level, actor_id, actor_label, message, context, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
      [
        entry.id,
        entry.timestamp,
        entry.category,
        entry.level,
        entry.actorId ?? null,
        entry.actorLabel,
        entry.message,
        entry.context ?? null,
        entry.metadata ? JSON.stringify(entry.metadata) : null,
      ],
    );
  }

  for (const session of normalized.sessions) {
    await client.query(
      `INSERT INTO bope_sessions
       (id, username, login_at, expires_at, token_hash)
       VALUES ($1, $2, $3, $4, $5)`,
      [session.id, session.username, session.loginAt, session.expiresAt, session.tokenHash],
    );
  }
}

async function ensureSeededStore(client: PoolClient): Promise<void> {
  const existing = await readStoreFromClient(client);
  if (existing) {
    return;
  }

  const initialStore: PersistedStore = {
    state: synchronizeState(createBootstrapState()),
    sessions: [],
  };

  await writeStoreToClient(client, initialStore);
}

export async function initializePersistence(): Promise<void> {
  if (initialized) {
    return;
  }

  await migrateDatabase();
  await withTransaction(async (client) => {
    await lockStore(client);
    await ensureSeededStore(client);
  });
  initialized = true;
}

export async function loadStore(): Promise<PersistedStore> {
  await initializePersistence();
  return withClient(async (client) => {
    const store = await readStoreFromClient(client);
    if (!store) {
      throw new Error("Command Center store is not initialized.");
    }
    return {
      state: synchronizeState(store.state),
      sessions: filterActiveSessions(store.sessions),
    };
  });
}

export async function saveStore(store: PersistedStore): Promise<void> {
  await initializePersistence();
  await withTransaction(async (client) => {
    await lockStore(client);
    await writeStoreToClient(client, store);
  });
}

export async function mutateStore<T>(
  mutator: (store: PersistedStore) => Promise<{ store: PersistedStore; result: T }> | { store: PersistedStore; result: T },
): Promise<T> {
  await initializePersistence();
  return withTransaction(async (client) => {
    await lockStore(client);
    const current = await readStoreFromClient(client);
    const store = current ?? {
      state: synchronizeState(createBootstrapState()),
      sessions: [],
    };
    const { store: nextStore, result } = await mutator(store);
    await writeStoreToClient(client, nextStore);
    return result;
  });
}
