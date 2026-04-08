import crypto from "node:crypto";
import { callClaude, runCodex, type LLMProvider } from "./llm.js";
import { readBudget, getBudgetSummary } from "./budget.js";
import { autoRouteSoldier, getSoldierProfile, selectModel } from "./soldiers.js";
import { detectTools, executeTool, formatToolResults } from "./tools.js";

export type ExecutionProvider = "claude" | "codex" | "auto";

export interface ExecuteInput {
  order: string;
  provider: ExecutionProvider;
  agentId?: string;
  projectPath?: string;
  maxTokens?: number;
  executionId?: string;
}

export type ExecutionEventType =
  | "started"
  | "chunk"
  | "completed"
  | "error"
  | "budget_warning";

export interface ExecutionEvent {
  id: string;
  executionId: string;
  type: ExecutionEventType;
  provider?: LLMProvider;
  message: string;
  timestamp: string;
  costUSD?: number;
}

export interface ExecuteResult {
  id: string;
  output: string;
  provider: LLMProvider;
  model: string;
  agentId: string;
  costUSD: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  viaCliTool: boolean;
}

function makeEvent(
  executionId: string,
  type: ExecutionEventType,
  message: string,
  extras?: Partial<ExecutionEvent>
): ExecutionEvent {
  return {
    id: crypto.randomUUID(),
    executionId,
    type,
    message,
    timestamp: new Date().toISOString(),
    ...extras,
  };
}

function selectProvider(
  preference: ExecutionProvider,
  order: string
): LLMProvider {
  if (preference === "claude") return "claude";
  if (preference === "codex") return "codex";

  // auto: heurística simple
  const codeKeywords = ["implementá", "escribí", "construí", "crear", "build", "code", "función", "clase", "component", "api", "endpoint", "refactor"];
  const lowerOrder = order.toLowerCase();
  const isCodeTask = codeKeywords.some((kw) => lowerOrder.includes(kw));
  return isCodeTask ? "codex" : "claude";
}

export async function execute(
  input: ExecuteInput,
  onEvent: (event: ExecutionEvent) => void
): Promise<ExecuteResult> {
  const executionId = crypto.randomUUID();
  const startedAt = Date.now();

  // ── Step 1: Auto-route soldier (ZERO tokens) ─────────────────────────────
  const agentId = input.agentId ?? autoRouteSoldier(input.order);

  // ── Step 2: Load soldier profile (ZERO tokens) ───────────────────────────
  const profile = getSoldierProfile(agentId);

  // ── Step 3: Select model by complexity (ZERO tokens) ─────────────────────
  const claudeModel = selectModel(input.order, agentId);

  // ── Step 4: Detect + execute tools (ZERO tokens) ─────────────────────────
  const detectedTools = detectTools(input.order);
  const toolResults = await Promise.all(detectedTools.map(executeTool));
  const toolContext = formatToolResults(toolResults);

  const provider = selectProvider(input.provider, input.order);

  onEvent(
    makeEvent(
      executionId,
      "started",
      `[${agentId.toUpperCase()}] Ejecutando con ${provider.toUpperCase()} (${claudeModel})...`,
      { provider }
    )
  );

  // ── Budget check ──────────────────────────────────────────────────────────
  const budget = await readBudget();
  const summary = getBudgetSummary(budget);
  if (summary.status !== "ok") {
    onEvent(
      makeEvent(
        executionId,
        "budget_warning",
        `⚠️ Budget ${summary.status.toUpperCase()}: $${summary.annualSpent.toFixed(2)} gastado de $${summary.annualLimit}`,
        { provider }
      )
    );
  }

  try {
    let result;

    // ── Step 7: LLM call (TOKENS HERE) ───────────────────────────────────
    if (provider === "codex") {
      const fullPrompt = input.projectPath
        ? `Contexto del proyecto: ${input.projectPath}\n\n${input.order}${toolContext}`
        : `${input.order}${toolContext}`;

      result = await runCodex(fullPrompt, (chunk) => {
        onEvent(makeEvent(executionId, "chunk", chunk, { provider }));
      });
    } else {
      // Inject tool context into the user message
      const userMessage = toolContext
        ? `${input.order}${toolContext}`
        : input.order;

      result = await callClaude(
        profile.systemPrompt,
        userMessage,
        input.maxTokens ?? 2048,
        (chunk) => {
          onEvent(makeEvent(executionId, "chunk", chunk, { provider }));
        },
        claudeModel
      );
    }

    const durationMs = Date.now() - startedAt;

    onEvent(
      makeEvent(
        executionId,
        "completed",
        `✅ [${agentId.toUpperCase()}] Completado en ${(durationMs / 1000).toFixed(1)}s — Modelo: ${result.model} — Costo: $${result.costUSD.toFixed(4)} — ${result.viaCliTool ? "vía CLI (suscripción)" : "vía API (tokens pagos)"}`,
        { provider, costUSD: result.costUSD }
      )
    );

    return {
      id: executionId,
      output: result.content,
      provider: result.provider,
      model: result.model,
      agentId,
      costUSD: result.costUSD,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs,
      viaCliTool: result.viaCliTool,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    onEvent(makeEvent(executionId, "error", `❌ Error: ${message}`, { provider }));
    throw error;
  }
}
