import crypto from "node:crypto";
import { callClaude, runCodex, type LLMProvider } from "./llm.js";
import { readBudget, getBudgetSummary } from "./budget.js";
import { autoRouteSoldier, getSoldierProfile, selectModel } from "./soldiers.js";
import { detectTools, executeTool, formatToolResults } from "./tools.js";
import { assertProviderAllowed, type ProviderPolicy } from "./providerGuard.js";
import { persistExecution } from "../executions.js";

export type ExecutionProvider = "claude" | "codex" | "auto";

export interface ExecuteInput {
  order: string;
  provider: ExecutionProvider;
  agentId?: string;
  projectPath?: string;
  maxTokens?: number;
  executionId?: string;
  /** Política de gobernanza del provider. El servidor HTTP la envía siempre en `/api/execute`. */
  policy?: ProviderPolicy;
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
  /** Solo presente en eventos completed de modo shadow */
  shadow?: boolean;
  /** Solo presente en eventos completed */
  model?: string;
  /** Solo presente en eventos completed */
  durationMs?: number;
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

/** Expuesto para que el servidor resuelva el provider efectivo y cargue la política correcta antes de ejecutar. */
export { selectProvider as resolveLlmProvider };

export async function execute(
  input: ExecuteInput,
  onEvent: (event: ExecutionEvent) => void
): Promise<ExecuteResult> {
  const executionId = input.executionId ?? crypto.randomUUID();
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

  // ── Step 5: Provider governance check (Req 1.2, 1.3, 1.4, 1.5) ──────────
  // assertProviderAllowed lanza ProviderBlockedError si el provider está bloqueado.
  // Retorna el modo efectivo: "shadow" | "armed".
  // Si no se provee policy, el modo cae a "shadow" por defecto (principio de menor privilegio).
  let effectiveMode: "shadow" | "armed";
  if (input.policy) {
    effectiveMode = assertProviderAllowed(input.policy);
  } else {
    effectiveMode = "shadow";
  }

  // ── Modo shadow: simular sin llamar al LLM (Req 1.4) ─────────────────────
  if (effectiveMode === "shadow") {
    const shadowTimestamp = new Date().toISOString();

    onEvent(
      makeEvent(
        executionId,
        "started",
        "Iniciando ejecución (modo shadow)...",
        { provider }
      )
    );

    const durationMs = Date.now() - startedAt;

    onEvent({
      id: crypto.randomUUID(),
      executionId,
      type: "completed",
      provider,
      message: "Ejecución shadow completada.",
      timestamp: new Date().toISOString(),
      costUSD: 0,
      shadow: true,
      model: "shadow",
      durationMs,
    });

    const shadowOutput = "[shadow] Ejecución simulada. No se enviaron tokens al LLM externo.";

    // Persistir ejecución shadow (Req 4.1, 1.4)
    await persistExecution({
      id: executionId,
      agentId,
      provider,
      model: "shadow",
      order: input.order,
      output: shadowOutput,
      costUSD: 0,
      inputTokens: 0,
      outputTokens: 0,
      durationMs,
      viaCliTool: false,
      status: "shadow",
      timestamp: shadowTimestamp,
    });

    return {
      id: executionId,
      output: shadowOutput,
      provider,
      model: "shadow",
      agentId,
      costUSD: 0,
      inputTokens: 0,
      outputTokens: 0,
      durationMs,
      viaCliTool: false,
    };
  }

  // ── Modo armed: flujo normal (Req 1.5) ────────────────────────────────────
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

  const executionTimestamp = new Date().toISOString();

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
        { provider, costUSD: result.costUSD, model: result.model, durationMs }
      )
    );

    const executeResult: ExecuteResult = {
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

    // Persistir ejecución completada (Req 4.1, 1.8)
    await persistExecution({
      id: executionId,
      agentId,
      provider,
      model: result.model,
      order: input.order,
      output: result.content,
      costUSD: result.costUSD,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      durationMs,
      viaCliTool: result.viaCliTool,
      status: "completed",
      timestamp: executionTimestamp,
    });

    return executeResult;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    onEvent(makeEvent(executionId, "error", `❌ Error: ${message}`, { provider }));

    // Persistir ejecución fallida (Req 4.1)
    const durationMs = Date.now() - startedAt;
    try {
      await persistExecution({
        id: executionId,
        agentId,
        provider,
        model: claudeModel,
        order: input.order,
        output: message,
        costUSD: 0,
        inputTokens: 0,
        outputTokens: 0,
        durationMs,
        viaCliTool: false,
        status: "failed",
        timestamp: executionTimestamp,
      });
    } catch {
      // No propagar errores de persistencia — el error original tiene prioridad
    }

    throw error;
  }
}
