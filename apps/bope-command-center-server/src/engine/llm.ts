import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { checkBudget, recordSpend, withBudgetLock } from "./budget.js";

const execFileAsync = promisify(execFile);

export type LLMProvider = "claude" | "codex";

export interface LLMCallResult {
  content: string;
  provider: LLMProvider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUSD: number;
  viaCliTool: boolean;
}

// Pricing tables per model
const CLAUDE_MODEL_PRICING: Record<string, { inputPerMillion: number; outputPerMillion: number }> = {
  "claude-haiku-4-5-20251001": { inputPerMillion: 0.80, outputPerMillion: 4.00 },
  "claude-sonnet-4-6": { inputPerMillion: 3.00, outputPerMillion: 15.00 },
};
const DEFAULT_CLAUDE_MODEL = "claude-haiku-4-5-20251001";
// Pricing — Codex (gpt-4o-mini as the Codex API backend)
const CODEX_PRICING = { inputPerMillion: 0.15, outputPerMillion: 0.60, model: "gpt-4o-mini" };

function estimateCost(
  inputTokens: number,
  outputTokens: number,
  pricing: { inputPerMillion: number; outputPerMillion: number }
): number {
  return (
    (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion
  );
}

async function isCliAvailable(cliName: string): Promise<boolean> {
  try {
    const cmd = process.platform === "win32" ? "where" : "which";
    await execFileAsync(cmd, [cliName], { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

export interface EngineStatus {
  claude: { mode: "cli" | "api" | "unavailable"; cliAvailable: boolean; apiKeySet: boolean };
  codex: { mode: "cli" | "api" | "unavailable"; cliAvailable: boolean; apiKeySet: boolean };
  preferApi: boolean;
  disableApi: boolean;
}

export async function getEngineStatus(): Promise<EngineStatus> {
  const preferApi = process.env.BOPE_PREFER_API === "true";
  const disableApi = process.env.BOPE_DISABLE_API === "true";
  const [claudeCli, codexCli] = await Promise.all([
    isCliAvailable("claude"),
    isCliAvailable("codex"),
  ]);
  const claudeApiKey = Boolean(process.env.ANTHROPIC_API_KEY);
  const openaiApiKey = Boolean(process.env.OPENAI_API_KEY);

  const claudeMode = !preferApi && claudeCli ? "cli" : !disableApi && claudeApiKey ? "api" : "unavailable";
  const codexMode = !preferApi && codexCli ? "cli" : !disableApi && openaiApiKey ? "api" : "unavailable";

  return {
    claude: { mode: claudeMode, cliAvailable: claudeCli, apiKeySet: claudeApiKey },
    codex: { mode: codexMode, cliAvailable: codexCli, apiKeySet: openaiApiKey },
    preferApi,
    disableApi,
  };
}

// ─── CLAUDE ───────────────────────────────────────────────────────────────────

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048,
  onChunk?: (chunk: string) => void,
  model = DEFAULT_CLAUDE_MODEL
): Promise<LLMCallResult> {
  const preferApi = process.env.BOPE_PREFER_API === "true";
  const disableApi = process.env.BOPE_DISABLE_API === "true";
  const cliAvailable = await isCliAvailable("claude");

  // CLI mode: use subscription exclusively, NO API fallback (avoids unexpected charges)
  if (!preferApi && cliAvailable) {
    return callClaudeCli(systemPrompt, userMessage, maxTokens, onChunk, model);
  }
  if (disableApi) {
    throw new Error("BOPE_DISABLE_API=true: fallback a Claude API bloqueado.");
  }

  // API mode: either BOPE_PREFER_API=true, or CLI not installed (e.g. Railway)
  return callClaudeApi(systemPrompt, userMessage, maxTokens, onChunk, model);
}

async function callClaudeCli(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  onChunk?: (chunk: string) => void,
  model = DEFAULT_CLAUDE_MODEL
): Promise<LLMCallResult> {
  const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

  // Strip CLAUDECODE (nested session detection) and ANTHROPIC_API_KEY
  // so the CLI uses the subscription, not the paid API key
  const STRIP_KEYS = new Set(["CLAUDECODE", "ANTHROPIC_API_KEY"]);
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (!STRIP_KEYS.has(k) && v !== undefined) env[k] = v;
  }

  const LLM_TIMEOUT_MS = 120_000;

  return new Promise((resolve, reject) => {
    const args = ["-p", "--model", model];
    const proc = spawn("claude", args, { shell: process.platform === "win32", env });
    let output = "";
    let stderrOutput = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        proc.kill("SIGTERM");
        reject(new Error("Claude CLI: timeout de 120 segundos excedido."));
      }
    }, LLM_TIMEOUT_MS);

    proc.stdin.write(fullPrompt);
    proc.stdin.end();

    proc.stdout.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      onChunk?.(chunk);
    });

    proc.stderr.on("data", (data: Buffer) => {
      const chunk = data.toString();
      stderrOutput += chunk;
      // Only forward stderr chunks that look like meaningful output, not progress indicators
      if (!chunk.match(/^\s*[\u2800-\u28FF]/)) onChunk?.(`[stderr] ${chunk}`);
    });

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0 && output.trim()) {
        const outputTokens = Math.ceil(output.length / 4);
        const inputTokens = Math.ceil(fullPrompt.length / 4);
        resolve({
          content: output.trim(),
          provider: "claude",
          model: `${model}-cli-subscription`,
          inputTokens,
          outputTokens,
          costUSD: 0,
          viaCliTool: true,
        });
      } else {
        const detail = stderrOutput.trim() || output.trim() || "sin output";
        reject(new Error(`Claude CLI falló (código ${code}): ${detail}`));
      }
    });

    proc.on("error", (err) => {
      if (!settled) { settled = true; clearTimeout(timeout); reject(err); }
    });
  });
}

