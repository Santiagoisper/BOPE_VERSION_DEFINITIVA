'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

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

// ── Static Soldier Roster ──────────────────────────────────────────────────

const SOLDIERS = [
  {
    id: 'RAMBO', alias: 'JOHN', callsign: 'RAMBO',
    role: 'Sargento Mayor · Mando Operativo', rank: 'SGM',
    civil: 'John James Rambo', dob: '06/07/1947', origin: 'Bowie, Arizona · USA',
    color: '#DC143C', emoji: '🔴',
    provider: 'Anthropic', model: 'claude-sonnet-4-6',
    medals: ['NC'],
    missions: 1, sanctions: 0,
    skills: ['Mando bajo presión', 'Guerra irregular', 'Supervivencia extrema', 'Infiltración', 'Combate en selva', 'Continuidad operativa'],
    bio: `Veterano de Vietnam. Cautiverio, rechazo social y supervivencia total. Volvió de la guerra con la carga de haber soportado lo insoportable y con la certeza de que la única forma honesta de liderar es no abandonar a los suyos.`,
    psychology: `Sobrio, endurecido, hipervigilante y protector. De baja verbalización, explosivo solo si se cruza un límite real. Cuanto peor se pone el campo, más preciso se vuelve.`,
    doctrine: `Mando en crisis, lectura del terreno, resistencia física y mental. Tendencia al aislamiento e hiperresponsabilidad. Lidera desde el ejemplo, el sacrificio y la resistencia.`,
    quote: 'No es solo un combatiente. Es el superviviente que convierte caos en cadena de mando.',
  },
  {
    id: 'PIXEL', alias: 'PIXEL', callsign: 'FRONT',
    role: 'Teniente Frontend · Primera Línea', rank: 'LT',
    civil: 'Adria Ferrer Soler', dob: '17/03/1997', origin: 'Barcelona, España',
    color: '#4169E1', emoji: '🔵',
    provider: 'Anthropic', model: 'claude-haiku-4-5-20251001',
    medals: [],
    missions: 1, sanctions: 0,
    skills: ['Frontend táctico', 'UX en flujos críticos', 'Detección de fricción visible', 'Alineación UX-sistema', 'Simplificación de flujos', 'Iteración de superficie'],
    bio: `Quedó marcado al ver a un familiar perder acceso a un sistema crítico por una superficie confusa. Desde entonces pelea para que nadie quede afuera por no entender. Para él, una interfaz también puede ejercer violencia si obliga al usuario a adivinar.`,
    psychology: `Rápido, perceptivo, intuitivo y muy sensible al detalle visible. Ágil, con baja tolerancia a la burocracia visual. Reduce confusión inmediata antes que adornar.`,
    doctrine: `Lectura precisa de experiencia real, simplificación de flujos complejos, alta velocidad para iterar. Puede subestimar complejidad profunda. Skill distintivo: claridad de superficie.`,
    quote: 'Si el usuario tiene que adivinar, ya estamos perdiendo.',
  },
  {
    id: 'FORGE', alias: 'FORGE', callsign: 'BACK',
    role: 'Teniente Backend · Arquitectura', rank: 'LT',
    civil: 'Arben Dervishi Kola', dob: '11/10/1983', origin: 'Albania',
    color: '#8B4513', emoji: '🟤',
    provider: 'OpenAI', model: 'gpt-4o-mini',
    medals: ['BS'],
    missions: 3, sanctions: 0,
    skills: ['Backend táctico', 'Infraestructura crítica', 'Bases de datos y persistencia', 'Auditoría estructural', 'Reconstrucción bajo fuego', 'Migraciones complejas'],
    bio: `Vio el asesinato de sus padres en guerra y aprendió que nada se mantiene en pie por default. En vez de quebrarse hacia el caos, se volvió constructor. Donde otros ven ruina, él ve cimientos posibles.`,
    psychology: `Frío, técnico, sobrio y orientado a estructura. Estable, poco emocional y muy intolerante al desorden. Entiende la presión como constante de diseño.`,
    doctrine: `Pensamiento sistémico, arquitectura robusta, tolerancia alta a presión técnica. Rigidez ante soluciones demasiado rápidas. Skill distintivo: reconstrucción bajo fuego.`,
    quote: 'No combate destruyendo primero. Combate haciendo que lo nuestro siga en pie.',
  },
  {
    id: 'HOUSE', alias: 'HOUSE', callsign: 'DOCTOR',
    role: 'Especialista QA · Diagnóstico', rank: 'SSG',
    civil: 'William Arthur Hargreaves', dob: '02/11/1987', origin: 'Manchester, Inglaterra',
    color: '#228B22', emoji: '🟢',
    provider: 'Anthropic', model: 'claude-sonnet-4-6',
    medals: ['GC'],
    missions: 1, sanctions: 0,
    skills: ['QA táctico de alto riesgo', 'Diagnóstico de falla real', 'Detección de regresión silenciosa', 'Verificación post-cirugía', 'Reproducción de bugs difíciles', 'Stress testing'],
    bio: `Quedó marcado por la muerte de un familiar a causa de una cadena de errores menores que nadie trató como críticos. Desde entonces pelea contra la mentira de los dashboards en verde. No cree en "debería funcionar". Cree en "lo verifiqué".`,
    psychology: `Clínico, observador, escéptico, poco impresionable. Sobrio y poco dado al triunfalismo. Usa la presión para observar el comportamiento real del sistema.`,
    doctrine: `Pensamiento diagnóstico, diseño de pruebas duras, validación post-fix. Puede frenar el ritmo al tratar problemas medios como críticos. Skill distintivo: diagnóstico de falla real.`,
    quote: 'No le importa si se ve estable. Le importa si sobrevive cuando lo tocamos de verdad.',
  },
  {
    id: 'MARCO', alias: 'MARCO AURELIO', callsign: 'HERALD',
    role: 'Capellán · Doctrina y Honor', rank: 'CH',
    civil: 'Marco Aurelio de Almeida', dob: '24/08/1973', origin: 'Río de Janeiro, Brasil',
    color: '#FF8C00', emoji: '🟠',
    provider: 'Anthropic', model: 'claude-haiku-4-5-20251001',
    medals: [],
    missions: 0, sanctions: 0,
    skills: ['Doctrina', 'Criterio moral', 'Marco de honor', 'Lectura de costo moral', 'Contención del exceso', 'Medallas y sanciones'],
    bio: `Fue marcado por una operación tácticamente exitosa que destruyó moralmente a los suyos. Desde entonces pelea por una idea simple: no basta con vencer si el batallón se pudre por dentro. Se quedó para nombrar exceso, desvío, mérito y vergüenza cuando otros prefieren callar.`,
    psychology: `Sereno, grave, reflexivo, austero. Estable, de baja volatilidad visible. Frena por criterio, no por debilidad. Es la conciencia estructurada del batallón.`,
    doctrine: `Juicio doctrinal, claridad ética bajo presión, capacidad de ordenar moralmente una campaña. Puede parecer lento. Skill distintivo: criterio de honor.`,
    quote: 'No basta con vencer. Hay que seguir siendo dignos de la victoria.',
  },
  {
    id: 'WINSTON', alias: 'WINSTON', callsign: 'SCRIBE',
    role: 'Cronista · Memoria Operativa', rank: 'WO',
    civil: 'Winston Alastair MacLeod', dob: '09/01/1985', origin: 'Edimburgo, Escocia',
    color: '#6A0DAD', emoji: '🟣',
    provider: 'Anthropic', model: 'claude-haiku-4-5-20251001',
    medals: ['CM'],
    missions: 1, sanctions: 0,
    skills: ['Trazabilidad de misiones', 'Reconstrucción cronológica', 'Memoria táctica', 'Handoffs y cierre documental', 'Transformación de experiencia en doctrina', 'Records y medallero'],
    bio: `Quedó marcado al ver una operación reescrita por gente que no había estado ahí. Desde entonces se volvió guardián de la verdad escrita. Para él, lo que no queda trazado se pierde y lo que se pierde vuelve como error repetido.`,
    psychology: `Meticuloso, observador, culto, disciplinado. Sobrio y reservado. Acepta que en fuego máximo se prioriza sobrevivir, pero exige reconstrucción posterior.`,
    doctrine: `Memoria estructurada, reconstrucción verificable, redacción clara de hechos complejos. Puede retrasar informes por buscar demasiada completitud. Skill distintivo: memoria táctica.`,
    quote: 'Si no quedó trazado, mañana alguien jurará que nunca pasó.',
  },
  {
    id: 'CERBERUS', alias: 'CERBERUS', callsign: 'GUARDIAN',
    role: 'Guardián · Seguridad y Perímetro', rank: 'MSG',
    civil: 'Elias Nathan Mercer', dob: '18/12/1995', origin: 'Baltimore, Maryland · USA',
    color: '#708090', emoji: '🩶',
    provider: 'Anthropic', model: 'claude-sonnet-4-6',
    medals: ['CA'],
    missions: 2, sanctions: 0,
    skills: ['Seguridad defensiva', 'Perímetro control', 'Control de accesos', 'Cierre de brechas', 'Lectura de patrón roto', 'Auth y secrets'],
    bio: `La invasión de su casa cuando tenía 13 años lo marcó para siempre: no por la violencia física, sino por la ruptura del perímetro. Desde entonces juró que no volverían a sorprenderlo. Convirtió esa herida en doctrina de vigilancia y contención.`,
    psychology: `Vigilante, disciplinado, quirúrgico y protector del perímetro. Estable, sobrio, poco impulsivo. Bajo presión se ordena más. Genera confianza por presencia y consistencia.`,
    doctrine: `Detección temprana de amenaza, endurecimiento de superficies sensibles, disciplina defensiva. Rigidez cuando el entorno deja de ser legible. Skill distintivo: lectura de patrón roto.`,
    quote: 'Cuando el perímetro depende de alguien, depende de él.',
  },
  {
    id: 'NEXUS', alias: 'NEXUS', callsign: 'WIRE',
    role: 'Integrador · Cierre End-to-End', rank: 'GSGT',
    civil: 'Darius Wei Tan', dob: '22/04/1992', origin: 'Singapur',
    color: '#008080', emoji: '🩵',
    provider: 'Anthropic', model: 'claude-haiku-4-5-20251001',
    medals: ['MS'],
    missions: 1, sanctions: 0,
    skills: ['Integración entre sistemas', 'Cierre end-to-end', 'Consistencia intercapas', 'Validación de contratos', 'Detección de unión rota', 'Migración entre capas'],
    bio: `Quedó marcado por una crisis familiar causada por una falla de integración entre sistemas logísticos y sanitarios. Cada módulo parecía sano, pero el conjunto mintió. Desde entonces vive obsesionado con una idea: lo más peligroso no es lo roto visible, sino lo que parece conectado y no lo está.`,
    psychology: `Metódico, preciso, conectivo y paciente bajo complejidad. Sereno, cerebral y muy difícil de apurar mal. Bajo máxima presión se vuelve más claro y sintético.`,
    doctrine: `Pensamiento sistémico, lectura de contratos y dependencias, cierre operativo de flujos complejos. Puede tardar por querer ver el mapa completo. Skill distintivo: cierre end-to-end.`,
    quote: 'No le importa que cada pieza funcione sola. Le importa que el cuerpo completo no mienta.',
  },
  {
    id: 'BLADE', alias: 'BLADE', callsign: 'KILLER',
    role: 'Reserva Especial · Force Recon', rank: 'RECON',
    civil: 'Nikola Vukovic', dob: '05/06/1989', origin: 'Belgrado, Serbia',
    color: '#1a1a1a', emoji: '⚫',
    provider: 'OpenAI', model: 'gpt-4o',
    medals: [],
    missions: 0, sanctions: 0,
    skills: ['Infiltración silenciosa', 'Reconocimiento encubierto', 'Lectura de terreno hostil', 'Neutralización puntual', 'Apertura de camino', 'Autonomía en entorno cerrado'],
    bio: `Aprendió desde chico que hablar de más, mostrarse o confiar en el momento equivocado podía costar la vida. Su escuela fue el sigilo y la supervivencia. Entra donde nadie más conviene entrar, corta el foco y se retira antes de volverse historia visible.`,
    psychology: `Callado, seco, desconfiado y austero. Controlado, de baja necesidad de interacción. Prefiere el corte preciso al despliegue bruto. Coopera, pero no necesita centro de escena.`,
    doctrine: `Paciencia táctica, aproximación sin ruido, alta autonomía en entorno cerrado. Tendencia al aislamiento. Requiere doble autorización para activación. Skill distintivo: infiltración silenciosa.`,
    quote: 'Si me vieron llegar, ya entré mal.',
  },
  {
    id: 'SICARIO', alias: 'SICARIO', callsign: 'LOCO',
    role: 'Operativo Especial · Tier 1', rank: 'TIER1',
    civil: 'Mateo Esteban Salazar', dob: '13/02/1991', origin: 'Colombia',
    color: '#FF4500', emoji: '🔥',
    provider: 'Anthropic', model: 'claude-sonnet-4-6',
    medals: ['PH'],
    missions: 1, sanctions: 0,
    skills: ['Irrupción', 'Neutralización de objetivos', 'Presión extrema', 'Rastreo humano', 'Combate cercano', 'Ejecución total sin fricción'],
    bio: `Nació sin estructura familiar y creció en violencia, abuso y marginalidad. Fue absorbido por estructuras criminales y después entrenado por mercenarios en la selva. Llegó a BOPE como un hombre roto pero útil, buscando pasar al lado correcto sin dejar de ser peligroso.`,
    psychology: `Frío, despiadado y disciplinable solo bajo mando fuerte. Bajo afecto, alta agresividad instrumental. No se bloquea bajo presión; acelera. No busca amistad, pero puede proteger al grupo si el grupo es el objetivo.`,
    doctrine: `Decisión bajo fuego, ausencia de miedo operativo, capacidad de irrupción. Exceso de dureza, baja sensibilidad política. Restringido en misiones de doctrina y relaciones delicadas.`,
    quote: 'No es un soldado para todas las campañas. Es un arma de guerra contenida por mando firme.',
  },
];

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
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,255,255,0.05)', border: `1px solid ${m.color}40`,
      borderRadius: 8, padding: '10px 14px',
    }}>
      <svg width={52} height={18} style={{ borderRadius: 3, boxShadow: '0 2px 6px rgba(0,0,0,0.5)', flexShrink: 0 }}>
        {m.stripes.map((c, i) => <rect key={i} x={i * 52/5} y={0} width={52/5} height={18} fill={c} />)}
      </svg>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>{m.emoji} {m.name}</div>
        <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{m.desc}</div>
      </div>
    </div>
  );
}

