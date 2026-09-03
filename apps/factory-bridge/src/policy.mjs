import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_AGENTS = [
  'architect',
  'claude-glm',
  'claude-deepseek',
  'codex',
  'claude',
  'hermes-glm'
];

function listEnv(name, fallback = []) {
  const raw = process.env[name];
  if (!raw) return fallback;
  return raw.split(/[;,]/).map((v) => v.trim()).filter(Boolean);
}

export function loadPolicy() {
  return {
    writeEnabled: String(process.env.FACTORY_BRIDGE_WRITE_ENABLED ?? 'false').toLowerCase() === 'true',
    agentAllowlist: new Set(listEnv('FACTORY_BRIDGE_AGENT_ALLOWLIST', DEFAULT_AGENTS)),
    repoRoots: listEnv('FACTORY_BRIDGE_REPO_ROOTS', []),
    maxPromptChars: Number(process.env.FACTORY_BRIDGE_MAX_PROMPT_CHARS ?? 20000),
    maxReadLines: Number(process.env.FACTORY_BRIDGE_MAX_READ_LINES ?? 200),
    killSwitchPath: process.env.FACTORY_BRIDGE_KILL_SWITCH_PATH || '',
    commandTimeoutMs: Number(process.env.FACTORY_BRIDGE_COMMAND_TIMEOUT_MS ?? 120000)
  };
}

export function isKilled(policy) {
  return Boolean(policy.killSwitchPath && fs.existsSync(policy.killSwitchPath));
}

export function assertWriteAllowed(policy) {
  if (!policy.writeEnabled) throw new Error('WRITE_DISABLED');
  if (isKilled(policy)) throw new Error('KILL_SWITCH_ACTIVE');
}

export function assertAgentAllowed(policy, target) {
  if (!target || !policy.agentAllowlist.has(target)) {
    throw new Error(`AGENT_NOT_ALLOWED:${target || '<empty>'}`);
  }
}

export function normalizeRepo(policy, repo) {
  if (!repo) throw new Error('REPO_REQUIRED');
  const candidate = path.resolve(repo);
  if (policy.repoRoots.length === 0) throw new Error('NO_REPO_ROOTS_CONFIGURED');
  const lc = candidate.toLowerCase();
  const allowed = policy.repoRoots.some((root) => {
    const resolved = path.resolve(root).toLowerCase();
    return lc === resolved || lc.startsWith(`${resolved}${path.sep}`);
  });
  if (!allowed) throw new Error('REPO_NOT_ALLOWED');
  return candidate;
}

export function validatePrompt(policy, text) {
  if (typeof text !== 'string' || text.trim().length === 0) throw new Error('PROMPT_REQUIRED');
  if (text.length > policy.maxPromptChars) throw new Error('PROMPT_TOO_LARGE');
  if (/\0/.test(text)) throw new Error('PROMPT_CONTAINS_NUL');
  return text;
}

export function promptAudit(text) {
  return {
    chars: text.length,
    sha256: crypto.createHash('sha256').update(text).digest('hex')
  };
}
