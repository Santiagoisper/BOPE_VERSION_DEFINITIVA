-- ============================================================
-- BOPE Runtime Schema — Migration 002
-- Tablas del corazón operativo: misiones, tareas, mensajes,
-- tool calls, artefactos, aprobaciones y costos.
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── ENUMS ────────────────────────────────────────────────────

CREATE TYPE bope_mission_status AS ENUM (
  'STANDBY',
  'ACTIVE',
  'AWAITING_APPROVAL',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'DEGRADED'
);

CREATE TYPE bope_task_status AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'BLOCKED',
  'CANCELLED'
);

CREATE TYPE bope_direction AS ENUM ('DOWN', 'UP', 'LATERAL');

CREATE TYPE bope_msg_kind AS ENUM (
  'ORDER',
  'REPORT',
  'SUGGESTION',
  'REQUEST_HELP',
  'TOOL_CALL',
  'TOOL_RESULT',
  'APPROVAL_REQUEST'
);

CREATE TYPE bope_priority AS ENUM ('P0', 'P1', 'P2', 'P3');

CREATE TYPE bope_approval_status AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE bope_loco_state AS ENUM (
  'HOLD',
  'LIMITED_RELEASE',
  'EMERGENCY_RELEASE'
);

CREATE TYPE bope_provider AS ENUM (
  'anthropic',
  'openai',
  'perplexity'
);

-- ── TABLA 1: missions ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bope_missions (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id    VARCHAR(30) UNIQUE NOT NULL,  -- e.g. M-2026-04-07-00001
  intent        TEXT        NOT NULL,
  priority      bope_priority NOT NULL DEFAULT 'P2',
  status        bope_mission_status NOT NULL DEFAULT 'ACTIVE',
  constraints   JSONB       NOT NULL DEFAULT '{}',
  budget_usd    NUMERIC(10,4) NOT NULL DEFAULT 75,
  loco_state    bope_loco_state NOT NULL DEFAULT 'HOLD',
  active_agents TEXT[]      NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at     TIMESTAMPTZ
);

CREATE INDEX idx_bope_missions_status   ON bope_missions(status);
CREATE INDEX idx_bope_missions_created  ON bope_missions(created_at DESC);

