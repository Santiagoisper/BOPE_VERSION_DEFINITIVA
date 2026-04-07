'use client';
import { useState } from 'react';

// ─── TROPA CANÓNICA (fuente: codex-logs/personnel/) ───────────────────────────
const TROPA = [
  {
    aka: 'RAMBO',
    nombre: 'John James Rambo',
    rango: 'Sargento Mayor',
    funcion: 'Mando operativo',
    capa: 'CODEX',
    estado: 'ACTIVO',
    folklore: 'Veterano de guerra y cautiverio. Volvió con la certeza de que liderar es no abandonar a los suyos. En BOPE su experiencia se convierte en conducción.',
    skills: ['Mando bajo presión', 'Guerra irregular', 'Infiltración', 'Continuidad operativa'],
    medallas: [{ codigo: 'NC', nombre: 'Navy Cross', mision: 'BOPE-CODEX-2026-009' }],
    record: '#1 Líder absoluto vigente',
    operaciones: 10,
  },
  {
    aka: 'PIXEL',
    nombre: 'Adrià Ferrer Soler',
    rango: 'Capitán',
    funcion: 'Interfaz y UX',
    capa: 'CLAUDE',
    estado: 'ACTIVO',
    folklore: 'Diseñador de combate. Convierte el caos visual en claridad táctica. Si la interfaz no habla, no sirve.',
    skills: ['UI/UX', 'Vercel CLI', 'Playwright', 'Analytics'],
    medallas: [],
    record: 'Especialista frontal',
    operaciones: 0,
  },
  {
    aka: 'FORGE',
    nombre: 'Arben Dervishi Kola',
    rango: 'Teniente Coronel',
    funcion: 'APIs, base de datos y backend',
    capa: 'CLAUDE',
    estado: 'ACTIVO',
    folklore: 'Constructor de infraestructura de guerra. Si no tiene base sólida, no hay operación posible.',
    skills: ['Node/TS', 'psql', 'GitHub CLI', 'Vercel CLI'],
    medallas: [],
    record: 'Ingeniero de backend',
    operaciones: 0,
  },
  {
    aka: 'HOUSE',
    nombre: 'William Arthur Hargreaves',
    rango: 'Mayor',
    funcion: 'QA y validación',
    capa: 'CLAUDE',
    estado: 'ACTIVO',
    folklore: 'Nadie sale al campo sin su aprobación. Lo que no pasa por HOUSE, no llega a producción.',
    skills: ['k6', 'Playwright', 'Sentry CLI', 'curl/jq'],
    medallas: [],
    record: 'Guardián de calidad',
    operaciones: 0,
  },
  {
    aka: 'WINSTON',
    nombre: 'Winston Alastair MacLeod',
    rango: 'Sargento',
    funcion: 'Memoria y registro',
    capa: 'CODEX',
    estado: 'ACTIVO',
    folklore: 'El batallón olvida. WINSTON no. Cada misión queda escrita, versionada y disponible para siempre.',
    skills: ['Git', 'GitHub CLI', 'jq', 'Trazabilidad'],
    medallas: [],
    record: 'Archivista del batallón',
    operaciones: 0,
  },
  {
    aka: 'NEXUS',
    nombre: 'Mateo Esteban Salazar',
    rango: 'Capitán',
    funcion: 'Integración end-to-end',
    capa: 'CODEX',
    estado: 'ACTIVO',
    folklore: 'Une los puntos que nadie más conecta. Donde hay un gap, NEXUS tiende el puente.',
    skills: ['n8n', 'Node/TS', 'k6', 'Deploy'],
    medallas: [],
    record: 'Integrador maestro',
    operaciones: 0,
  },
  {
    aka: 'CERBERUS',
    nombre: 'Nikola Vukovic',
    rango: 'Capitán',
    funcion: 'Seguridad y secrets',
    capa: 'CLAUDE',
    estado: 'ACTIVO',
    folklore: 'Tres cabezas, ninguna descansa. El perímetro no se negocia.',
    skills: ['openssl', 'WAF/IAM', 'curl defensivo', 'TLS'],
    medallas: [],
    record: 'Guardián del perímetro',
    operaciones: 0,
  },
  {
    aka: 'MARCO AURELIO',
    nombre: 'Marco Aurelio de Almeida',
    rango: 'Consejero',
    funcion: 'Consejo, sanciones y medallas',
    capa: 'CLAUDE',
    estado: 'ACTIVO',
    folklore: 'No combate. Juzga. Su palabra es la doctrina del batallón y su silencio pesa más que cualquier orden.',
    skills: ['Doctrina', 'Sanciones', 'Condecoraciones', 'Consejo estratégico'],
    medallas: [],
    record: 'Consejero supremo',
    operaciones: 0,
  },
  {
    aka: 'BLADE',
    nombre: 'Darius Wei Tan',
    rango: 'Teniente',
    funcion: 'Reconocimiento táctico',
    capa: 'CODEX',
    estado: 'ACTIVO',
    folklore: 'Entra, observa, sale. Nadie sabe que estuvo ahí hasta que entrega el informe.',
    skills: ['curl recon', 'Análisis', 'Diagnóstico', 'Reconocimiento'],
    medallas: [],
    record: 'Especialista recon',
    operaciones: 0,
  },
  {
    aka: 'SICARIO',
    nombre: 'Elias Nathan Mercer',
    rango: 'Operativo Especial',
    funcion: 'Ejecución total sin fricción',
    capa: 'CLAUDE',
    estado: 'STANDBY',
    folklore: 'Solo entra cuando todo lo demás falló o cuando la misión requiere velocidad absoluta. No pregunta. Ejecuta.',
    skills: ['Ejecución total', 'Velocidad', 'Codex API fuerza bruta'],
    medallas: [],
    record: 'Último recurso',
    operaciones: 0,
  },
];

