/**
 * BOPE Orchestrator — Codex CLI engine adapter
 * Spawns `codex` CLI in the given working directory and returns stdout.
 */

import { spawn } from 'node:child_process';

export interface EngineRunOptions {
  instructions: string;
  workingDir: string;
  /** Called with each chunk of stdout/stderr for live logging */
  onLog?: (line: string) => void;
  /** Timeout in milliseconds (default: 10 minutes) */
  timeoutMs?: number;
}

export interface EngineResult {
  stdout: string;
  exitCode: number;
}

/**
 * Run Codex CLI non-interactively.
 * Codex CLI is invoked as: codex --approval-mode full-auto -q "<instructions>"
 */
export async function runCodex(opts: EngineRunOptions): Promise<EngineResult> {
  return runCli(
    'codex',
    ['--approval-mode', 'full-auto', '-q', opts.instructions],
    opts,
  );
}

/**
 * Run Claude Code CLI non-interactively.
 * Claude CLI is invoked as: claude -p "<instructions>"
 */
export async function runClaude(opts: EngineRunOptions): Promise<EngineResult> {
  return runCli('claude', ['-p', opts.instructions], opts);
}

function runCli(
  cmd: string,
  args: string[],
  opts: EngineRunOptions,
): Promise<EngineResult> {
  return new Promise((resolve, reject) => {
    const timeout = opts.timeoutMs ?? 10 * 60 * 1000;
    let stdout = '';
    let timedOut = false;

    const child = spawn(cmd, args, {
      cwd: opts.workingDir,
      shell: false,
      env: process.env,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeout);

    child.stdout.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      stdout += text;
      if (opts.onLog) {
        for (const line of text.split('\n')) {
          if (line.trim()) opts.onLog(line);
        }
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      if (opts.onLog) {
        for (const line of text.split('\n')) {
          if (line.trim()) opts.onLog(`[stderr] ${line}`);
        }
      }
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error(
            `[BOPE] CLI '${cmd}' not found in PATH. Please install it first.`,
          ),
        );
      } else {
        reject(err);
      }
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`[BOPE] '${cmd}' timed out after ${timeout}ms`));
        return;
      }
      resolve({ stdout, exitCode: code ?? 0 });
    });
  });
}
