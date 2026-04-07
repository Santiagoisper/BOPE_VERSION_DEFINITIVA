// ============================================================
// BOPE Types — envelope neutro + perfiles + estado
// ============================================================

export type BopePriority = 'P0' | 'P1' | 'P2' | 'P3';
export type BopeDirection = 'DOWN' | 'UP' | 'LATERAL';
export type BopeProvider = 'anthropic' | 'openai' | 'perplexity';
export type LocoState = 'HOLD' | 'LIMITED_RELEASE' | 'EMERGENCY_RELEASE';

export type MissionStatus =
  | 'STANDBY'
  | 'ACTIVE'
  | 'AWAITING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'DEGRADED';

export type TaskStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'BLOCKED'
  | 'CANCELLED';

export type MessageKind =
  | 'ORDER'
  | 'REPORT'
  | 'SUGGESTION'
  | 'REQUEST_HELP'
  | 'TOOL_CALL'
  | 'TOOL_RESULT'
  | 'APPROVAL_REQUEST';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// ── BOPEMessage — envelope neutro ────────────────────────────

export interface BOPEMessage {
  mission_id:        string;
  task_id?:          string;
  from:              SoldierId | 'SANTI' | 'SYSTEM';
  to:                SoldierId | 'SANTI' | 'SYSTEM';
  direction:         BopeDirection;
  kind:              MessageKind;
  priority:          BopePriority;
  status?:           TaskStatus;
  summary?:          string;
  payload?:          Record<string, unknown>;
  evidence?:         Record<string, unknown>;
  requires_approval: boolean;
  timestamp:         string; // ISO 8601
}

// ── Identidades ───────────────────────────────────────────────

export type SoldierId =
  | 'RAMBO'
  | 'BLADE'
  | 'FORGE'
  | 'PIXEL'
  | 'NEXUS'
  | 'CERBERUS'
  | 'HOUSE'
  | 'WINSTON'
  | 'MARCO'
  | 'LOCO';

// ── Perfiles de soldados ──────────────────────────────────────

export interface SoldierProfile {
  id:               SoldierId;
  name:             string;
  alias:            string;
  role:             string;
  emoji:            string;
  color:            string;
  provider:         BopeProvider;
  model_default:    string;
  model_escalation: string | null;
  tools_allowed:    string[];
  budget_monthly_usd: number;
  timeout_seconds:  number;
  medals:           string[];
}

