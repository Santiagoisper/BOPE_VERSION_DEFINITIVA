import { execFile } from "node:child_process";
import { spawn } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { callClaude, callOpenAI } from "@/lib/adapters/claude";
import type { SoldierId } from "@/lib/types";
import type {
  EngineExecutionInput,
  EngineExecutionResult,
  RuntimeChannel,
  RuntimeEngine,
} from "./types";

const execFileAsync = promisify(execFile);

function commandLookupBin(): string {
  return process.platform === "win32" ? "where" : "which";
}

export async function isCliAvailable(name: "claude" | "codex"): Promise<boolean> {
  try {
    await execFileAsync(commandLookupBin(), [name], { timeout: 1500 });
    return true;
  } catch {
    return false;
  }
}

function stripEnv(keys: string[]): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {};
  const denied = new Set(keys);
  for (const [key, value] of Object.entries(process.env)) {
    if (!denied.has(key) && value !== undefined) {
      env[key] = value;
    }
  }
  return env;
}

function resolveWorkspaceRoot(): string {
  const configured = process.env.BOPE_WORKSPACE_ROOT;
  if (configured) {
    return configured;
  }

  const cwd = process.cwd();
  return path.basename(cwd).toLowerCase() === "app" ? path.resolve(cwd, "..") : cwd;
}

