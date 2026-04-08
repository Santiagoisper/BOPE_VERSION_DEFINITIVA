ALTER TABLE bope_provider_configs
  ADD COLUMN IF NOT EXISTS max_requests_per_mission integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS max_mission_budget double precision NOT NULL DEFAULT 250;

CREATE TABLE IF NOT EXISTS bope_provider_governance (
  singleton_key text PRIMARY KEY,
  global_kill_switch_active boolean NOT NULL DEFAULT true,
  default_mission_budget_limit double precision NOT NULL,
  default_requests_per_mission integer NOT NULL,
  period_label text NOT NULL DEFAULT 'minute',
  notes text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
