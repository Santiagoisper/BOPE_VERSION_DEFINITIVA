import type { ModelProvider, ToolConnection } from "../types";

export const MODEL_PROVIDERS: ModelProvider[] = [
  {
    id: "codex",
    name: "OpenAI Codex / GPT-4",
    shortName: "Codex",
    role: "execution",
    isPrimary: true,
    status: "active",
    annualBudget: 1000.00,
    monthlyBudget: 83.33,
    accumulatedCost: 312.40,
    monthlySpend: 47.80,
    requestsThisMonth: 1842,
    tokensThisMonth: 4_280_000,
    description: "Motor principal de ejecución del batallón. Responsable de generación de código, debugging y entrega de artefactos.",
    capabilities: ["Generación de código", "Debugging", "Refactorización", "Testing", "Análisis de código", "Documentación técnica"],
  },
  {
    id: "claude",
    name: "Anthropic Claude",
    shortName: "Claude",
    role: "architecture",
    isPrimary: false,
    status: "active",
    annualBudget: 500.00,
    monthlyBudget: 41.67,
    accumulatedCost: 148.60,
    monthlySpend: 28.30,
    requestsThisMonth: 924,
    tokensThisMonth: 1_860_000,
    description: "Motor de arquitectura, revisión y apoyo estratégico. Especializado en razonamiento complejo, análisis de riesgo y planificación.",
    capabilities: ["Arquitectura de sistemas", "Code review", "Análisis estratégico", "Documentación", "Gestión de riesgo", "Consultoría técnica"],
  },
];

export const TOOL_CONNECTIONS: ToolConnection[] = [
  { id: "github", name: "GitHub", type: "VCS", status: "connected", lastUsed: "2026-04-02T14:30:00Z", usageCount: 482 },
  { id: "vercel", name: "Vercel", type: "Deploy", status: "connected", lastUsed: "2026-04-02T12:00:00Z", usageCount: 145 },
  { id: "postgres", name: "PostgreSQL", type: "Database", status: "connected", lastUsed: "2026-04-02T16:00:00Z", usageCount: 3841 },
  { id: "sentry", name: "Sentry", type: "Monitoring", status: "connected", lastUsed: "2026-04-01T08:00:00Z", usageCount: 78 },
  { id: "stripe", name: "Stripe", type: "Payments", status: "disconnected", usageCount: 0 },
];
