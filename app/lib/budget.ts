// ============================================================
// Budget Tracker — hard caps por proveedor + por agente
// ============================================================
import { sql } from './db';
import { BOPE_CONFIG, billingMonth } from './config';
import type { BopeProvider, SoldierId } from './types';

export interface BudgetStatus {
  provider:   BopeProvider;
  spent_usd:  number;
  cap_usd:    number;
  remaining_usd: number;
  pct_used:   number;
  over_cap:   boolean;
}

export interface AgentBudgetStatus {
  agent:       SoldierId;
  spent_usd:   number;
  cap_usd:     number;
  remaining_usd: number;
  over_cap:    boolean;
}

// ── Consultar gasto mensual por proveedor ─────────────────────

export async function getMonthlySpend(
  provider: BopeProvider,
  month = billingMonth(),
): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(cost_total_usd), 0) AS spent
    FROM bope_costs
    WHERE provider = ${provider}
      AND billing_month = ${month}
  `;
  return Number(rows[0].spent);
}

// ── Consultar gasto mensual por agente ────────────────────────

export async function getAgentMonthlySpend(
  agent: SoldierId,
  month = billingMonth(),
): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(cost_total_usd), 0) AS spent
    FROM bope_costs
    WHERE agent = ${agent}
      AND billing_month = ${month}
  `;
  return Number(rows[0].spent);
}

// ── Verificar si el proveedor está dentro del cap ─────────────
// Lanza error si el cap se excedió — el caller debe capturarlo
// y crear una aprobación de aumento de límite.

export async function assertProviderBudget(
  provider: BopeProvider,
  cost_to_add_usd: number,
  month = billingMonth(),
): Promise<void> {
  const spent = await getMonthlySpend(provider, month);
  const cap   = BOPE_CONFIG.monthly_caps_usd[provider] as number;
  const projected = spent + cost_to_add_usd;

  if (projected > cap) {
    throw new BudgetExceededError(
      provider,
      spent,
      cap,
      cost_to_add_usd,
    );
  }
}

// ── Estado completo de presupuestos ──────────────────────────

export async function getAllBudgetStatus(month = billingMonth()): Promise<{
  providers: BudgetStatus[];
  agents:    AgentBudgetStatus[];
  month:     string;
  total_spent_usd: number;
  annual_cap_usd:  number;
}> {
  // Gasto por proveedor
  const providerRows = await sql`
    SELECT provider, COALESCE(SUM(cost_total_usd), 0) AS spent
    FROM bope_costs
    WHERE billing_month = ${month}
    GROUP BY provider
  `;

  const spendByProvider = new Map<string, number>(
    providerRows.map(r => [r.provider as string, Number(r.spent)])
  );

  const providers: BudgetStatus[] = (
    ['anthropic', 'openai', 'perplexity'] as BopeProvider[]
  ).map(p => {
    const cap     = BOPE_CONFIG.monthly_caps_usd[p] as number;
    const spent   = spendByProvider.get(p) ?? 0;
    const remaining = Math.max(0, cap - spent);
    const pct_used  = cap > 0 ? (spent / cap) * 100 : 0;
    return { provider: p, spent_usd: spent, cap_usd: cap, remaining_usd: remaining, pct_used, over_cap: spent > cap };
  });

  // Gasto por agente
  const agentRows = await sql`
    SELECT agent, COALESCE(SUM(cost_total_usd), 0) AS spent
    FROM bope_costs
    WHERE billing_month = ${month}
    GROUP BY agent
    ORDER BY spent DESC
  `;

  const { SOLDIERS } = await import('./types');
  const agents: AgentBudgetStatus[] = agentRows.map(r => {
    const agent = r.agent as SoldierId;
    const profile = SOLDIERS[agent];
    const cap   = profile?.budget_monthly_usd ?? 5;
    const spent = Number(r.spent);
    return {
      agent,
      spent_usd:     spent,
      cap_usd:       cap,
      remaining_usd: Math.max(0, cap - spent),
      over_cap:      spent > cap,
    };
  });

  const total_spent_usd = providers.reduce((s, p) => s + p.spent_usd, 0);

  return {
    providers,
    agents,
    month,
    total_spent_usd,
    annual_cap_usd: BOPE_CONFIG.annual_cap_usd,
  };
}

// ── Gasto acumulado del año ───────────────────────────────────

export async function getYearlySpend(year = new Date().getFullYear()): Promise<number> {
  const rows = await sql`
    SELECT COALESCE(SUM(cost_total_usd), 0) AS spent
    FROM bope_costs
    WHERE billing_month LIKE ${year + '-%'}
  `;
  return Number(rows[0].spent);
}

// ── Error tipado ──────────────────────────────────────────────

export class BudgetExceededError extends Error {
  constructor(
    public readonly provider: BopeProvider,
    public readonly spent:    number,
    public readonly cap:      number,
    public readonly requested: number,
  ) {
    super(
      `[BUDGET] Cap mensual excedido para ${provider}: ` +
      `gastado $${spent.toFixed(4)} + solicitado $${requested.toFixed(4)} ` +
      `> cap $${cap.toFixed(2)} USD. Requiere aprobación de SANTI.`
    );
    this.name = 'BudgetExceededError';
  }
}
