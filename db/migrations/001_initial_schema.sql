CREATE TYPE mission_status AS ENUM
  ('active', 'completed', 'failed', 'archived');
CREATE TYPE task_status AS ENUM
  ('pending', 'in_progress', 'completed',
   'failed', 'awaiting_commander');
CREATE TYPE event_type AS ENUM
  ('handoff', 'reasoning', 'agent_response',
   'error', 'system_log');

CREATE TABLE missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    objective TEXT NOT NULL,
    status mission_status DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    current_agent VARCHAR(50) NOT NULL,
    next_agent VARCHAR(50),
    status task_status DEFAULT 'pending',
    reason TEXT,
    payload JSONB DEFAULT '{}',
    result TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID REFERENCES missions(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    type event_type NOT NULL,
    agent VARCHAR(50) NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comms_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    agent VARCHAR(50) NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    latency_ms INTEGER,
    tokens_in INTEGER,
    tokens_out INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_reputation (
    agent_id VARCHAR(50) PRIMARY KEY,
    success_count INTEGER DEFAULT 0,
    fail_count INTEGER DEFAULT 0,
    avg_latency_ms FLOAT DEFAULT 0,
    last_active TIMESTAMPTZ
);

CREATE INDEX idx_tasks_mission ON tasks(mission_id);
CREATE INDEX idx_events_mission ON events(mission_id);
