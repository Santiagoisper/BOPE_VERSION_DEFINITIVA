// ============================================================
// BOPE Config — precios reales, caps, modelos
// Fuente: Anthropic pricing + OpenAI pricing (2026-04)
// ============================================================

export const BOPE_CONFIG = {
  version: 'bope-1.0',
  annual_cap_usd: 1500,

  monthly_caps_usd: {
    anthropic:   25,   // Claude API
    openai:      50,   // OpenAI API
    n8n_eur:     20,   // n8n Starter (fijo)
    perplexity:   0,   // Phase 2
  },

  // ── Precios por millón de tokens (USD) ───────────────────
  pricing: {
    anthropic: {
      'claude-sonnet-4-6': {
        input:       3.00,   // $3.00/M tokens
        output:     15.00,   // $15.00/M tokens
        cache_write: 3.75,   // $3.75/M tokens
        cache_read:  0.30,   // $0.30/M tokens
      },
      'claude-haiku-4-5-20251001': {
        input:       0.80,
        output:      4.00,
        cache_write: 1.00,
        cache_read:  0.08,
      },
    },
    openai: {
      // Precios cargados como placeholder — actualizar cuando llegue la key
      'gpt-4o-mini': {
        input:       0.75,   // placeholder ~gpt-5.4-mini pricing
        output:      4.50,
        cache_write: 0,
        cache_read:  0.375,  // 50% descuento en cache (OpenAI policy)
      },
      'gpt-4o': {
        input:       2.50,   // placeholder ~gpt-5.4 pricing
        output:     15.00,
        cache_write: 0,
        cache_read:  1.25,
      },
    },
  },

  // ── Modelos por defecto ───────────────────────────────────
  models: {
    rambo:             { provider: 'anthropic', model: 'claude-sonnet-4-6' },
    winston:           { provider: 'anthropic', model: 'claude-sonnet-4-6' },
    marco:             { provider: 'anthropic', model: 'claude-sonnet-4-6' },
    blade:             { provider: 'openai',    model: 'gpt-4o-mini' },
    forge:             { provider: 'openai',    model: 'gpt-4o-mini' },
    pixel:             { provider: 'openai',    model: 'gpt-4o-mini' },
    nexus:             { provider: 'openai',    model: 'gpt-4o-mini' },
    cerberus:          { provider: 'openai',    model: 'gpt-4o-mini' },
    house:             { provider: 'openai',    model: 'gpt-4o-mini' },
    loco:              { provider: 'openai',    model: 'gpt-4o-mini' },
    execution_escalation: { provider: 'openai', model: 'gpt-4o' },
  },

  // ── Control LOCO ─────────────────────────────────────────
  loco_control: {
    default_state:              'HOLD',
    mandatory_house_review:     true,
    mandatory_logging_fields:   ['diff_or_pr', 'commands', 'env', 'timestamps', 'rollback_plan'],
  },

  // ── Acciones que requieren aprobación SANTI ───────────────
  approval_required_for: [
    'merge_to_main',
    'production_deploy',
    'destructive_db_migration',
    'rotate_high_privilege_secrets',
    'increase_monthly_caps',
    'set_loco_emergency_release',
  ],

  // ── Timeouts ─────────────────────────────────────────────
  timeouts_seconds: {
    agent_default:   90,
    agent_loco:      60,
    approval_wait: 3600,
  },
} as const;

// ── Helper: calcular costo de una llamada ─────────────────────

export interface TokenUsage {
  input:       number;
  output:      number;
  cache_write?: number;
  cache_read?:  number;
}

export interface CostBreakdown {
  cost_input_usd:       number;
  cost_output_usd:      number;
  cost_cache_write_usd: number;
  cost_cache_read_usd:  number;
  cost_total_usd:       number;
}

export function calculateCost(
  provider: 'anthropic' | 'openai',
  model: string,
  usage: TokenUsage,
): CostBreakdown {
  const prices = (BOPE_CONFIG.pricing[provider] as Record<string, {
    input: number; output: number; cache_write: number; cache_read: number;
  }>)[model];

  if (!prices) {
    // Si el modelo no está en el catálogo, usar el más caro del proveedor para no subestimar
    console.warn(`[COST] Modelo desconocido: ${provider}/${model} — usando fallback conservador`);
    const fallback = { input: 3, output: 15, cache_write: 3.75, cache_read: 0.30 };
    return computeBreakdown(fallback, usage);
  }

  return computeBreakdown(prices, usage);
}

function computeBreakdown(
  prices: { input: number; output: number; cache_write: number; cache_read: number },
  usage: TokenUsage,
): CostBreakdown {
  const M = 1_000_000;
  const cost_input_usd       = (usage.input       / M) * prices.input;
  const cost_output_usd      = (usage.output      / M) * prices.output;
  const cost_cache_write_usd = ((usage.cache_write ?? 0) / M) * prices.cache_write;
  const cost_cache_read_usd  = ((usage.cache_read  ?? 0) / M) * prices.cache_read;
  const cost_total_usd       = cost_input_usd + cost_output_usd + cost_cache_write_usd + cost_cache_read_usd;

  return {
    cost_input_usd:       round8(cost_input_usd),
    cost_output_usd:      round8(cost_output_usd),
    cost_cache_write_usd: round8(cost_cache_write_usd),
    cost_cache_read_usd:  round8(cost_cache_read_usd),
    cost_total_usd:       round8(cost_total_usd),
  };
}

function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

// ── Billing month helper ──────────────────────────────────────

export function billingMonth(date = new Date()): string {
  return date.toISOString().slice(0, 7); // 'YYYY-MM'
}
