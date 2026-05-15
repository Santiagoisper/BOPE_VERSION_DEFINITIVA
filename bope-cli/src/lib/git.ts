import { runCommand } from './system.js';

export interface GitContext {
  insideWorkTree: boolean;
  repoRoot?: string;
  branch?: string;
  repoName?: string;
  error?: string;
}

function extractRepoName(repoRoot: string): string {
  const normalized = repoRoot.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  return segments[segments.length - 1] ?? repoRoot;
}

export async function detectGitContext(cwd: string): Promise<GitContext> {
  try {
    const inside = await runCommand('git', ['rev-parse', '--is-inside-work-tree'], cwd);
    if (inside !== 'true') {
      return { insideWorkTree: false, error: 'No estas dentro de un work tree de git.' };
    }

    const repoRoot = await runCommand('git', ['rev-parse', '--show-toplevel'], cwd);
    const branch = await runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD'], cwd);

    return {
      insideWorkTree: true,
      repoRoot,
      branch,
      repoName: extractRepoName(repoRoot)
    };
  } catch (error) {
    return {
      insideWorkTree: false,
      error: error instanceof Error ? error.message : 'No se pudo ejecutar git.'
    };
  }
}