// ─── ARSENAL CANÓNICO (fuente: codex-logs/ARSENAL-BOPE.md) ────────────────────
const ARSENAL = [
  {
    nivel: 'BASE',
    color: 'var(--color-success)',
    armas: [
      { nombre: 'Git CLI', tipo: 'Versionado', costo: 'FREE', efectivos: ['RAMBO', 'FORGE', 'WINSTON', 'HOUSE', 'NEXUS'], uso: 'diff, commit, ramas, rollback — base obligatoria' },
      { nombre: 'GitHub CLI', tipo: 'Repos y PRs', costo: 'FREE', efectivos: ['FORGE', 'WINSTON', 'HOUSE'], uso: 'PRs, issues, releases, trazabilidad' },
      { nombre: 'Vercel CLI', tipo: 'Deploy', costo: 'FREE/bajo', efectivos: ['FORGE', 'NEXUS', 'PIXEL'], uso: 'Deploy, preview, rollback, logs' },
      { nombre: 'Neon Postgres', tipo: 'DB serverless', costo: 'FREE tier', efectivos: ['FORGE', 'NEXUS', 'HOUSE'], uso: 'Base de datos principal del stack' },
      { nombre: 'Node/TS scripts', tipo: 'Automatización', costo: 'FREE', efectivos: ['FORGE', 'NEXUS', 'HOUSE', 'RAMBO'], uso: 'Jobs, validaciones, simulacros' },
      { nombre: 'curl + jq', tipo: 'HTTP cliente', costo: 'FREE', efectivos: ['HOUSE', 'NEXUS', 'CERBERUS', 'BLADE'], uso: 'APIs, healthchecks, recon defensivo' },
    ],
  },
  {
    nivel: 'INTERMEDIO',
    color: 'var(--color-warning)',
    armas: [
      { nombre: 'Supabase CLI', tipo: 'BaaS', costo: 'FREE tier / pago si escala', efectivos: ['FORGE', 'NEXUS'], uso: 'Migraciones, auth, storage — solo si el stack lo requiere' },
      { nombre: 'Playwright', tipo: 'UI testing', costo: 'FREE', efectivos: ['PIXEL', 'HOUSE'], uso: 'Smoke, UI real, flujos críticos' },
      { nombre: 'k6', tipo: 'Carga', costo: 'FREE', efectivos: ['HOUSE', 'NEXUS'], uso: 'Stress, latencia — no usar de rutina' },
      { nombre: 'Sentry CLI', tipo: 'Observabilidad', costo: 'FREE tier', efectivos: ['HOUSE', 'WINSTON'], uso: 'Errores, releases — solo si Sentry ya existe' },
      { nombre: 'openssl', tipo: 'Crypto/TLS', costo: 'FREE', efectivos: ['CERBERUS', 'FORGE', 'NEXUS'], uso: 'Hashes, certificados, TLS debug' },
    ],
  },
  {
    nivel: 'RESERVA',
    color: 'var(--color-danger)',
    armas: [
      { nombre: 'Replit', tipo: 'IDE cloud + deploy', costo: '⚠️ PAGO — vigilar tope', efectivos: ['PIXEL', 'FORGE'], uso: 'Prototipo visual rápido. Solo misiones con tope aprobado. Riesgo de gasto descontrolado.' },
      { nombre: 'n8n', tipo: 'Automatización', costo: 'FREE self-host / pago cloud', efectivos: ['NEXUS', 'FORGE'], uso: 'Workflows complejos — solo si la integración lo exige' },
      { nombre: 'Aider', tipo: 'Agente CLI', costo: 'Medio (API)', efectivos: ['FORGE', 'NEXUS'], uso: 'Refactors grandes — no es arma base' },
      { nombre: 'Cursor', tipo: 'IDE IA', costo: 'Suscripción', efectivos: ['RAMBO', 'FORGE'], uso: 'Excelente pero consume suscripción rápido' },
    ],
  },
];

