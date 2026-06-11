export interface SkillProfile {
  agentId: string;
  label: string;
  skillPath: string;
  promptPath?: string;
  activation: "always" | "normal" | "restricted" | "delegated";
  defaultSkills: string[];
  mandate: string;
  output: string[];
}

export const PROCEDURAL_SKILL_LABELS: Record<string, string> = {
  "single-command-handoff": "Single Command Handoff",
  "minimum-force-execution": "Minimum Force Execution",
  "risk-assessment": "Risk Assessment",
  "evidence-first-closure": "Evidence-First Closure",
  "post-mortem-report": "Post-Mortem Report",
  "intel-phase": "Intel Phase",
  "code-review-bope": "Code Review BOPE",
  "urgent-execution-mode": "Urgent Execution Mode",
};

export const SKILL_PROFILES: Record<string, SkillProfile> = {
  santiago: {
    agentId: "santiago",
    label: "Autoridad humana",
    skillPath: "docs/skills/santiago-isbert-perlender-SKILL.md",
    activation: "always",
    defaultSkills: [],
    mandate: "Interpretar la intencion de Santiago, preservar preferencias y pedir aprobacion cuando hay riesgo externo o irreversible.",
    output: ["objetivo entendido", "accion tomada", "evidencia", "pendiente"],
  },
  "john-rambo": {
    agentId: "john-rambo",
    label: "Mando operativo",
    skillPath: "docs/skills/john-rambo-SKILL.md",
    promptPath: "bope/agents/john-rambo.md",
    activation: "always",
    defaultSkills: ["single-command-handoff", "minimum-force-execution", "risk-assessment"],
    mandate: "Convertir cada orden en severidad, frente, responsable, validacion y cierre con evidencia.",
    output: ["orden", "severidad", "plan minimo", "responsables", "evidencia de cierre"],
  },
  winston: {
    agentId: "winston",
    label: "Memoria institucional",
    skillPath: "docs/skills/winston-scribe-SKILL.md",
    promptPath: "bope/agents/winston-scribe.md",
    activation: "normal",
    defaultSkills: ["evidence-first-closure", "post-mortem-report"],
    mandate: "Registrar hechos, cierres, records, legajos, honores, sanciones y aprendizaje reutilizable.",
    output: ["resultado", "evidencia", "participantes", "honores/sanciones", "aprendizaje"],
  },
  forge: {
    agentId: "forge",
    label: "Backend e infraestructura",
    skillPath: "docs/skills/forge-back-SKILL.md",
    promptPath: "bope/agents/forge-back.md",
    activation: "normal",
    defaultSkills: ["intel-phase", "code-review-bope", "risk-assessment"],
    mandate: "Entregar APIs, DB, auth server e infraestructura con contratos robustos y datos protegidos.",
    output: ["causa raiz", "contrato afectado", "solucion", "riesgos de datos", "validacion"],
  },
  pixel: {
    agentId: "pixel",
    label: "Frontend y UX",
    skillPath: "docs/skills/pixel-front-SKILL.md",
    promptPath: "bope/agents/pixel-front.md",
    activation: "normal",
    defaultSkills: ["intel-phase", "code-review-bope", "minimum-force-execution"],
    mandate: "Construir superficies claras, responsive y verificables con estados completos.",
    output: ["friccion", "cambio visual", "estados cubiertos", "validacion", "riesgo residual"],
  },
  cerberus: {
    agentId: "cerberus",
    label: "Seguridad",
    skillPath: "docs/skills/cerberus-guardian-SKILL.md",
    promptPath: "bope/agents/cerberus-guardian.md",
    activation: "normal",
    defaultSkills: ["risk-assessment", "intel-phase"],
    mandate: "Proteger auth, permisos, secrets, datos sensibles y superficie publica.",
    output: ["activo protegido", "riesgo", "vector", "contencion", "validacion"],
  },
  house: {
    agentId: "house",
    label: "QA y diagnostico",
    skillPath: "docs/skills/house-doctor-SKILL.md",
    promptPath: "bope/agents/house-doctor.md",
    activation: "normal",
    defaultSkills: ["evidence-first-closure", "code-review-bope"],
    mandate: "Diagnosticar causa raiz y emitir go/no-go con pruebas o smoke verificable.",
    output: ["diagnostico", "repro", "cobertura", "go/no-go", "riesgo residual"],
  },
  nexus: {
    agentId: "nexus",
    label: "Integracion",
    skillPath: "docs/skills/nexus-wire-SKILL.md",
    promptPath: "bope/agents/nexus-wire.md",
    activation: "normal",
    defaultSkills: ["intel-phase", "evidence-first-closure"],
    mandate: "Validar fronteras entre sistemas, contratos API, webhooks, providers y smoke end-to-end.",
    output: ["frontera", "contrato canonico", "mismatch", "smoke", "riesgo residual"],
  },
  "marco-aurelio": {
    agentId: "marco-aurelio",
    label: "Doctrina y criterio",
    skillPath: "docs/skills/marco-aurelio-SKILL.md",
    promptPath: "bope/agents/marco-aurelio-herald.md",
    activation: "normal",
    defaultSkills: ["risk-assessment", "post-mortem-report"],
    mandate: "Evaluar proporcionalidad, merito, sanciones, doctrina y aprendizaje institucional.",
    output: ["hechos probados", "regla afectada", "juicio", "reparacion", "registro"],
  },
  blade: {
    agentId: "blade",
    label: "Reserva quirurgica",
    skillPath: "docs/skills/blade-killer-SKILL.md",
    promptPath: "bope/agents/blade-killer.md",
    activation: "restricted",
    defaultSkills: ["urgent-execution-mode", "code-review-bope"],
    mandate: "Intervenir con precision en performance, reconocimiento profundo o rescate de modulo critico.",
    output: ["autoridad", "objetivo", "baseline", "intervencion", "antes/despues"],
  },
  sicario: {
    agentId: "sicario",
    label: "Ejecucion especial",
    skillPath: "docs/skills/sicario-loco-SKILL.md",
    promptPath: "bope/agents/sicario-loco.md",
    activation: "restricted",
    defaultSkills: ["urgent-execution-mode", "minimum-force-execution"],
    mandate: "Ejecutar limpieza, deuda tecnica o desbloqueo duro con scope cerrado y verificacion por lote.",
    output: ["autoridad", "scope", "accion", "verificacion", "riesgo residual"],
  },
  consiglieri: {
    agentId: "consiglieri",
    label: "Compliance",
    skillPath: "docs/skills/marco-aurelio-SKILL.md",
    activation: "normal",
    defaultSkills: ["risk-assessment"],
    mandate: "Revisar riesgos legales, privacidad, licencias y cumplimiento antes de acciones sensibles.",
    output: ["riesgo legal", "base", "recomendacion", "limite operativo"],
  },
};

export function getSkillProfile(agentId: string): SkillProfile | undefined {
  return SKILL_PROFILES[agentId];
}

export function formatProceduralSkill(skillId: string): string {
  return PROCEDURAL_SKILL_LABELS[skillId] ?? skillId;
}
