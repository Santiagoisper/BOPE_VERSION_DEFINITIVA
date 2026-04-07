export const dynamic = 'force-dynamic';
// GET /api/v1/budgets — estado de presupuestos con números exactos
import { NextRequest, NextResponse } from 'next/server';
import { getAllBudgetStatus, getYearlySpend } from '@/lib/budget';
import { billingMonth } from '@/lib/config';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') ?? billingMonth();

    const [budgets, yearlySpend, topCostMissions] = await Promise.all([
      getAllBudgetStatus(month),
      getYearlySpend(),
      sql`
        SELECT
          m.mission_id,
          m.intent,
          m.status,
          COALESCE(SUM(c.cost_total_usd), 0) AS cost_usd
        FROM bope_missions m
        LEFT JOIN bope_costs c ON c.mission_id = m.id
        GROUP BY m.id, m.mission_id, m.intent, m.status
        HAVING COALESCE(SUM(c.cost_total_usd), 0) > 0
        ORDER BY cost_usd DESC
        LIMIT 10
      `,
    ]);

    // Desglose por modelo para transparencia total
    const modelBreakdown = await sql`
      SELECT
        provider, model, agent,
        SUM(tokens_input)        AS tokens_input,
        SUM(tokens_output)       AS tokens_output,
        SUM(tokens_cache_write)  AS tokens_cache_write,
        SUM(tokens_cache_read)   AS tokens_cache_read,
        SUM(cost_input_usd)      AS cost_input_usd,
        SUM(cost_output_usd)     AS cost_output_usd,
        SUM(cost_cache_write_usd) AS cost_cache_write_usd,
        SUM(cost_cache_read_usd)  AS cost_cache_read_usd,
        SUM(cost_total_usd)      AS cost_total_usd,
        COUNT(*)                 AS call_count
      FROM bope_costs
      WHERE billing_month = ${month}
      GROUP BY provider, model, agent
      ORDER BY cost_total_usd DESC
    `;

    // Proyección anual basada en gasto mensual actual
    const currentMonthSpend = budgets.total_spent_usd;
    const daysInMonth = new Date(
      new Date().getFullYear(), new Date().getMonth() + 1, 0
    ).getDate();
    const dayOfMonth   = new Date().getDate();
    const dailyRate    = dayOfMonth > 0 ? currentMonthSpend / dayOfMonth : 0;
    const projectedMonthly  = dailyRate * daysInMonth;
    const projectedAnnual   = projectedMonthly * 12;

    return NextResponse.json({
      ok: true,
      data: {
        ...budgets,
        month,
        yearly_spend_usd:        Math.round(yearlySpend * 1e6) / 1e6,
        projected_monthly_usd:   Math.round(projectedMonthly * 1e6) / 1e6,
        projected_annual_usd:    Math.round(projectedAnnual * 1e6) / 1e6,
        annual_cap_usd:          budgets.annual_cap_usd,
        annual_remaining_usd:    Math.max(0, budgets.annual_cap_usd - yearlySpend),
        model_breakdown:         modelBreakdown,
        top_cost_missions:       topCostMissions,
      },
    });
  } catch (err) {
    console.error('[GET /budgets]', err);
    return NextResponse.json({ ok: false, error: 'Error interno' }, { status: 500 });
  }
}
