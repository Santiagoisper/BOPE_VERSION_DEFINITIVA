/**
 * BOPE CLI — Entrypoint terminal local.
 * Importa solo engine/* — no requiere DB ni servidor HTTP.
 *
 * Modos:
 *   --example   Demo completo simulado, sin LLM (100% offline)
 *   --dry-run   Muestra pipeline completo sin llamar al LLM
 *   (ninguno)   Ejecución armada vía Claude CLI (suscripción, $0)
 */

import "../loadEnv.js";
import { autoRouteSoldier, getSoldierProfile, selectModel } from "../engine/soldiers.js";
import { readBudget, getBudgetSummary } from "../engine/budget.js";
import { getEngineStatus, callClaude } from "../engine/llm.js";

// ── Arg parsing ──────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const FLAG_EXAMPLE = argv.includes("--example") || argv.includes("-e");
const FLAG_DRYRUN  = argv.includes("--dry-run")  || argv.includes("-d");
const FLAG_HELP    = argv.includes("--help")     || argv.includes("-h");
const orderArgs    = argv.filter((a) => !a.startsWith("-"));
const RAW_ORDER    = orderArgs.join(" ").trim();

const EXAMPLE_ORDER =
  "Creá un endpoint REST GET /api/missions/active que retorne las misiones activas " +
  "filtradas por agente, con paginación y ordenamiento por fecha de inicio. " +
  "Incluí validación de parámetros y manejo de errores 400/500.";

// ── Helpers ──────────────────────────────────────────────────────────────────

const W  = 64;
const HL = "═";
const SL = "─";
const hr = (c: string) => c.repeat(W);

function section(title: string): void {
  console.log(`\n  ${title}`);
  console.log("  " + SL.repeat(W - 2));
}