export const SOLDIERS: Record<SoldierId, SoldierProfile> = {
  RAMBO: {
    id: 'RAMBO', name: 'JOHN', alias: 'RAMBO', role: 'Sargento Mayor — Orquestador',
    emoji: '🔴', color: '#ef4444',
    provider: 'anthropic', model_default: 'claude-sonnet-4-6', model_escalation: null,
    tools_allowed: ['dispatch', 'state_read', 'state_write', 'approvals', 'github', 'vercel', 'neon'],
    budget_monthly_usd: 12, timeout_seconds: 120,
    medals: ['NC'],
  },
  BLADE: {
    id: 'BLADE', name: 'BLADE', alias: 'KILLER', role: 'Reserva Especial — Reconocimiento',
    emoji: '⚫', color: '#374151',
    provider: 'openai', model_default: 'gpt-4o-mini', model_escalation: 'gpt-4o',
    tools_allowed: ['github_read', 'fs_read', 'terminal_readonly'],
    budget_monthly_usd: 5, timeout_seconds: 60,
    medals: [],
  },
  FORGE: {
    id: 'FORGE', name: 'FORGE', alias: 'BACK', role: 'Teniente Backend',
    emoji: '🟤', color: '#92400e',
    provider: 'openai', model_default: 'gpt-4o-mini', model_escalation: 'gpt-4o',
    tools_allowed: ['github', 'neon', 'terminal', 'fs'],
    budget_monthly_usd: 10, timeout_seconds: 120,
    medals: ['BS'],
  },
  PIXEL: {
    id: 'PIXEL', name: 'PIXEL', alias: 'FRONT', role: 'Teniente Frontend',
    emoji: '🔵', color: '#1d4ed8',
    provider: 'openai', model_default: 'gpt-4o-mini', model_escalation: 'gpt-4o',
    tools_allowed: ['github', 'vercel', 'terminal', 'fs'],
    budget_monthly_usd: 8, timeout_seconds: 120,
    medals: [],
  },
  NEXUS: {
    id: 'NEXUS', name: 'NEXUS', alias: 'WIRE', role: 'Integrador',
    emoji: '🩵', color: '#0891b2',
    provider: 'openai', model_default: 'gpt-4o-mini', model_escalation: null,
    tools_allowed: ['github', 'terminal', 'vercel_logs', 'neon_uri'],
    budget_monthly_usd: 6, timeout_seconds: 90,
    medals: ['MS'],
  },
  CERBERUS: {
    id: 'CERBERUS', name: 'CERBERUS', alias: 'GUARDIAN', role: 'Guardián de Seguridad',
    emoji: '🩶', color: '#4b5563',
    provider: 'openai', model_default: 'gpt-4o-mini', model_escalation: 'gpt-4o',
    tools_allowed: ['github_review', 'vercel_env', 'neon_roles', 'fs_secrets_scan', 'terminal_sast'],
    budget_monthly_usd: 5, timeout_seconds: 90,
    medals: ['CA'],
  },
  HOUSE: {
    id: 'HOUSE', name: 'HOUSE', alias: 'DOCTOR', role: 'Especialista QA',
    emoji: '🟢', color: '#15803d',
    provider: 'openai', model_default: 'gpt-4o-mini', model_escalation: null,
    tools_allowed: ['terminal_runner', 'github_review', 'vercel_logs', 'neon_branch'],
    budget_monthly_usd: 5, timeout_seconds: 90,
    medals: ['GC'],
  },
  WINSTON: {
    id: 'WINSTON', name: 'WINSTON', alias: 'SCRIBE', role: 'Cronista — Memoria y Auditoría',
    emoji: '🟣', color: '#7c3aed',
    provider: 'anthropic', model_default: 'claude-sonnet-4-6', model_escalation: null,
    tools_allowed: ['fs_docs', 'github_comments', 'n8n_notif', 'logs_read'],
    budget_monthly_usd: 4, timeout_seconds: 60,
    medals: ['CM'],
  },
  MARCO: {
    id: 'MARCO', name: 'MARCO AURELIO', alias: 'HERALD', role: 'Capellán — Contrapeso Moral',
    emoji: '🟠', color: '#c2410c',
    provider: 'anthropic', model_default: 'claude-sonnet-4-6', model_escalation: null,
    tools_allowed: ['state_read', 'pr_read', 'report_read'],
    budget_monthly_usd: 3, timeout_seconds: 45,
    medals: [],
  },
  LOCO: {
    id: 'LOCO', name: 'SICARIO', alias: 'LOCO', role: 'Operativo Especial — Irrupción',
    emoji: '🔥', color: '#dc2626',
    provider: 'openai', model_default: 'gpt-4o-mini', model_escalation: 'gpt-4o',
    tools_allowed: ['github_hotfix', 'terminal_fix', 'vercel_rollback'],
    budget_monthly_usd: 7, timeout_seconds: 60,
    medals: ['PH'],
  },
};

// ── Misión ────────────────────────────────────────────────────

export interface Mission {
  id:            string; // UUID
  mission_id:    string; // M-2026-04-07-00001
  intent:        string;
  priority:      BopePriority;
  status:        MissionStatus;
  constraints:   Record<string, unknown>;
  budget_usd:    number;
  loco_state:    LocoState;
  active_agents: SoldierId[];
  created_at:    string;
  updated_at:    string;
  closed_at?:    string;
}

export interface Task {
  id:            string;
  task_id:       string;
  mission_id:    string;
  owner:         SoldierId;
  status:        TaskStatus;
  description:   string;
  deadline_at?:  string;
  escalation_to?: SoldierId;
  result?:       string;
  evidence:      Record<string, unknown>;
  created_at:    string;
  updated_at:    string;
}

export interface Approval {
  id:             string;
  approval_id:    string;
  mission_id:     string;
  requested_by:   SoldierId | 'SYSTEM';
  action_type:    string;
  risk_level:     'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description:    string;
  payload:        Record<string, unknown>;
  status:         ApprovalStatus;
  decided_by?:    string;
  decision_note?: string;
  requested_at:   string;
  decided_at?:    string;
}

export interface CostRecord {
  id:                   string;
  mission_id:           string;
  task_id?:             string;
  agent:                SoldierId;
  provider:             BopeProvider;
  model:                string;
  tokens_input:         number;
  tokens_output:        number;
  tokens_cache_write:   number;
  tokens_cache_read:    number;
  cost_input_usd:       number;
  cost_output_usd:      number;
  cost_cache_write_usd: number;
  cost_cache_read_usd:  number;
  cost_total_usd:       number;
  billing_month:        string; // 'YYYY-MM'
  created_at:           string;
}

// ── Respuesta estándar API ────────────────────────────────────

export interface ApiOk<T> {
  ok: true;
  data: T;
}

export interface ApiError {
  ok: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiOk<T> | ApiError;