// ─── HERRAMIENTAS EXTERNAS (costo real) ───────────────────────────────────────
const HERRAMIENTAS_EXTERNAS = [
  { nombre: 'Claude Code', tipo: 'Agente IA', modelo: 'Claude', costo_tipo: 'Suscripción', riesgo: 'MEDIO', nota: 'Corta al 95% semanal. Espera 4-5 días.' },
  { nombre: 'Codex (OpenAI)', tipo: 'Agente IA', modelo: 'GPT-4o', costo_tipo: 'Suscripción', riesgo: 'MEDIO', nota: 'Secuencial. Consume rápido en multi-agentes.' },
  { nombre: 'Replit', tipo: 'IDE Cloud', modelo: 'Varios', costo_tipo: '⚠️ PAGO post-suscripción', riesgo: 'ALTO', nota: 'Extraordinario en frontend. Sin tope = factura inesperada.' },
  { nombre: 'Manus', tipo: 'Agente IA', modelo: 'Varios', costo_tipo: 'Suscripción', riesgo: 'ALTO', nota: 'Consume toda la suscripción en <1 hora de terminal.' },
  { nombre: 'Cursor', tipo: 'IDE IA', modelo: 'Varios', costo_tipo: 'Suscripción', riesgo: 'BAJO', nota: 'Excelente calidad. Controlado si no se abusa.' },
  { nombre: 'GitHub Copilot', tipo: 'Asistente IA', modelo: 'Varios', costo_tipo: 'Suscripción', riesgo: 'BAJO', nota: 'Integrado en repo. Comportamiento por explorar.' },
];

// ─── PRESUPUESTO ──────────────────────────────────────────────────────────────
const PRESUPUESTO = {
  anual_usd: 1500,
  distribucion: [
    { item: 'OpenAI API', asignado: 500, gastado: 0, color: 'var(--color-primary)' },
    { item: 'Claude API', asignado: 500, gastado: 0, color: 'var(--color-success)' },
    { item: 'Gemini / AI Studio', asignado: 150, gastado: 0, color: 'var(--color-warning)' },
    { item: 'Infra (Vercel/Neon)', asignado: 200, gastado: 0, color: 'var(--color-gold)' },
    { item: 'Reserva táctica', asignado: 150, gastado: 0, color: 'var(--color-text-muted)' },
  ],
};

