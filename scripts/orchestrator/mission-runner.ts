/**
 * BOPE Orchestrator — MissionRunner
 *
 * Flow:
 *  1. Fetch mission from backend.
 *  2. Publish REPORT "orchestrator started".
 *  3. Ask JOHN (Codex CLI) to produce a PlanV1 JSON.
 *  4. Parse plan robustly (tolerate stdout noise).
 *  5. For each task: create branch, run engine, commit, publish events.
 *  6. Controlled parallelism via `plan.parallelism` (default 2).
 *  7. On error: publish REPORT with error summary.
 */

import { spawnSync } from 'node:child_process';
import { BopeHttpClient } from './http-client.ts';
import { runCodex, runClaude } from './engines/cli-runner.ts';
import type { OrchestratorOptions, PlanV1, PlanTask } from './types.ts';

const JOHN = 'JOHN';
const COMMANDER = 'COMMANDER';

/** Prompt sent to JOHN to produce the plan */
function buildPlanPrompt(mission: Record<string, unknown>): string {
  return [
    'You are JOHN, the BOPE mission planner. Your job is to produce a strict JSON execution plan.',
    '',
    `Mission objective: ${mission.intent ?? mission.objective ?? JSON.stringify(mission)}`,
    `Mission ID: ${mission.mission_id ?? mission.id}`,
    '',
    'Respond with ONLY a valid JSON object matching this exact schema (no prose, no markdown, no explanation):',
    '',
    '{',
    '  "parallelism": <number, how many tasks to run in parallel, min 1>,',
    '  "tasks": [',
    '    {',
    '      "id": "<short-slug, e.g. task-1>",',
    '      "title": "<human readable title>",',
    '      "engine": "<codex|claude>",',
    '      "agent": "<optional agent name>",',
    '      "instructions": "<full instructions for the worker agent>",',
    '      "branch": "<optional override branch name>"',
    '    }',
    '  ],',
    '  "merge": { "strategy": "john-integrates", "base": "main" }',
    '}',
    '',
    'Rules:',
    '- Decompose the objective into concrete, independently executable tasks.',
    '- Choose engine=codex for implementation/refactoring tasks, engine=claude for research/planning/review.',
    '- Set parallelism based on task independence (max 4).',
    '- Each task\'s instructions must be self-contained.',
    '- Output ONLY the JSON object. No text before or after.',
  ].join('\n');
}

/** Extract the first valid JSON object from noisy stdout */
export function extractFirstJson(text: string): Record<string, unknown> | null {
  // Try full text first
  try {
    return JSON.parse(text.trim()) as Record<string, unknown>;
  } catch {
    // fall through
  }

  // Find the first { ... } block, respecting string boundaries
  const start = text.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (ch === '\\' && inString) {
      escape = true;
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        try {
          return JSON.parse(candidate) as Record<string, unknown>;
        } catch {
          // Try again from the next '{' after start
          const next = text.indexOf('{', start + 1);
          if (next === -1) return null;
          return extractFirstJson(text.slice(next));
        }
      }
    }
  }
  return null;
}

/** Run git command in given directory, throw on failure */
function git(args: string[], cwd: string): string {
  const result = spawnSync('git', args, { cwd, encoding: 'utf-8' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `[git ${args.join(' ')}] exit ${result.status}: ${result.stderr}`,
    );
  }
  return result.stdout.trim();
}

/** Check whether there are uncommitted changes in the working directory */
function hasChanges(cwd: string): boolean {
  const result = spawnSync('git', ['status', '--porcelain'], {
    cwd,
    encoding: 'utf-8',
  });
  return (result.stdout ?? '').trim().length > 0;
}

export class MissionRunner {
  private readonly client: BopeHttpClient;

  constructor(private readonly opts: OrchestratorOptions) {
    this.client = new BopeHttpClient(opts.baseUrl, opts.mission);
  }

