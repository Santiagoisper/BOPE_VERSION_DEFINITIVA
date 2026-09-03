import test from 'node:test';
import assert from 'node:assert/strict';
import { assertAgentAllowed, normalizeRepo, validatePrompt } from '../src/policy.mjs';

const policy = {
  writeEnabled: false,
  agentAllowlist: new Set(['claude-glm']),
  repoRoots: [process.cwd()],
  maxPromptChars: 20,
  maxReadLines: 200,
  killSwitchPath: '',
  commandTimeoutMs: 1000
};

test('agent allowlist blocks unknown targets', () => {
  assert.doesNotThrow(() => assertAgentAllowed(policy, 'claude-glm'));
  assert.throws(() => assertAgentAllowed(policy, 'unknown'), /AGENT_NOT_ALLOWED/);
});

test('prompt limits are enforced', () => {
  assert.equal(validatePrompt(policy, 'hello'), 'hello');
  assert.throws(() => validatePrompt(policy, ''), /PROMPT_REQUIRED/);
  assert.throws(() => validatePrompt(policy, 'x'.repeat(21)), /PROMPT_TOO_LARGE/);
});

test('repo must be under configured roots', () => {
  assert.equal(normalizeRepo(policy, process.cwd()), process.cwd());
});
