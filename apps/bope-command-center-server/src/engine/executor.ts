import crypto from "node:crypto";
import { callClaude, runCodex, type LLMProvider } from "./llm.js";
import { readBudget, getBudgetSummary } from "./budget.js";

export type ExecutionProvider = "claude" | "codex" | "auto";

export interface ExecuteInput {
  order: string;
  provider: ExecutionProvider;
  projectPath?: string;
  maxTokens?: number;
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
  costUSD: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  viaCliTool: boolean;
}

const BOPE_SYSTEM_PROMPT = `Eres un agente de desarrollo de software del Batallón BOPE.
Recibes órdenes directas del Comandante y las ejecutas con precisión técnica.
IDIOMA: Siempre español, código en el lenguaje requerido.
DOCTRINA: Código limpio, sin over-engineering. Entregás lo que se pide, nada más.
Si la orden requiere código, entregá código listo para usar.
Si requiere análisis, entregá análisis concreto con recomendaciones accionables.`;

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
  // Codex para tasks de código puro, Claude para todo lo demás
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

  const provider = selectProvider(input.provider, input.order);

  onEvent(
    makeEvent(executionId, "started", `Ejecutando con ${provider.toUpperCase()}...`, {
      provider,
    })
  );

  // Chequeamos budget antes de empezar
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

    if (provider === "codex") {
      // Codex corre como subprocess del CLI — streams todo
      const fullPrompt = input.projectPath
        ? `Contexto del proyecto: ${input.projectPath}\n\n${input.order}`
        : input.order;

      result = await runCodex(fullPrompt, (chunk) => {
        onEvent(makeEvent(executionId, "chunk", chunk, { provider }));
      });
    } else {
      // Claude puede usar CLI (suscripción, $0) o API (tokens pagos)
      result = await callClaude(
        BOPE_SYSTEM_PROMPT,
        input.order,
        input.maxTokens ?? 2048,
        (chunk) => {
          onEvent(makeEvent(executionId, "chunk", chunk, { provider }));
        }
      );
    }

    const durationMs = Date.now() - startedAt;

    onEvent(
      makeEvent(
        executionId,
        "completed",
        `✅ Completado en ${(durationMs / 1000).toFixed(1)}s — Costo: $${result.costUSD.toFixed(4)} — ${result.viaCliTool ? "vía CLI (suscripción)" : "vía API (tokens pagos)"}`,
        { provider, costUSD: result.costUSD }
      )
    );

    return {
      id: executionId,
      output: result.content,
      provider: result.provider,
      model: result.model,
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