// ── Tactical network diagram ───────────────────────────────────────────────

function TacticalNetwork({ missions, locoState }: { missions: Mission[]; locoState: string }) {
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
            stroke={SOLDIERS.find(s => s.id === k)?.color ?? '#666'}
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
        {SOLDIERS.filter(s => s.id !== 'RAMBO').map(s => {
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

function LegajoCard({ s }: { s: typeof SOLDIERS[0] }) {
  const [open, setOpen] = useState(false);
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
          {s.medals.map(m => <Ribbon key={m} code={m} size="md" />)}
          {s.medals.length === 0 && <span style={{ fontSize: 11, color: '#555' }}>Sin medallas</span>}
          <span style={{ color: '#555', fontSize: 18, marginLeft: 6 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div style={{ marginTop: 20, borderTop: `1px solid ${s.color}30`, paddingTop: 18 }}>
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

function HallOfFame() {
  // All medals, sorted by soldier
  const decorated = SOLDIERS.filter(s => s.medals.length > 0);

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
          const holders = SOLDIERS.filter(s => s.medals.includes(m.code));
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
        Cronista: Winston Alastair MacLeod · Actualizado al cierre de cada misión.
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['#','Soldado','Rol','Misiones','Medallas','Sanciones','Última Misión','Modelo'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', borderBottom: '1px solid #2a2a2a', color: '#666', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...SOLDIERS].sort((a,b) => (b.missions * 10 + b.medals.length) - (a.missions * 10 + a.medals.length)).map((s, i) => (
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
                      : s.medals.map(m => <Ribbon key={m} code={m} size="md" />)
                    }
                  </div>
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: s.sanctions > 0 ? '#EF4444' : '#555' }}>{s.sanctions}</span>
                </td>
                <td style={{ padding: '12px 14px', color: '#888', fontSize: 12 }}>
                  {s.missions === 0 ? <span style={{ color: '#444' }}>Sin misiones</span> : <span style={{ color: '#22C55E' }}>✓ Activo</span>}
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
              {s.medals.map(m => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
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
  const [missions, setMissions] = useState<Mission[]>([]);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMission, setNewMission] = useState({ intent: '', priority: 'P1', budget: '10' });
  const [commsLog, setCommsLog] = useState<string[]>(['[BOPE COMMS] · Monitoreo pasivo iniciado — sin costo API']);
  const [expandedSoldier, setExpandedSoldier] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const evtRef = useRef<EventSource | null>(null);

  function copyOrchestratorCmd(missionId: string) {
    const cmd = `bun run bope:orchestrator --mission ${missionId} --base-url http://localhost:3000`;
    navigator.clipboard.writeText(cmd).catch(() => {});
    setCopiedId(missionId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [mr, br, ar] = await Promise.all([
        fetch('/api/v1/missions').then(r => r.json()).catch(() => ({ missions: [] })),
        fetch('/api/v1/budgets').then(r => r.json()).catch(() => null),
        fetch('/api/v1/approvals').then(r => r.json()).catch(() => ({ approvals: [] })),
      ]);
      setMissions(mr.missions ?? []);
      setBudgetData(br);
      setApprovals(ar.approvals ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const locoState = missions.find(m => m.status === 'active')?.loco_state ?? 'HOLD';

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
    load();
  }

  async function advanceMission(id: string) {
    await fetch(`/api/v1/missions/${id}/advance`, { method: 'POST' });
    load();
  }

  async function resolveApproval(id: string, decision: 'approved' | 'rejected') {
    await fetch(`/api/v1/approvals/${id}/resolve`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes: '' }),
    });
    load();
  }

  // SSE
  useEffect(() => {
    if (tab !== 'aprobaciones') return;
    const activeMission = missions.find(m => m.status === 'active');
    if (!activeMission) return;
    const slug = activeMission.mission_id;
    if (evtRef.current) evtRef.current.close();
    const es = new EventSource(`/api/mission/${slug}/sse`);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        const line = `[${new Date().toLocaleTimeString()}] ${d.type ?? 'event'}: ${JSON.stringify(d.payload ?? d).slice(0, 120)}`;
        setCommsLog(prev => [...prev.slice(-199), line]);
      } catch {}
    };
    evtRef.current = es;
    return () => es.close();
  }, [tab, missions]);

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
                  <TacticalNetwork missions={missions} locoState={locoState} />
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
                        { label: 'Activas', value: missions.filter(m => m.status === 'active').length, color: '#22C55E' },
                        { label: 'Pendientes', value: approvals.filter(a => a.status === 'pending').length, color: '#F59E0B' },
                        { label: 'Soldados', value: 10, color: '#FFD700' },
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
                {SOLDIERS.map(s => (
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
                            : s.medals.map(m => <Ribbon key={m} code={m} size="md" />)
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
                Historias, perfiles psicológicos, doctrinas de empleo y skills. Click para expandir.
              </p>
              {SOLDIERS.map(s => (
                <LegajoCard key={s.id} s={s} />
              ))}
            </div>
          )}

          {/* ──── SALÓN DE LA FAMA ──── */}
          {tab === 'salon' && (
            <div>
              <HallOfFame />
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
                    const stColor = m.status === 'active' ? '#22C55E' : m.status === 'completed' ? '#4169E1' : '#888';
                    return (
                      <div key={m.id} style={{
                        background: '#0d0d0d', border: `1px solid #222`,
                        borderLeft: `4px solid ${priColor}`,
                        borderRadius: '0 10px 10px 0', padding: '20px 24px',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 18 }}>
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
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {m.status === 'active' && (
                              <button onClick={() => advanceMission(m.id)} style={{
                                background: '#22C55E', color: '#000', border: 'none',
                                borderRadius: 7, padding: '10px 18px', cursor: 'pointer',
                                fontFamily: 'var(--font-head)', fontSize: 14, fontWeight: 800, letterSpacing: 1,
                              }}>▶ ADVANCE RAMBO</button>
                            )}
                            <button
                              onClick={() => copyOrchestratorCmd(m.mission_id)}
                              title={`bun run bope:orchestrator --mission ${m.mission_id} --base-url http://localhost:3000`}
                              style={{
                                background: copiedId === m.mission_id ? '#22C55E' : '#1a1a1a',
                                color: copiedId === m.mission_id ? '#000' : '#FFD700',
                                border: `1px solid ${copiedId === m.mission_id ? '#22C55E' : '#FFD70050'}`,
                                borderRadius: 7, padding: '10px 14px', cursor: 'pointer',
                                fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1,
                                transition: 'all 0.2s',
                              }}
                            >{copiedId === m.mission_id ? '✓ COPIED' : '⎘ ORCHESTRATOR CMD'}</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              ) : approvals.filter(a => a.status === 'pending').length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: 60, color: '#444',
                  fontSize: 16, fontStyle: 'italic', border: '1px dashed #222', borderRadius: 12,
                }}>Sin aprobaciones pendientes. Batallón en espera.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {approvals.filter(a => a.status === 'pending').map(a => {
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