function row(label: string, value: string): void {
  console.log(`  ${label.padEnd(22)}${value}`);
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function usd(n: number): string {
  return n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`;
}

function budgetBadge(status: "ok" | "warning" | "critical"): string {
  if (status === "ok")       return "✅ OK";
  if (status === "warning")  return "⚠️  WARNING";
  return "🔴 CRITICAL";
}

// Keyword table — solo para display (el routing real lo hace soldiers.ts)
const ROUTE_DISPLAY: Record<string, string[]> = {
  pixel:    ["ui", "componente", "frontend", "react", "css", "tailwind", "diseño", "interfaz"],
  forge:    ["api", "backend", "endpoint", "db", "database", "postgres", "sql", "servidor"],
  house:    ["bug", "test", "qa", "error", "debug", "falla", "crash", "problema"],
  nexus:    ["deploy", "git", "vercel", "neon", "infra", "ci", "cd", "pipeline"],
  cerberus: ["seguridad", "secret", "token", "auth", "vuln", "owasp"],
  sicario:  ["refactor", "legacy", "migrar", "deuda", "limpia", "elimina"],
};

function routingReason(order: string, agentId: string): string {
  const lower  = order.toLowerCase();
  const kws    = ROUTE_DISPLAY[agentId] ?? [];
  const matched = kws.filter((k) => lower.includes(k));
  return matched.length > 0
    ? `keywords: ${matched.join(", ")}`
    : "sin keyword → john-rambo (default)";
}

// Output simulado por agente (solo para --example)
function exampleOutput(agentId: string): string {
  const MAP: Record<string, string> = {
    forge: `// src/routes/missions.ts — FORGE

import { Router, type Request, type Response } from "express";

const router = Router();

router.get("/missions/active", async (req: Request, res: Response) => {
  const page    = Math.max(1, Number(req.query["page"]  ?? 1));
  const limit   = Math.min(100, Number(req.query["limit"] ?? 20));
  const agentId = req.query["agentId"] as string | undefined;
  const sort    = ["startedAt", "priority"].includes(req.query["sort"] as string)
    ? (req.query["sort"] as string) : "startedAt";

  const offset = (page - 1) * limit;

  const { rows, rowCount } = await db.query(
    \`SELECT * FROM missions
     WHERE status = 'active'
     \${agentId ? "AND $1 = ANY(assigned_agents)" : ""}
     ORDER BY \${sort} DESC
     LIMIT $\${agentId ? 2 : 1}
     OFFSET $\${agentId ? 3 : 2}\`,
    agentId ? [agentId, limit, offset] : [limit, offset]
  );

  res.json({ data: rows, total: rowCount, page, limit });
});

export default router;

// Registrar en server.ts:
// import missionsRouter from "./routes/missions.js";
// app.use("/api", missionsRouter);`,

    pixel: `// components/MissionList.tsx — PIXEL

export function MissionList({ agentId }: { agentId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["missions", "active", agentId],
    queryFn: () => api.get(\`/missions/active\${agentId ? \`?agentId=\${agentId}\` : ""}\`),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="grid gap-3">
      {data?.data.map((m) => <MissionCard key={m.id} mission={m} />)}
    </div>
  );
}`,

    house: `DIAGNÓSTICO — Root Cause Analysis (HOUSE)

Síntoma:   endpoint /api/missions/active retorna 500 intermitente
Causa:     offset calculado antes de validar page >= 1
           → offset negativo → Postgres: ERROR: OFFSET must not be negative
Evidencia: pg stack trace: logs/server-error-2026-05-15.log:L847
Solución:  page = Math.max(1, Number(page)) antes de calcular offset
Test:      GET /api/missions/active?page=-1 debe retornar HTTP 400`,
  };

  return (
    MAP[agentId] ??
    `[${agentId.toUpperCase()}] Orden procesada correctamente.\n` +
    `Ejecutá sin --example para la respuesta real del agente.`
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  if (FLAG_HELP) {
    console.log(`
BOPE CLI — Terminal local

Uso:
  node dist/scripts/bope-cli.js [opciones] [orden]

Opciones:
  --example, -e    Demo completo simulado (sin LLM, 100% offline)
  --dry-run, -d    Muestra pipeline sin llamar al LLM
  --help, -h       Esta ayuda

Ejemplos:
  pnpm bope:example
  pnpm bope:dev
  node dist/scripts/bope-cli.js "debuguear error 500 en /api/executions"
`);
    return;
  }

  const mode  = FLAG_EXAMPLE ? "EJEMPLO" : FLAG_DRYRUN ? "DRY-RUN" : "ARMADO";
  const order = FLAG_EXAMPLE ? EXAMPLE_ORDER : RAW_ORDER || EXAMPLE_ORDER;

  console.log("\n" + hr(HL));
  console.log("🪖  BOPE CLI — TERMINAL LOCAL");
  console.log(`    Fecha: ${new Date().toISOString().slice(0, 10)}  |  Modo: ${mode}`);
  console.log(hr(HL));

  console.log("\n  ORDEN RECIBIDA:");
  console.log(`  "${order.slice(0, 120)}${order.length > 120 ? "..." : ""}"`);

  // ── 1. CLASIFICACIÓN ─────────────────────────────────────────────────────

  section("1 · CLASIFICACIÓN DE MISIÓN");

  const agentId = autoRouteSoldier(order);

  let profile;
  try {
    profile = getSoldierProfile(agentId);
  } catch (err) {
    console.log(`  ❌ ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }

  const model = selectModel(order, agentId);

  row("Agente:",  agentId.toUpperCase());
  row("Motivo:",  routingReason(order, agentId));
  row("Modelo:",  model);

  // ── 2. ARQUITECTURA ───────────────────────────────────────────────────────

  section("2 · ARQUITECTURA DE EJECUCIÓN");

  const engine    = await getEngineStatus();
  const claudeStr =
    engine.claude.mode === "cli" ? "CLI (suscripción — $0.00)" :
    engine.claude.mode === "api" ? "API (tokens pagos)" :
    "NO DISPONIBLE";

  row("Provider:",   "claude");
  row("Modelo:",     model);
  row("Engine:",     claudeStr);
  row("Max tokens:", "2048");
  row("CLI:",        engine.claude.cliAvailable ? "✅ disponible" : "❌ no encontrado");
  row("API key:",    engine.claude.apiKeySet    ? "✅ configurada" : "— no configurada");

  // ── 3. PRESUPUESTO ────────────────────────────────────────────────────────

  section("3 · PRESUPUESTO");

  const budget  = await readBudget();
  const summary = getBudgetSummary(budget);
  const badge   = budgetBadge(summary.status);

  row("Anual:",       `${usd(summary.annualSpent)} / ${usd(summary.annualLimit)}  ${badge}`);
  row("Mensual:",     `${usd(summary.monthlySpent)} / ${usd(summary.monthlyLimit)}  ${badge}`);
  row("Ejecuciones:", String(summary.executionCount));

  const byProv = Object.entries(summary.byProvider)
    .map(([k, v]) => `${k}: ${usd(v)}`)
    .join("  ") || "—";
  row("Por provider:", byProv);

  // ── 4. ITERACIONES ────────────────────────────────────────────────────────

  section("4 · ITERACIONES");

  const step4Label = FLAG_EXAMPLE
    ? "Generando output de ejemplo (simulado)"
    : FLAG_DRYRUN
    ? "LLM omitido (modo dry-run)"
    : engine.claude.mode !== "unavailable"
    ? `Llamando Claude (${engine.claude.mode.toUpperCase()})`
    : "LLM no disponible — abortando";

  const steps = [
    "Validando presupuesto",
    `Clasificando agente → ${agentId.toUpperCase()}`,
    "Verificando engine",
    step4Label,
  ];

  for (let i = 0; i < steps.length; i++) {
    process.stdout.write(`  [${i + 1}/${steps.length}] ${steps[i]}...`);
    if (FLAG_EXAMPLE) await sleep(60);
    console.log("   ✅");
  }

  // ── 5. DECISIÓN + OUTPUT ──────────────────────────────────────────────────

  section("5 · DECISIÓN FINAL");

  let output: string                  = "";
  let costUSD: number                 = 0;
  let finalModel: string              = model;
  let approved: boolean               = true;
  let rejectReason: string            = "";

  if (FLAG_EXAMPLE) {
    output = exampleOutput(agentId);
  } else if (FLAG_DRYRUN) {
    output = `Pipeline completo. Agente: ${agentId.toUpperCase()} · Modelo: ${model} · Sin LLM (dry-run).`;
  } else if (engine.claude.mode === "unavailable") {
    approved      = false;
    rejectReason  = "Claude CLI no encontrado y BOPE_DISABLE_API=true. " +
                    "Configurá el CLI o una ANTHROPIC_API_KEY en .env";
  } else {
    const result = await callClaude(
      profile.systemPrompt,
      order,
      2048,
      (chunk) => process.stdout.write(chunk),
      model
    ).catch((err: unknown) => {
      approved      = false;
      rejectReason  = err instanceof Error ? err.message : String(err);
      return null;
    });

    if (result) {
      output     = result.content;
      costUSD    = result.costUSD;
      finalModel = result.model;
    }
  }

  row("Status:", approved ? "APROBADO ✅" : "BLOQUEADO ❌");
  row("Agente:", agentId.toUpperCase());
  row("Modelo:", finalModel);
  row("Costo:",  `${usd(costUSD)}${costUSD === 0 && approved ? " (suscripción / simulado)" : ""}`);
  if (!approved) row("Motivo:", rejectReason);

  if (approved && output) {
    section("OUTPUT");
    console.log();
    console.log(output.split("\n").map((l) => `  ${l}`).join("\n"));
    console.log();
  }

  console.log("\n" + hr(HL));
  console.log("  Batallón listo. En espera de órdenes, Comandante.");
  console.log(hr(HL) + "\n");
}

main().catch((err: unknown) => {
  console.error("❌ Error fatal:", err instanceof Error ? err.message : err);
  process.exit(1);
});
