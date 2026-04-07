'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSSE } from '@/lib/useSSE';
import CommsLog from '@/components/terminal/CommsLog';

// ── Types ────────────────────────────────────────────────────

interface Mission {
  id: string; mission_id: string; intent: string; priority: string;
  status: string; budget_usd: number; loco_state: string;
  active_agents: string[]; total_cost_usd: number; task_count: number;
  created_at: string;
}

interface BudgetProvider {
  provider: string; spent_usd: number; cap_usd: number;
  remaining_usd: number; pct_used: number; over_cap: boolean;
}

interface AgentBudget {
  agent: string; spent_usd: number; cap_usd: number;
  remaining_usd: number; over_cap: boolean;
}

interface ModelRow {
  provider: string; model: string; agent: string;
  tokens_input: number; tokens_output: number;
  cost_total_usd: number; call_count: number;
}

interface BudgetData {
  month: string; total_spent_usd: number; annual_cap_usd: number;
  yearly_spend_usd: number; projected_monthly_usd: number;
  projected_annual_usd: number; annual_remaining_usd: number;
  providers: BudgetProvider[]; agents: AgentBudget[];
  model_breakdown: ModelRow[]; top_cost_missions: { mission_id: string; intent: string; cost_usd: number }[];
}

interface Approval {
  id: string; approval_id: string; mission_id: string;
  action_type: string; risk_level: string; description: string;
  requested_by: string; status: string; requested_at: string;
  mission_label: string;
}

// ── Helpers ──────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'text-green-400', STANDBY: 'text-yellow-500',
  COMPLETED: 'text-gray-500', FAILED: 'text-red-500',
  AWAITING_APPROVAL: 'text-yellow-400', CANCELLED: 'text-gray-600',
  DEGRADED: 'text-orange-400',
};

const PRIORITY_COLOR: Record<string, string> = {
  P0: 'text-red-400 font-bold', P1: 'text-orange-400',
  P2: 'text-yellow-400', P3: 'text-gray-400',
};

const RISK_COLOR: Record<string, string> = {
  CRITICAL: 'text-red-400', HIGH: 'text-orange-400',
  MEDIUM: 'text-yellow-400', LOW: 'text-green-400',
};

const MEDAL_LABELS: Record<string, string> = {
  NC: '🥇NC', BS: '🥈BS', CM: '⭐CM', CA: '🎯CA',
  MS: '🔧MS', GC: '🛡️GC', PH: '💜PH',
};

const SOLDIERS_META: Record<string, { emoji: string; color: string; medals: string[] }> = {
  RAMBO:    { emoji: '🔴', color: '#ef4444', medals: ['NC'] },
  BLADE:    { emoji: '⚫', color: '#374151', medals: [] },
  FORGE:    { emoji: '🟤', color: '#92400e', medals: ['BS'] },
  PIXEL:    { emoji: '🔵', color: '#1d4ed8', medals: [] },
  NEXUS:    { emoji: '🩵', color: '#0891b2', medals: ['MS'] },
  CERBERUS: { emoji: '🩶', color: '#4b5563', medals: ['CA'] },
  HOUSE:    { emoji: '🟢', color: '#15803d', medals: ['GC'] },
  WINSTON:  { emoji: '🟣', color: '#7c3aed', medals: ['CM'] },
  MARCO:    { emoji: '🟠', color: '#c2410c', medals: [] },
  LOCO:     { emoji: '🔥', color: '#dc2626', medals: ['PH'] },
};

function fmt$(n: number, decimals = 4) {
  return `$${n.toFixed(decimals)}`;
}

