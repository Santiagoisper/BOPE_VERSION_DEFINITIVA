import type { RouterId } from '../types';

export type DecideNextAgentReason =
  | 'commander-input'
  | 'agent-review'
  | 'auto-triggered'
  | 'performance-analyze'
  | 'architecture-design'
  | 'quality-refactor';

export const DEFAULT_AGENT: RouterId = 'CODEX';

export function decideNextAgent(
  reason: string,
  from: RouterId,
  to: RouterId | undefined,
): RouterId {
  if (reason === 'commander-input' && from === 'COMMANDER') {
    if (to === 'CC') {
      return 'CODEX';
    }

    if (to === 'CODEX') {
      return 'CC';
    }

    if (!to) {
      return DEFAULT_AGENT;
    }
  }

  if (reason === 'agent-review') {
    if (from === 'CC' && to === 'CODEX') {
      return 'COMMANDER';
    }

    if (from === 'CODEX' && to === 'CC') {
      return 'COMMANDER';
    }
  }

  if (reason === 'auto-triggered') {
    return 'COMMANDER';
  }

  if (reason === 'performance-analyze') {
    return 'COMMANDER';
  }

  if (reason === 'architecture-design' && to === 'GEMINI') {
    return 'COMMANDER';
  }

  if (reason === 'quality-refactor' && to === 'DEEPSEEK') {
    return 'COMMANDER';
  }

  return 'COMMANDER';
}