async function runClaudeCli(input: EngineExecutionInput): Promise<EngineExecutionResult> {
  const args = ["-p", "--model", input.model];
  const prompt = `${input.system}\n\n${input.prompt}`;
  const env = stripEnv(["CLAUDECODE", "ANTHROPIC_API_KEY"]);
  const timeoutMs = input.timeoutMs ?? 120_000;

  return new Promise((resolve, reject) => {
    const proc = spawn("claude", args, {
      shell: process.platform === "win32",
      cwd: resolveWorkspaceRoot(),
      env,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill("SIGTERM");
      reject(new Error(`Claude CLI timeout tras ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    proc.stdin.write(prompt);
    proc.stdin.end();

    proc.stdout.on("data", async (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      await input.onChunk?.(chunk);
    });

    proc.stderr.on("data", async (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      if (chunk.trim()) {
        await input.onChunk?.(`[stderr] ${chunk}`);
      }
    });

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0 && stdout.trim()) {
        resolve({
          content: stdout.trim(),
          model: `${input.model}-cli`,
          engine: "claude",
          channel: "cli",
          via: "claude-cli-subscription",
          costUsd: 0,
        });
        return;
      }
      reject(new Error(`Claude CLI fallo (${code ?? "?"}): ${(stderr || stdout).trim() || "sin output"}`));
    });

    proc.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function runCodexCli(input: EngineExecutionInput): Promise<EngineExecutionResult> {
  const env = stripEnv(["OPENAI_API_KEY"]);
  const timeoutMs = input.timeoutMs ?? 120_000;

  return new Promise((resolve, reject) => {
    const proc = spawn("codex", [input.prompt], {
      shell: process.platform === "win32",
      cwd: resolveWorkspaceRoot(),
      env,
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      proc.kill("SIGTERM");
      reject(new Error(`Codex CLI timeout tras ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    proc.stdout.on("data", async (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      await input.onChunk?.(chunk);
    });

    proc.stderr.on("data", async (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      if (chunk.trim()) {
        await input.onChunk?.(`[stderr] ${chunk}`);
      }
    });

    proc.on("close", (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (code === 0 && stdout.trim()) {
        resolve({
          content: stdout.trim(),
          model: `${input.model}-cli`,
          engine: "codex",
          channel: "cli",
          via: "codex-cli-subscription",
          costUsd: 0,
        });
        return;
      }
      reject(new Error(`Codex CLI fallo (${code ?? "?"}): ${(stderr || stdout).trim() || "sin output"}`));
    });

    proc.on("error", (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(error);
    });
  });
}

async function runClaudeApi(input: EngineExecutionInput): Promise<EngineExecutionResult> {
  const result = await callClaude({
    mission_id: input.missionUuid,
    task_id: input.taskUuid,
    agent: input.agent,
    model: input.model,
    system: input.system,
    max_tokens: input.maxTokens,
    messages: [{ role: "user", content: input.prompt }],
  });

  await input.onChunk?.(result.content);

  return {
    content: result.content,
    model: result.model,
    engine: "claude",
    channel: "api",
    via: "anthropic-api",
    costUsd: result.cost.cost_total_usd,
  };
}

async function runOpenAIApi(input: EngineExecutionInput): Promise<EngineExecutionResult> {
  const result = await callOpenAI({
    mission_id: input.missionUuid,
    task_id: input.taskUuid,
    agent: input.agent,
    model: input.model,
    max_tokens: input.maxTokens,
    messages: [
      { role: "system", content: input.system },
      { role: "user", content: input.prompt },
    ],
  });

  await input.onChunk?.(result.content);

  return {
    content: result.content,
    model: result.model,
    engine: "codex",
    channel: "api",
    via: "openai-api",
    costUsd: result.cost.cost_total_usd,
  };
}

export async function resolvePreferredChannel(
  engine: RuntimeEngine,
  preferred?: RuntimeChannel,
): Promise<RuntimeChannel> {
  const cliOk = await isCliAvailable(engine === "claude" ? "claude" : "codex");

  if (preferred) {
    if (preferred === "cli") {
      return cliOk ? "cli" : "api";
    }
    return "api";
  }

  return cliOk ? "cli" : "api";
}

export async function executeWithEngine(input: EngineExecutionInput): Promise<EngineExecutionResult> {
  if (input.engine === "claude") {
    if (input.channel === "cli") {
      try {
        return await runClaudeCli(input);
      } catch (error) {
        await input.onChunk?.(`[runtime] Claude CLI falló, intento fallback API: ${error instanceof Error ? error.message : String(error)}`);
        return runClaudeApi({ ...input, channel: "api" });
      }
    }
    return runClaudeApi(input);
  }

  if (input.channel === "cli") {
    try {
      return await runCodexCli(input);
    } catch (error) {
      await input.onChunk?.(`[runtime] Codex CLI falló, intento fallback API: ${error instanceof Error ? error.message : String(error)}`);
      return runOpenAIApi({ ...input, channel: "api" });
    }
  }
  return runOpenAIApi(input);
}

export function defaultModelFor(agent: SoldierId, engine: RuntimeEngine): string {
  const claudeMap: Partial<Record<SoldierId, string>> = {
    RAMBO: "claude-sonnet-4-6",
    WINSTON: "claude-haiku-4-5-20251001",
    MARCO: "claude-haiku-4-5-20251001",
    HOUSE: "claude-sonnet-4-6",
    CERBERUS: "claude-sonnet-4-6",
    NEXUS: "claude-haiku-4-5-20251001",
    PIXEL: "claude-haiku-4-5-20251001",
    FORGE: "claude-sonnet-4-6",
    BLADE: "claude-sonnet-4-6",
    LOCO: "claude-sonnet-4-6",
  };

  const codexMap: Partial<Record<SoldierId, string>> = {
    RAMBO: "gpt-4o-mini",
    WINSTON: "gpt-4o-mini",
    MARCO: "gpt-4o-mini",
    HOUSE: "gpt-4o-mini",
    CERBERUS: "gpt-4o-mini",
    NEXUS: "gpt-4o-mini",
    PIXEL: "gpt-4o-mini",
    FORGE: "gpt-4o-mini",
    BLADE: "gpt-4o",
    LOCO: "gpt-4o",
  };

  return engine === "claude" ? claudeMap[agent] ?? "claude-sonnet-4-6" : codexMap[agent] ?? "gpt-4o-mini";
}