-- ── TABLA 2: tasks ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bope_tasks (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       VARCHAR(30) NOT NULL,             -- e.g. T-0001
  mission_id    UUID        NOT NULL REFERENCES bope_missions(id) ON DELETE CASCADE,
  owner         VARCHAR(30) NOT NULL,             -- soldado responsable
  status        bope_task_status NOT NULL DEFAULT 'PENDING',
  description   TEXT        NOT NULL,
  deadline_at   TIMESTAMPTZ,
  escalation_to VARCHAR(30),                      -- a quién escala si bloquea
  result        TEXT,
  evidence      JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bope_tasks_mission   ON bope_tasks(mission_id);
CREATE INDEX idx_bope_tasks_owner     ON bope_tasks(owner);
CREATE INDEX idx_bope_tasks_status    ON bope_tasks(status);

-- ── TABLA 3: messages ─────────────────────────────────────────
-- Envelope neutro BOPEMessage — independiente del proveedor.

CREATE TABLE IF NOT EXISTS bope_messages (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id      UUID          NOT NULL REFERENCES bope_missions(id) ON DELETE CASCADE,
  task_id         UUID          REFERENCES bope_tasks(id) ON DELETE SET NULL,
  from_agent      VARCHAR(30)   NOT NULL,
  to_agent        VARCHAR(30)   NOT NULL,
  direction       bope_direction NOT NULL,
  kind            bope_msg_kind NOT NULL,
  priority        bope_priority NOT NULL DEFAULT 'P2',
  status          bope_task_status,
  summary         TEXT,
  payload         JSONB         NOT NULL DEFAULT '{}',
  evidence        JSONB         NOT NULL DEFAULT '{}',
  requires_approval BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bope_messages_mission   ON bope_messages(mission_id);
CREATE INDEX idx_bope_messages_from      ON bope_messages(from_agent);
CREATE INDEX idx_bope_messages_to        ON bope_messages(to_agent);
CREATE INDEX idx_bope_messages_created   ON bope_messages(created_at DESC);

-- ── TABLA 4: tool_calls ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS bope_tool_calls (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id    UUID        NOT NULL REFERENCES bope_missions(id) ON DELETE CASCADE,
  task_id       UUID        REFERENCES bope_tasks(id) ON DELETE SET NULL,
  actor         VARCHAR(30) NOT NULL,             -- soldado que llamó la tool
  tool_name     VARCHAR(60) NOT NULL,             -- e.g. github.create_pr
  args_hash     TEXT        NOT NULL,             -- SHA256 del payload de args
  args          JSONB       NOT NULL DEFAULT '{}',
  result_hash   TEXT,
  result        JSONB,
  success       BOOLEAN,
  latency_ms    INTEGER,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ
);

CREATE INDEX idx_bope_tool_calls_mission ON bope_tool_calls(mission_id);
CREATE INDEX idx_bope_tool_calls_actor   ON bope_tool_calls(actor);
CREATE INDEX idx_bope_tool_calls_tool    ON bope_tool_calls(tool_name);

-- ── TABLA 5: artifacts ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bope_artifacts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id    UUID        NOT NULL REFERENCES bope_missions(id) ON DELETE CASCADE,
  task_id       UUID        REFERENCES bope_tasks(id) ON DELETE SET NULL,
  actor         VARCHAR(30) NOT NULL,
  kind          VARCHAR(30) NOT NULL,             -- pr, commit, doc, log, screenshot
  url           TEXT,
  path          TEXT,
  checksum      TEXT,
  metadata      JSONB       NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bope_artifacts_mission ON bope_artifacts(mission_id);

-- ── TABLA 6: approvals ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bope_approvals (
  id              UUID                PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id     VARCHAR(30)         UNIQUE NOT NULL,  -- e.g. APR-0001
  mission_id      UUID                NOT NULL REFERENCES bope_missions(id) ON DELETE CASCADE,
  requested_by    VARCHAR(30)         NOT NULL,
  action_type     VARCHAR(60)         NOT NULL,   -- merge_to_main, production_deploy, etc.
  risk_level      VARCHAR(10)         NOT NULL DEFAULT 'HIGH',
  description     TEXT                NOT NULL,
  payload         JSONB               NOT NULL DEFAULT '{}',
  status          bope_approval_status NOT NULL DEFAULT 'PENDING',
  decided_by      VARCHAR(30),
  decision_note   TEXT,
  requested_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  decided_at      TIMESTAMPTZ
);

CREATE INDEX idx_bope_approvals_mission ON bope_approvals(mission_id);
CREATE INDEX idx_bope_approvals_status  ON bope_approvals(status);

-- ── TABLA 7: costs ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bope_costs (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id      UUID          NOT NULL REFERENCES bope_missions(id) ON DELETE CASCADE,
  task_id         UUID          REFERENCES bope_tasks(id) ON DELETE SET NULL,
  agent           VARCHAR(30)   NOT NULL,
  provider        bope_provider NOT NULL,
  model           VARCHAR(50)   NOT NULL,
  tokens_input    INTEGER       NOT NULL DEFAULT 0,
  tokens_output   INTEGER       NOT NULL DEFAULT 0,
  tokens_cache_write INTEGER    NOT NULL DEFAULT 0,
  tokens_cache_read  INTEGER    NOT NULL DEFAULT 0,
  -- Costos calculados en USD con 8 decimales de precisión
  cost_input_usd      NUMERIC(14,8) NOT NULL DEFAULT 0,
  cost_output_usd     NUMERIC(14,8) NOT NULL DEFAULT 0,
  cost_cache_write_usd NUMERIC(14,8) NOT NULL DEFAULT 0,
  cost_cache_read_usd  NUMERIC(14,8) NOT NULL DEFAULT 0,
  cost_total_usd      NUMERIC(14,8) NOT NULL DEFAULT 0,
  -- Periodo de facturación (para caps mensuales)
  billing_month   CHAR(7)       NOT NULL,         -- e.g. '2026-04'
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_bope_costs_mission        ON bope_costs(mission_id);
CREATE INDEX idx_bope_costs_agent          ON bope_costs(agent);
CREATE INDEX idx_bope_costs_provider       ON bope_costs(provider);
CREATE INDEX idx_bope_costs_billing_month  ON bope_costs(billing_month);

-- Vista de costos mensuales por proveedor (para hard caps)
CREATE OR REPLACE VIEW bope_monthly_costs AS
SELECT
  billing_month,
  provider,
  agent,
  SUM(tokens_input)        AS total_tokens_input,
  SUM(tokens_output)       AS total_tokens_output,
  SUM(cost_total_usd)      AS total_cost_usd
FROM bope_costs
GROUP BY billing_month, provider, agent;

-- Vista de caps mensuales por proveedor
CREATE OR REPLACE VIEW bope_monthly_totals AS
SELECT
  billing_month,
  provider,
  SUM(cost_total_usd) AS spent_usd
FROM bope_costs
GROUP BY billing_month, provider;

-- ── FUNCIÓN: auto-update updated_at ──────────────────────────

CREATE OR REPLACE FUNCTION bope_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_missions_updated_at
  BEFORE UPDATE ON bope_missions
  FOR EACH ROW EXECUTE FUNCTION bope_set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON bope_tasks
  FOR EACH ROW EXECUTE FUNCTION bope_set_updated_at();

-- ── SECUENCIAS para IDs legibles ──────────────────────────────

CREATE SEQUENCE IF NOT EXISTS bope_mission_seq START 1;
CREATE SEQUENCE IF NOT EXISTS bope_task_seq    START 1;
CREATE SEQUENCE IF NOT EXISTS bope_approval_seq START 1;
