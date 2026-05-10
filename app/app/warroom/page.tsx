'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import initialWarRoomState from '@/public/warroom-state.json';
import type { MissionEffect, WarRoomMissionRecord, WarRoomStateFile } from '@/lib/warroom/types';
import type { SoldierWithRecords } from '@/lib/warroom/soldierProfiles';
import { SOLDIER_BASE_PROFILES } from '@/lib/warroom/soldierProfiles';
import { mergeSoldiersWithCodexRecords } from '@/lib/warroom/mergeState';

// ── Types ──────────────────────────────────────────────────────────────────

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
interface MissionTaskDetail {
  id: string; task_id: string; owner: string; status: string;
  description: string; result?: string | null; created_at: string;
  evidence?: Record<string, unknown>;
}
interface MissionMessageDetail {
  id: string; from_agent: string; to_agent: string; kind: string;
  status?: string | null; summary?: string | null; created_at: string;
}
interface MissionDetail {
  mission: Mission;
  tasks: MissionTaskDetail[];
  messages: MissionMessageDetail[];
  total_cost_usd: number;
}

function buildSoldierSummary(detail: MissionDetail) {
  const owners = Array.from(new Set(detail.tasks.map(task => task.owner)));
  return owners.map((owner) => {
    const tasks = detail.tasks.filter(task => task.owner === owner);
    const latestTask = [...tasks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
    const latestMessage = detail.messages.find(msg => msg.from_agent === owner || msg.to_agent === owner);
    return {
      owner,
      taskCount: tasks.length,
      latestStatus: latestTask?.status ?? 'PENDING',
      latestDescription: latestTask?.description ?? 'Sin tarea activa',
      latestMessage: latestMessage?.summary ?? 'Sin mensajes',
    };
  });
}

function getTaskEvidence(task: MissionTaskDetail) {
  const evidence = task.evidence ?? {};
  return {
    engine: typeof evidence.engine === 'string' ? evidence.engine.toUpperCase() : null,
    channel: typeof evidence.channel === 'string' ? evidence.channel.toUpperCase() : null,
    lateral: Boolean(evidence.allow_lateral_help),
  };
}

function buildTaskStatusSummary(tasks: MissionTaskDetail[]) {
  return {
    completed: tasks.filter(task => task.status === 'COMPLETED').length,
    blocked: tasks.filter(task => task.status === 'BLOCKED').length,
    active: tasks.filter(task => task.status === 'IN_PROGRESS').length,
    pending: tasks.filter(task => task.status === 'PENDING').length,
  };
}

type Tab = 'mando' | 'efectivos' | 'legajos' | 'salon' | 'misiones' | 'presupuesto' | 'aprobaciones';

// ── Medal data ─────────────────────────────────────────────────────────────

const MEDALS: Record<string, { name: string; code: string; emoji: string; desc: string; color: string; stripes: string[] }> = {
  NC: { name: 'Navy Cross', code: 'NC', emoji: '🥇', desc: 'Ejecución excepcional bajo presión extrema', color: '#003087', stripes: ['#003087','#FFFFFF','#FFD700','#FFFFFF','#003087'] },
  BS: { name: 'Bronze Star', code: 'BS', emoji: '🥈', desc: 'Entrega sin errores en misión crítica', color: '#CD7F32', stripes: ['#C8102E','#FFFFFF','#003087','#FFFFFF','#C8102E'] },
  CM: { name: 'Commendation Medal', code: 'CM', emoji: '⭐', desc: 'Trabajo sobresaliente en campaña', color: '#4169E1', stripes: ['#228B22','#FFFFFF','#228B22','#FFFFFF','#228B22'] },
  CA: { name: 'Combat Action Ribbon', code: 'CA', emoji: '🎯', desc: 'Resolver crisis en producción en vivo', color: '#8B0000', stripes: ['#003087','#C8102E','#FFFFFF','#C8102E','#003087'] },
  MS: { name: 'Meritorious Service', code: 'MS', emoji: '🔧', desc: 'Contribución técnica de alto impacto', color: '#2E8B57', stripes: ['#2E8B57','#FFFFFF','#2E8B57','#FFFFFF','#2E8B57'] },
  GC: { name: 'Good Conduct Medal', code: 'GC', emoji: '🛡️', desc: '10 misiones sin una sola infracción', color: '#8B4513', stripes: ['#8B4513','#FFD700','#8B4513','#FFD700','#8B4513'] },
  PH: { name: 'Purple Heart', code: 'PH', emoji: '💜', desc: 'Caída en misión, sanción cumplida, retorno honorable', color: '#800080', stripes: ['#800080','#800080','#FFD700','#800080','#800080'] },
};

const CODEX_BOOTSTRAP = initialWarRoomState as WarRoomStateFile;

const COMMANDER = {
  id: 'SANTIAGO', alias: 'SANTIAGO', callsign: 'COMANDANTE',
  role: 'Comandante Supremo', rank: '★★★★★',
  civil: 'Santiago Isbert Perlender', origin: 'Argentina',
  color: '#FFD700', emoji: '🟡',
  medals: ['★★★★★'],
};

// ── Ribbon component ───────────────────────────────────────────────────────

function Ribbon({ code, size = 'sm' }: { code: string; size?: 'sm' | 'md' | 'lg' }) {
  const m = MEDALS[code];
  if (!m) return null;
  const w = size === 'lg' ? 48 : size === 'md' ? 36 : 24;
  const h = size === 'lg' ? 16 : size === 'md' ? 12 : 8;
  const sw = w / 5;
  return (
    <span title={`${m.name} — ${m.desc}`} style={{ display: 'inline-block', marginRight: 3, verticalAlign: 'middle' }}>
      <svg width={w} height={h} style={{ display: 'block', borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
        {m.stripes.map((c, i) => <rect key={i} x={i * sw} y={0} width={sw} height={h} fill={c} />)}
      </svg>
    </span>
  );
}

function MedalBadge({ code }: { code: string }) {
  const m = MEDALS[code];
  if (!m) return null;
  const rw = 36;
  const rh = 11;
  const sw = rw / 5;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 6,
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${m.color}35`,
      borderRadius: 6, padding: '5px 8px',
    }}>
      <svg width={rw} height={rh} style={{ borderRadius: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.5)', flexShrink: 0, marginTop: 3 }}>
        {m.stripes.map((c, i) => <rect key={i} x={i * sw} y={0} width={sw} height={rh} fill={c} />)}
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#eaeaea', letterSpacing: 0.5 }}>
          {m.emoji} {m.name}
        </div>
        <div style={{
          fontSize: 14, color: '#d0d4dc', marginTop: 3, lineHeight: 1.4, fontWeight: 500,
        }}>
          {m.desc}
        </div>
      </div>
    </div>
  );
}

function MissionLedgerEffects({ effects }: { effects?: MissionEffect[] }) {
  const list = effects ?? [];
  if (!list.length) {
    return <span style={{ fontSize: 12, color: '#555' }}>—</span>;
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
      {list.map((e, i) =>
        e.kind === 'medal' ? (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <Ribbon code={e.code} size="sm" />
            <span style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
              [{e.code}]
            </span>
          </span>
        ) : (
          <span
            key={i}
            title={e.label}
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 999,
              background: '#1c0808',
              border: '1px solid #EF4444',
              color: '#FCA5A5',
              fontFamily: 'var(--font-mono)',
            }}>
            ⚖ SANCIÓN
          </span>
        ))}
    </div>
  );
}

/** Historial táctico por misión dentro del legajo (fuente máquina) */
function SoldierMissionLedgerPanel({ soldier }: { soldier: SoldierWithRecords }) {
  const rows = soldier.missionHistory ?? [];
  if (rows.length === 0) {
    return (
      <div style={{ marginBottom: 18, padding: '12px 14px', background: '#111', borderRadius: 8, border: '1px dashed #333' }}>
        <div style={{ fontSize: 11, color: '#666', letterSpacing: 1 }}>SIN OPERACIONES REGISTRADAS EN CODEX</div>
      </div>
    );
  }
  return (
    <div style={{
      marginBottom: 22,
      background: 'rgba(10,14,26,0.55)',
      border: `1px solid ${soldier.color}38`,
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: `1px solid ${soldier.color}22`,
        fontFamily: 'var(--font-head)',
        color: soldier.color,
        fontSize: 12,
        letterSpacing: 1.2,
      }}>
        REGISTRO OPERATIVO — MISIÓN A MISIÓN
        <span style={{ fontFamily: 'var(--font-mono)', color: '#6b7280', fontSize: 10, marginLeft: 10 }}>
          /warroom-state.json · debe alinearse a codex-logs/RECORDS.md
        </span>
      </div>
      <div style={{ overflowX: 'auto', maxHeight: 300, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: '#6b7280', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #222', background: '#0a0a0a', position: 'sticky', top: 0 }}>
                Misión
              </th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #222', background: '#0a0a0a', position: 'sticky', top: 0 }}>
                Rol
              </th>
              <th style={{ padding: '8px 10px', textAlign: 'right', borderBottom: '1px solid #222', background: '#0a0a0a', position: 'sticky', top: 0 }}>
                ~Lín
              </th>
              <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #222', background: '#0a0a0a', position: 'sticky', top: 0 }}>
                Resultado
              </th>
              <th style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid #222', background: '#0a0a0a', position: 'sticky', top: 0 }}>
                Honor / Sanción
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row: WarRoomMissionRecord, idx: number) => (
              <tr key={`${soldier.id}-${row.missionId}-${idx}`} style={{ borderBottom: '1px solid #171717' }}>
                <td style={{ padding: '10px 12px', color: '#e5e7eb', fontFamily: 'var(--font-mono)', fontSize: 12, verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                  {row.missionId}
                </td>
                <td style={{ padding: '10px 12px', color: '#aaa', verticalAlign: 'top' }}>{row.role}</td>
                <td style={{ padding: '10px 10px', color: '#888', textAlign: 'right', fontFamily: 'var(--font-mono)', verticalAlign: 'top' }}>
                  {row.approxLines == null ? '—' : row.approxLines}
                </td>
                <td style={{ padding: '10px 12px', color: '#cfd5de', lineHeight: 1.45, verticalAlign: 'top' }}>
                  {row.resultado}
                </td>
                <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right' }}>
                  <MissionLedgerEffects effects={row.effects} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tactical network diagram ───────────────────────────────────────────────

function TacticalNetwork({ missions, locoState, soldiers }: {
  missions: Mission[];
  locoState: string;
  soldiers: SoldierWithRecords[];
}) {
  const locoColor = locoState === 'HOLD' ? '#22C55E' : locoState === 'LIMITED_RELEASE' ? '#F59E0B' : '#EF4444';
  const locoLabel = locoState === 'HOLD' ? '🟢 HOLD' : locoState === 'LIMITED_RELEASE' ? '🟡 LIMITED' : '🔴 EMERGENCY';

  const laterals = [
    ['PIXEL','FORGE'], ['FORGE','NEXUS'], ['HOUSE','CERBERUS'],
    ['WINSTON','NEXUS'], ['HOUSE','WINSTON'], ['CERBERUS','NEXUS'],
  ];
  const soldierPos: Record<string, [number, number]> = {
    RAMBO: [400, 120],
    PIXEL: [180, 240], FORGE: [320, 240], HOUSE: [460, 240], CERBERUS: [600, 240],
    MARCO: [140, 360], WINSTON: [280, 360], NEXUS: [420, 360], BLADE: [560, 360], SICARIO: [660, 360],
  };

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox="0 0 800 460" style={{ width: '100%', minWidth: 640, display: 'block' }}>
        {/* SANTI → RAMBO */}
        <line x1={400} y1={30} x2={400} y2={100} stroke="#FFD700" strokeWidth={2.5} strokeDasharray="6,3" />

        {/* RAMBO → soldiers */}
        {Object.entries(soldierPos).filter(([k]) => k !== 'RAMBO').map(([k, [x, y]]) => (
          <line key={k} x1={400} y1={140} x2={x} y2={y - 16}
            stroke={soldiers.find(so => so.id === k)?.color ?? '#666'}
            strokeWidth={1.5} strokeOpacity={0.5} />
        ))}

        {/* Lateral connections */}
        {laterals.map(([a, b]) => {
          const pa = soldierPos[a], pb = soldierPos[b];
          if (!pa || !pb) return null;
          return <line key={`${a}-${b}`} x1={pa[0]} y1={pa[1]} x2={pb[0]} y2={pb[1]}
            stroke="#444" strokeWidth={1} strokeDasharray="4,4" />;
        })}

        {/* WINSTON & HOUSE lateral observation arrows (mobile units) */}
        <path d={`M ${soldierPos.WINSTON[0]} ${soldierPos.WINSTON[1]-20} Q 340 200 ${soldierPos.HOUSE[0]} ${soldierPos.HOUSE[1]-20}`}
          stroke="#6A0DAD" strokeWidth={1.5} strokeDasharray="3,3" fill="none" />

        {/* SANTI node */}
        <circle cx={400} cy={24} r={22} fill="#1a1a0a" stroke="#FFD700" strokeWidth={2.5} />
        <text x={400} y={28} textAnchor="middle" fontSize={9} fontWeight="800" fill="#FFD700" fontFamily="monospace">SANTI</text>

        {/* RAMBO node */}
        <circle cx={400} cy={120} r={28} fill="#1a0505" stroke="#DC143C" strokeWidth={2.5} />
        <text x={400} y={116} textAnchor="middle" fontSize={8} fontWeight="800" fill="#DC143C" fontFamily="monospace">JOHN</text>
        <text x={400} y={128} textAnchor="middle" fontSize={7} fill="#999" fontFamily="monospace">RAMBO</text>

        {/* Soldier nodes */}
        {soldiers.filter(s => s.id !== 'RAMBO').map(s => {
          const pos = soldierPos[s.id];
          if (!pos) return null;
          return (
            <g key={s.id}>
              <circle cx={pos[0]} cy={pos[1]} r={20} fill="#111" stroke={s.color} strokeWidth={2} />
              <text x={pos[0]} y={pos[1] - 3} textAnchor="middle" fontSize={7} fontWeight="700" fill={s.color} fontFamily="monospace">{s.alias}</text>
              <text x={pos[0]} y={pos[1] + 8} textAnchor="middle" fontSize={6} fill="#777" fontFamily="monospace">{s.callsign}</text>
            </g>
          );
        })}

        {/* LOCO indicator */}
        <rect x={290} y={410} width={220} height={36} rx={6} fill="#111" stroke={locoColor} strokeWidth={1.5} />
        <text x={400} y={424} textAnchor="middle" fontSize={8} fill="#888" fontFamily="monospace">PROTOCOLO LOCO</text>
        <text x={400} y={440} textAnchor="middle" fontSize={11} fontWeight="800" fill={locoColor} fontFamily="monospace">{locoLabel}</text>

        {/* legend */}
        <text x={14} y={430} fontSize={7} fill="#555" fontFamily="monospace">─ ─ mando vertical</text>
        <text x={14} y={442} fontSize={7} fill="#555" fontFamily="monospace">─ ─ lateral (lateral doctrine)</text>
      </svg>
    </div>
  );
}

// ── Soldier card (expanded legajo) ────────────────────────────────────────

function LegajoCard({ s }: { s: SoldierWithRecords }) {
  const [open, setOpen] = useState(false);
  const medalCounts = s.medals.reduce<Record<string, number>>((acc, code) => {
    acc[code] = (acc[code] ?? 0) + 1;
    return acc;
  }, {});
  const medalsWithCount = Object.entries(medalCounts);
  return (
    <div onClick={() => setOpen(o => !o)} style={{
      cursor: 'pointer', background: '#0d0d0d',
      border: `1px solid ${open ? s.color : '#2a2a2a'}`,
      borderRadius: 10, padding: '18px 22px', marginBottom: 14,
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: `${s.color}22`, border: `2px solid ${s.color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, flexShrink: 0,
        }}>{s.emoji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: s.color, letterSpacing: 1 }}>{s.alias}</span>
            <span style={{ fontSize: 13, color: '#888' }}>·</span>
            <span style={{ fontSize: 14, color: '#ccc', fontWeight: 600 }}>{s.callsign}</span>
            <span style={{ fontSize: 11, color: '#666', background: '#1a1a1a', padding: '2px 8px', borderRadius: 4 }}>{s.rank}</span>
          </div>
          <div style={{ fontSize: 13, color: '#aaa', marginTop: 3 }}>{s.role}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{s.civil} · {s.origin}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {s.medals.map((m, idx) => <Ribbon key={`${s.id}-hdr-${m}-${idx}`} code={m} size="md" />)}
          {s.medals.length === 0 && <span style={{ fontSize: 11, color: '#555' }}>Sin medallas</span>}
          <span style={{ color: '#555', fontSize: 18, marginLeft: 6 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ marginTop: 20, borderTop: `1px solid ${s.color}30`, paddingTop: 18 }}>
          {s.portrait && (
            <div style={{ marginBottom: 18, display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{
                width: 220,
                flex: '0 0 220px',
                background: 'linear-gradient(180deg, #120f08 0%, #0b0b0b 100%)',
                border: '2px solid #d4af37',
                borderRadius: 10,
                boxShadow: '0 10px 24px rgba(0,0,0,0.45)',
                overflow: 'hidden',
              }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1' }}>
                  <Image src={s.portrait} alt={`Retrato de ${s.alias}`} fill sizes="220px" style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ padding: '8px 10px', textAlign: 'center', borderTop: '1px solid #3a2d10' }}>
                  <div style={{ fontFamily: 'var(--font-head)', color: '#FFD700', fontSize: 14, letterSpacing: 1, fontWeight: 800 }}>
                    {s.portraitTitle ?? s.alias}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', color: '#8f8f8f', fontSize: 10, letterSpacing: 1 }}>
                    LEGAJO OFICIAL
                  </div>
                </div>
              </div>

              {s.medals.length > 0 && (
                <div style={{
                  minWidth: 200,
                  flex: '1 1 260px',
                  background: 'rgba(12,12,12,0.88)',
                  border: '1px solid #3a2d10',
                  borderRadius: 8,
                  padding: '7px 9px',
                }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 11, color: '#FFD700', letterSpacing: 0.8, marginBottom: 6 }}>
                    🦅 CONDECORACIONES MARINES
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: 5,
                    maxHeight: 168,
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}>
                    {medalsWithCount.map(([code, count]) => (
                      <div key={`${s.id}-${code}`} style={{ position: 'relative' }}>
                        <MedalBadge code={code} />
                        {count > 1 && (
                          <span style={{
                            position: 'absolute',
                            top: -6,
                            right: -2,
                            background: '#FFD700',
                            color: '#000',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '2px 8px',
                            border: '1px solid #7a6418',
                            fontFamily: 'var(--font-mono)',
                          }}>
                            x{count}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <SoldierMissionLedgerPanel soldier={s} />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>

            {/* Historia */}
            <div>
              <div style={sectionLabel}>HISTORIA</div>
              <p style={{ fontSize: 14, color: '#d0d0d0', lineHeight: 1.7, margin: 0 }}>{s.bio}</p>
            </div>

            {/* Psicología */}
            <div>
              <div style={sectionLabel}>PERFIL PSICOLÓGICO</div>
              <p style={{ fontSize: 14, color: '#d0d0d0', lineHeight: 1.7, margin: 0 }}>{s.psychology}</p>
            </div>

            {/* Doctrina */}
            <div>
              <div style={sectionLabel}>DOCTRINA DE EMPLEO</div>
              <p style={{ fontSize: 14, color: '#d0d0d0', lineHeight: 1.7, margin: 0 }}>{s.doctrine}</p>
            </div>

            {/* Skills */}
            <div>
              <div style={sectionLabel}>SKILLS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {s.skills.map(sk => (
                  <span key={sk} style={{
                    fontSize: 12, color: s.color, background: `${s.color}18`,
                    border: `1px solid ${s.color}40`, borderRadius: 4, padding: '3px 10px',
                  }}>{sk}</span>
                ))}
              </div>
            </div>

          </div>

          {/* Stats bar */}
          <div style={{ marginTop: 18, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={statChip(s.color)}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{s.missions}</span>
              <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>misiones</span>
            </div>
            <div style={statChip(s.color)}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{s.medals.length}</span>
              <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>condecoraciones</span>
            </div>
            <div style={statChip('#555')}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{s.sanctions}</span>
              <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>sanciones</span>
            </div>
            <div style={statChip(s.color)}>
              <span style={{ fontSize: 18, fontWeight: 800 }}>{s.codexApproxLinesTotal}</span>
              <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6 }}>lín. Codex (~)</span>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap' }}>{s.provider}</span>
              <span style={{ fontSize: 12, color: s.color, fontFamily: 'monospace', background: `${s.color}18`, padding: '2px 8px', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.model}</span>
            </div>
          </div>

          {/* Quote */}
          <div style={{
            marginTop: 16, padding: '12px 18px', background: `${s.color}0D`,
            borderLeft: `3px solid ${s.color}`, borderRadius: '0 6px 6px 0',
            fontSize: 13, fontStyle: 'italic', color: '#ccc',
          }}>"{s.quote}"</div>
        </div>
      )}
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10, fontWeight: 800, letterSpacing: 2, color: '#666',
  textTransform: 'uppercase', marginBottom: 8,
};
function statChip(color: string): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center',
    background: `${color}15`, border: `1px solid ${color}30`,
    borderRadius: 6, padding: '6px 14px', color: '#fff',
  };
}

// ── Hall of Fame ───────────────────────────────────────────────────────────

function HallOfFame({ soldiers }: { soldiers: SoldierWithRecords[] }) {
  const decorated = soldiers.filter(s => s.medals.length > 0);

  return (
    <div>
      {/* Medal wall */}
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFD700', letterSpacing: 2, marginBottom: 6, marginTop: 0 }}>
        MEDALLERO OFICIAL
      </h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 24, marginTop: 0 }}>
        Condecoraciones otorgadas por el Comandante Supremo. Cada ribbon es ganado en campo.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12, marginBottom: 40 }}>
        {Object.values(MEDALS).map(m => {
          const holders = soldiers.filter(s => s.medals.includes(m.code));
          return (
            <div key={m.code} style={{
              background: '#0d0d0d', border: `1px solid ${m.color}40`,
              borderRadius: 10, padding: '16px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <svg width={52} height={18} style={{ borderRadius: 3, boxShadow: '0 2px 4px rgba(0,0,0,0.6)', flexShrink: 0 }}>
                  {m.stripes.map((c, i) => <rect key={i} x={i*52/5} y={0} width={52/5} height={18} fill={c} />)}
                </svg>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{m.emoji} {m.name}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{m.desc}</div>
                </div>
              </div>
              {holders.length === 0 ? (
                <div style={{ fontSize: 12, color: '#555', fontStyle: 'italic' }}>Sin condecorados aún</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {holders.map(h => (
                    <span key={h.id} style={{
                      fontSize: 12, fontWeight: 700, color: h.color,
                      background: `${h.color}18`, border: `1px solid ${h.color}40`,
                      borderRadius: 4, padding: '3px 10px',
                    }}>{h.emoji} {h.alias}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leaderboard */}
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFD700', letterSpacing: 2, marginBottom: 6, marginTop: 0 }}>
        RECORDS — TABLA MAESTRA
      </h2>
      <p style={{ fontSize: 13, color: '#666', marginBottom: 16, marginTop: 0 }}>
        Cronista: Winston · Datos cargados desde <code style={{ fontSize: 11, color: '#888' }}>/warroom-state.json</code> · Keep al día con RECORDS.md
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['#','Soldado','Rol','Misiones','Medallas','Sanciones','Líneas (~)','Última misión','Modelo'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: h.includes('Mision') || h.includes('Líneas') || h.includes('Sanciones') ? 'center' : 'left', borderBottom: '1px solid #2a2a2a', color: '#666', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...soldiers].sort((a,b) => (b.missions * 10 + b.medals.length) - (a.missions * 10 + a.medals.length)).map((s, i) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                <td style={{ padding: '12px 14px', color: '#555', fontWeight: 700, fontSize: 15 }}>{i+1}</td>
                <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                  <span style={{ fontSize: 20 }}>{s.emoji}</span>{' '}
                  <span style={{ fontWeight: 800, color: s.color, fontSize: 14 }}>{s.alias}</span>{' '}
                  <span style={{ color: '#555', fontSize: 12 }}>· {s.callsign}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#888', fontSize: 12 }}>{s.role.split(' · ')[0]}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{s.missions}</span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {s.medals.length === 0
                      ? <span style={{ fontSize: 12, color: '#555' }}>—</span>
                      : s.medals.map((m, idx) => <Ribbon key={`${s.id}-rank-${m}-${idx}`} code={m} size="md" />)
                    }
                  </div>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: s.sanctions > 0 ? '#EF4444' : '#555' }}>{s.sanctions}</span>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'center', color: '#888', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                  {s.codexApproxLinesTotal > 0 ? s.codexApproxLinesTotal : '—'}
                </td>
                <td style={{ padding: '12px 14px', color: '#999', fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.35, maxWidth: 200 }}>
                  {s.lastMissionId ? (
                    <>
                      <span style={{ display: 'block', wordBreak: 'break-word', color: '#cfcfcf' }}>{s.lastMissionId}</span>
                      {s.lastMissionDate ? (
                        <span style={{ display: 'block', color: '#555', marginTop: 4 }}>{s.lastMissionDate}</span>
                      ) : null}
                    </>
                  ) : (
                    <span style={{ color: '#444' }}>—</span>
                  )}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>{s.model}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Solo decorated */}
      <h2 style={{ fontSize: 22, fontWeight: 800, color: '#FFD700', letterSpacing: 2, marginBottom: 16, marginTop: 40 }}>
        SALÓN DE LA FAMA
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
        {decorated.map(s => (
          <div key={s.id} style={{
            background: '#0d0d0d', border: `1px solid ${s.color}50`,
            borderRadius: 12, padding: '20px 24px',
            boxShadow: `0 4px 20px ${s.color}15`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: `${s.color}20`, border: `2px solid ${s.color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
              }}>{s.emoji}</div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.alias}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{s.civil}</div>
                <div style={{ fontSize: 11, color: '#555' }}>{s.origin}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {s.medals.map((m, mi) => (
                <div key={`${s.id}-hof-${m}-${mi}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Ribbon code={m} size="md" />
                  <span style={{ fontSize: 12, color: '#ccc' }}>{MEDALS[m]?.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function WarRoom() {
  const [tab, setTab] = useState<Tab>('mando');
  const [codexMirror, setCodexMirror] = useState<WarRoomStateFile>(() => CODEX_BOOTSTRAP);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
  const [missionDetail, setMissionDetail] = useState<MissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMission, setNewMission] = useState({ intent: '', priority: 'P1', budget: '10' });
  const [commsLog, setCommsLog] = useState<string[]>(['[BOPE COMMS] · Monitoreo pasivo iniciado — sin costo API']);
  const [expandedSoldier, setExpandedSoldier] = useState<string | null>(null);
  const evtRef = useRef<EventSource | null>(null);

  const reloadCodexMirror = useCallback(async () => {
    try {
      const res = await fetch(`/warroom-state.json?t=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) setCodexMirror(await res.json());
    } catch { /* noop */ }
  }, []);

  const soldiers = useMemo(
    () => mergeSoldiersWithCodexRecords(SOLDIER_BASE_PROFILES, codexMirror),
    [codexMirror],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      await reloadCodexMirror();
      const [mr, br, ar] = await Promise.all([
        fetch('/api/v1/missions').then(r => r.json()).catch(() => ({ missions: [] })),
        fetch('/api/v1/budgets').then(r => r.json()).catch(() => null),
        fetch('/api/v1/approvals').then(r => r.json()).catch(() => ({ approvals: [] })),
      ]);
      const nextMissions = mr.data ?? mr.missions ?? [];
      setMissions(nextMissions);
      setBudgetData(br?.data ?? br);
      setApprovals(ar.data ?? ar.approvals ?? []);
      setSelectedMissionId((current) => current ?? nextMissions.find((m: Mission) => m.status?.toUpperCase() === 'ACTIVE')?.id ?? nextMissions[0]?.id ?? null);
    } finally {
      setLoading(false);
    }
  }, [reloadCodexMirror]);

  useEffect(() => { load(); }, [load]);

  const loadMissionDetail = useCallback(async (missionId: string) => {
    const result = await fetch(`/api/v1/missions/${missionId}`).then(r => r.json()).catch(() => null);
    setMissionDetail(result?.data ?? null);
  }, []);

  useEffect(() => {
    if (!selectedMissionId) {
      setMissionDetail(null);
      return;
    }
    void loadMissionDetail(selectedMissionId);
  }, [selectedMissionId, loadMissionDetail]);

  const locoState = missions.find(m => m.status?.toUpperCase() === 'ACTIVE')?.loco_state ?? 'HOLD';

  async function createMission() {
    if (!newMission.intent.trim()) return;
    await fetch('/api/v1/missions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: newMission.intent,
        priority: newMission.priority,
        budget_usd: parseFloat(newMission.budget) || 10,
        loco_state: 'HOLD',
        active_agents: [],
      }),
    });
    setNewMission({ intent: '', priority: 'P1', budget: '10' });
    await load();
  }

  async function advanceMission(id: string) {
    setSelectedMissionId(id);
    await fetch(`/api/v1/missions/${id}/advance`, { method: 'POST' });
    await Promise.all([load(), loadMissionDetail(id)]);
  }

  async function resolveApproval(id: string, decision: 'approved' | 'rejected') {
    await fetch(`/api/v1/approvals/${id}/resolve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: decision.toUpperCase(), decision_note: '' }),
    });
    await load();
  }

  async function retryTask(taskId: string) {
    await fetch(`/api/v1/tasks/${taskId}/retry`, { method: 'POST' });
    if (selectedMissionId) {
      await Promise.all([load(), loadMissionDetail(selectedMissionId)]);
    } else {
      await load();
    }
  }

  async function cancelTask(taskId: string) {
    await fetch(`/api/v1/tasks/${taskId}/cancel`, { method: 'POST' });
    if (selectedMissionId) {
      await Promise.all([load(), loadMissionDetail(selectedMissionId)]);
    } else {
      await load();
    }
  }

  // SSE
  useEffect(() => {
    if (tab !== 'aprobaciones' && tab !== 'misiones') return;
    const activeMission = missions.find(m => m.status?.toUpperCase() === 'ACTIVE');
    if (!activeMission) return;
    const slug = activeMission.mission_id;
    if (evtRef.current) evtRef.current.close();
    const es = new EventSource(`/api/mission/${slug}/sse`);

    const pushLine = (raw: string) => {
      try {
        const d = JSON.parse(raw);
        const parts = [
          d.agent ? `[${d.agent}]` : '',
          d.to ? `-> ${d.to}` : '',
          d.kind ? `(${d.kind})` : '',
          d.summary ?? d.message ?? JSON.stringify(d.payload ?? d),
        ].filter(Boolean);
        const line = `[${new Date().toLocaleTimeString()}] ${parts.join(' ')}`.slice(0, 240);
        setCommsLog(prev => [...prev.slice(-199), line]);
        if (selectedMissionId === activeMission.id) {
          void loadMissionDetail(activeMission.id);
        }
      } catch {}
    };

    es.onmessage = (e) => pushLine(e.data);
    ['MISSION_UPDATED', 'AGENT_REPLIED', 'HANDOFF_INITIATED', 'system_log'].forEach((eventName) => {
      es.addEventListener(eventName, (e) => pushLine((e as MessageEvent).data));
    });
    evtRef.current = es;
    return () => es.close();
  }, [tab, missions, selectedMissionId, loadMissionDetail]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'mando', label: 'MANDO' },
    { id: 'efectivos', label: 'EFECTIVOS' },
    { id: 'legajos', label: 'LEGAJOS' },
    { id: 'salon', label: 'SALÓN' },
    { id: 'misiones', label: 'MISIONES' },
    { id: 'presupuesto', label: 'PRESUPUESTO' },
    { id: 'aprobaciones', label: 'APROBACIONES' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Barlow:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #080808; }
        :root {
          --font-head: 'Barlow Condensed', 'Impact', sans-serif;
          --font-body: 'Barlow', system-ui, sans-serif;
          --font-mono: 'Share Tech Mono', monospace;
        }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#080808', color: '#e8e8e8',
        fontFamily: 'var(--font-body)', fontSize: 15,
      }}>
        {/* ── HEADER ── */}
        <header style={{
          background: 'linear-gradient(180deg, #0f0a00 0%, #0a0a0a 100%)',
          borderBottom: '2px solid #2a1a00',
          padding: '20px 32px',
          display: 'flex', alignItems: 'center', gap: 24,
        }}>
          <Image
            src="/bope-shield.png" alt="BOPE"
            width={80} height={80}
            style={{ objectFit: 'contain', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <div style={{
              fontFamily: 'var(--font-head)', fontSize: 34, fontWeight: 900,
              color: '#FFD700', letterSpacing: 4, lineHeight: 1, textTransform: 'uppercase',
            }}>
              BATALLÓN DE OPERACIONES DE PRECISIÓN Y EXCELENCIA
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 14, color: '#888',
              marginTop: 6, letterSpacing: 2,
            }}>
              WAR ROOM v2.0 · SALA DE MANDO OPERATIVO
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, color: '#555', marginBottom: 4,
            }}>COMANDANTE SUPREMO</div>
            <div style={{
              fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800,
              color: '#FFD700', letterSpacing: 2,
            }}>SANTIAGO ★★★★★</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#444', marginTop: 3 }}>
              {new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* ── TABS ── */}
        <nav style={{
          background: '#0a0a0a', borderBottom: '1px solid #1e1e1e',
          display: 'flex', overflowX: 'auto', padding: '0 24px',
        }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 700,
              letterSpacing: 2, padding: '16px 24px', whiteSpace: 'nowrap',
              color: tab === t.id ? '#FFD700' : '#666',
              borderBottom: tab === t.id ? '3px solid #FFD700' : '3px solid transparent',
              transition: 'color 0.15s',
            }}>{t.label}</button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
            <button onClick={load} style={{
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 6,
              color: '#888', fontSize: 13, fontFamily: 'var(--font-mono)',
              cursor: 'pointer', padding: '8px 16px', letterSpacing: 1,
            }}>↻ SYNC</button>
          </div>
        </nav>

        {/* ── CONTENT ── */}
        <main style={{ padding: '28px 32px', maxWidth: 1280, margin: '0 auto' }}>

          {/* ──── MANDO ──── */}
          {tab === 'mando' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
                <div>
                  <SectionTitle>RED DE MANDO TÁCTICA</SectionTitle>
                  <TacticalNetwork missions={missions} locoState={locoState} soldiers={soldiers} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* LOCO state */}
                  <InfoCard title="PROTOCOLO LOCO">
                    {(['HOLD','LIMITED_RELEASE','EMERGENCY_RELEASE'] as const).map(state => {
                      const active = locoState === state;
                      const col = state === 'HOLD' ? '#22C55E' : state === 'LIMITED_RELEASE' ? '#F59E0B' : '#EF4444';
                      const labels: Record<string, string> = { HOLD: '🟢 HOLD — Normal ops', LIMITED_RELEASE: '🟡 LIMITED — Escalation auth', EMERGENCY_RELEASE: '🔴 EMERGENCY — Full release' };
                      return (
                        <div key={state} style={{
                          padding: '10px 14px', borderRadius: 7, marginBottom: 6,
                          background: active ? `${col}18` : '#111',
                          border: `1px solid ${active ? col : '#222'}`,
                          fontFamily: 'var(--font-mono)', fontSize: 13, color: active ? col : '#555',
                          fontWeight: active ? 700 : 400,
                        }}>{labels[state]}</div>
                      );
                    })}
                  </InfoCard>

                  {/* Rules */}
                  <InfoCard title="REGLAS DE COMBATE">
                    {[
                      '1. RAMBO manda operativamente',
                      '2. SANTI decide en máximo',
                      '3. WINSTON y HOUSE son unidades móviles',
                      '4. Comunicación lateral permitida',
                      '5. BLADE requiere doble auth',
                      '6. SICARIO solo bajo mando firme',
                      '7. Ningún agente opera solo sin misión',
                    ].map((r, i) => (
                      <div key={i} style={{ fontSize: 13, color: '#ccc', padding: '5px 0', borderBottom: '1px solid #1a1a1a', fontFamily: 'var(--font-body)' }}>{r}</div>
                    ))}
                  </InfoCard>

                  {/* Quick stats */}
                  <InfoCard title="ESTADO OPERATIVO">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { label: 'Misiones', value: missions.length, color: '#4169E1' },
                        { label: 'Activas', value: missions.filter(m => m.status?.toUpperCase() === 'ACTIVE').length, color: '#22C55E' },
                        { label: 'Pendientes', value: approvals.filter(a => a.status?.toUpperCase() === 'PENDING').length, color: '#F59E0B' },
                        { label: 'Soldados', value: soldiers.length, color: '#FFD700' },
                      ].map(s => (
                        <div key={s.label} style={{
                          background: '#111', borderRadius: 8, padding: '12px 14px',
                          border: `1px solid ${s.color}30`,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontFamily: 'var(--font-head)', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                          <div style={{ fontSize: 11, color: '#777', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2, fontFamily: 'var(--font-body)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </InfoCard>
                </div>
              </div>
            </div>
          )}

          {/* ──── EFECTIVOS ──── */}
          {tab === 'efectivos' && (
            <div>
              <SectionTitle>ROSTER OFICIAL — EFECTIVOS DEL BATALLÓN</SectionTitle>

              {/* Commander */}
              <div style={{
                background: 'linear-gradient(135deg, #1a1200 0%, #0d0d0d 100%)',
                border: '2px solid #FFD700', borderRadius: 12,
                padding: '20px 28px', marginBottom: 20,
                display: 'flex', alignItems: 'center', gap: 20,
              }}>
                <Image src="/bope-shield.png" alt="Comandante" width={60} height={60} style={{ objectFit: 'contain' }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 900, color: '#FFD700', letterSpacing: 3 }}>
                    SANTIAGO ISBERT PERLENDER
                  </div>
                  <div style={{ fontSize: 15, color: '#aaa', marginTop: 3 }}>Comandante Supremo · El Comandante no lleva medallas — las otorga</div>
                </div>
                <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-head)', fontSize: 32, color: '#FFD700', letterSpacing: 4 }}>★★★★★</div>
              </div>

              {/* Soldiers grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {soldiers.map(s => (
                  <div key={s.id} style={{
                    background: '#0d0d0d', border: `1px solid ${s.color}40`,
                    borderRadius: 10, padding: '16px 20px',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s',
                  }}
                    onClick={() => { setTab('legajos'); setTimeout(() => setExpandedSoldier(s.id), 100); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                        background: `${s.color}20`, border: `2px solid ${s.color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                      }}>{s.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-head)', fontSize: 20, fontWeight: 800, color: s.color }}>{s.alias}</span>
                          <span style={{ fontSize: 12, color: '#777' }}>· {s.callsign}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#aaa', marginTop: 2 }}>{s.role}</div>
                        <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>{s.civil} · {s.origin}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {s.medals.length === 0
                            ? <span style={{ fontSize: 11, color: '#444' }}>—</span>
                            : s.medals.map((m, idx) => <Ribbon key={`${s.id}-ef-${m}-${idx}`} code={m} size="md" />)
                          }
                        </div>
                        <span style={{ fontSize: 10, color: '#555', fontFamily: 'var(--font-mono)' }}>{s.rank}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${s.color}20`, display: 'flex', gap: 16, fontSize: 12 }}>
                      <span style={{ color: '#888' }}>{s.missions} misiones</span>
                      <span style={{ color: '#666' }}>·</span>
                      <span style={{ color: '#888' }}>{s.medals.length} condecoraciones</span>
                      <span style={{ color: '#666' }}>·</span>
                      <span style={{ color: '#666', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{s.provider}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ──── LEGAJOS ──── */}
          {tab === 'legajos' && (
            <div>
              <SectionTitle>LEGAJOS — DOSSIER COMPLETO DEL PERSONAL</SectionTitle>
              <p style={{ fontSize: 14, color: '#777', marginBottom: 28 }}>
                Perfil orgánico + registro táctico Codex (misión por misión, honores/sanciones). Datos desde <code style={{ fontSize: 12, color: '#888' }}>/warroom-state.json</code> · alinear con RECORDS.md al cerrar. Click para expandir.
              </p>
              {soldiers.map(s => (
                <LegajoCard key={s.id} s={s} />
              ))}
            </div>
          )}

          {/* ──── SALÓN DE LA FAMA ──── */}
          {tab === 'salon' && (
            <div>
              <HallOfFame soldiers={soldiers} />
            </div>
          )}

          {/* ──── MISIONES ──── */}
          {tab === 'misiones' && (
            <div>
              <SectionTitle>CENTRO DE MISIONES</SectionTitle>

              {/* Create */}
              <div style={{
                background: '#0d0d0d', border: '1px solid #2a2a2a',
                borderRadius: 12, padding: '24px 28px', marginBottom: 28,
              }}>
                <div style={{ fontWeight: 700, color: '#FFD700', letterSpacing: 2, marginBottom: 18, fontFamily: 'var(--font-head)', fontSize: 17 }}>
                  NUEVA MISIÓN
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 140px 160px', gap: 12, alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#666', letterSpacing: 1, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Intención / Objetivo</label>
                    <input
                      value={newMission.intent} onChange={e => setNewMission(p => ({ ...p, intent: e.target.value }))}
                      placeholder="Describe el objetivo de la misión..."
                      onKeyDown={e => e.key === 'Enter' && createMission()}
                      style={{
                        width: '100%', background: '#111', border: '1px solid #333',
                        borderRadius: 7, padding: '12px 16px', color: '#fff',
                        fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#666', letterSpacing: 1, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Prioridad</label>
                    <select value={newMission.priority} onChange={e => setNewMission(p => ({ ...p, priority: e.target.value }))}
                      style={{
                        width: '100%', background: '#111', border: '1px solid #333',
                        borderRadius: 7, padding: '12px 14px', color: '#fff',
                        fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none',
                      }}>
                      {['P0','P1','P2','P3'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#666', letterSpacing: 1, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>Budget (USD)</label>
                    <input
                      type="number" value={newMission.budget}
                      onChange={e => setNewMission(p => ({ ...p, budget: e.target.value }))}
                      style={{
                        width: '100%', background: '#111', border: '1px solid #333',
                        borderRadius: 7, padding: '12px 16px', color: '#fff',
                        fontSize: 15, fontFamily: 'var(--font-body)', outline: 'none',
                      }}
                    />
                  </div>
                  <button onClick={createMission} style={{
                    background: '#FFD700', color: '#000', border: 'none',
                    borderRadius: 7, padding: '12px 20px', cursor: 'pointer',
                    fontFamily: 'var(--font-head)', fontSize: 16, fontWeight: 800, letterSpacing: 2,
                  }}>CREAR MISIÓN</button>
                </div>
              </div>

              {/* Mission list */}
              {loading ? (
                <div style={{ textAlign: 'center', color: '#555', padding: 40, fontSize: 16 }}>Cargando…</div>
              ) : missions.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#444', padding: 60, fontSize: 16, fontStyle: 'italic' }}>No hay misiones registradas.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {missions.map(m => {
                    const priColor = m.priority === 'P0' ? '#EF4444' : m.priority === 'P1' ? '#F59E0B' : '#22C55E';
                    const status = m.status?.toUpperCase();
                    const stColor = status === 'ACTIVE' ? '#22C55E' : status === 'COMPLETED' ? '#4169E1' : '#888';
                    return (
                      <div key={m.id} style={{
                        background: '#0d0d0d', border: `1px solid #222`,
                        borderLeft: `4px solid ${priColor}`,
                        borderRadius: '0 10px 10px 0', padding: '20px 24px',
                        cursor: 'pointer',
                        boxShadow: selectedMissionId === m.id ? `0 0 0 1px ${priColor} inset` : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }} onClick={() => setSelectedMissionId(m.id)}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#666' }}>{m.mission_id}</span>
                              <span style={{ background: `${priColor}20`, color: priColor, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{m.priority}</span>
                              <span style={{ background: `${stColor}20`, color: stColor, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{m.status.toUpperCase()}</span>
                            </div>
                            <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{m.intent}</div>
                            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: '#888', flexWrap: 'wrap' }}>
                              <span>Budget: <strong style={{ color: '#fff' }}>${m.budget_usd}</strong></span>
                              <span>Consumido: <strong style={{ color: m.total_cost_usd > m.budget_usd * 0.8 ? '#F59E0B' : '#22C55E' }}>${m.total_cost_usd?.toFixed(4) ?? '0.0000'}</strong></span>
                              <span>Tareas: <strong style={{ color: '#fff' }}>{m.task_count ?? 0}</strong></span>
                              <span>LOCO: <strong style={{ color: m.loco_state === 'HOLD' ? '#22C55E' : '#F59E0B' }}>{m.loco_state}</strong></span>
                            </div>
                          </div>
                          {status === 'ACTIVE' && (
                            <button onClick={(e) => { e.stopPropagation(); advanceMission(m.id); }} style={{
                              background: '#22C55E', color: '#000', border: 'none',
                              borderRadius: 7, padding: '10px 18px', cursor: 'pointer',
                              fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 800, letterSpacing: 1, flexShrink: 0,
                            }}>▶ ADVANCE RAMBO</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div style={{
                marginTop: 24, background: '#0d0d0d', border: '1px solid #1f1f1f',
                borderRadius: 12, padding: '22px 24px',
              }}>
                <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: '#FFD700', letterSpacing: 2, marginBottom: 18 }}>
                  MISION TACTICA EN FOCO
                </div>
                {!missionDetail ? (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>Selecciona una misión para ver tareas, comms y costo operativo.</div>
                ) : (
                  <>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: 14, marginBottom: 18,
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.06), rgba(17,17,17,0.9))',
                    border: '1px solid #2a2a2a', borderRadius: 12, padding: '14px 16px',
                  }}>
                    <div>
                      <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{missionDetail.mission.intent}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ background: '#151515', border: '1px solid #333', color: '#ddd', borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>{missionDetail.mission.mission_id}</span>
                        <span style={{ background: '#132017', border: '1px solid #264d31', color: '#8fe39d', borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>{missionDetail.mission.status}</span>
                        <span style={{ background: '#201608', border: '1px solid #5a3c12', color: '#f5c46b', borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>{missionDetail.mission.priority}</span>
                        {(missionDetail.mission.active_agents ?? []).map(agent => (
                          <span key={agent} style={{ background: '#101820', border: '1px solid #29435c', color: '#8dc6ff', borderRadius: 999, padding: '3px 9px', fontSize: 11, fontWeight: 700 }}>{agent}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(70px, 1fr))', gap: 10 }}>
                      {Object.entries(buildTaskStatusSummary(missionDetail.tasks)).map(([label, value]) => (
                        <div key={label} style={{ background: '#111', border: '1px solid #252525', borderRadius: 10, padding: '10px 12px' }}>
                          <div style={{ color: '#fff', fontSize: 18, fontWeight: 800 }}>{value}</div>
                          <div style={{ color: '#6f6f6f', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 18 }}>
                    {buildSoldierSummary(missionDetail).map((soldier) => {
                      const color = soldier.latestStatus === 'COMPLETED' ? '#22C55E' : soldier.latestStatus === 'BLOCKED' ? '#EF4444' : '#F59E0B';
                      return (
                        <div key={soldier.owner} style={{ background: '#111', border: `1px solid ${color}33`, borderRadius: 10, padding: '12px 14px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                            <span style={{ color: '#fff', fontWeight: 800 }}>{soldier.owner}</span>
                            <span style={{ color, fontSize: 11, fontWeight: 800 }}>{soldier.latestStatus}</span>
                          </div>
                          <div style={{ color: '#888', fontSize: 11, marginBottom: 6 }}>{soldier.taskCount} tarea(s)</div>
                          <div style={{ color: '#ccc', fontSize: 12, lineHeight: 1.4 }}>{soldier.latestDescription.slice(0, 72)}</div>
                          <div style={{ color: '#666', fontSize: 11, marginTop: 8 }}>{soldier.latestMessage.slice(0, 90)}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>{missionDetail.mission.intent}</div>
                        <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
                          {missionDetail.mission.mission_id} · Estado {missionDetail.mission.status} · Costo ${missionDetail.total_cost_usd?.toFixed?.(4) ?? '0.0000'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {missionDetail.tasks.length === 0 ? (
                          <div style={{ color: '#666', fontStyle: 'italic' }}>Sin tareas registradas todavía.</div>
                        ) : missionDetail.tasks.map(task => {
                          const color = task.status === 'COMPLETED' ? '#22C55E' : task.status === 'BLOCKED' ? '#EF4444' : '#F59E0B';
                          const meta = getTaskEvidence(task);
                          return (
                            <div key={task.id} style={{ background: '#111', border: `1px solid ${color}30`, borderRadius: 8, padding: '12px 14px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                                <span style={{ color: '#fff', fontWeight: 700 }}>{task.task_id} · {task.owner}</span>
                                <span style={{ color, fontSize: 12, fontWeight: 700 }}>{task.status}</span>
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                {meta.engine && <span style={{ background: '#17202a', color: '#8dc6ff', border: '1px solid #29435c', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{meta.engine}</span>}
                                {meta.channel && <span style={{ background: '#1a1a1a', color: '#e8e8e8', border: '1px solid #353535', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{meta.channel}</span>}
                                {meta.lateral && <span style={{ background: '#20162b', color: '#d6b3ff', border: '1px solid #51346e', borderRadius: 999, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>LATERAL</span>}
                              </div>
                              <div style={{ color: '#ccc', fontSize: 13 }}>{task.description}</div>
                              {task.result && <div style={{ color: '#777', fontSize: 12, marginTop: 6 }}>{String(task.result).slice(0, 180)}</div>}
                              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                {task.status === 'BLOCKED' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); retryTask(task.id); }}
                                    style={{
                                      background: '#F59E0B', color: '#111', border: 'none', borderRadius: 6,
                                      padding: '6px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                                    }}
                                  >
                                    REINTENTAR
                                  </button>
                                )}
                                {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); cancelTask(task.id); }}
                                    style={{
                                      background: '#2a2a2a', color: '#ddd', border: '1px solid #444', borderRadius: 6,
                                      padding: '6px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                    }}
                                  >
                                    CANCELAR
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: 16, color: '#FFD700', letterSpacing: 1, marginBottom: 12 }}>
                        COMMS DE LA MISION
                      </div>
                      <div style={{
                        background: '#050505', border: '1px solid #1a1a1a', borderRadius: 10,
                        padding: '14px 16px', maxHeight: 520, overflowY: 'auto', fontFamily: 'var(--font-mono)',
                      }}>
                        {missionDetail.messages.length === 0 ? (
                          <div style={{ color: '#666', fontStyle: 'italic' }}>Sin mensajes todavía.</div>
                        ) : missionDetail.messages.map(msg => (
                          <div key={msg.id} style={{ marginBottom: 10, fontSize: 12, lineHeight: 1.55 }}>
                            <div style={{ color: '#777' }}>
                              [{new Date(msg.created_at).toLocaleTimeString()}] {msg.from_agent} -&gt; {msg.to_agent} {msg.kind}
                            </div>
                            <div style={{ color: msg.status === 'BLOCKED' ? '#EF4444' : msg.status === 'COMPLETED' ? '#22C55E' : '#d2d2d2' }}>
                              {msg.summary ?? 'Sin resumen'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ──── PRESUPUESTO ──── */}
          {tab === 'presupuesto' && (
            <div>
              <SectionTitle>CONTROL DE PRESUPUESTO OPERATIVO</SectionTitle>
              {!budgetData ? (
                <div style={{ textAlign: 'center', color: '#555', padding: 60, fontSize: 16 }}>
                  {loading ? 'Cargando datos financieros…' : 'Sin datos de presupuesto.'}
                </div>
              ) : (
                <>
                  {/* KPIs */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
                    {[
                      { label: 'Gasto mensual', value: `$${budgetData.total_spent_usd?.toFixed(4)}`, color: '#4169E1' },
                      { label: 'Proyección mensual', value: `$${budgetData.projected_monthly_usd?.toFixed(2)}`, color: '#F59E0B' },
                      { label: 'Proyección anual', value: `$${budgetData.projected_annual_usd?.toFixed(0)}`, color: '#F59E0B' },
                      { label: 'Cap anual', value: `$${budgetData.annual_cap_usd?.toFixed(0)}`, color: '#888' },
                      { label: 'Restante anual', value: `$${budgetData.annual_remaining_usd?.toFixed(2)}`, color: '#22C55E' },
                    ].map(k => (
                      <div key={k.label} style={{
                        background: '#0d0d0d', border: `1px solid ${k.color}30`,
                        borderRadius: 10, padding: '18px 22px',
                      }}>
                        <div style={{ fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 800, color: k.color }}>{k.value}</div>
                        <div style={{ fontSize: 12, color: '#777', marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' }}>{k.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Provider bars */}
                  <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>
                    <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: '#FFD700', letterSpacing: 2, marginBottom: 20 }}>PROVEEDORES</div>
                    {(budgetData.providers ?? []).map(p => {
                      const pct = Math.min(100, (p.pct_used ?? 0));
                      const barColor = pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#22C55E';
                      return (
                        <div key={p.provider} style={{ marginBottom: 20 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 14 }}>
                            <span style={{ fontWeight: 700, color: '#fff', textTransform: 'capitalize' }}>{p.provider}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', color: '#aaa' }}>
                              <strong style={{ color: barColor }}>${p.spent_usd?.toFixed(4)}</strong> / ${p.cap_usd?.toFixed(2)} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div style={{ height: 12, background: '#1a1a1a', borderRadius: 6, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 6, transition: 'width 0.5s' }} />
                          </div>
                          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Restante: ${p.remaining_usd?.toFixed(2)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Model breakdown */}
                  {(budgetData.model_breakdown ?? []).length > 0 && (
                    <div style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: 12, padding: '24px 28px' }}>
                      <div style={{ fontFamily: 'var(--font-head)', fontSize: 18, fontWeight: 700, color: '#FFD700', letterSpacing: 2, marginBottom: 20 }}>DESGLOSE POR MODELO</div>
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead>
                            <tr>
                              {['Proveedor','Modelo','Agente','Llamadas','Tokens entrada','Tokens salida','Costo USD'].map(h => (
                                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #222', color: '#666', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {budgetData.model_breakdown.map((r, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #151515' }}>
                                <td style={{ padding: '12px 14px', color: '#aaa', textTransform: 'capitalize' }}>{r.provider}</td>
                                <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ccc' }}>{r.model}</td>
                                <td style={{ padding: '12px 14px', color: '#aaa' }}>{r.agent}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#fff', fontWeight: 600 }}>{r.call_count}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#888', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{(r.tokens_input ?? 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#888', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{(r.tokens_output ?? 0).toLocaleString()}</td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', color: '#22C55E', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>${r.cost_total_usd?.toFixed(6)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ──── APROBACIONES ──── */}
          {tab === 'aprobaciones' && (
            <div>
              <SectionTitle>COLA DE APROBACIONES</SectionTitle>
              {loading ? (
                <div style={{ textAlign: 'center', color: '#555', padding: 40, fontSize: 16 }}>Cargando…</div>
              ) : approvals.filter(a => a.status?.toUpperCase() === 'PENDING').length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: 60, color: '#444',
                  fontSize: 16, fontStyle: 'italic', border: '1px dashed #222', borderRadius: 12,
                }}>Sin aprobaciones pendientes. Batallón en espera.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {approvals.filter(a => a.status?.toUpperCase() === 'PENDING').map(a => {
                    const rColor = a.risk_level === 'CRITICAL' ? '#EF4444' : a.risk_level === 'HIGH' ? '#F59E0B' : '#4169E1';
                    return (
                      <div key={a.id} style={{
                        background: '#0d0d0d', border: `1px solid ${rColor}40`,
                        borderLeft: `4px solid ${rColor}`,
                        borderRadius: '0 10px 10px 0', padding: '20px 24px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                              <span style={{ background: `${rColor}20`, color: rColor, fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>{a.risk_level}</span>
                              <span style={{ background: '#1a1a1a', color: '#aaa', fontSize: 12, padding: '2px 8px', borderRadius: 4 }}>{a.action_type}</span>
                            </div>
                            <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{a.description}</div>
                            <div style={{ fontSize: 13, color: '#777' }}>
                              Misión: <span style={{ color: '#aaa' }}>{a.mission_label || a.mission_id}</span>
                              {' · '}Solicitado por: <span style={{ color: '#aaa' }}>{a.requested_by}</span>
                              {' · '}<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{new Date(a.requested_at).toLocaleString('es-AR')}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                            <button onClick={() => resolveApproval(a.id, 'approved')} style={{
                              background: '#22C55E', color: '#000', border: 'none',
                              borderRadius: 7, padding: '10px 20px', cursor: 'pointer',
                              fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 800, letterSpacing: 1,
                            }}>✓ APROBAR</button>
                            <button onClick={() => resolveApproval(a.id, 'rejected')} style={{
                              background: '#EF4444', color: '#fff', border: 'none',
                              borderRadius: 7, padding: '10px 20px', cursor: 'pointer',
                              fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 800, letterSpacing: 1,
                            }}>✕ RECHAZAR</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* COMMS inline */}
              <div style={{ marginTop: 32 }}>
                <SectionTitle>COMMS — MONITOREO PASIVO</SectionTitle>
                <div style={{ fontSize: 12, color: '#555', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                  SSE stream · monitoreo pasivo · sin costo API
                </div>
                <div style={{
                  background: '#050505', border: '1px solid #1a1a1a', borderRadius: 10,
                  padding: '16px 20px', height: 280, overflowY: 'auto', fontFamily: 'var(--font-mono)',
                }}>
                  {commsLog.map((line, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#22C55E', marginBottom: 4, lineHeight: 1.6 }}>{line}</div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  );
}

// ── Helper components ─────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-head)', fontSize: 26, fontWeight: 900,
      color: '#FFD700', letterSpacing: 3, textTransform: 'uppercase',
      marginBottom: 22, borderBottom: '1px solid #2a1a00', paddingBottom: 10,
    }}>{children}</h2>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#0d0d0d', border: '1px solid #1e1e1e',
      borderRadius: 10, padding: '18px 20px',
    }}>
      <div style={{
        fontFamily: 'var(--font-head)', fontSize: 15, fontWeight: 800,
        color: '#FFD700', letterSpacing: 2, marginBottom: 14,
      }}>{title}</div>
      {children}
    </div>
  );
}
