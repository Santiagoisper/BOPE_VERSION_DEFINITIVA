import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { checkBudget, recordSpend } from "./budget.js";

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

// Pricing — Claude Haiku 4.5
const CLAUDE_PRICING = { inputPerMillion: 3.0, outputPerMillion: 15.0, model: "claude-haiku-4-5" };
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
    // On Windows use 'where', on Unix use 'which'
    const cmd = process.platform === "win32" ? "where" : "which";
    await execFileAsync(cmd, [cliName], { timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

// ─── CLAUDE ───────────────────────────────────────────────────────────────────

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 2048,
  onChunk?: (chunk: string) => void
): Promise<LLMCallResult> {
  // Try CLI first — uses subscription, $0 API cost
  const cliAvailable = await isCliAvailable("claude");
  if (cliAvailable && process.env.BOPE_PREFER_API !== "true") {
    return callClaudeCli(systemPrompt, userMessage, maxTokens, onChunk);
  }
  return callClaudeApi(systemPrompt, userMessage, maxTokens, onChunk);
}

async function callClaudeCli(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  onChunk?: (chunk: string) => void
): Promise<LLMCallResult> {
  const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

  return new Promise((resolve, reject) => {
    const args = ["--print", "--max-tokens", String(maxTokens), fullPrompt];
    const proc = spawn("claude", args, { shell: process.platform === "win32" });
    let output = "";

    proc.stdout.on("data", (data: Buffer) => {
      const chunk = data.toString();
      output += chunk;
      onChunk?.(chunk);
    });

    proc.stderr.on("data", (data: Buffer) => {
      onChunk?.(`[stderr] ${data.toString()}`);
    });

    proc.on("close", (code) => {
      if (code === 0 && output.trim()) {
        const outputTokens = Math.ceil(output.length / 4);
        const inputTokens = Math.ceil(fullPrompt.length / 4);
        resolve({
          content: output.trim(),
          provider: "claude",
          model: "claude-cli-subscription",
          inputTokens,
          outputTokens,
          costUSD: 0, // CLI usa suscripción, no API tokens
          viaCliTool: true,
        });
      } else {
        reject(new Error(`Claude CLI salió con código ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

async function callClaudeApi(
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  onChunk?: (chunk: string) => void
): Promise<LLMCallResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada.");

  const estimatedInput = Math.ceil((systemPrompt.length + userMessage.length) / 4);
  const estimatedCost = estimateCost(estimatedInput, maxTokens, CLAUDE_PRICING);
  await checkBudget(estimatedCost);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_PRICING.model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

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
  const costUSD = estimateCost(inputTokens, outputTokens, CLAUDE_PRICING);

  onChunk?.(content);
  await recordSpend("claude", costUSD, inputTokens + outputTokens);

  return {
    content,
    provider: "claude",
    model: CLAUDE_PRICING.model,
    inputTokens,
    outputTokens,
    costUSD,
    viaCliTool: false,
  };
}

// ─── CODEX ────────────────────────────────────────────────────────────────────

export async function runCodex(
  prompt: string,
  onChunk: (chunk: string) => void
): Promise<LLMCallResult> {
  return new Promise((resolve, reject) => {
    // Codex CLI: codex --quiet "<prompt>"
    const args = ["--quiet", prompt];
    const proc = spawn("codex", args, {
      shell: process.platform === "win32",
      env: { ...process.env },
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
        // Codex CLI usa API tokens de OpenAI — estimamos costo basado en tokens aproximados
        const inputTokens = Math.ceil(prompt.length / 4);
        const outputTokens = Math.ceil(output.length / 4);
        const costUSD = estimateCost(inputTokens, outputTokens, CODEX_PRICING);
        await recordSpend("codex", costUSD, inputTokens + outputTokens).catch(() => {});
        resolve({
          content: output,
          provider: "codex",
          model: CODEX_PRICING.model,
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
      reject(new Error(`No se pudo lanzar Codex CLI: ${err.message}. ¿Está instalado?`));
    });
  });
}
