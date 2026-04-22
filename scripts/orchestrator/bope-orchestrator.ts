#!/usr/bin/env bun
/**
 * BOPE Orchestrator CLI
 *
 * Usage:
 *   bun run bope:orchestrator --mission <uuid|M-...> [--base-url <url>] [--repo <path>] [--base-branch <branch>]
 *
 * Examples:
 *   bun scripts/orchestrator/bope-orchestrator.ts --mission M-2026-04-07-00001
 *   bun scripts/orchestrator/bope-orchestrator.ts --mission abc123 --base-url http://localhost:3000 --repo /path/to/repo
 */

import { MissionRunner } from './mission-runner.ts';
import type { OrchestratorOptions } from './types.ts';
import { resolve } from 'node:path';

// ─── Argument parsing ────────────────────────────────────────────────────────

function parseArgs(args: string[]): OrchestratorOptions {
  const opts: Partial<OrchestratorOptions> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--mission':
        opts.mission = args[++i];
        break;
      case '--base-url':
        opts.baseUrl = args[++i];
        break;
      case '--repo':
        opts.repo = args[++i];
        break;
      case '--base-branch':
        opts.baseBranch = args[++i];
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  if (!opts.mission) {
    console.error('[BOPE] Error: --mission <id> is required.');
    printHelp();
    process.exit(1);
  }

  return {
    mission: opts.mission,
    baseUrl: opts.baseUrl ?? process.env.BOPE_BASE_URL ?? 'http://localhost:3000',
    repo: opts.repo ? resolve(opts.repo) : process.cwd(),
    baseBranch: opts.baseBranch ?? process.env.BOPE_BASE_BRANCH ?? 'main',
  };
}

function printHelp(): void {
  console.log(`
BOPE Orchestrator MVP
─────────────────────
Usage:
  bun run bope:orchestrator --mission <uuid|M-...> [options]

Options:
  --mission     <id>    Mission UUID or readable ID (e.g. M-2026-04-07-00001)  [required]
  --base-url    <url>   Next.js backend URL (default: http://localhost:3000)
  --repo        <path>  Repo path where branches will be created (default: cwd)
  --base-branch <name>  Branch to create task branches from (default: main)
  --help                Show this help

Environment variables:
  BOPE_BASE_URL     Override --base-url
  BOPE_BASE_BRANCH  Override --base-branch

Prerequisites:
  • bun (https://bun.sh)
  • git in PATH
  • codex CLI in PATH (https://github.com/openai/codex)
  • claude CLI in PATH (https://docs.anthropic.com/claude/docs/claude-cli)
  • Next.js app running at --base-url
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const opts = parseArgs(args);

  console.log('[BOPE] Orchestrator starting...');
  console.log(`  mission   : ${opts.mission}`);
  console.log(`  base-url  : ${opts.baseUrl}`);
  console.log(`  repo      : ${opts.repo}`);
  console.log(`  base-branch: ${opts.baseBranch}`);
  console.log('');

  const runner = new MissionRunner(opts);

  try {
    await runner.run();
    process.exit(0);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\n[BOPE] Fatal error: ${msg}`);
    process.exit(1);
  }
}

main();
