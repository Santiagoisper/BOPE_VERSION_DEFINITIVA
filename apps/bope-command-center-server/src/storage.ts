import crypto from "node:crypto";
import type { PoolClient } from "pg";
import type { MissionPriority } from "./shared/types.js";
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
  ProviderGovernanceRecord,
  ProviderRecord,
  ProviderControlUpdateInput,
  ProviderGovernanceUpdateInput,
  SanctionRecord,
  StoredSessionRecord,
  ToolRecord,
} from "./domain.js";
import { migrateDatabase } from "./migrations.js";
import { createBootstrapState } from "./seed.js";
import { createMissionInState, synchronizeState, updateBudgetPolicyInState } from "./state.js";

const STORE_LOCK_ID = 812_260_401;

let initialized = false;
let cachedStore: PersistedStore | null = null;

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
    maxRequestsPerMission: Number(row.max_requests_per_mission),
    maxMissionBudget: Number(row.max_mission_budget),
    traceLevel: row.trace_level as ProviderConfigRecord["traceLevel"],
    notes: String(row.notes),
    updatedAt: toIso(row.updated_at),
  }));
}

function mapProviderGovernance(row?: Record<string, unknown>): ProviderGovernanceRecord {
  return {
    globalKillSwitchActive: row ? Boolean(row.global_kill_switch_active) : true,
    defaultMissionBudgetLimit: row ? Number(row.default_mission_budget_limit) : 180,
    defaultRequestsPerMission: row ? Number(row.default_requests_per_mission) : 8,
    periodLabel: (row?.period_label as "minute") ?? "minute",
    notes: row ? String(row.notes) : "Gobernanza central activa. Providers bloqueados hasta orden expresa.",
    updatedAt: row ? toIso(row.updated_at) : new Date().toISOString(),
  };
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

  const authResult = await client.query("SELECT * FROM bope_auth_config WHERE singleton_key = 'auth'");
  const agentRows = await client.query("SELECT * FROM bope_agents ORDER BY codename ASC");
  const performanceRows = await client.query("SELECT * FROM bope_agent_performance ORDER BY agent_id ASC");
  const missionRows = await client.query("SELECT * FROM bope_missions ORDER BY created_at DESC");
  const eventRows = await client.query("SELECT * FROM bope_mission_events ORDER BY event_timestamp DESC");
  const medalRows = await client.query("SELECT * FROM bope_medals ORDER BY awarded_at DESC");
  const sanctionRows = await client.query("SELECT * FROM bope_sanctions ORDER BY issued_at DESC");
  const budgetPolicyRows = await client.query("SELECT * FROM bope_budget_policy WHERE singleton_key = 'budget-policy'");
  const providerRows = await client.query("SELECT * FROM bope_providers ORDER BY id ASC");
  const providerConfigRows = await client.query("SELECT * FROM bope_provider_configs ORDER BY provider_id ASC");
  const providerGovernanceRows = await client.query("SELECT * FROM bope_provider_governance WHERE singleton_key = 'governance'");
  const toolRows = await client.query("SELECT * FROM bope_tools ORDER BY name ASC");
  const directOrderRows = await client.query("SELECT * FROM bope_direct_orders ORDER BY issued_at DESC");
  const budgetAlertRows = await client.query("SELECT * FROM bope_budget_alerts ORDER BY created_at DESC");
  const auditRows = await client.query("SELECT * FROM bope_audit_logs ORDER BY event_timestamp DESC");
  const sessionRows = await client.query("SELECT * FROM bope_sessions ORDER BY login_at DESC");

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
    providerGovernance: mapProviderGovernance(providerGovernanceRows.rows[0]),
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

async function upsertMeta(client: PoolClient, state: CommandCenterState): Promise<void> {
  await client.query(
    `INSERT INTO bope_meta (singleton_key, schema_version, seeded_at, updated_at, active_budget_alert_keys)
     VALUES ('meta', $1, $2, $3, $4::jsonb)
     ON CONFLICT (singleton_key) DO UPDATE SET
       schema_version = EXCLUDED.schema_version,
       seeded_at = EXCLUDED.seeded_at,
       updated_at = EXCLUDED.updated_at,
       active_budget_alert_keys = EXCLUDED.active_budget_alert_keys`,
    [
      state.schemaVersion,
      state.meta.seededAt,
      state.meta.updatedAt,
      JSON.stringify(state.meta.activeBudgetAlertKeys),
    ],
  );
}

async function upsertProviderGovernance(client: PoolClient, governance: ProviderGovernanceRecord): Promise<void> {
  await client.query(
    `INSERT INTO bope_provider_governance
     (singleton_key, global_kill_switch_active, default_mission_budget_limit, default_requests_per_mission, period_label, notes, updated_at)
     VALUES ('governance', $1, $2, $3, $4, $5, $6)
     ON CONFLICT (singleton_key) DO UPDATE SET
       global_kill_switch_active = EXCLUDED.global_kill_switch_active,
       default_mission_budget_limit = EXCLUDED.default_mission_budget_limit,
       default_requests_per_mission = EXCLUDED.default_requests_per_mission,
       period_label = EXCLUDED.period_label,
       notes = EXCLUDED.notes,
       updated_at = EXCLUDED.updated_at`,
    [
      governance.globalKillSwitchActive,
      governance.defaultMissionBudgetLimit,
      governance.defaultRequestsPerMission,
      governance.periodLabel,
      governance.notes,
      governance.updatedAt,
    ],
  );
}

async function replaceBudgetAlerts(client: PoolClient, alerts: BudgetAlertRecord[]): Promise<void> {
  await client.query("DELETE FROM bope_budget_alerts");
  for (const alert of alerts) {
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
}

async function insertAuditLogs(client: PoolClient, entries: AuditLogRecord[]): Promise<void> {
  for (const entry of entries) {
    await client.query(
      `INSERT INTO bope_audit_logs
       (id, event_timestamp, category, level, actor_id, actor_label, message, context, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
       ON CONFLICT (id) DO NOTHING`,
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
}

async function upsertSession(client: PoolClient, session: StoredSessionRecord): Promise<void> {
  await client.query(
    `INSERT INTO bope_sessions
     (id, username, login_at, expires_at, token_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       username = EXCLUDED.username,
       login_at = EXCLUDED.login_at,
       expires_at = EXCLUDED.expires_at,
       token_hash = EXCLUDED.token_hash`,
    [session.id, session.username, session.loginAt, session.expiresAt, session.tokenHash],
  );
}

async function deleteSessionByTokenHash(client: PoolClient, tokenHash: string): Promise<void> {
  await client.query("DELETE FROM bope_sessions WHERE token_hash = $1", [tokenHash]);
}

async function deleteExpiredSessions(client: PoolClient): Promise<void> {
  await client.query("DELETE FROM bope_sessions WHERE expires_at <= now()");
}

async function upsertAuthConfig(client: PoolClient, authConfig: AuthConfigRecord | null): Promise<void> {
  if (!authConfig) {
    await client.query("DELETE FROM bope_auth_config WHERE singleton_key = 'auth'");
    return;
  }
  await client.query(
    `INSERT INTO bope_auth_config
     (singleton_key, username, password_hash, salt, iterations, created_at, last_password_change_at, failed_attempts, lock_until)
     VALUES ('auth', $1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (singleton_key) DO UPDATE SET
       username = EXCLUDED.username,
       password_hash = EXCLUDED.password_hash,
       salt = EXCLUDED.salt,
       iterations = EXCLUDED.iterations,
       created_at = EXCLUDED.created_at,
       last_password_change_at = EXCLUDED.last_password_change_at,
       failed_attempts = EXCLUDED.failed_attempts,
       lock_until = EXCLUDED.lock_until`,
    [
      authConfig.username,
      authConfig.passwordHash,
      authConfig.salt,
      authConfig.iterations,
      authConfig.createdAt,
      authConfig.lastPasswordChangeAt,
      authConfig.failedAttempts,
      authConfig.lockUntil ?? null,
    ],
  );
}

async function persistDerivedState(
  client: PoolClient,
  previousState: CommandCenterState,
  nextState: CommandCenterState,
): Promise<void> {
  await upsertMeta(client, nextState);
  await replaceBudgetAlerts(client, nextState.budgetAlerts);
  const previousAuditIds = new Set(previousState.auditLog.map((entry) => entry.id));
  await insertAuditLogs(
    client,
    nextState.auditLog.filter((entry) => !previousAuditIds.has(entry.id)),
  );
}

function withUpdatedMeta(state: CommandCenterState, updatedAt: string): CommandCenterState {
  return {
    ...state,
    meta: {
      ...state.meta,
      updatedAt,
    },
  };
}

async function createMissionMutation(
  client: PoolClient,
  store: PersistedStore,
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
): Promise<CommandCenterState> {
  const synchronized = createMissionInState(store.state, input);
  const nextState = withUpdatedMeta(
    {
      ...synchronized,
      budgetAlerts: store.state.budgetAlerts,
      meta: {
        ...synchronized.meta,
        activeBudgetAlertKeys: store.state.meta.activeBudgetAlertKeys,
      },
    },
    synchronized.meta.updatedAt,
  );
  const mission = nextState.missions[0];
  const missionEvent = nextState.missionEvents[0];
  const previousAuditIds = new Set(store.state.auditLog.map((entry: AuditLogRecord) => entry.id));
  const missionAudit = nextState.auditLog.find(
    (entry: AuditLogRecord) => !previousAuditIds.has(entry.id) && entry.category === "mission",
  );
  const updatedPerformance = nextState.agentPerformance.find((entry) => entry.agentId === input.leadAgent);

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

  await client.query(
    `INSERT INTO bope_mission_events
     (id, mission_id, event_timestamp, type, agent_id, provider_id, tool_id, engine_id, severity, message, cost_impact, source, created_by, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)`,
    [
      missionEvent.id,
      missionEvent.missionId,
      missionEvent.timestamp,
      missionEvent.type,
      missionEvent.agentId ?? null,
      missionEvent.providerId ?? null,
      missionEvent.toolId ?? null,
      missionEvent.engineId ?? null,
      missionEvent.severity,
      missionEvent.message,
      missionEvent.costImpact,
      missionEvent.source,
      missionEvent.createdBy,
      missionEvent.metadata ? JSON.stringify(missionEvent.metadata) : null,
    ],
  );

  if (updatedPerformance) {
    await client.query(
      `UPDATE bope_agent_performance
       SET trust_score = $2, historical_cost = $3, missions_completed = $4, missions_failed = $5, updated_at = $6
       WHERE agent_id = $1`,
      [
        updatedPerformance.agentId,
        updatedPerformance.trustScore,
        updatedPerformance.historicalCost,
        updatedPerformance.missionsCompleted,
        updatedPerformance.missionsFailed,
        updatedPerformance.updatedAt,
      ],
    );
  }

  if (missionAudit) {
    await insertAuditLogs(client, [missionAudit]);
  }
  await upsertMeta(client, nextState);
  return nextState;
}

async function updateBudgetPolicyMutation(
  client: PoolClient,
  store: PersistedStore,
  input: {
    annualBudget: number;
    monthlyTarget: number;
    providerBudgets: Array<{ id: string; annualBudget: number; monthlyBudget: number }>;
    reason: string;
    actorLabel: string;
  },
): Promise<CommandCenterState> {
  const nextState = updateBudgetPolicyInState(store.state, input);

  await client.query(
    `UPDATE bope_budget_policy
     SET annual_budget = $1, monthly_target = $2, currency = $3, warning_threshold = $4, critical_threshold = $5
     WHERE singleton_key = 'budget-policy'`,
    [
      nextState.budgetPolicy.annualBudget,
      nextState.budgetPolicy.monthlyTarget,
      nextState.budgetPolicy.currency,
      nextState.budgetPolicy.warningThreshold,
      nextState.budgetPolicy.criticalThreshold,
    ],
  );

  for (const provider of nextState.providers) {
    await client.query(
      `UPDATE bope_providers
       SET annual_budget = $2, monthly_budget = $3, updated_at = $4
       WHERE id = $1`,
      [provider.id, provider.annualBudget, provider.monthlyBudget, provider.updatedAt],
    );
  }

  for (const config of nextState.providerConfigs) {
    await client.query(
      `UPDATE bope_provider_configs
       SET monthly_hard_limit = $2, annual_hard_limit = $3, updated_at = $4
       WHERE provider_id = $1`,
      [config.providerId, config.monthlyHardLimit, config.annualHardLimit, config.updatedAt],
    );
  }

  await persistDerivedState(client, store.state, nextState);
  return nextState;
}

async function bootstrapAuthMutation(
  client: PoolClient,
  store: PersistedStore,
  authConfig: AuthConfigRecord,
  session: StoredSessionRecord,
  auditEntry: AuditLogRecord,
): Promise<CommandCenterState> {
  const nextState = withUpdatedMeta({
    ...store.state,
    authConfig,
    auditLog: [...store.state.auditLog, auditEntry],
  }, auditEntry.timestamp);
  await upsertAuthConfig(client, nextState.authConfig);
  await deleteExpiredSessions(client);
  await upsertSession(client, session);
  await upsertMeta(client, nextState);
  await insertAuditLogs(client, [auditEntry]);
  return nextState;
}

async function loginSuccessMutation(
  client: PoolClient,
  store: PersistedStore,
  authConfig: AuthConfigRecord,
  session: StoredSessionRecord,
  auditEntry: AuditLogRecord,
): Promise<CommandCenterState> {
  const nextState = withUpdatedMeta({
    ...store.state,
    authConfig,
    auditLog: [...store.state.auditLog, auditEntry],
  }, auditEntry.timestamp);
  await upsertAuthConfig(client, nextState.authConfig);
  await deleteExpiredSessions(client);
  await upsertSession(client, session);
  await upsertMeta(client, nextState);
  await insertAuditLogs(client, [auditEntry]);
  return nextState;
}

async function loginFailureMutation(
  client: PoolClient,
  store: PersistedStore,
  authConfig: AuthConfigRecord,
  auditEntry: AuditLogRecord,
): Promise<void> {
  const nextState = withUpdatedMeta({
    ...store.state,
    authConfig,
    auditLog: [...store.state.auditLog, auditEntry],
  }, auditEntry.timestamp);
  await upsertAuthConfig(client, nextState.authConfig);
  await upsertMeta(client, nextState);
  await insertAuditLogs(client, [auditEntry]);
}

async function logoutMutation(client: PoolClient, store: PersistedStore, tokenHash: string): Promise<void> {
  void store;
  await deleteSessionByTokenHash(client, tokenHash);
}

async function updateProviderControlMutation(
  client: PoolClient,
  store: PersistedStore,
  input: ProviderControlUpdateInput,
): Promise<CommandCenterState> {
  const updatedAt = new Date().toISOString();
  const nextConfigs = store.state.providerConfigs.map((config) =>
    config.providerId === input.providerId
      ? {
          ...config,
          enabled: input.enabled,
          mode: input.mode,
          killSwitchActive: input.killSwitchActive,
          monthlyHardLimit: input.monthlyHardLimit,
          annualHardLimit: input.annualHardLimit,
          maxTokensPerRequest: input.maxTokensPerRequest,
          maxRequestsPerMinute: input.maxRequestsPerMinute,
          maxRequestsPerMission: input.maxRequestsPerMission,
          maxMissionBudget: input.maxMissionBudget,
          notes: input.notes,
          updatedAt,
        }
      : config,
  );
  const auditEntry: AuditLogRecord = {
    id: `audit-provider-${crypto.randomUUID()}`,
    timestamp: updatedAt,
    category: "provider",
    level: input.enabled ? "warning" : "info",
    actorLabel: input.actorLabel,
    message: `Control del provider ${input.providerId} actualizado.`,
    context: input.providerId,
    metadata: { action: "control-update", providerId: input.providerId, reason: input.reason, mode: input.mode, enabled: input.enabled },
  };
  const nextState = withUpdatedMeta(
    { ...store.state, providerConfigs: nextConfigs, auditLog: [auditEntry, ...store.state.auditLog] },
    updatedAt,
  );
  const config = nextConfigs.find((item) => item.providerId === input.providerId);
  if (!config) {
    return store.state;
  }
  await client.query(
    `UPDATE bope_provider_configs
     SET mode = $2, enabled = $3, kill_switch_active = $4, monthly_hard_limit = $5, annual_hard_limit = $6,
         max_tokens_per_request = $7, max_requests_per_minute = $8, max_requests_per_mission = $9, max_mission_budget = $10,
         trace_level = $11, notes = $12, updated_at = $13
     WHERE provider_id = $1`,
    [
      config.providerId,
      config.mode,
      config.enabled,
      config.killSwitchActive,
      config.monthlyHardLimit,
      config.annualHardLimit,
      config.maxTokensPerRequest,
      config.maxRequestsPerMinute,
      config.maxRequestsPerMission,
      config.maxMissionBudget,
      config.traceLevel,
      config.notes,
      config.updatedAt,
    ],
  );
  await upsertMeta(client, nextState);
  await insertAuditLogs(client, [auditEntry]);
  return nextState;
}

async function updateProviderGovernanceMutation(
  client: PoolClient,
  store: PersistedStore,
  input: ProviderGovernanceUpdateInput,
): Promise<CommandCenterState> {
  const updatedAt = new Date().toISOString();
  const governance: ProviderGovernanceRecord = {
    ...store.state.providerGovernance,
    globalKillSwitchActive: input.globalKillSwitchActive,
    defaultMissionBudgetLimit: input.defaultMissionBudgetLimit,
    defaultRequestsPerMission: input.defaultRequestsPerMission,
    notes: input.notes,
    updatedAt,
  };
  const auditEntry: AuditLogRecord = {
    id: `audit-provider-governance-${crypto.randomUUID()}`,
    timestamp: updatedAt,
    category: "provider",
    level: "warning",
    actorLabel: input.actorLabel,
    message: "Gobernanza global de providers actualizada.",
    context: "provider-governance",
    metadata: { action: "governance-update", reason: input.reason, globalKillSwitchActive: input.globalKillSwitchActive },
  };
  const nextState = withUpdatedMeta(
    { ...store.state, providerGovernance: governance, auditLog: [auditEntry, ...store.state.auditLog] },
    updatedAt,
  );
  await upsertProviderGovernance(client, governance);
  await upsertMeta(client, nextState);
  await insertAuditLogs(client, [auditEntry]);
  return nextState;
}

async function recordProviderAttemptMutation(
  client: PoolClient,
  store: PersistedStore,
  input: { providerId: string; missionId?: string; requestedTokens: number; estimatedCost: number; actorLabel: string },
): Promise<CommandCenterState> {
  const updatedAt = new Date().toISOString();
  const control = store.state.providerConfigs.find((item) => item.providerId === input.providerId);
  const effectiveMissionLimit =
    control && control.maxRequestsPerMission > 0
      ? control.maxRequestsPerMission
      : store.state.providerGovernance.defaultRequestsPerMission;
  const effectiveMissionBudget =
    control && control.maxMissionBudget > 0
      ? control.maxMissionBudget
      : store.state.providerGovernance.defaultMissionBudgetLimit;
  const periodStart = Date.now() - 60_000;
  const requestsThisMinute = store.state.auditLog.filter((entry) => {
    const metadata = entry.metadata as Record<string, unknown> | undefined;
    return (
      entry.category === "provider" &&
      metadata?.action === "attempt" &&
      metadata?.providerId === input.providerId &&
      new Date(entry.timestamp).getTime() >= periodStart
    );
  }).length;
  const requestsThisMission = input.missionId
    ? store.state.auditLog.filter((entry) => {
        const metadata = entry.metadata as Record<string, unknown> | undefined;
        return entry.category === "provider" && metadata?.action === "attempt" && metadata?.providerId === input.providerId && metadata?.missionId === input.missionId;
      }).length
    : 0;
  const allowed = Boolean(
    control &&
      !store.state.providerGovernance.globalKillSwitchActive &&
      control.enabled &&
      !control.killSwitchActive &&
      input.requestedTokens <= control.maxTokensPerRequest &&
      input.estimatedCost <= effectiveMissionBudget &&
      requestsThisMinute < control.maxRequestsPerMinute &&
      (!input.missionId || requestsThisMission < effectiveMissionLimit),
  );
  const auditEntry: AuditLogRecord = {
    id: `audit-provider-attempt-${crypto.randomUUID()}`,
    timestamp: updatedAt,
    category: "provider",
    level: allowed ? "info" : "warning",
    actorLabel: input.actorLabel,
    message: allowed ? `Intento de uso de ${input.providerId} admitido en modo seco.` : `Intento de uso de ${input.providerId} bloqueado por gobernanza.`,
    context: input.providerId,
    metadata: {
      action: "attempt",
      providerId: input.providerId,
      missionId: input.missionId,
      requestedTokens: input.requestedTokens,
      estimatedCost: input.estimatedCost,
      allowed,
      requestsThisMinute,
      requestsThisMission,
      effectiveMissionLimit,
      effectiveMissionBudget,
    },
  };
  const nextState = withUpdatedMeta({ ...store.state, auditLog: [auditEntry, ...store.state.auditLog] }, updatedAt);
  await upsertMeta(client, nextState);
  await insertAuditLogs(client, [auditEntry]);
  return nextState;
}

export async function mutateIncremental<T>(
  mutator: (client: PoolClient, store: PersistedStore) => Promise<{ result: T; nextStore?: PersistedStore }>,
): Promise<T> {
  await initializePersistence();
  return withTransaction(async (client) => {
    await lockStore(client);
    const current = await readStoreFromClient(client);
    const store = current ?? {
      state: synchronizeState(createBootstrapState()),
      sessions: [],
    };
    const { result, nextStore } = await mutator(client, store);
    cachedStore = nextStore
      ? {
          state: synchronizeState(nextStore.state),
          sessions: filterActiveSessions(nextStore.sessions),
        }
      : store;
    return result;
  });
}

export {
  bootstrapAuthMutation,
  createMissionMutation,
  loginFailureMutation,
  loginSuccessMutation,
  logoutMutation,
  recordProviderAttemptMutation,
  updateProviderControlMutation,
  updateProviderGovernanceMutation,
  updateBudgetPolicyMutation,
};

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
  await client.query("DELETE FROM bope_provider_governance");
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
       (provider_id, mode, enabled, kill_switch_active, monthly_hard_limit, annual_hard_limit, max_tokens_per_request, max_requests_per_minute, max_requests_per_mission, max_mission_budget, trace_level, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        config.providerId,
        config.mode,
        config.enabled,
        config.killSwitchActive,
        config.monthlyHardLimit,
        config.annualHardLimit,
        config.maxTokensPerRequest,
        config.maxRequestsPerMinute,
        config.maxRequestsPerMission,
        config.maxMissionBudget,
        config.traceLevel,
        config.notes,
        config.updatedAt,
      ],
    );
  }

  await upsertProviderGovernance(client, normalized.state.providerGovernance);

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
    cachedStore = {
      state: synchronizeState(existing.state),
      sessions: filterActiveSessions(existing.sessions),
    };
    return;
  }

  const initialStore: PersistedStore = {
    state: synchronizeState(createBootstrapState()),
    sessions: [],
  };

  await writeStoreToClient(client, initialStore);
  cachedStore = initialStore;
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
  if (cachedStore) {
    return {
      state: synchronizeState(cachedStore.state),
      sessions: filterActiveSessions(cachedStore.sessions),
    };
  }
  return withClient(async (client) => {
    const store = await readStoreFromClient(client);
    if (!store) {
      throw new Error("Command Center store is not initialized.");
    }
    cachedStore = {
      state: synchronizeState(store.state),
      sessions: filterActiveSessions(store.sessions),
    };
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
    cachedStore = {
      state: synchronizeState(store.state),
      sessions: filterActiveSessions(store.sessions),
    };
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
    cachedStore = {
      state: synchronizeState(nextStore.state),
      sessions: filterActiveSessions(nextStore.sessions),
    };
    return result;
  });
}