function pctBar(pct: number, over: boolean) {
  const w = Math.min(pct, 100).toFixed(1);
  const color = over ? '#ef4444' : pct > 80 ? '#f97316' : pct > 50 ? '#eab308' : '#22c55e';
  return (
    <div className="w-full bg-[#1e2a36] rounded-sm h-1.5 mt-1">
      <div style={{ width: `${w}%`, background: color, height: '100%', borderRadius: 2, transition: 'width .4s' }} />
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────

export default function WarRoom() {
  const [tab, setTab] = useState<'missions' | 'budget' | 'approvals' | 'comms'>('missions');
  const [missions, setMissions]     = useState<Mission[]>([]);
  const [budget, setBudget]         = useState<BudgetData | null>(null);
  const [approvals, setApprovals]   = useState<Approval[]>([]);
  const [activeMission, setActiveMission] = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [createForm, setCreateForm] = useState({ intent: '', priority: 'P2', budget_usd: 75 });
  const [creating, setCreating]     = useState(false);
  const [advanceResult, setAdvanceResult] = useState<string | null>(null);
  const [advancing, setAdvancing]   = useState(false);

  const { events, connected } = useSSE(activeMission);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ────────────────────────────────────────────────

  const fetchMissions = useCallback(async () => {
    const r = await fetch('/api/v1/missions?limit=20');
    const d = await r.json();
    if (d.ok) setMissions(d.data);
  }, []);

  const fetchBudget = useCallback(async () => {
    const r = await fetch('/api/v1/budgets');
    const d = await r.json();
    if (d.ok) setBudget(d.data);
  }, []);

  const fetchApprovals = useCallback(async () => {
    const r = await fetch('/api/v1/approvals?status=PENDING');
    const d = await r.json();
    if (d.ok) setApprovals(d.data);
  }, []);

  useEffect(() => {
    fetchMissions();
    fetchBudget();
    fetchApprovals();
    pollRef.current = setInterval(() => {
      fetchMissions();
      fetchBudget();
      fetchApprovals();
    }, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMissions, fetchBudget, fetchApprovals]);

  // ── Crear misión ─────────────────────────────────────────

  const createMission = async () => {
    if (!createForm.intent.trim() || createForm.intent.length < 10) return;
    setCreating(true);
    try {
      const r = await fetch('/api/v1/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const d = await r.json();
      if (d.ok) {
        setCreateForm({ intent: '', priority: 'P2', budget_usd: 75 });
        await fetchMissions();
        setActiveMission(d.data.mission_id);
        setTab('comms');
      }
    } finally { setCreating(false); }
  };

  // ── Advance RAMBO ────────────────────────────────────────

  const advanceMission = async (missionId: string) => {
    setAdvancing(true);
    setAdvanceResult(null);
    try {
      const r = await fetch(`/api/v1/missions/${missionId}/advance`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) {
        const dec = d.data.decision as Record<string, unknown>;
        setAdvanceResult(JSON.stringify(dec, null, 2));
        await fetchMissions();
        await fetchBudget();
      } else {
        setAdvanceResult(`ERROR: ${d.error}`);
      }
    } finally { setAdvancing(false); }
  };

  // ── Approve / Reject ─────────────────────────────────────

  const resolve = async (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      await fetch(`/api/v1/approvals/${approvalId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, decided_by: 'SANTI' }),
      });
      await Promise.all([fetchApprovals(), fetchMissions()]);
    } finally { setLoading(false); }
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>

      {/* ── HEADER ── */}
      <header style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }} className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg">🪖</span>
          <div>
            <div className="font-bold tracking-widest text-sm" style={{ color: 'var(--color-gold)' }}>BOPE — SALA DE GUERRA</div>
            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              COMMANDER: SANTIAGO ISBERT PERLENDER &nbsp;★★★★★
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full pulse ${connected ? 'bg-green-400' : 'bg-red-500'}`} />
            <span style={{ color: 'var(--color-text-muted)' }}>{connected ? 'SSE LIVE' : 'SSE OFF'}</span>
          </div>
          {budget && (
            <div style={{ color: 'var(--color-text-muted)' }}>
              <span style={{ color: 'var(--color-warning)' }}>MES: {fmt$(budget.total_spent_usd)}</span>
              &nbsp;/&nbsp;
              <span>AÑO: {fmt$(budget.yearly_spend_usd, 2)}</span>
              &nbsp;/&nbsp;
              <span>CAP: ${budget.annual_cap_usd}</span>
            </div>
          )}
          <div style={{ color: 'var(--color-text-muted)' }}>
            {approvals.length > 0 && (
              <span className="text-yellow-400 font-bold">⚠ {approvals.length} APROBACIÓN{approvals.length > 1 ? 'ES' : ''}</span>
            )}
          </div>
        </div>
      </header>

      {/* ── TABS ── */}
      <nav style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }} className="flex px-6 gap-6 text-xs">
        {(['missions', 'budget', 'approvals', 'comms'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`py-2 uppercase tracking-widest transition-colors ${tab === t ? 'tab-active' : ''}`}
            style={{ color: tab === t ? 'var(--color-primary)' : 'var(--color-text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
            {t === 'approvals' && approvals.length > 0 ? `${t} (${approvals.length})` : t}
          </button>
        ))}
      </nav>

      {/* ── MAIN ── */}
      <main className="flex-1 p-6 overflow-auto">

        {/* ══════ MISSIONS TAB ══════ */}
        {tab === 'missions' && (
          <div className="flex flex-col gap-6">

            {/* Crear misión */}
            <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} className="p-5 rounded">
              <div className="text-xs tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>▸ NUEVA ORDEN A RAMBO</div>
              <textarea
                value={createForm.intent}
                onChange={e => setCreateForm(f => ({ ...f, intent: e.target.value }))}
                placeholder="Describe la intención mínima de la misión..."
                rows={3}
                className="w-full p-3 text-sm rounded resize-none mb-3"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', outline: 'none' }}
              />
              <div className="flex gap-3 flex-wrap">
                {(['P0','P1','P2','P3'] as const).map(p => (
                  <button key={p} onClick={() => setCreateForm(f => ({ ...f, priority: p }))}
                    className="px-3 py-1 text-xs rounded border transition-all"
                    style={{
                      borderColor: createForm.priority === p ? 'var(--color-primary)' : 'var(--color-border)',
                      color: createForm.priority === p ? 'var(--color-primary)' : 'var(--color-text-muted)',
                      background: 'transparent', cursor: 'pointer',
                    }}>{p}</button>
                ))}
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Budget USD:</span>
                  <input type="number" value={createForm.budget_usd}
                    onChange={e => setCreateForm(f => ({ ...f, budget_usd: Number(e.target.value) }))}
                    className="w-20 px-2 py-1 text-xs rounded"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)', fontFamily: 'var(--font-mono)', outline: 'none' }} />
                </div>
                <button onClick={createMission} disabled={creating || createForm.intent.length < 10}
                  className="ml-auto px-5 py-1.5 text-xs rounded border font-bold tracking-widest transition-all"
                  style={{
                    borderColor: 'var(--color-success)', color: 'var(--color-success)',
                    background: 'transparent', cursor: 'pointer', opacity: creating ? 0.5 : 1,
                  }}>
                  {creating ? '⟳ CREANDO...' : '▶ EMITIR ORDEN'}
                </button>
              </div>
            </section>

            {/* Lista de misiones */}
            <section>
              <div className="text-xs tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>▸ MISIONES ACTIVAS</div>
              {missions.length === 0 ? (
                <div className="text-xs py-4" style={{ color: 'var(--color-text-faint)' }}>— Sin misiones registradas —</div>
              ) : (
                <div className="flex flex-col gap-2">
                  {missions.map(m => (
                    <div key={m.id}
                      onClick={() => { setActiveMission(m.mission_id); setTab('comms'); }}
                      style={{
                        background: activeMission === m.mission_id ? 'var(--color-surface-2)' : 'var(--color-surface)',
                        border: `1px solid ${activeMission === m.mission_id ? 'var(--color-primary-dim)' : 'var(--color-border)'}`,
                        cursor: 'pointer',
                      }}
                      className="p-4 rounded flex items-start justify-between gap-4 hover:border-[var(--color-border-bright)] transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${PRIORITY_COLOR[m.priority]}`}>{m.priority}</span>
                          <span className={`text-xs font-bold ${STATUS_COLOR[m.status] ?? 'text-gray-400'}`}>{m.status}</span>
                          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{m.mission_id}</span>
                        </div>
                        <div className="text-sm truncate" style={{ color: 'var(--color-text)' }}>{m.intent}</div>
                        <div className="flex gap-4 mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <span>Tareas: {m.task_count}</span>
                          <span>Agentes: {m.active_agents?.join(', ') || '—'}</span>
                          <span style={{ color: 'var(--color-warning)' }}>Costo: {fmt$(Number(m.total_cost_usd))}</span>
                          <span>LOCO: <span className={m.loco_state === 'HOLD' ? 'text-gray-500' : m.loco_state === 'LIMITED_RELEASE' ? 'text-yellow-400' : 'text-red-400'}>{m.loco_state}</span></span>
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); advanceMission(m.mission_id); }}
                        disabled={advancing}
                        className="px-3 py-1 text-xs rounded border flex-shrink-0"
                        style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)', background: 'transparent', cursor: 'pointer' }}>
                        {advancing ? '⟳' : 'ADVANCE'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Resultado de advance */}
            {advanceResult && (
              <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} className="p-4 rounded">
                <div className="text-xs tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>▸ DECISIÓN RAMBO</div>
                <pre className="text-xs overflow-x-auto" style={{ color: 'var(--color-success)', whiteSpace: 'pre-wrap' }}>{advanceResult}</pre>
              </section>
            )}
          </div>
        )}

        {/* ══════ BUDGET TAB ══════ */}
        {tab === 'budget' && (
          <div className="flex flex-col gap-6">
            {!budget ? (
              <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Cargando presupuestos...</div>
            ) : (
              <>
                {/* Resumen anual */}
                <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'MES ACTUAL', value: fmt$(budget.total_spent_usd), sub: `de $${budget.providers.find(p => p.provider === 'anthropic')?.cap_usd ?? 25} Claude + $${budget.providers.find(p => p.provider === 'openai')?.cap_usd ?? 50} OAI` },
                    { label: 'AÑO EN CURSO', value: fmt$(budget.yearly_spend_usd, 2), sub: `de $${budget.annual_cap_usd}/año` },
                    { label: 'PROYECCIÓN MENSUAL', value: fmt$(budget.projected_monthly_usd), sub: 'a ritmo actual' },
                    { label: 'PROYECCIÓN ANUAL', value: fmt$(budget.projected_annual_usd, 2), sub: `margen $${budget.annual_remaining_usd.toFixed(2)}` },
                  ].map(c => (
                    <div key={c.label} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} className="p-4 rounded">
                      <div className="text-xs mb-1 tracking-widest" style={{ color: 'var(--color-text-muted)' }}>{c.label}</div>
                      <div className="text-xl font-bold" style={{ color: 'var(--color-gold)' }}>{c.value}</div>
                      <div className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>{c.sub}</div>
                    </div>
                  ))}
                </section>

                {/* Caps por proveedor */}
                <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} className="p-5 rounded">
                  <div className="text-xs tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>▸ HARD CAPS POR PROVEEDOR — {budget.month}</div>
                  <div className="flex flex-col gap-4">
                    {budget.providers.map(p => (
                      <div key={p.provider}>
                        <div className="flex justify-between text-xs mb-0.5">
                          <span className="uppercase font-bold" style={{ color: p.over_cap ? 'var(--color-danger)' : 'var(--color-text)' }}>
                            {p.provider} {p.over_cap && '⚠ EXCEDIDO'}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)' }}>
                            {fmt$(p.spent_usd)} / ${p.cap_usd} — {p.remaining_usd.toFixed(4)} restante — {p.pct_used.toFixed(1)}%
                          </span>
                        </div>
                        {pctBar(p.pct_used, p.over_cap)}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Desglose por modelo */}
                {budget.model_breakdown.length > 0 && (
                  <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} className="p-5 rounded">
                    <div className="text-xs tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>▸ DESGLOSE EXACTO POR MODELO Y AGENTE</div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr style={{ color: 'var(--color-text-muted)', borderBottom: '1px solid var(--color-border)' }}>
                          <th className="text-left py-2 pr-4">Agente</th>
                          <th className="text-left py-2 pr-4">Modelo</th>
                          <th className="text-right py-2 pr-4">Calls</th>
                          <th className="text-right py-2 pr-4">Tokens IN</th>
                          <th className="text-right py-2 pr-4">Tokens OUT</th>
                          <th className="text-right py-2">Costo USD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {budget.model_breakdown.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td className="py-1.5 pr-4">
                              <span>{SOLDIERS_META[r.agent]?.emoji ?? '·'} {r.agent}</span>
                            </td>
                            <td className="py-1.5 pr-4" style={{ color: 'var(--color-text-muted)' }}>{r.model}</td>
                            <td className="py-1.5 pr-4 text-right" style={{ color: 'var(--color-text-muted)' }}>{r.call_count}</td>
                            <td className="py-1.5 pr-4 text-right" style={{ color: 'var(--color-text-muted)' }}>{Number(r.tokens_input).toLocaleString()}</td>
                            <td className="py-1.5 pr-4 text-right" style={{ color: 'var(--color-text-muted)' }}>{Number(r.tokens_output).toLocaleString()}</td>
                            <td className="py-1.5 text-right font-bold" style={{ color: 'var(--color-warning)' }}>{fmt$(Number(r.cost_total_usd))}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: '2px solid var(--color-border-bright)' }}>
                          <td colSpan={5} className="pt-2 text-right pr-4 font-bold text-xs tracking-widest" style={{ color: 'var(--color-text-muted)' }}>TOTAL MES</td>
                          <td className="pt-2 text-right font-bold" style={{ color: 'var(--color-gold)' }}>
                            {fmt$(budget.total_spent_usd)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </section>
                )}

                {/* Agentes con más gasto */}
                {budget.agents.length > 0 && (
                  <section style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} className="p-5 rounded">
                    <div className="text-xs tracking-widest mb-4" style={{ color: 'var(--color-text-muted)' }}>▸ GASTO POR SOLDADO</div>
                    <div className="flex flex-col gap-3">
                      {budget.agents.map(a => (
                        <div key={a.agent}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span style={{ color: a.over_cap ? 'var(--color-danger)' : 'var(--color-text)' }}>
                              {SOLDIERS_META[a.agent]?.emoji ?? '·'} {a.agent} {a.over_cap && '⚠'}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)' }}>
                              {fmt$(a.spent_usd)} / ${a.cap_usd}
                            </span>
                          </div>
                          {pctBar(a.cap_usd > 0 ? (a.spent_usd / a.cap_usd) * 100 : 0, a.over_cap)}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════ APPROVALS TAB ══════ */}
        {tab === 'approvals' && (
          <div className="flex flex-col gap-3">
            <div className="text-xs tracking-widest mb-2" style={{ color: 'var(--color-text-muted)' }}>▸ COLA DE APROBACIONES — SOLO SANTI DECIDE</div>
            {approvals.length === 0 ? (
              <div className="text-xs py-6 text-center" style={{ color: 'var(--color-text-faint)' }}>
                ✓ Sin aprobaciones pendientes
              </div>
            ) : (
              approvals.map(a => (
                <div key={a.id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} className="p-4 rounded">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold ${RISK_COLOR[a.risk_level]}`}>{a.risk_level}</span>
                        <span className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>{a.action_type}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{a.approval_id}</span>
                      </div>
                      <div className="text-sm mb-1">{a.description}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        Misión: {a.mission_label} &nbsp;·&nbsp; Solicitado por: {a.requested_by}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => resolve(a.id, 'APPROVED')} disabled={loading}
                        className="px-3 py-1 text-xs rounded border"
                        style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'transparent', cursor: 'pointer' }}>
                        ✓ APROBAR
                      </button>
                      <button onClick={() => resolve(a.id, 'REJECTED')} disabled={loading}
                        className="px-3 py-1 text-xs rounded border"
                        style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', background: 'transparent', cursor: 'pointer' }}>
                        ✕ RECHAZAR
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ══════ COMMS TAB ══════ */}
        {tab === 'comms' && (
          <div className="flex flex-col gap-4 h-full">
            {/* Selector de misión */}
            <div className="flex gap-2 flex-wrap">
              {missions.map(m => (
                <button key={m.id} onClick={() => setActiveMission(m.mission_id)}
                  className="px-3 py-1 text-xs rounded border transition-all"
                  style={{
                    borderColor: activeMission === m.mission_id ? 'var(--color-primary)' : 'var(--color-border)',
                    color: activeMission === m.mission_id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    background: 'transparent', cursor: 'pointer',
                  }}>
                  {m.mission_id}
                </button>
              ))}
              {missions.length === 0 && (
                <span className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Sin misiones — crea una primero</span>
              )}
            </div>

            {activeMission ? (
              <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', minHeight: '60vh' }}
                className="rounded flex flex-col">
                <div className="px-4 py-2 border-b flex items-center gap-2" style={{ borderColor: 'var(--color-border)' }}>
                  <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 pulse' : 'bg-red-500'}`} />
                  <span className="text-xs tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                    COMMS LOG — {activeMission}
                  </span>
                </div>
                <div style={{ minHeight: '50vh' }}>
                  <CommsLog events={events} />
                </div>
              </div>
            ) : (
              <div className="text-xs py-8 text-center" style={{ color: 'var(--color-text-faint)' }}>
                — Selecciona una misión para ver el COMMS LOG —
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-faint)' }}
        className="px-6 py-2 flex justify-between text-xs">
        <span style={{ color: 'var(--color-text-faint)' }}>BOPE v1.0 · Claude claude-sonnet-4-6 · OpenAI pending</span>
        <span style={{ color: 'var(--color-text-faint)' }}>
          {budget ? `CAP ANUAL: $${budget.annual_cap_usd} · USADO: ${fmt$(budget.yearly_spend_usd, 2)} · RESTANTE: $${budget.annual_remaining_usd.toFixed(2)}` : ''}
        </span>
      </footer>
    </div>
  );
}
