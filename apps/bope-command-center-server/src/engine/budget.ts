import { promises as fs } from "node:fs";
import path from "node:path";

const BUDGET_FILE = path.resolve(process.cwd(), "data/budget.json");

// ── In-memory mutex para serializar check→call→record ─────────────────────────
// Previene TOCTOU: dos ejecuciones concurrentes no pueden pasar el check simultáneamente.
let _budgetLockChain: Promise<void> = Promise.resolve();

export function withBudgetLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = _budgetLockChain.then(() => fn());
  // Absorber el error en la cadena para que un fallo no bloquee futuros waiters
  _budgetLockChain = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

const ANNUAL_LIMIT = Number(process.env.BOPE_ANNUAL_BUDGET ?? 1500);
const MONTHLY_LIMIT = Number(process.env.BOPE_MONTHLY_LIMIT ?? 125);
const PER_EXECUTION_LIMIT = Number(process.env.BOPE_MAX_EXECUTION_COST ?? 2.0);

export interface BudgetState {
  annualLimit: number;
  monthlyLimit: number;
  annualSpent: number;
  monthlySpent: number;
  currentMonthKey: string;
  byProvider: Record<string, number>;
  tokensByProvider: Record<string, number>;
  executionCount: number;
  lastUpdated: string;
}

export class BudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BudgetExceededError";
  }
}

function currentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function emptyState(): BudgetState {
  return {
    annualLimit: ANNUAL_LIMIT,
    monthlyLimit: MONTHLY_LIMIT,
    annualSpent: 0,
    monthlySpent: 0,
    currentMonthKey: currentMonthKey(),
    byProvider: {},
    tokensByProvider: {},
    executionCount: 0,
    lastUpdated: new Date().toISOString(),
  };
}

export async function readBudget(): Promise<BudgetState> {
  try {
    const raw = await fs.readFile(BUDGET_FILE, "utf8");
    const stored = JSON.parse(raw) as BudgetState;
    const thisMonth = currentMonthKey();
    if (stored.currentMonthKey !== thisMonth) {
      stored.monthlySpent = 0;
      stored.currentMonthKey = thisMonth;
    }
    stored.annualLimit = ANNUAL_LIMIT;
    stored.monthlyLimit = MONTHLY_LIMIT;
    return stored;
  } catch {
    return emptyState();
  }
}

async function writeBudget(state: BudgetState): Promise<void> {
  await fs.mkdir(path.dirname(BUDGET_FILE), { recursive: true });
  const tmp = `${BUDGET_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
  await fs.rename(tmp, BUDGET_FILE);
}

export async function checkBudget(estimatedCost: number): Promise<void> {
  const state = await readBudget();

  if (state.annualSpent >= ANNUAL_LIMIT) {
    throw new BudgetExceededError(
      `Presupuesto anual agotado. Gastado: $${state.annualSpent.toFixed(2)} de $${ANNUAL_LIMIT}`
    );
  }
  if (state.monthlySpent >= MONTHLY_LIMIT) {
    throw new BudgetExceededError(
      `Límite mensual agotado. Gastado: $${state.monthlySpent.toFixed(2)} de $${MONTHLY_LIMIT} este mes.`
    );
  }
  if (estimatedCost > PER_EXECUTION_LIMIT) {
    throw new BudgetExceededError(
      `Costo estimado $${estimatedCost.toFixed(4)} supera el límite por ejecución de $${PER_EXECUTION_LIMIT}.`
    );
  }
}

export async function recordSpend(
  provider: string,
  costUSD: number,
  tokens: number
): Promise<BudgetState> {
  const state = await readBudget();
  state.annualSpent += costUSD;
  state.monthlySpent += costUSD;
  state.byProvider[provider] = (state.byProvider[provider] ?? 0) + costUSD;
  state.tokensByProvider[provider] = (state.tokensByProvider[provider] ?? 0) + tokens;
  state.executionCount += 1;
  state.lastUpdated = new Date().toISOString();
  await writeBudget(state);
  return state;
}

export function getBudgetSummary(state: BudgetState) {
  const annualRemaining = state.annualLimit - state.annualSpent;
  const monthlyRemaining = state.monthlyLimit - state.monthlySpent;
  const ratio = state.annualSpent / state.annualLimit;
  const status: "ok" | "warning" | "critical" =
    ratio >= 0.9 ? "critical" : ratio >= 0.75 ? "warning" : "ok";

  return {
    ...state,
    annualRemaining,
    monthlyRemaining,
    status,
  };
}