// ─── CUADRO DE HONOR ─────────────────────────────────────────────────────────
const HONOR = [
  {
    efectivo: 'JOHN JAMES RAMBO',
    aka: 'RAMBO',
    medalla: 'Navy Cross',
    codigo: 'NC',
    mision: 'BOPE-CODEX-2026-009',
    fecha: '2026-02-17',
    propuesto: 'SANTIAGO',
    descripcion: 'Liderazgo excepcional bajo desgaste extremo. Continuidad operativa total.',
  },
];

// ─── COMPONENTES ─────────────────────────────────────────────────────────────
function StatusDot({ estado }: { estado: string }) {
  const cls = estado === 'ACTIVO' ? 'dot-active pulse' : estado === 'STANDBY' ? 'dot-standby' : 'dot-idle';
  return <span className={cls} style={{ width: 8, height: 8, borderRadius: '50%', display: 'inline-block', flexShrink: 0 }} />;
}

function CapaBadge({ capa }: { capa: string }) {
  const color = capa === 'CODEX' ? 'var(--color-primary)' : 'var(--color-gold)';
  return (
    <span style={{ fontSize: 9, fontWeight: 700, color, border: `1px solid ${color}`, borderRadius: 2, padding: '1px 5px', letterSpacing: '0.1em' }}>
      {capa}
    </span>
  );
}

function MedalBadge({ codigo, nombre }: { codigo: string; nombre: string }) {
  return (
    <span className="medal-badge" style={{ color: 'var(--color-gold)', borderColor: 'var(--color-gold)', background: 'rgba(227,179,65,0.08)' }} title={nombre}>
      🎖 {codigo}
    </span>
  );
}

