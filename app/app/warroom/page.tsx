'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSSE } from '@/lib/useSSE';
import CommsLog from '@/components/terminal/CommsLog';

// ── Types ─────────────────────────────────────────────────────

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
  model_breakdown: ModelRow[];
  top_cost_missions: { mission_id: string; intent: string; cost_usd: number }[];
}
interface Approval {
  id: string; approval_id: string; mission_id: string;
  action_type: string; risk_level: string; description: string;
  requested_by: string; status: string; requested_at: string;
  mission_label: string;
}

type Tab = 'mando' | 'batallon' | 'misiones' | 'presupuesto' | 'aprobaciones' | 'comms';

// ── Static Data — Roster & Records ────────────────────────────

const SOLDIERS = [
  {
    id: 'RAMBO', alias: 'JOHN', role: 'Sargento Mayor', rank: 'SGM',
    civil: 'John James Rambo', origin: 'Bowie, Arizona', color: '#DC143C',
    emoji: '🔴', provider: 'anthropic', model: 'claude-sonnet-4-6',
    medals: ['NC'],
    bio: 'Líder táctico. Primer punto de contacto operativo. Interpreta, ordena, asigna ownership, arbitra y consolida.',
    missions: 3, lines: 0, sanctions: 1,
  },
  {
    id: 'FORGE', alias: 'BACK', role: 'Teniente Backend', rank: '1LT',
    civil: 'Arben Dervinski Kola', origin: 'Albania', color: '#92400e',
    emoji: '🟤', provider: 'openai', model: 'gpt-4o-mini',
    medals: ['BS'],
    bio: 'APIs, base de datos Neon/PostgreSQL, Vercel e infraestructura. Stack: Node.js, TypeScript, Next.js.',
    missions: 2, lines: 0, sanctions: 0,
  },
  {
    id: 'PIXEL', alias: 'FRONT', role: 'Teniente Frontend', rank: '1LT',
    civil: 'Adria Ferrer Soler', origin: 'Barcelona, España', color: '#1d4ed8',
    emoji: '🔵', provider: 'openai', model: 'gpt-4o-mini',
    medals: [],
    bio: 'UI/UX, React, TypeScript, experiencia de usuario. Stack: Next.js, Tailwind CSS, shadcn/ui.',
    missions: 1, lines: 0, sanctions: 0,
  },
  {
    id: 'NEXUS', alias: 'WIRE', role: 'Integrador', rank: 'GSGT',
    civil: 'Darius Wei Tan', origin: 'Singapur', color: '#0891b2',
    emoji: '🩵', provider: 'openai', model: 'gpt-4o-mini',
    medals: ['MS'],
    bio: 'Integración end-to-end entre frontend y backend. Detecta type mismatches, valida contratos API.',
    missions: 2, lines: 0, sanctions: 1,
  },
  {
    id: 'CERBERUS', alias: 'GUARDIAN', role: 'Guardián', rank: 'MSGT',
    civil: 'Elias Nathan Mercer', origin: 'Baltimore, Maryland', color: '#4b5563',
    emoji: '🩶', provider: 'openai', model: 'gpt-4o-mini',
    medals: ['CA'],
    bio: 'Auditoría de seguridad, secrets, variables de entorno. Solo audita y reporta — no modifica.',
    missions: 2, lines: 0, sanctions: 0,
  },
  {
    id: 'HOUSE', alias: 'DOCTOR', role: 'Especialista QA', rank: 'SSGT',
    civil: 'William Arthur Hargreaves', origin: 'Manchester, Inglaterra', color: '#15803d',
    emoji: '🟢', provider: 'openai', model: 'gpt-4o-mini',
    medals: ['GC'],
    bio: 'Diagnóstico, debugging, detección de bugs. Unidad móvil de auditoría. Reproduce, aísla, documenta.',
    missions: 2, lines: 0, sanctions: 0,
  },
  {
    id: 'WINSTON', alias: 'SCRIBE', role: 'Cronista', rank: 'WO',
    civil: 'Winston Alastair MacLeod', origin: 'Edimburgo, Escocia', color: '#7c3aed',
    emoji: '🟣', provider: 'anthropic', model: 'claude-sonnet-4-6',
    medals: ['CM'],
    bio: 'Memoria viva en movimiento. Captura decisiones parciales, registra handoffs, consolida doctrina.',
    missions: 2, lines: 0, sanctions: 0,
  },
  {
    id: 'MARCO', alias: 'HERALD', role: 'Capellán', rank: 'CHAP',
    civil: 'Marco Aurelio de Almeida', origin: 'Río de Janeiro, Brasil', color: '#c2410c',
    emoji: '🟠', provider: 'anthropic', model: 'claude-sonnet-4-6',
    medals: [],
    bio: 'Consejero del Comandante. Única autoridad para sugerir medallas y sanciones. Reporta solo a Santiago.',
    missions: 1, lines: 0, sanctions: 0,
  },
  {
    id: 'BLADE', alias: 'KILLER', role: 'Reserva Especial', rank: 'RECON',
    civil: 'Nikola Vukovic', origin: 'Belgrado, Serbia', color: '#1f2937',
    emoji: '⚫', provider: 'openai', model: 'gpt-4o',
    medals: [],
    bio: 'Refactor nuclear, reescritura de código legacy. Solo con doble firma: Santiago + John.',
    missions: 0, lines: 0, sanctions: 0,
  },
  {
    id: 'LOCO', alias: 'SICARIO', role: 'Operativo Especial', rank: 'TIER1',
    civil: 'Mateo Esteban Salazar', origin: 'Colombia', color: '#dc2626',
    emoji: '🔥', provider: 'openai', model: 'gpt-4o-mini',
    medals: ['PH'],
    bio: 'Irrupción, hotfixes, presión extrema. No pregunta — ejecuta. Requiere mando claro y revisión post-irrupción.',
    missions: 1, lines: 0, sanctions: 1,
  },
];

