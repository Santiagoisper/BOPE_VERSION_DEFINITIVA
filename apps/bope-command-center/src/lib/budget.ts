import type { Budget } from "../types";

export const ANNUAL_BUDGET = 1500;
export const THRESHOLD_WARNING = 0.75;
export const THRESHOLD_CRITICAL = 0.90;

export function computeBudget(accumulatedSpend: number, currentMonthSpend: number, byProvider: Record<string, number>): Budget {
  const monthlyTarget = ANNUAL_BUDGET / 12;
  return {
    annual: ANNUAL_BUDGET,
    monthlyTarget,
    accumulatedSpend,
    currentMonthSpend,
    remainingAnnual: ANNUAL_BUDGET - accumulatedSpend,
    remainingMonthly: monthlyTarget - currentMonthSpend,
    thresholdWarning: ANNUAL_BUDGET * THRESHOLD_WARNING,
    thresholdCritical: ANNUAL_BUDGET * THRESHOLD_CRITICAL,
    byProvider,
  };
}

export function getBudgetStatus(budget: Budget): "ok" | "warning" | "critical" {
  const ratio = budget.accumulatedSpend / budget.annual;
  if (ratio >= THRESHOLD_CRITICAL) return "critical";
  if (ratio >= THRESHOLD_WARNING) return "warning";
  return "ok";
}

export function getMonthlyStatus(budget: Budget): "ok" | "warning" | "critical" {
  const ratio = budget.currentMonthSpend / budget.monthlyTarget;
  if (ratio >= 1.0) return "critical";
  if (ratio >= THRESHOLD_WARNING) return "warning";
  return "ok";
}

export function annualUsagePercent(budget: Budget): number {
  return Math.min(100, (budget.accumulatedSpend / budget.annual) * 100);
}

export function monthlyUsagePercent(budget: Budget): number {
  return Math.min(100, (budget.currentMonthSpend / budget.monthlyTarget) * 100);
}

export function providerUsagePercent(providerSpend: number, totalSpend: number): number {
  if (totalSpend === 0) return 0;
  return (providerSpend / totalSpend) * 100;
}

export function formatCost(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatCostShort(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function missionCostEfficiency(estimated: number, actual: number): number {
  if (estimated === 0) return 0;
  return ((estimated - actual) / estimated) * 100;
}

export function projectAnnualSpend(accumulatedSpend: number, monthsElapsed: number): number {
  if (monthsElapsed <= 0) return 0;
  const monthlyAvg = accumulatedSpend / monthsElapsed;
  return monthlyAvg * 12;
}