  async run(): Promise<void> {
    // 1. Fetch mission
    console.log(`[BOPE] Fetching mission: ${this.opts.mission}`);
    const mission = await this.fetchMission();

    // 2. Publish "orchestrator started"
    await this.client.report({
      from: JOHN,
      to: COMMANDER,
      summary: `Orchestrator started for mission ${mission.mission_id ?? mission.id}. Calling JOHN to plan.`,
      status: 'IN_PROGRESS',
    });

    // 3. Run JOHN to produce plan
    console.log('[BOPE] Asking JOHN (Codex CLI) for plan...');
    const prompt = buildPlanPrompt(mission);

    let plan: PlanV1;
    try {
      plan = await this.runJohn(prompt, mission);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await this.client.report({
        from: JOHN,
        to: COMMANDER,
        summary: `Planning failed: ${msg}`,
        status: 'BLOCKED',
      });
      throw err;
    }

    console.log(
      `[BOPE] Plan received: ${plan.tasks.length} task(s), parallelism=${plan.parallelism ?? 2}`,
    );
    await this.client.report({
      from: JOHN,
      to: COMMANDER,
      summary: `Plan ready: ${plan.tasks.length} task(s) · parallelism ${plan.parallelism ?? 2}`,
      status: 'IN_PROGRESS',
      payload: { plan },
    });

    // 4. Execute tasks with controlled parallelism
    const parallelism = Math.max(1, plan.parallelism ?? 2);
    await this.executeTasks(plan.tasks, parallelism, mission);

    await this.client.report({
      from: JOHN,
      to: COMMANDER,
      summary: `All ${plan.tasks.length} task(s) processed. Orchestrator done.`,
      status: 'COMPLETED',
    });

    console.log('[BOPE] Mission orchestration complete.');
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private async fetchMission(): Promise<Record<string, unknown>> {
    const url = `${this.opts.baseUrl}/api/v1/missions/${this.opts.mission}`;
    let res: Response;
    try {
      res = await fetch(url);
    } catch (err) {
      throw new Error(
        `[BOPE] Cannot reach backend at ${url}. ` +
          `Start Next.js with 'pnpm --dir app dev' first. Error: ${String(err)}`,
      );
    }
    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(
          `[BOPE] Mission '${this.opts.mission}' not found in the database.`,
        );
      }
      throw new Error(`[BOPE] GET ${url} returned HTTP ${res.status}`);
    }
    const body = (await res.json()) as { ok: boolean; data?: { mission?: Record<string, unknown> } };
    if (!body.ok || !body.data?.mission) {
      throw new Error(`[BOPE] Unexpected response from ${url}: ${JSON.stringify(body)}`);
    }
    return body.data.mission;
  }

  private async runJohn(
    prompt: string,
    mission: Record<string, unknown>,
  ): Promise<PlanV1> {
    let stdout = '';

    try {
      const result = await runCodex({
        instructions: prompt,
        workingDir: this.opts.repo,
        onLog: (line) => {
          console.log(`  [JOHN] ${line}`);
        },
        timeoutMs: 5 * 60 * 1000,
      });
      stdout = result.stdout;
    } catch (err) {
      // If Codex CLI is not installed, fall back to a minimal 1-task plan.
      // Check ENOENT (binary not found) directly, which is cross-platform and consistent.
      const isNotFound =
        (err as NodeJS.ErrnoException).code === 'ENOENT' ||
        (err instanceof Error && err.message.includes('not found in PATH'));
      if (isNotFound) {
        console.warn('[BOPE] Codex CLI not in PATH — generating fallback 1-task plan.');
        return this.buildFallbackPlan(mission);
      }
      throw err;
    }

    const parsed = extractFirstJson(stdout);
    if (!parsed) {
      console.warn(
        '[BOPE] JOHN output did not contain a valid JSON object. stdout:\n',
        stdout.slice(0, 2000),
      );
      console.warn('[BOPE] Using fallback single-task plan.');
      return this.buildFallbackPlan(mission);
    }

    // Validate minimal shape
    const plan = parsed as unknown as PlanV1;
    if (!Array.isArray(plan.tasks) || plan.tasks.length === 0) {
      console.warn('[BOPE] Plan has no tasks. Using fallback single-task plan.');
      return this.buildFallbackPlan(mission);
    }

    return plan;
  }

  /** Fallback plan when JOHN cannot produce JSON */
  private buildFallbackPlan(mission: Record<string, unknown>): PlanV1 {
    return {
      parallelism: 1,
      tasks: [
        {
          id: 'task-1',
          title: 'Execute mission objective',
          engine: 'codex',
          instructions: String(mission.intent ?? mission.objective ?? 'Complete the mission'),
          branch: undefined,
        },
      ],
      merge: { strategy: 'john-integrates', base: this.opts.baseBranch },
    };
  }

  private async executeTasks(
    tasks: PlanTask[],
    parallelism: number,
    mission: Record<string, unknown>,
  ): Promise<void> {
    const missionId = String(mission.mission_id ?? mission.id ?? this.opts.mission);

    // Execute tasks in chunks of `parallelism`
    for (let i = 0; i < tasks.length; i += parallelism) {
      const chunk = tasks.slice(i, i + parallelism);
      await Promise.all(
        chunk.map((task) => this.executeTask(task, missionId)),
      );
    }
  }

  private async executeTask(task: PlanTask, missionId: string): Promise<void> {
    const branchName =
      task.branch ??
      `mission/${missionId.replace(/[^a-zA-Z0-9._-]/g, '-')}/${task.id}`;

    console.log(`[BOPE] Task '${task.id}': creating branch '${branchName}'...`);

    // Publish ORDER event
    await this.client.order({
      from: JOHN,
      to: task.agent ?? task.engine.toUpperCase(),
      summary: `Starting task '${task.title}' on branch '${branchName}'`,
      taskId: undefined,
      payload: { taskId: task.id, branch: branchName, engine: task.engine },
    });

    try {
      // Create branch from base
      git(['checkout', this.opts.baseBranch], this.opts.repo);
      git(['pull', '--ff-only'], this.opts.repo);
      // Create or reset the task branch
      try {
        git(['checkout', '-b', branchName], this.opts.repo);
      } catch {
        // Branch already exists — reset it
        git(['checkout', branchName], this.opts.repo);
        git(['reset', '--hard', this.opts.baseBranch], this.opts.repo);
      }

      // Run the chosen engine
      const logs: string[] = [];
      const runner = task.engine === 'claude' ? runClaude : runCodex;
      const result = await runner({
        instructions: task.instructions,
        workingDir: this.opts.repo,
        onLog: (line) => {
          logs.push(line);
          console.log(`  [${task.id}/${task.engine}] ${line}`);
        },
        timeoutMs: 10 * 60 * 1000,
      });

      // Commit if there are changes
      let committed = false;
      if (hasChanges(this.opts.repo)) {
        git(['add', '-A'], this.opts.repo);
        git(
          [
            'commit',
            '-m',
            `bope(${missionId}/${task.id}): ${task.title}`,
          ],
          this.opts.repo,
        );
        committed = true;
        console.log(`[BOPE] Task '${task.id}': committed changes on '${branchName}'.`);
      } else {
        console.log(`[BOPE] Task '${task.id}': no changes to commit.`);
      }

      // Return to base branch
      git(['checkout', this.opts.baseBranch], this.opts.repo);

      await this.client.report({
        from: task.agent ?? task.engine.toUpperCase(),
        to: JOHN,
        summary: `Task '${task.title}' completed (exit ${result.exitCode})${committed ? ` · committed on ${branchName}` : ' · no changes'}`,
        status: result.exitCode === 0 ? 'COMPLETED' : 'BLOCKED',
        payload: {
          taskId: task.id,
          branch: branchName,
          exitCode: result.exitCode,
          committed,
          logSample: logs.slice(-10).join('\n'),
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[BOPE] Task '${task.id}' failed: ${msg}`);

      // Try to return to base branch
      try {
        git(['checkout', this.opts.baseBranch], this.opts.repo);
      } catch {
        // best effort
      }

      await this.client.report({
        from: task.agent ?? task.engine.toUpperCase(),
        to: JOHN,
        summary: `Task '${task.title}' failed: ${msg}`,
        status: 'BLOCKED',
        payload: { taskId: task.id, branch: branchName, error: msg },
      });
    }
  }
}
