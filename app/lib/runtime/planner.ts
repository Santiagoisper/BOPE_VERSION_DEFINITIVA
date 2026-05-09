import { z } from "zod";
import type { SoldierId } from "@/lib/types";
import { executeWithEngine, defaultModelFor, resolvePreferredChannel } from "./engines";
import type { MissionRuntimeContext, RuntimePlan, RuntimeTaskPlan } from "./types";

const PlannerResponseSchema = z.object({
  assessment: z.string(),
  rationale: z.string(),
  topology: z.enum(["solo", "sequential", "parallel"]),
  max_concurrency: z.number().int().min(1).max(5),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  tasks: z.array(z.object({
    agent: z.enum(["RAMBO", "BLADE", "FORGE", "PIXEL", "NEXUS", "CERBERUS", "HOUSE", "WINSTON", "MARCO", "LOCO"]),
    goal: z.string().min(5),
    engine: z.enum(["claude", "codex"]),
    channel: z.enum(["cli", "api"]).optional(),
    depends_on: z.array(z.string()).default([]),
    allow_lateral_help: z.boolean().default(false),
    help_targets: z.array(z.enum(["RAMBO", "BLADE", "FORGE", "PIXEL", "NEXUS", "CERBERUS", "HOUSE", "WINSTON", "MARCO", "LOCO"])).default([]),
    max_tokens: z.number().int().min(256).max(8192).optional(),
  })).min(1).max(5),
});

const JOHN_SYSTEM = `Eres JOHN RAMBO, orquestador BOPE.
Decides como ejecutar una mision de software con soldados especializados.
Tu trabajo es devolver SOLO JSON valido.
Reglas:
- Puedes elegir engine claude o codex por tarea.
- Prefiere channel cli cuando sea viable; api solo si aporta autonomia o fallback.
- topology puede ser solo, sequential o parallel.
- max_concurrency entre 1 y 5.
- Asigna tareas concretas, sin superposicion innecesaria.
- Usa allow_lateral_help=true solo cuando la colaboracion lateral agregue valor real.
- Solo activa HOUSE para validar, CERBERUS para seguridad, WINSTON para memoria, NEXUS para integracion.
- Si la mision es de implementacion multi-frente, favorece parallel.
- Si hay ambiguedad o poco contexto, crea pocas tareas y deja clara la racional.
Devuelve:
{
  "assessment": "...",
  "rationale": "...",
  "topology": "solo|sequential|parallel",
  "max_concurrency": 1,
  "risk_level": "LOW|MEDIUM|HIGH|CRITICAL",
  "tasks": [
    {
      "agent": "FORGE",
      "goal": "....",
      "engine": "codex",
      "channel": "cli",
      "depends_on": [],
      "allow_lateral_help": false,
      "help_targets": [],
      "max_tokens": 2048
    }
  ]
}`;

function fallbackPlan(context: MissionRuntimeContext): RuntimePlan {
  const text = context.intent.toLowerCase();
  const tasks: RuntimeTaskPlan[] = [];

  const implementationEngine = text.includes("ui") || text.includes("frontend") ? "claude" : "codex";
  const implementationAgent = text.includes("ui") || text.includes("dashboard") ? "PIXEL" : "FORGE";

  tasks.push({
    agent: implementationAgent,
    goal: context.intent,
    engine: implementationEngine,
    channel: "cli",
    depends_on: [],
    allow_lateral_help: true,
    help_targets: implementationAgent === "PIXEL" ? ["NEXUS"] : ["PIXEL"],
    max_tokens: 4096,
  });

  if (text.includes("integr") || text.includes("api") || text.includes("tiempo real")) {
    tasks.push({
      agent: "NEXUS",
      goal: "Asegurar contrato entre runtime, eventos y War Room en vivo.",
      engine: "claude",
      channel: "cli",
      depends_on: [],
      allow_lateral_help: true,
      help_targets: [implementationAgent],
      max_tokens: 3072,
    });
  }

  tasks.push({
    agent: "HOUSE",
    goal: "Validar el flujo principal y detectar riesgos/regresiones del runtime.",
    engine: "claude",
    channel: "cli",
    depends_on: tasks.length > 1 ? [tasks[0].agent, "NEXUS"] : [tasks[0].agent],
    allow_lateral_help: false,
    help_targets: [],
    max_tokens: 2048,
  });

  return {
    assessment: "Mision de implementacion con visibilidad live y coordinacion multiagente.",
    rationale: "Se abre un frente principal de implementacion, soporte de integracion y validacion al cierre.",
    topology: tasks.length > 2 ? "parallel" : "sequential",
    max_concurrency: Math.min(3, tasks.length),
    risk_level: "HIGH",
    tasks,
  };
}

function normalizeDependencies(tasks: RuntimeTaskPlan[]): RuntimeTaskPlan[] {
  return tasks.map((task) => ({
    ...task,
    depends_on: task.depends_on.filter((value) => value && value !== task.agent),
    help_targets: task.help_targets.filter((value) => value !== task.agent),
  }));
}

export async function buildJohnPlan(context: MissionRuntimeContext): Promise<RuntimePlan> {
  const prompt = `Estado actual de la mision:
${JSON.stringify({
  mission: {
    mission_id: context.missionSlug,
    intent: context.intent,
    priority: context.priority,
    status: context.status,
    loco_state: context.loco_state,
    budget_usd: context.budget_usd,
  },
  tasks: context.tasks,
  recent_messages: context.recentMessages.slice(0, 12),
}, null, 2)}

Decide el plan operativo siguiente.`;

  try {
    const plannerChannel = await resolvePreferredChannel("claude");
    const result = await executeWithEngine({
      missionUuid: context.missionUuid,
      agent: "RAMBO",
      engine: "claude",
      channel: plannerChannel,
      model: defaultModelFor("RAMBO", "claude"),
      system: JOHN_SYSTEM,
      prompt,
      maxTokens: 3072,
    });

    const jsonMatch = result.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallbackPlan(context);
    }

    const parsed = PlannerResponseSchema.parse(JSON.parse(jsonMatch[0]));
    const tasks = await Promise.all(parsed.tasks.map(async (task) => ({
      ...task,
      channel: await resolvePreferredChannel(task.engine, task.channel),
    })));

    return {
      assessment: parsed.assessment,
      rationale: parsed.rationale,
      topology: parsed.topology,
      max_concurrency: parsed.max_concurrency,
      risk_level: parsed.risk_level,
      tasks: normalizeDependencies(tasks),
    };
  } catch {
    return fallbackPlan(context);
  }
}