// ─── PÁGINA PRINCIPAL ────────────────────────────────────────────────────────
export default function WarRoom() {
  const [tab, setTab] = useState<'comando'|'tropa'|'arsenal'|'honor'>('comando');
  const [tropaFiltro, setTropaFiltro] = useState<'TODOS'|'CODEX'|'CLAUDE'>('TODOS');
  const [soldadoActivo, setSoldadoActivo] = useState<typeof TROPA[0] | null>(null);

  const tropaMostrada = tropaFiltro === 'TODOS' ? TROPA : TROPA.filter(s => s.capa === tropaFiltro);

  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'comando', label: '⬡ COMANDO' },
    { id: 'tropa', label: '◈ TROPA' },
    { id: 'arsenal', label: '⚔ ARSENAL' },
    { id: 'honor', label: '★ HONOR' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--color-bg)' }}>

      {/* ── HEADER ── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 52, borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Logo SVG */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-label="BOPE">
            <polygon points="14,2 26,8 26,20 14,26 2,20 2,8" stroke="#58a6ff" strokeWidth="1.5" fill="none"/>
            <polygon points="14,6 22,10 22,18 14,22 6,18 6,10" stroke="#58a6ff" strokeWidth="0.75" fill="rgba(88,166,255,0.06)"/>
            <text x="14" y="17" textAnchor="middle" fontSize="7" fontWeight="700" fill="#58a6ff" fontFamily="monospace">BOPE</text>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--color-text)' }}>WAR ROOM</span>
          <span style={{ fontSize: 10, color: 'var(--color-text-faint)', letterSpacing: '0.1em' }}>v2.0 · DEFINITIVO</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot estado="ACTIVO" />
            <span style={{ fontSize: 10, color: 'var(--color-success)', letterSpacing: '0.1em' }}>SISTEMA ONLINE</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', letterSpacing: '0.08em' }}>
            COMMANDER: <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>SANTIAGO ISBERT PERLENDER</span>
          </div>
        </div>
      </header>

      {/* ── TABS ── */}
      <nav style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)', flexShrink: 0, padding: '0 24px',
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '10px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)',
            color: tab === t.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
            borderBottom: tab === t.id ? '2px solid var(--color-primary)' : '2px solid transparent',
            transition: 'color 0.15s, border-color 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── CONTENIDO ── */}
      <main style={{ flex: 1, overflow: 'auto', padding: 24 }}>

        {/* ══ COMANDO CENTRAL ══ */}
        {tab === 'comando' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 1100 }}>

            {/* Misión activa */}
            <div style={panel}>
              <SectionTitle icon="⬡" label="MISIÓN ACTIVA" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                <Row label="SLUG" value="BOPE-WARROOM-2026-001" highlight />
                <Row label="OBJETIVO" value="War Room v2 — fichas reales, arsenal, honor, presupuesto" />
                <Row label="ESTADO" value="ACTIVO" color="var(--color-success)" />
                <Row label="CAPAS" value="CODEX + CLAUDE" />
                <Row label="AGENTE DE MANDO" value="JOHN JAMES RAMBO" highlight />
              </div>
            </div>

            {/* Estado de capas */}
            <div style={panel}>
              <SectionTitle icon="◈" label="ESTADO DE CAPAS" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                {['CODEX', 'CLAUDE', 'GEMINI'].map(capa => (
                  <div key={capa} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusDot estado="ACTIVO" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '0.1em' }}>{capa}</span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--color-success)' }}>ONLINE</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Presupuesto mensual */}
            <div style={{ ...panel, gridColumn: '1 / -1' }}>
              <SectionTitle icon="$" label={`PRESUPUESTO ANUAL — $${PRESUPUESTO.anual_usd} USD / ICHTHYS`} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginTop: 16 }}>
                {PRESUPUESTO.distribucion.map(p => {
                  const pct = Math.round((p.asignado / PRESUPUESTO.anual_usd) * 100);
                  const gastadoPct = p.asignado > 0 ? Math.round((p.gastado / p.asignado) * 100) : 0;
                  return (
                    <div key={p.item} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <span style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{p.item}</span>
                      <span style={{ fontSize: 18, fontWeight: 700, color: p.color }}>${p.asignado}</span>
                      <span style={{ fontSize: 9, color: 'var(--color-text-faint)' }}>{pct}% del total</span>
                      <div style={{ height: 3, background: 'var(--color-border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${gastadoPct}%`, background: p.color, borderRadius: 2, transition: 'width 0.4s' }} />
                      </div>
                      <span style={{ fontSize: 9, color: 'var(--color-text-muted)' }}>Gastado: <span style={{ color: 'var(--color-text)' }}>${p.gastado}</span></span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Herramientas externas */}
            <div style={{ ...panel, gridColumn: '1 / -1' }}>
              <SectionTitle icon="⚠" label="HERRAMIENTAS EXTERNAS — CONTROL DE RIESGO" />
              <div style={{ marginTop: 12, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Herramienta', 'Tipo', 'Costo', 'Riesgo', 'Notas'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '6px 12px', fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {HERRAMIENTAS_EXTERNAS.map((h, i) => (
                      <tr key={h.nombre} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--color-text)' }}>{h.nombre}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)' }}>{h.tipo}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)' }}>{h.costo_tipo}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span style={{
                            fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 2, letterSpacing: '0.1em',
                            color: h.riesgo === 'ALTO' ? 'var(--color-danger)' : h.riesgo === 'MEDIO' ? 'var(--color-warning)' : 'var(--color-success)',
                            border: `1px solid ${h.riesgo === 'ALTO' ? 'var(--color-danger)' : h.riesgo === 'MEDIO' ? 'var(--color-warning)' : 'var(--color-success)'}`,
                          }}>{h.riesgo}</span>
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--color-text-muted)', fontSize: 10 }}>{h.nota}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══ TROPA ══ */}
        {tab === 'tropa' && (
          <div>
            {/* Filtro de capa */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {(['TODOS', 'CODEX', 'CLAUDE'] as const).map(f => (
                <button key={f} onClick={() => setTropaFiltro(f)} style={{
                  padding: '5px 14px', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  background: tropaFiltro === f ? 'var(--color-primary-dim)' : 'var(--color-surface)',
                  border: `1px solid ${tropaFiltro === f ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  color: tropaFiltro === f ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  borderRadius: 3, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                }}>
                  EQUIPO {f}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {tropaMostrada.map(s => (
                <div key={s.aka} onClick={() => setSoldadoActivo(soldadoActivo?.aka === s.aka ? null : s)}
                  style={{
                    ...panel, cursor: 'pointer',
                    border: soldadoActivo?.aka === s.aka ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    transition: 'border-color 0.15s',
                  }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusDot estado={s.estado} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.1em' }}>{s.aka}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{s.nombre}</div>
                      </div>
                    </div>
                    <CapaBadge capa={s.capa} />
                  </div>

                  <div style={{ fontSize: 10, color: 'var(--color-primary)', marginBottom: 6, letterSpacing: '0.08em' }}>{s.rango} · {s.funcion}</div>

                  <p style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 10 }}>{s.folklore}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {s.skills.map(sk => (
                      <span key={sk} style={{ fontSize: 9, padding: '2px 6px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 2, color: 'var(--color-text-muted)', letterSpacing: '0.06em' }}>{sk}</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: 8 }}>
                    <span style={{ fontSize: 9, color: 'var(--color-text-faint)' }}>OPS: {s.operaciones}</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {s.medallas.length > 0
                        ? s.medallas.map(m => <MedalBadge key={m.codigo} codigo={m.codigo} nombre={m.nombre} />)
                        : <span style={{ fontSize: 9, color: 'var(--color-text-faint)' }}>sin condecoraciones</span>}
                    </div>
                  </div>

                  {soldadoActivo?.aka === s.aka && (
                    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
                      <div style={{ fontSize: 9, color: 'var(--color-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Record</div>
                      <div style={{ fontSize: 10, color: 'var(--color-gold)' }}>{s.record}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ ARSENAL RAMBO ══ */}
        {tab === 'arsenal' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1100 }}>
            <div style={{ ...panel, borderLeft: '3px solid var(--color-primary)' }}>
              <SectionTitle icon="⚔" label="DOCTRINA DE ARSENAL — JOHN JAMES RAMBO" />
              <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, lineHeight: 1.8 }}>
                Antes de cada misión, RAMBO evalúa complejidad y decide qué armas desplegar y a qué efectivos equipar.
                <strong style={{ color: 'var(--color-text)' }}> Primero lo gratuito. Luego lo intermedio si el stack lo exige. La reserva entra solo con orden expresa.</strong>
                {' '}No se activan herramientas redundantes por moda o comodidad.
              </p>
            </div>

            {ARSENAL.map(nivel => (
              <div key={nivel.nivel} style={panel}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 10px', border: `1px solid ${nivel.color}`, color: nivel.color, borderRadius: 2, letterSpacing: '0.15em' }}>NIVEL {nivel.nivel}</span>
                  {nivel.nivel === 'RESERVA' && (
                    <span style={{ fontSize: 9, color: 'var(--color-danger)', letterSpacing: '0.08em' }}>⚠ ACTIVACIÓN SOLO CON ORDEN EXPRESA DE SANTIAGO</span>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {nivel.armas.map(arma => (
                    <div key={arma.nombre} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 4, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{arma.nombre}</span>
                        <span style={{ fontSize: 9, padding: '2px 6px', background: arma.costo === 'FREE' || arma.costo === 'FREE tier' || arma.costo === 'FREE tier / pago si escala' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)', color: arma.costo.includes('FREE') ? 'var(--color-success)' : 'var(--color-warning)', border: `1px solid ${arma.costo.includes('FREE') ? 'var(--color-success)' : 'var(--color-warning)'}`, borderRadius: 2, letterSpacing: '0.08em', whiteSpace: 'nowrap', marginLeft: 8 }}>
                          {arma.costo}
                        </span>
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--color-text-faint)', marginBottom: 6 }}>{arma.tipo}</div>
                      <p style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 8 }}>{arma.uso}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                        {arma.efectivos.map(ef => (
                          <span key={ef} style={{ fontSize: 9, padding: '1px 5px', background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.2)', borderRadius: 2, color: 'var(--color-primary)', letterSpacing: '0.06em' }}>{ef}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══ CUADRO DE HONOR ══ */}
        {tab === 'honor' && (
          <div style={{ maxWidth: 900 }}>
            <div style={{ ...panel, marginBottom: 20, borderLeft: '3px solid var(--color-gold)' }}>
              <SectionTitle icon="★" label="CUADRO DE HONOR — BATALLÓN BOPE" />
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 6, lineHeight: 1.8 }}>
                Las condecoraciones son permanentes. Las propone MARCO AURELIO o SANTIAGO. Las ratifica el Comandante Supremo.
                Cada medalla queda asentada en GitHub y es parte de la identidad del efectivo para siempre.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {HONOR.map((h, i) => (
                <div key={i} style={{ ...panel, display: 'flex', gap: 20, alignItems: 'flex-start', borderLeft: '3px solid var(--color-gold)' }}>
                  <div style={{ fontSize: 32, lineHeight: 1 }}>🎖</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gold)', letterSpacing: '0.1em' }}>{h.medalla}</span>
                      <span style={{ fontSize: 9, padding: '2px 6px', border: '1px solid var(--color-gold)', color: 'var(--color-gold)', borderRadius: 2 }}>[{h.codigo}]</span>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>{h.efectivo} <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>aka</span> {h.aka}</div>
                    <p style={{ fontSize: 10, color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: 8 }}>{h.descripcion}</p>
                    <div style={{ display: 'flex', gap: 16, fontSize: 9, color: 'var(--color-text-faint)' }}>
                      <span>MISIÓN: <span style={{ color: 'var(--color-text-muted)' }}>{h.mision}</span></span>
                      <span>FECHA: <span style={{ color: 'var(--color-text-muted)' }}>{h.fecha}</span></span>
                      <span>PROPUESTO POR: <span style={{ color: 'var(--color-text-muted)' }}>{h.propuesto}</span></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tropa sin condecoraciones */}
            <div style={{ ...panel, marginTop: 20 }}>
              <SectionTitle icon="◈" label="PENDIENTES DE DISTINCIÓN" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, marginTop: 12 }}>
                {TROPA.filter(s => s.medallas.length === 0).map(s => (
                  <div key={s.aka} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 3 }}>
                    <StatusDot estado={s.estado} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text)' }}>{s.aka}</div>
                      <div style={{ fontSize: 9, color: 'var(--color-text-faint)' }}>{s.nombre}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid var(--color-border)', padding: '8px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--color-surface)', flexShrink: 0,
      }}>
        <span style={{ fontSize: 9, color: 'var(--color-text-faint)', letterSpacing: '0.1em' }}>BOPE WAR ROOM v2.0 · DEFINITIVO · ICHTHYS</span>
        <span style={{ fontSize: 9, color: 'var(--color-text-faint)', letterSpacing: '0.08em' }}>Fuente de verdad: github.com/Santiagoisper/BOPE_VERSION_DEFINITIVA</span>
      </footer>

    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const panel: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  padding: 16,
};

function SectionTitle({ icon, label }: { icon: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: 'var(--color-primary)', fontSize: 12 }}>{icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

function Row({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 9, color: 'var(--color-text-faint)', letterSpacing: '0.1em', textTransform: 'uppercase', minWidth: 80, paddingTop: 2 }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: highlight ? 600 : 400, color: color || (highlight ? 'var(--color-text)' : 'var(--color-text-muted)'), fontFamily: 'var(--font-mono)' }}>{value}</span>
    </div>
  );
}
