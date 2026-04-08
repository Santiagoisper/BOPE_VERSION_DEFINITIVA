import { AGENTS } from "../shared/agents.js";

export interface SoldierProfile {
  id: string;
  systemPrompt: string;
  modelPreference: "haiku" | "sonnet";
}

const DEFAULT_SYSTEM_PROMPT = `Eres un agente de desarrollo de software del Batallón BOPE.
Recibes órdenes directas del Comandante y las ejecutas con precisión técnica.
IDIOMA: Siempre español, código en el lenguaje requerido.
DOCTRINA: Código limpio, sin over-engineering. Entregás lo que se pide, nada más.`;

// Keyword → agentId routing table (evaluated in order, first match wins)
const ROUTING_RULES: Array<{ keywords: string[]; agentId: string }> = [
  {
    keywords: ["ui", "componente", "frontend", "react", "css", "tailwind", "diseño", "interfaz", "html", "jsx", "tsx", "estilos", "layout", "responsive"],
    agentId: "pixel",
  },
  {
    keywords: ["api", "backend", "endpoint", "db", "database", "postgres", "sql", "servidor", "neon", "schema", "tabla", "query", "migration"],
    agentId: "forge",
  },
  {
    keywords: ["bug", "test", "qa", "error", "debug", "falla", "crash", "issue", "problema", "diagnos", "fallo", "roto", "no funciona"],
    agentId: "house",
  },
  {
    keywords: ["deploy", "git", "vercel", "neon", "infra", "ci", "cd", "pipeline", "webhook", "integra", "github", "railway"],
    agentId: "nexus",
  },
  {
    keywords: ["seguridad", "secret", "token", "auth", "vuln", "owasp", "brecha", "permiso", "credencial", "password", "contraseña", "xss", "injection"],
    agentId: "cerberus",
  },
  {
    keywords: ["refactor", "legacy", "migrar", "deuda", "limpia", "elimina", "cleanup", "reorganiza", "reestructura"],
    agentId: "sicario",
  },
];

/**
 * Deterministic keyword-based routing. Zero tokens.
 * Returns agentId based on order content, or "john-rambo" as default.
 */
export function autoRouteSoldier(order: string): string {
  const lower = order.toLowerCase();
  for (const rule of ROUTING_RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return rule.agentId;
    }
  }
  return "john-rambo";
}

/**
 * Returns soldier profile from the AGENTS array. Zero tokens.
 * Falls back to john-rambo if agentId is not found.
 * Throws if the agent is offline or sanctioned.
 */
export function getSoldierProfile(agentId: string): SoldierProfile {
  const agent = AGENTS.find((a) => a.id === agentId) ?? AGENTS.find((a) => a.id === "john-rambo");
  if (!agent) {
    return { id: "john-rambo", systemPrompt: DEFAULT_SYSTEM_PROMPT, modelPreference: "sonnet" };
  }
  if (agent.status === "offline") {
    throw new Error(`Agente ${agent.id.toUpperCase()} está offline y no puede recibir órdenes.`);
  }
  if (agent.status === "sanctioned") {
    throw new Error(`Agente ${agent.id.toUpperCase()} está sancionado y no puede recibir órdenes.`);
  }
  return {
    id: agent.id,
    systemPrompt: agent.systemPrompt ?? DEFAULT_SYSTEM_PROMPT,
    modelPreference: agent.modelPreference ?? "sonnet",
  };
}

// Agents that always use sonnet regardless of order complexity
const SONNET_FORCE = new Set(["john-rambo", "forge", "blade", "sicario"]);
// Agents that default to haiku (formateo, docs, simple checks)
const HAIKU_FORCE = new Set(["winston", "cerberus", "consiglieri"]);

// Keywords that force sonnet selection even for short orders
const SONNET_KEYWORDS = [
  "implementá", "implementa", "crea", "crear", "código", "codigo", "arquitectura",
  "debug", "analiza", "diseñá", "diseña", "construí", "construye",
  "refactor", "migra", "optimiza", "build", "develop", "escribe", "escribí",
];

/**
 * Selects Claude model based on order complexity and agent role. Zero tokens.
 */
export function selectModel(
  order: string,
  agentId: string
): "claude-haiku-4-5-20251001" | "claude-sonnet-4-6" {
  if (SONNET_FORCE.has(agentId)) return "claude-sonnet-4-6";
  if (HAIKU_FORCE.has(agentId)) return "claude-haiku-4-5-20251001";

  const wordCount = order.trim().split(/\s+/).length;
  const lower = order.toLowerCase();
  const hasComplexKeyword = SONNET_KEYWORDS.some((kw) => lower.includes(kw));

  // Haiku: short order AND no complex keywords
  if (wordCount < 50 && !hasComplexKeyword) return "claude-haiku-4-5-20251001";

  return "claude-sonnet-4-6";
}
