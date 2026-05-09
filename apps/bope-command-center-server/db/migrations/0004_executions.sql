CREATE TABLE IF NOT EXISTS bope_executions (
  id          text PRIMARY KEY,
  agent_id    text NOT NULL,
  provider    text NOT NULL,           -- 'claude' | 'codex'
  model       text NOT NULL,
  "order"     text NOT NULL,
  output      text NOT NULL,
  cost_usd    double precision NOT NULL DEFAULT 0,
  input_tokens  integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  duration_ms   integer NOT NULL DEFAULT 0,
  via_cli_tool  boolean NOT NULL DEFAULT false,
  status      text NOT NULL DEFAULT 'completed', -- 'completed' | 'failed' | 'shadow'
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bope_executions_created_at
  ON bope_executions(created_at DESC);