// ── USMC Medal Ribbons (CSS) ───────────────────────────────────

const MEDAL_DATA: Record<string, {
  name: string; full: string; stripes: string[]; desc: string;
}> = {
  NC: {
    name: 'Navy Cross', full: '[NC]',
    stripes: ['#003087','#003087','#FFD700','#003087','#003087'],
    desc: 'Ejecución excepcional bajo presión extrema',
  },
  BS: {
    name: 'Bronze Star', full: '[BS]',
    stripes: ['#C8102E','#FFFFFF','#003087','#FFFFFF','#C8102E'],
    desc: 'Entrega sin errores en misión crítica',
  },
  CM: {
    name: 'Commendation Medal', full: '[CM]',
    stripes: ['#4B6F44','#4B6F44','#FFD700','#4B6F44','#4B6F44'],
    desc: 'Trabajo sobresaliente en campaña',
  },
  CA: {
    name: 'Combat Action Ribbon', full: '[CA]',
    stripes: ['#FFD700','#C8102E','#003087','#C8102E','#FFD700'],
    desc: 'Resolver bug/crisis en producción en vivo',
  },
  MS: {
    name: 'Meritorious Service', full: '[MS]',
    stripes: ['#C8102E','#FFFFFF','#C8102E','#FFFFFF','#C8102E'],
    desc: 'Contribución técnica de alto impacto',
  },
  GC: {
    name: 'Good Conduct Medal', full: '[GC]',
    stripes: ['#8B0000','#FFD700','#8B0000','#FFD700','#8B0000'],
    desc: '10 misiones sin una sola infracción',
  },
  PH: {
    name: 'Purple Heart', full: '[PH]',
    stripes: ['#800080','#800080','#FFD700','#800080','#800080'],
    desc: 'Caída en misión, sanción cumplida, retorno honorable',
  },
};

function MedalRibbon({ code, size = 'sm' }: { code: string; size?: 'sm' | 'lg' }) {
  const m = MEDAL_DATA[code];
  if (!m) return null;
  const w = size === 'lg' ? 40 : 20;
  const h = size === 'lg' ? 14 : 8;
  const stripeW = w / m.stripes.length;
  return (
    <div title={`${m.name} — ${m.desc}`} style={{ display: 'inline-block', cursor: 'help' }}>
      <svg width={w} height={h} style={{ display: 'block' }}>
        {m.stripes.map((c, i) => (
          <rect key={i} x={i * stripeW} y={0} width={stripeW} height={h} fill={c} />
        ))}
        <rect x={0} y={0} width={w} height={h} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={0.5} />
      </svg>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#22c55e', STANDBY: '#eab308', COMPLETED: '#6b7280',
  FAILED: '#ef4444', AWAITING_APPROVAL: '#f59e0b',
  CANCELLED: '#4b5563', DEGRADED: '#f97316',
};
const PRIORITY_COLOR: Record<string, string> = {
  P0: '#ef4444', P1: '#f97316', P2: '#eab308', P3: '#6b7280',
};
const RISK_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444', HIGH: '#f97316', MEDIUM: '#eab308', LOW: '#22c55e',
};
const LOCO_COLOR: Record<string, string> = {
  HOLD: '#4b5563', LIMITED_RELEASE: '#eab308', EMERGENCY_RELEASE: '#ef4444',
};

function fmt$(n: number, d = 4) { return `$${Number(n).toFixed(d)}`; }

function PctBar({ pct, over }: { pct: number; over: boolean }) {
  const w = Math.min(pct, 100);
  const color = over ? '#ef4444' : pct > 80 ? '#f97316' : pct > 50 ? '#eab308' : '#22c55e';
  return (
    <div style={{ width: '100%', background: '#1e2a36', borderRadius: 2, height: 6, marginTop: 4 }}>
      <div style={{ width: `${w}%`, background: color, height: '100%', borderRadius: 2, transition: 'width .4s' }} />
    </div>
  );
}

// ── Tactical Network Diagram ──────────────────────────────────

