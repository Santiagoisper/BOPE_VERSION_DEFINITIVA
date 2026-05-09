import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getBudgetSummary } from "../engine/budget.js";
import type { BudgetState } from "../engine/budget.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(annualSpent: number, annualLimit: number): BudgetState {
  return {
    annualLimit,
    monthlyLimit: 125,
    annualSpent,
    monthlySpent: 0,
    currentMonthKey: "2025-01",
    byProvider: {},
    tokensByProvider: {},
    executionCount: 0,
    lastUpdated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Unit tests — Requirements 6.5
// ---------------------------------------------------------------------------

describe("getBudgetSummary — unit tests (status thresholds)", () => {
  it('annualSpent = 0 → status "ok"', () => {
    const summary = getBudgetSummary(makeState(0, 1000));
    expect(summary.status).toBe("ok");
  });

  it('annualSpent = 74% of annualLimit → status "ok"', () => {
    const summary = getBudgetSummary(makeState(740, 1000));
    expect(summary.status).toBe("ok");
  });

  it('annualSpent = 75% of annualLimit → status "warning"', () => {
    const summary = getBudgetSummary(makeState(750, 1000));
    expect(summary.status).toBe("warning");
  });

  it('annualSpent = 89% of annualLimit → status "warning"', () => {
    const summary = getBudgetSummary(makeState(890, 1000));
    expect(summary.status).toBe("warning");
  });

  it('annualSpent = 90% of annualLimit → status "critical"', () => {
    const summary = getBudgetSummary(makeState(900, 1000));
    expect(summary.status).toBe("critical");
  });

  it('annualSpent = 100% of annualLimit → status "critical"', () => {
    const summary = getBudgetSummary(makeState(1000, 1000));
    expect(summary.status).toBe("critical");
  });
});

// ---------------------------------------------------------------------------
// Property-based test — Property 3 — Requirements 6.6
// ---------------------------------------------------------------------------

describe("getBudgetSummary — property tests", () => {
  /**
   * Property 3: Invariante de conservación del presupuesto
   *
   * Para cualquier BudgetState válido (annualSpent >= 0, annualLimit > 0),
   * getBudgetSummary debe satisfacer:
   *   annualRemaining + annualSpent === annualLimit
   *
   * **Validates: Requirements 6.6**
   */
  it("annualRemaining + annualSpent === annualLimit for any valid BudgetState", () => {
    fc.assert(
      fc.property(
        fc.record({
          annualLimit: fc.float({ min: 1, max: 10_000, noNaN: true }),
          annualSpent: fc.float({ min: 0, max: 10_000, noNaN: true }),
          monthlyLimit: fc.float({ min: 1, max: 1_000, noNaN: true }),
          monthlySpent: fc.float({ min: 0, max: 1_000, noNaN: true }),
          currentMonthKey: fc.constant("2025-01"),
          byProvider: fc.constant({}),
          tokensByProvider: fc.constant({}),
          executionCount: fc.nat(),
          lastUpdated: fc.constant(new Date().toISOString()),
        }),
        (state) => {
          const summary = getBudgetSummary(state);
          // Use toBeCloseTo with high precision to handle floating-point arithmetic
          expect(summary.annualRemaining + summary.annualSpent).toBeCloseTo(
            summary.annualLimit,
            10
          );
        }
      )
    );
  });
});
