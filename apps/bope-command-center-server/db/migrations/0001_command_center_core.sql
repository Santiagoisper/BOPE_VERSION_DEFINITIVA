CREATE TABLE IF NOT EXISTS bope_schema_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bope_meta (
  singleton_key text PRIMARY KEY,
  schema_version integer NOT NULL,
  seeded_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  active_budget_alert_keys jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE TABLE IF NOT EXISTS bope_auth_config (
  singleton_key text PRIMARY KEY,
  username text NOT NULL,
  password_hash text NOT NULL,
  salt text NOT NULL,
  iterations integer NOT NULL,
  created_at timestamptz NOT NULL,
  last_password_change_at timestamptz NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  lock_until timestamptz
);

CREATE TABLE IF NOT EXISTS bope_sessions (
  id text PRIMARY KEY,
  username text NOT NULL,
  login_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  token_hash text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS bope_agents (
  id text PRIMARY KEY,
  codename text NOT NULL,
  full_name text,
  role text NOT NULL,
  specialization text NOT NULL,
  preferred_engine text NOT NULL,
  status text NOT NULL,
  rank text NOT NULL,
  bio text NOT NULL,
  skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  joined_at timestamptz NOT NULL,
  last_active timestamptz NOT NULL,
  availability text NOT NULL,
  clearance_level text NOT NULL,
  is_command boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS bope_agent_performance (
  agent_id text PRIMARY KEY REFERENCES bope_agents(id) ON DELETE CASCADE,
  trust_score integer NOT NULL,
  historical_cost double precision NOT NULL,
  missions_completed integer NOT NULL,
  missions_failed integer NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS bope_missions (
  id text PRIMARY KEY,
  codename text NOT NULL,
  title text NOT NULL,
  objective text NOT NULL,
  status text NOT NULL,
  priority text NOT NULL,
  lead_agent text NOT NULL REFERENCES bope_agents(id),
  assigned_agents jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  estimated_duration integer NOT NULL,
  budget_estimated double precision NOT NULL,
  budget_approved double precision NOT NULL,
  budget_actual double precision NOT NULL,
  budget_currency text NOT NULL,
  budget_by_provider jsonb NOT NULL DEFAULT '{}'::jsonb,
  outcome text,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress_percent integer NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS bope_mission_events (
  id text PRIMARY KEY,
  mission_id text NOT NULL REFERENCES bope_missions(id) ON DELETE CASCADE,
  event_timestamp timestamptz NOT NULL,
  type text NOT NULL,
  agent_id text,
  provider_id text,
  tool_id text,
  engine_id text,
  severity text NOT NULL,
  message text NOT NULL,
  cost_impact double precision NOT NULL DEFAULT 0,
  source text NOT NULL,
  created_by text NOT NULL,
  metadata jsonb
);

CREATE TABLE IF NOT EXISTS bope_medals (
  id text PRIMARY KEY,
  agent_id text NOT NULL REFERENCES bope_agents(id) ON DELETE CASCADE,
  mission_id text REFERENCES bope_missions(id) ON DELETE SET NULL,
  type text NOT NULL,
  label text NOT NULL,
  description text NOT NULL,
  awarded_at timestamptz NOT NULL,
  awarded_by text NOT NULL,
  status text NOT NULL
);

CREATE TABLE IF NOT EXISTS bope_sanctions (
  id text PRIMARY KEY,
  agent_id text NOT NULL REFERENCES bope_agents(id) ON DELETE CASCADE,
  mission_id text REFERENCES bope_missions(id) ON DELETE SET NULL,
  severity text NOT NULL,
  reason text NOT NULL,
  details text NOT NULL,
  issued_at timestamptz NOT NULL,
  issued_by text NOT NULL,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolution_note text
);

CREATE TABLE IF NOT EXISTS bope_budget_policy (
  singleton_key text PRIMARY KEY,
  annual_budget double precision NOT NULL,
  monthly_target double precision NOT NULL,
  currency text NOT NULL,
  warning_threshold double precision NOT NULL,
  critical_threshold double precision NOT NULL
);

CREATE TABLE IF NOT EXISTS bope_providers (
  id text PRIMARY KEY,
  name text NOT NULL,
  short_name text NOT NULL,
  role text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL,
  annual_budget double precision NOT NULL,
  monthly_budget double precision NOT NULL,
  accumulated_cost double precision NOT NULL,
  monthly_spend double precision NOT NULL,
  requests_this_month integer NOT NULL,
  tokens_this_month integer NOT NULL,
  description text NOT NULL,
  capabilities jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS bope_provider_configs (
  provider_id text PRIMARY KEY REFERENCES bope_providers(id) ON DELETE CASCADE,
  mode text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  kill_switch_active boolean NOT NULL DEFAULT true,
  monthly_hard_limit double precision NOT NULL,
  annual_hard_limit double precision NOT NULL,
  max_tokens_per_request integer NOT NULL,
  max_requests_per_minute integer NOT NULL,
  trace_level text NOT NULL,
  notes text NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS bope_tools (
  id text PRIMARY KEY,
  name text NOT NULL,
  type text NOT NULL,
  category text NOT NULL,
  status text NOT NULL,
  usage_count integer NOT NULL,
  provider_id text REFERENCES bope_providers(id) ON DELETE SET NULL,
  last_used timestamptz,
  health_status text NOT NULL,
  audit_required boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS bope_direct_orders (
  id text PRIMARY KEY,
  agent_id text NOT NULL REFERENCES bope_agents(id) ON DELETE CASCADE,
  message text NOT NULL,
  priority text NOT NULL,
  issued_at timestamptz NOT NULL,
  issued_by text NOT NULL
);

CREATE TABLE IF NOT EXISTS bope_budget_alerts (
  id text PRIMARY KEY,
  alert_key text NOT NULL UNIQUE,
  scope text NOT NULL,
  scope_id text NOT NULL,
  metric text NOT NULL,
  level text NOT NULL,
  message text NOT NULL,
  current_value double precision NOT NULL,
  threshold_value double precision NOT NULL,
  created_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS bope_audit_logs (
  id text PRIMARY KEY,
  event_timestamp timestamptz NOT NULL,
  category text NOT NULL,
  level text NOT NULL,
  actor_id text,
  actor_label text NOT NULL,
  message text NOT NULL,
  context text,
  metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_bope_sessions_expires_at ON bope_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_bope_mission_events_mission_id ON bope_mission_events(mission_id);
CREATE INDEX IF NOT EXISTS idx_bope_audit_logs_timestamp ON bope_audit_logs(event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_bope_budget_alerts_scope ON bope_budget_alerts(scope, scope_id);