function TacticalNetwork({ missions, locoState }: { missions: Mission[]; locoState: string }) {
  const activeMission = missions.find(m => m.status === 'ACTIVE');
  const networkSoldiers = SOLDIERS.filter(s => s.id !== 'RAMBO' && s.id !== 'MARCO');

  return (
    <div style={{ padding: '24px 0', userSelect: 'none' }}>

      {/* SANTI */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a1208 0%, #2a1e0a 100%)',
          border: '2px solid #FFD700', borderRadius: 8, padding: '10px 32px',
          textAlign: 'center', minWidth: 240,
        }}>
          <div style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 13, letterSpacing: 3 }}>
            ★★★★★ SANTIAGO ISBERT PERLENDER
          </div>
          <div style={{ color: '#a87e20', fontSize: 10, marginTop: 2, letterSpacing: 2 }}>
            COMANDANTE SUPREMO · GENERAL (5★)
          </div>
          <div style={{ color: '#6b5a1a', fontSize: 9, marginTop: 2 }}>
            da intención · recibe cierre final
          </div>
        </div>
      </div>

      {/* Arrow down */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 1, height: 20, background: '#FFD700', opacity: 0.5 }} />
          <div style={{ fontSize: 10, color: '#FFD700', opacity: 0.5 }}>▼</div>
        </div>
      </div>

      {/* RAMBO */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{
          background: 'linear-gradient(135deg, #1a0808 0%, #2a0a0a 100%)',
          border: '2px solid #DC143C', borderRadius: 8, padding: '10px 32px',
          textAlign: 'center', minWidth: 280,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>🔴</span>
            <span style={{ color: '#DC143C', fontWeight: 'bold', fontSize: 13, letterSpacing: 2 }}>
              JOHN · RAMBO
            </span>
            <div style={{ display: 'flex', gap: 2 }}>
              {SOLDIERS.find(s => s.id === 'RAMBO')?.medals.map(m => (
                <MedalRibbon key={m} code={m} size="sm" />
              ))}
            </div>
          </div>
          <div style={{ color: '#7a1111', fontSize: 10, letterSpacing: 2 }}>
            SARGENTO MAYOR · MANDO OPERATIVO CENTRAL
          </div>
          <div style={{ color: '#5a0e0e', fontSize: 9, marginTop: 2 }}>
            interpreta · ordena · asigna · arbitra · consolida
          </div>
          {activeMission && (
            <div style={{ marginTop: 6, padding: '3px 8px', background: 'rgba(220,20,60,0.15)', borderRadius: 4, fontSize: 9, color: '#DC143C' }}>
              MISIÓN ACTIVA: {activeMission.mission_id}
            </div>
          )}
        </div>
      </div>

      {/* Arrow down */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 1, height: 16, background: '#DC143C', opacity: 0.4 }} />
          <div style={{ fontSize: 10, color: '#DC143C', opacity: 0.4 }}>▼</div>
        </div>
      </div>

      {/* Red label */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <div style={{
          border: '1px dashed #374151', borderRadius: 4, padding: '4px 16px',
          fontSize: 9, color: '#4b5563', letterSpacing: 2,
        }}>
          RED TÁCTICA — lateralidad permitida entre compañeros
        </div>
      </div>

      {/* Soldiers network */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 900, margin: '0 auto' }}>
        {networkSoldiers.map(s => {
          const isLoco = s.id === 'LOCO';
          const locoC = isLoco ? LOCO_COLOR[locoState] || '#4b5563' : undefined;
          return (
            <div key={s.id} style={{
              background: `linear-gradient(135deg, #0d1117 0%, #161b22 100%)`,
              border: `1.5px solid ${isLoco ? locoC : s.color}44`,
              borderRadius: 6, padding: '8px 12px', minWidth: 110, textAlign: 'center',
              position: 'relative',
            }}>
              {isLoco && (
                <div style={{
                  position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
                  background: locoC, borderRadius: 3, padding: '1px 6px',
                  fontSize: 8, fontWeight: 'bold', color: '#fff', letterSpacing: 1, whiteSpace: 'nowrap',
                }}>
                  {locoState.replace('_', ' ')}
                </div>
              )}
              <div style={{ fontSize: 14, marginBottom: 2 }}>{s.emoji}</div>
              <div style={{ color: s.color, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>{s.id}</div>
              <div style={{ color: '#4b5563', fontSize: 8, letterSpacing: 1 }}>{s.role.split(' ')[0]}</div>
              {s.medals.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4 }}>
                  {s.medals.map(m => <MedalRibbon key={m} code={m} size="sm" />)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lateral connection line */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 60, height: 1, background: 'linear-gradient(to right, transparent, #374151)' }} />
          <span style={{ fontSize: 8, color: '#374151', letterSpacing: 1 }}>↔ lateralidad ↔</span>
          <div style={{ width: 60, height: 1, background: 'linear-gradient(to left, transparent, #374151)' }} />
        </div>
      </div>

      {/* MARCO AURELIO — bottom, special */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
        <div style={{
          background: 'linear-gradient(135deg, #0d0a06 0%, #1a1208 100%)',
          border: '1px solid #c2410c44', borderRadius: 6, padding: '6px 20px',
          textAlign: 'center', fontSize: 9, color: '#7a4520',
        }}>
          <span style={{ marginRight: 6 }}>🟠</span>
          <span style={{ color: '#c2410c', fontWeight: 'bold', letterSpacing: 1 }}>MARCO AURELIO</span>
          <span style={{ marginLeft: 8, color: '#4b2510' }}>· interviene si detecta costo moral ·</span>
        </div>
      </div>

      {/* Up arrows */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, gap: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: '#374151' }}>▲</div>
          <div style={{ width: 1, height: 12, background: '#374151' }} />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ fontSize: 8, color: '#4b5563', letterSpacing: 2, padding: '2px 12px', border: '1px dashed #374151', borderRadius: 3 }}>
          todo resultado relevante sube a RAMBO · RAMBO compacta y reporta al Comandante
        </div>
      </div>

      {/* LOCO doctrine */}
      <div style={{ marginTop: 16, padding: '8px 16px', background: '#0d1117', border: '1px solid #374151', borderRadius: 6, maxWidth: 600, margin: '16px auto 0' }}>
        <div style={{ fontSize: 9, color: '#4b5563', letterSpacing: 1, marginBottom: 4 }}>DOCTRINA LOCO — CONTROL DE CORREA</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {(['HOLD', 'LIMITED_RELEASE', 'EMERGENCY_RELEASE'] as const).map(state => (
            <div key={state} style={{
              flex: 1, padding: '4px 8px', borderRadius: 4, textAlign: 'center',
              background: locoState === state ? LOCO_COLOR[state] + '22' : 'transparent',
              border: `1px solid ${locoState === state ? LOCO_COLOR[state] : '#374151'}`,
            }}>
              <div style={{ fontSize: 8, fontWeight: 'bold', color: LOCO_COLOR[state], letterSpacing: 1 }}>
                {state.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 7, color: '#4b5563', marginTop: 2 }}>
                {state === 'HOLD' ? 'solo RAMBO activa' : state === 'LIMITED_RELEASE' ? 'compañeros c/ permiso' : 'cualquier frente crítico'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Soldier Card ──────────────────────────────────────────────

function SoldierCard({ s }: { s: typeof SOLDIERS[0] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{
        background: '#0d1117', border: `1px solid ${s.color}33`,
        borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
        transition: 'border-color .2s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = s.color + '88')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = s.color + '33')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{s.emoji}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: s.color, fontWeight: 'bold', fontSize: 12, letterSpacing: 2 }}>{s.id}</span>
            <span style={{ color: '#4b5563', fontSize: 9, letterSpacing: 1 }}>·</span>
            <span style={{ color: '#6b7280', fontSize: 9, letterSpacing: 1 }}>{s.alias}</span>
            <span style={{ color: '#374151', fontSize: 9 }}>{s.rank}</span>
          </div>
          <div style={{ color: '#374151', fontSize: 9, letterSpacing: 1, marginTop: 1 }}>{s.role.toUpperCase()}</div>
          <div style={{ color: '#4b5563', fontSize: 9, marginTop: 1 }}>{s.civil} · {s.origin}</div>

          {/* Medals */}
          <div style={{ display: 'flex', gap: 4, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {s.medals.length === 0 ? (
              <span style={{ fontSize: 9, color: '#374151' }}>— sin condecoraciones —</span>
            ) : s.medals.map(m => (
              <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MedalRibbon code={m} size="lg" />
                <span style={{ fontSize: 9, color: '#6b7280' }}>{MEDAL_DATA[m]?.name}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            <span style={{ fontSize: 9, color: '#374151' }}>Misiones: <span style={{ color: '#6b7280' }}>{s.missions}</span></span>
            <span style={{ fontSize: 9, color: s.sanctions > 0 ? '#f97316' : '#374151' }}>
              Sanciones: <span>{s.sanctions}</span>
            </span>
            <span style={{ fontSize: 9, color: '#374151' }}>
              {s.provider === 'anthropic' ? '🔷' : '🟩'} {s.model}
            </span>
          </div>
        </div>
      </div>

      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #1e2a36' }}>
          <p style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6 }}>{s.bio}</p>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function WarRoom() {
  const [tab, setTab] = useState<Tab>('mando');
  const [missions, setMissions]   = useState<Mission[]>([]);
  const [budget, setBudget]       = useState<BudgetData | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [activeMission, setActiveMission] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ intent: '', priority: 'P2', budget_usd: 75 });
  const [creating, setCreating]   = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [advanceResult, setAdvanceResult] = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);

  const { events, connected } = useSSE(activeMission);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentLocoState = missions.find(m => m.status === 'ACTIVE')?.loco_state ?? 'HOLD';

  const fetchMissions = useCallback(async () => {
    const r = await fetch('/api/v1/missions?limit=30');
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
    fetchMissions(); fetchBudget(); fetchApprovals();
    pollRef.current = setInterval(() => {
      fetchMissions(); fetchBudget(); fetchApprovals();
    }, 20000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchMissions, fetchBudget, fetchApprovals]);

  const createMission = async () => {
    if (createForm.intent.length < 10) return;
    setCreating(true);
    try {
      const r = await fetch('/api/v1/missions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  const advanceMission = async (missionId: string) => {
    setAdvancing(true); setAdvanceResult(null);
    try {
      const r = await fetch(`/api/v1/missions/${missionId}/advance`, { method: 'POST' });
      const d = await r.json();
      if (d.ok) {
        setAdvanceResult(JSON.stringify(d.data.decision, null, 2));
        await fetchMissions(); await fetchBudget();
      } else {
        setAdvanceResult(`ERROR: ${d.error}`);
      }
    } finally { setAdvancing(false); }
  };

  const resolve = async (approvalId: string, decision: 'APPROVED' | 'REJECTED') => {
    setLoading(true);
    try {
      await fetch(`/api/v1/approvals/${approvalId}/resolve`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, decided_by: 'SANTI' }),
      });
      await Promise.all([fetchApprovals(), fetchMissions()]);
    } finally { setLoading(false); }
  };

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'mando',        label: 'MANDO' },
    { id: 'batallon',     label: 'BATALLÓN' },
    { id: 'misiones',     label: 'MISIONES', badge: missions.filter(m => m.status === 'ACTIVE').length || undefined },
    { id: 'presupuesto',  label: 'PRESUPUESTO' },
    { id: 'aprobaciones', label: 'APROBACIONES', badge: approvals.length || undefined },
    { id: 'comms',        label: 'COMMS' },
  ];

  const S = {
    bg:        '#0d1117',
    surface:   '#161b22',
    surface2:  '#1e2a36',
    border:    '#21262d',
    borderBr:  '#30363d',
    text:      '#e6edf3',
    muted:     '#6e7681',
    faint:     '#3d444d',
    gold:      '#FFD700',
    danger:    '#ef4444',
    warning:   '#f97316',
    success:   '#22c55e',
    primary:   '#58a6ff',
    mono:      '"Courier New", "Consolas", monospace',
  };

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: S.bg, color: S.text, fontFamily: S.mono, fontSize: 12 }}>

      {/* ── HEADER ── */}
      <header style={{ background: S.surface, borderBottom: `1px solid ${S.border}`, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 20 }}>🪖</span>
          <div>
            <div style={{ color: S.gold, fontWeight: 'bold', letterSpacing: 4, fontSize: 13 }}>BOPE — SALA DE GUERRA</div>
            <div style={{ color: S.muted, fontSize: 9, letterSpacing: 2, marginTop: 1 }}>
              COMMANDER: SANTIAGO ISBERT PERLENDER ★★★★★ · GENERAL · CINME
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? S.success : S.danger, boxShadow: connected ? `0 0 6px ${S.success}` : 'none' }} />
            <span style={{ color: S.muted }}>{connected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: S.muted }}>LOCO:</span>
            <span style={{ color: LOCO_COLOR[currentLocoState], fontWeight: 'bold', letterSpacing: 1 }}>
              {currentLocoState.replace(/_/g, ' ')}
            </span>
          </div>
          {budget && (
            <div style={{ color: S.muted }}>
              <span style={{ color: S.warning }}>MES: {fmt$(budget.total_spent_usd)}</span>
              <span style={{ margin: '0 4px' }}>/</span>
              <span>AÑO: {fmt$(budget.yearly_spend_usd, 2)}</span>
              <span style={{ margin: '0 4px' }}>/</span>
              <span style={{ color: S.gold }}>CAP: ${budget.annual_cap_usd}</span>
            </div>
          )}
          {approvals.length > 0 && (
            <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>⚠ {approvals.length} APROBACIÓN{approvals.length > 1 ? 'ES' : ''}</span>
          )}
        </div>
      </header>

      {/* ── TABS ── */}
      <nav style={{ background: S.surface, borderBottom: `1px solid ${S.border}`, display: 'flex', padding: '0 20px', gap: 24 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '10px 0', fontSize: 10, letterSpacing: 3, fontFamily: S.mono,
              color: tab === t.id ? S.primary : S.muted,
              background: 'transparent', border: 'none', cursor: 'pointer',
              borderBottom: `2px solid ${tab === t.id ? S.primary : 'transparent'}`,
              transition: 'color .15s',
            }}>
            {t.label}{t.badge ? ` (${t.badge})` : ''}
          </button>
        ))}
      </nav>

      {/* ── MAIN ── */}
      <main style={{ flex: 1, padding: 20, overflowY: 'auto' }}>

        {/* ══════ MANDO ══════ */}
        {tab === 'mando' && (
          <div>
            <TacticalNetwork missions={missions} locoState={currentLocoState} />

            {/* Rules */}
            <div style={{ maxWidth: 700, margin: '20px auto 0', background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ color: S.muted, fontSize: 9, letterSpacing: 2, marginBottom: 10 }}>▸ REGLAS DE FUEGO — DOCTRINA BOPE</div>
              {[
                'RAMBO asigna misión, ownership y prioridad.',
                'Los soldados pueden coordinarse lateralmente entre sí.',
                'WINSTON y HOUSE tienen permiso permanente de observación lateral.',
                'La lateralidad sirve para pedir, validar, auditar, registrar o complementar.',
                'Ningún soldado lateral cambia por sí solo el objetivo estratégico ni desacata a RAMBO.',
                'Todo estado operativo relevante termina consolidado en RAMBO.',
                'RAMBO compacta y reporta al Comandante.',
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                  <span style={{ color: S.gold, fontWeight: 'bold', fontSize: 10, minWidth: 16 }}>{i + 1}.</span>
                  <span style={{ color: S.muted, fontSize: 10, lineHeight: 1.6 }}>{r}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#0d1117', borderRadius: 4, borderLeft: `3px solid ${S.gold}` }}>
                <span style={{ color: S.gold, fontStyle: 'italic', fontSize: 10 }}>
                  &quot;BOPE no es una fila. BOPE es una red bajo mando.&quot;
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ══════ BATALLÓN ══════ */}
        {tab === 'batallon' && (
          <div>
            {/* Medal legend */}
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
              <div style={{ color: S.muted, fontSize: 9, letterSpacing: 2, marginBottom: 10 }}>▸ CONDECORACIONES — EQUIVALENCIAS USMC</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {Object.entries(MEDAL_DATA).map(([code, m]) => (
                  <div key={code} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MedalRibbon code={code} size="lg" />
                    <div>
                      <div style={{ fontSize: 9, color: S.text, fontWeight: 'bold' }}>{m.name}</div>
                      <div style={{ fontSize: 8, color: S.muted }}>{m.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Soldiers grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 10 }}>
              {SOLDIERS.map(s => <SoldierCard key={s.id} s={s} />)}
            </div>
          </div>
        )}

        {/* ══════ MISIONES ══════ */}
        {tab === 'misiones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Nueva orden */}
            <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, padding: 16 }}>
              <div style={{ color: S.muted, fontSize: 9, letterSpacing: 2, marginBottom: 12 }}>▸ NUEVA ORDEN A RAMBO</div>
              <textarea value={createForm.intent}
                onChange={e => setCreateForm(f => ({ ...f, intent: e.target.value }))}
                placeholder="Describe la intención mínima de la misión..."
                rows={3}
                style={{ width: '100%', padding: 10, background: S.surface2, border: `1px solid ${S.border}`, color: S.text, fontFamily: S.mono, fontSize: 11, borderRadius: 4, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {(['P0','P1','P2','P3'] as const).map(p => (
                  <button key={p} onClick={() => setCreateForm(f => ({ ...f, priority: p }))}
                    style={{
                      padding: '4px 12px', fontSize: 10, fontFamily: S.mono, letterSpacing: 1,
                      background: 'transparent', cursor: 'pointer', borderRadius: 4,
                      border: `1px solid ${createForm.priority === p ? PRIORITY_COLOR[p] : S.border}`,
                      color: createForm.priority === p ? PRIORITY_COLOR[p] : S.muted,
                    }}>{p}</button>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                  <span style={{ color: S.muted, fontSize: 10 }}>Budget USD:</span>
                  <input type="number" value={createForm.budget_usd}
                    onChange={e => setCreateForm(f => ({ ...f, budget_usd: Number(e.target.value) }))}
                    style={{ width: 70, padding: '4px 8px', background: S.surface2, border: `1px solid ${S.border}`, color: S.text, fontFamily: S.mono, fontSize: 10, borderRadius: 4, outline: 'none' }}
                  />
                </div>
                <button onClick={createMission} disabled={creating || createForm.intent.length < 10}
                  style={{
                    marginLeft: 'auto', padding: '6px 20px', fontSize: 10, fontFamily: S.mono, letterSpacing: 2,
                    background: 'transparent', border: `1px solid ${S.success}`, color: S.success,
                    cursor: creating ? 'not-allowed' : 'pointer', borderRadius: 4, opacity: creating ? 0.5 : 1,
                  }}>
                  {creating ? '⟳ CREANDO...' : '▶ EMITIR ORDEN'}
                </button>
              </div>
            </div>

            {/* Mission list */}
            {missions.length === 0 ? (
              <div style={{ color: S.faint, fontSize: 11, textAlign: 'center', padding: 32 }}>— Sin misiones registradas —</div>
            ) : missions.map(m => (
              <div key={m.id}
                style={{
                  background: activeMission === m.mission_id ? S.surface2 : S.surface,
                  border: `1px solid ${activeMission === m.mission_id ? S.primary + '44' : S.border}`,
                  borderRadius: 8, padding: 14, cursor: 'pointer',
                }}
                onClick={() => { setActiveMission(m.mission_id); setTab('comms'); }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ color: PRIORITY_COLOR[m.priority], fontWeight: 'bold', fontSize: 11 }}>{m.priority}</span>
                      <span style={{ color: STATUS_COLOR[m.status] ?? S.muted, fontSize: 10 }}>{m.status}</span>
                      <span style={{ color: S.muted, fontSize: 10 }}>{m.mission_id}</span>
                      <span style={{ color: LOCO_COLOR[m.loco_state], fontSize: 9, letterSpacing: 1 }}>LOCO:{m.loco_state.replace(/_/g,'·')}</span>
                    </div>
                    <div style={{ color: S.text, fontSize: 12, marginBottom: 4 }}>{m.intent}</div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 10, color: S.muted }}>
                      <span>Tareas: {m.task_count}</span>
                      <span>Budget: ${m.budget_usd}</span>
                      <span style={{ color: S.warning }}>Costo: {fmt$(Number(m.total_cost_usd))}</span>
                      <span>{new Date(m.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); advanceMission(m.mission_id); }}
                    disabled={advancing}
                    style={{ padding: '6px 14px', fontSize: 10, fontFamily: S.mono, background: 'transparent', border: `1px solid ${S.primary}`, color: S.primary, cursor: 'pointer', borderRadius: 4, whiteSpace: 'nowrap', flexShrink: 0 }}>
                    {advancing ? '⟳' : 'ADVANCE RAMBO'}
                  </button>
                </div>
              </div>
            ))}

            {advanceResult && (
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ color: S.muted, fontSize: 9, letterSpacing: 2, marginBottom: 8 }}>▸ DECISIÓN RAMBO</div>
                <pre style={{ color: S.success, fontSize: 10, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>{advanceResult}</pre>
              </div>
            )}
          </div>
        )}

        {/* ══════ PRESUPUESTO ══════ */}
        {tab === 'presupuesto' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!budget ? (
              <div style={{ color: S.muted, fontSize: 11 }}>Cargando presupuestos...</div>
            ) : (
              <>
                {/* KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                  {[
                    { label: 'MES ACTUAL', value: fmt$(budget.total_spent_usd), sub: budget.month, color: S.warning },
                    { label: 'AÑO EN CURSO', value: fmt$(budget.yearly_spend_usd, 2), sub: `cap $${budget.annual_cap_usd}`, color: S.gold },
                    { label: 'PROYECCIÓN MENSUAL', value: fmt$(budget.projected_monthly_usd), sub: 'a ritmo actual', color: S.primary },
                    { label: 'PROYECCIÓN ANUAL', value: fmt$(budget.projected_annual_usd, 2), sub: `margen $${Number(budget.annual_remaining_usd).toFixed(2)}`, color: S.success },
                  ].map(c => (
                    <div key={c.label} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ color: S.muted, fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>{c.label}</div>
                      <div style={{ color: c.color, fontWeight: 'bold', fontSize: 18 }}>{c.value}</div>
                      <div style={{ color: S.faint, fontSize: 9, marginTop: 2 }}>{c.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Provider caps */}
                <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, padding: 16 }}>
                  <div style={{ color: S.muted, fontSize: 9, letterSpacing: 2, marginBottom: 12 }}>▸ HARD CAPS POR PROVEEDOR — {budget.month}</div>
                  {budget.providers.map(p => (
                    <div key={p.provider} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                        <span style={{ color: p.over_cap ? S.danger : S.text, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1 }}>
                          {p.provider} {p.over_cap && '⚠ EXCEDIDO'}
                        </span>
                        <span style={{ color: S.muted }}>
                          {fmt$(p.spent_usd)} / ${p.cap_usd} · {p.pct_used.toFixed(1)}% · {fmt$(p.remaining_usd)} restante
                        </span>
                      </div>
                      <PctBar pct={p.pct_used} over={p.over_cap} />
                    </div>
                  ))}
                </div>

                {/* Model breakdown */}
                {budget.model_breakdown.length > 0 && (
                  <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, padding: 16 }}>
                    <div style={{ color: S.muted, fontSize: 9, letterSpacing: 2, marginBottom: 12 }}>▸ DESGLOSE EXACTO POR MODELO Y AGENTE</div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10 }}>
                      <thead>
                        <tr style={{ color: S.muted, borderBottom: `1px solid ${S.border}` }}>
                          {['AGENTE','MODELO','CALLS','TOKENS IN','TOKENS OUT','COSTO USD'].map(h => (
                            <th key={h} style={{ textAlign: h === 'AGENTE' || h === 'MODELO' ? 'left' : 'right', padding: '6px 8px', letterSpacing: 1, fontWeight: 'normal' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {budget.model_breakdown.map((r, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid ${S.border}44` }}>
                            <td style={{ padding: '6px 8px', color: S.text }}>
                              {SOLDIERS.find(s => s.id === r.agent)?.emoji ?? '·'} {r.agent}
                            </td>
                            <td style={{ padding: '6px 8px', color: S.muted }}>{r.model}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: S.muted }}>{r.call_count}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: S.muted }}>{Number(r.tokens_input).toLocaleString()}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: S.muted }}>{Number(r.tokens_output).toLocaleString()}</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', color: S.warning, fontWeight: 'bold' }}>{fmt$(Number(r.cost_total_usd))}</td>
                          </tr>
                        ))}
                        <tr style={{ borderTop: `2px solid ${S.border}` }}>
                          <td colSpan={5} style={{ padding: '8px', textAlign: 'right', color: S.muted, fontSize: 9, letterSpacing: 2 }}>TOTAL MES</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: S.gold, fontWeight: 'bold', fontSize: 14 }}>{fmt$(budget.total_spent_usd)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Agent spend */}
                {budget.agents.length > 0 && (
                  <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, padding: 16 }}>
                    <div style={{ color: S.muted, fontSize: 9, letterSpacing: 2, marginBottom: 12 }}>▸ GASTO POR SOLDADO</div>
                    {budget.agents.map(a => {
                      const sol = SOLDIERS.find(s => s.id === a.agent);
                      return (
                        <div key={a.agent} style={{ marginBottom: 10 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                            <span style={{ color: a.over_cap ? S.danger : S.text }}>
                              {sol?.emoji ?? '·'} {a.agent} {a.over_cap && '⚠'}
                            </span>
                            <span style={{ color: S.muted }}>{fmt$(a.spent_usd)} / ${a.cap_usd}</span>
                          </div>
                          <PctBar pct={a.cap_usd > 0 ? (a.spent_usd / a.cap_usd) * 100 : 0} over={a.over_cap} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════ APROBACIONES ══════ */}
        {tab === 'aprobaciones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ color: S.muted, fontSize: 9, letterSpacing: 2, marginBottom: 4 }}>▸ COLA DE APROBACIONES — SOLO SANTI DECIDE</div>
            {approvals.length === 0 ? (
              <div style={{ color: S.faint, fontSize: 11, textAlign: 'center', padding: 40 }}>
                ✓ Sin aprobaciones pendientes
              </div>
            ) : approvals.map(a => (
              <div key={a.id} style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                      <span style={{ color: RISK_COLOR[a.risk_level], fontWeight: 'bold', fontSize: 10 }}>{a.risk_level}</span>
                      <span style={{ color: S.text, fontWeight: 'bold', fontSize: 10 }}>{a.action_type}</span>
                      <span style={{ color: S.muted, fontSize: 9 }}>{a.approval_id}</span>
                    </div>
                    <div style={{ color: S.text, fontSize: 11, marginBottom: 4 }}>{a.description}</div>
                    <div style={{ color: S.muted, fontSize: 9 }}>
                      Misión: {a.mission_label} · Solicitado por: {a.requested_by}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => resolve(a.id, 'APPROVED')} disabled={loading}
                      style={{ padding: '6px 14px', fontSize: 10, fontFamily: S.mono, background: 'transparent', border: `1px solid ${S.success}`, color: S.success, cursor: 'pointer', borderRadius: 4 }}>
                      ✓ APROBAR
                    </button>
                    <button onClick={() => resolve(a.id, 'REJECTED')} disabled={loading}
                      style={{ padding: '6px 14px', fontSize: 10, fontFamily: S.mono, background: 'transparent', border: `1px solid ${S.danger}`, color: S.danger, cursor: 'pointer', borderRadius: 4 }}>
                      ✕ RECHAZAR
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════ COMMS ══════ */}
        {tab === 'comms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: S.muted, fontSize: 9, letterSpacing: 2 }}>MISIÓN:</span>
              {missions.map(m => (
                <button key={m.id} onClick={() => setActiveMission(m.mission_id)}
                  style={{
                    padding: '4px 10px', fontSize: 9, fontFamily: S.mono, background: 'transparent',
                    border: `1px solid ${activeMission === m.mission_id ? S.primary : S.border}`,
                    color: activeMission === m.mission_id ? S.primary : S.muted,
                    cursor: 'pointer', borderRadius: 4, letterSpacing: 1,
                  }}>
                  {m.mission_id} <span style={{ color: STATUS_COLOR[m.status] }}>·</span>
                </button>
              ))}
              {missions.length === 0 && <span style={{ color: S.faint, fontSize: 10 }}>Sin misiones — crea una primero</span>}
            </div>

            {activeMission ? (
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 8, minHeight: '65vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '8px 14px', borderBottom: `1px solid ${S.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? S.success : S.danger, boxShadow: connected ? `0 0 6px ${S.success}` : 'none' }} />
                  <span style={{ color: S.muted, fontSize: 9, letterSpacing: 2 }}>COMMS LOG · {activeMission}</span>
                  <span style={{ color: S.faint, fontSize: 9, marginLeft: 'auto' }}>monitoreo pasivo · sin costo API</span>
                </div>
                <div style={{ flex: 1 }}>
                  <CommsLog events={events} />
                </div>
              </div>
            ) : (
              <div style={{ color: S.faint, fontSize: 11, textAlign: 'center', padding: 60 }}>
                — Selecciona una misión para monitorear el COMMS LOG —
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: S.surface, borderTop: `1px solid ${S.border}`, padding: '6px 20px', display: 'flex', justifyContent: 'space-between', fontSize: 9, color: S.faint }}>
        <span>BOPE v1.0 · Anthropic claude-sonnet-4-6 · OpenAI gpt-4o-mini · Neon · n8n · Sentry</span>
        <span>{budget ? `CAP ANUAL $${budget.annual_cap_usd} · USADO ${fmt$(budget.yearly_spend_usd, 2)} · RESTANTE $${Number(budget.annual_remaining_usd).toFixed(2)}` : ''}</span>
      </footer>
    </div>
  );
}