async function callClaudeApi(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  onChunk?: (chunk: string) => void,
  model = DEFAULT_CLAUDE_MODEL
): Promise<LLMCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada.");

  const pricing = CLAUDE_MODEL_PRICING[model] ?? CLAUDE_MODEL_PRICING[DEFAULT_CLAUDE_MODEL]!;
  const estimatedInput = Math.ceil((systemPrompt.length + userMessage.length) / 4);
  const estimatedCost = estimateCost(estimatedInput, maxTokens, pricing);
  // Serializar check con el lock para prevenir TOCTOU en ejecuciones concurrentes
  await withBudgetLock(() => checkBudget(estimatedCost));

  const abortController = new AbortController();
  const apiTimeout = setTimeout(() => abortController.abort(), 120_000);

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: abortController.signal,
    });
  } finally {
    clearTimeout(apiTimeout);
  }

  if (!response.ok) {
    const err = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(`Claude API error: ${err?.error?.message ?? response.statusText}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  const content = data.content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");

  const { input_tokens: inputTokens, output_tokens: outputTokens } = data.usage;
  const costUSD = estimateCost(inputTokens, outputTokens, pricing);

  onChunk?.(content);
  await recordSpend("claude", costUSD, inputTokens + outputTokens);

  return {
    content,
    provider: "claude",
    model,
    inputTokens,
    outputTokens,
    costUSD,
    viaCliTool: false,
  };
}

// ─── CODEX ────────────────────────────────────────────────────────────────────

/**
 * Tries Codex CLI first. If unavailable or fails, falls back to OpenAI API.
 * Same pattern as Claude: CLI (cheaper/free) → API (paid per token).
 */
export async function runCodex(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<LLMCallResult> {
  const preferApi = process.env.BOPE_PREFER_API === "true";
  const disableApi = process.env.BOPE_DISABLE_API === "true";
  const cliAvailable = await isCliAvailable("codex");

  // CLI mode: use subscription exclusively, NO API fallback
  if (!preferApi && cliAvailable) {
    return runCodexCli(prompt, onChunk);
  }
  if (disableApi) {
    throw new Error("BOPE_DISABLE_API=true: fallback a OpenAI API bloqueado.");
  }

  return runCodexApi(prompt, onChunk);
}

async function runCodexCli(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<LLMCallResult> {
  // Budget check serializado con el lock — misma política que runCodexApi.
  const estimatedInput = Math.ceil(prompt.length / 4);
  const estimatedCost = estimateCost(estimatedInput, 2048, CODEX_PRICING);
  await withBudgetLock(() => checkBudget(estimatedCost));

  return new Promise((resolve, reject) => {
    // Strip OPENAI_API_KEY so Codex CLI uses subscription, not the paid key
    const STRIP_KEYS = new Set(["OPENAI_API_KEY"]);
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) {
      if (!STRIP_KEYS.has(k) && v !== undefined) env[k] = v;
    }
    const args = [prompt];
    const proc = spawn("codex", args, {
      shell: process.platform === "win32",
      env,
    });

    let output = "";

    proc.stdout.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      onChunk(chunk);
    });

    proc.stderr.on("data", (data: Buffer) => {
      onChunk(`[stderr] ${data.toString()}`);
    });

    proc.on("close", async (code) => {
      if (code === 0) {
        const inputTokens = Math.ceil(prompt.length / 4);
        const outputTokens = Math.ceil(output.length / 4);
        const costUSD = estimateCost(inputTokens, outputTokens, CODEX_PRICING);
        await recordSpend("codex", costUSD, inputTokens + outputTokens).catch(() => {});
        resolve({
          content: output,
          provider: "codex",
          model: `${CODEX_PRICING.model}-cli`,
          inputTokens,
          outputTokens,
          costUSD,
          viaCliTool: true,
        });
      } else {
        reject(new Error(`Codex CLI salió con código ${code ?? "desconocido"}`));
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`No se pudo lanzar Codex CLI: ${err.message}`));
    });
  });
}

async function runCodexApi(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<LLMCallResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada y Codex CLI no disponible.");

  const estimatedInput = Math.ceil(prompt.length / 4);
  const estimatedCost = estimateCost(estimatedInput, 2048, CODEX_PRICING);
  // Serializar check con el lock para prevenir TOCTOU en ejecuciones concurrentes
  await withBudgetLock(() => checkBudget(estimatedCost));

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CODEX_PRICING.model,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = (await response.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(`OpenAI API error: ${err?.error?.message ?? response.statusText}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
    usage: { prompt_tokens: number; completion_tokens: number };
  };

  const content = data.choices[0]?.message.content ?? "";
  const inputTokens = data.usage.prompt_tokens;
  const outputTokens = data.usage.completion_tokens;
  const costUSD = estimateCost(inputTokens, outputTokens, CODEX_PRICING);

  onChunk(content);
  await recordSpend("codex", costUSD, inputTokens + outputTokens);

  return {
    content,
    provider: "codex",
    model: CODEX_PRICING.model,
    inputTokens,
    outputTokens,
    costUSD,
    viaCliTool: false,
  };
}
