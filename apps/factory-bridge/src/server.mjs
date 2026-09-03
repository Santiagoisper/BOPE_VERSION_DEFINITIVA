import readline from 'node:readline';
import os from 'node:os';
import { runBinary, herdr, parseMaybeJson } from './herdr.mjs';
import {
  loadPolicy,
  isKilled,
  assertWriteAllowed,
  assertAgentAllowed,
  normalizeRepo,
  validatePrompt,
  promptAudit
} from './policy.mjs';
import { EventLedger } from './ledger.mjs';

const VERSION = '0.1.0';
const policy = loadPolicy();
const ledger = new EventLedger();

const tools = [
  tool('factory_health', 'Read bridge, host, policy and Herdr health. Read-only.', {}, true),
  tool('factory_agents', 'List agents currently visible to Herdr. Read-only.', {}, true),
  tool('factory_agent_status', 'Read one allowlisted Herdr agent status.', {
    type: 'object', properties: { target: { type: 'string' } }, required: ['target'], additionalProperties: false
  }, true),
  tool('factory_agent_read', 'Read recent terminal output from one allowlisted agent.', {
    type: 'object', properties: { target: { type: 'string' }, lines: { type: 'integer', minimum: 1, maximum: 200 } }, required: ['target'], additionalProperties: false
  }, true),
  tool('factory_git_status', 'Read git status for an allowlisted repository root.', {
    type: 'object', properties: { repo: { type: 'string' } }, required: ['repo'], additionalProperties: false
  }, true),
  tool('factory_worktrees', 'List git worktrees for an allowlisted repository.', {
    type: 'object', properties: { repo: { type: 'string' } }, required: ['repo'], additionalProperties: false
  }, true),
  tool('factory_events', 'Read recent Factory Bridge audit events.', {
    type: 'object', properties: { limit: { type: 'integer', minimum: 1, maximum: 100 } }, additionalProperties: false
  }, true),
  tool('factory_agent_prompt', 'Send a prompt to an existing allowlisted Herdr agent. Write-gated, audited and kill-switch protected.', {
    type: 'object',
    properties: {
      target: { type: 'string' },
      text: { type: 'string' },
      wait: { type: 'boolean' },
      timeout_ms: { type: 'integer', minimum: 3000, maximum: 300000 }
    },
    required: ['target', 'text'],
    additionalProperties: false
  }, false)
];

function tool(name, description, inputSchema, readOnly) {
  const schema = inputSchema.type ? inputSchema : { type: 'object', properties: {}, additionalProperties: false };
  return {
    name,
    title: name.replaceAll('_', ' '),
    description,
    inputSchema: schema,
    annotations: {
      readOnlyHint: readOnly,
      destructiveHint: false,
      idempotentHint: readOnly,
      openWorldHint: false
    }
  };
}

async function callTool(name, args = {}) {
  const start = Date.now();
  const mode = name === 'factory_agent_prompt' ? 'write' : 'read';
  let auditArgs = args;
  try {
    let data;
    switch (name) {
      case 'factory_health': {
        let herdrState;
        try {
          const r = await herdr(['agent', 'list'], policy);
          herdrState = { ok: true, output: parseMaybeJson(r.stdout) };
        } catch (error) {
          herdrState = { ok: false, error: error instanceof Error ? error.message : String(error) };
        }
        data = {
          ok: herdrState.ok,
          bridge: { name: 'factory-bridge', version: VERSION, pid: process.pid },
          host: { hostname: os.hostname(), platform: process.platform, node: process.version },
          policy: {
            writeEnabled: policy.writeEnabled,
            killed: isKilled(policy),
            allowedAgents: [...policy.agentAllowlist],
            repoRootsConfigured: policy.repoRoots.length
          },
          herdr: herdrState
        };
        break;
      }
      case 'factory_agents': {
        const r = await herdr(['agent', 'list'], policy);
        data = parseMaybeJson(r.stdout);
        break;
      }
      case 'factory_agent_status': {
        assertAgentAllowed(policy, args.target);
        const r = await herdr(['agent', 'get', args.target], policy);
        data = parseMaybeJson(r.stdout);
        break;
      }
      case 'factory_agent_read': {
        assertAgentAllowed(policy, args.target);
        const lines = Math.max(1, Math.min(Number(args.lines || 80), policy.maxReadLines));
        const r = await herdr(['agent', 'read', args.target, '--source', 'recent-unwrapped', '--lines', String(lines)], policy);
        data = { target: args.target, lines, text: r.stdout };
        break;
      }
      case 'factory_git_status': {
        const repo = normalizeRepo(policy, args.repo);
        const r = await runBinary('git', ['-C', repo, 'status', '--short', '--branch'], { timeoutMs: policy.commandTimeoutMs });
        data = { repo, text: r.stdout };
        break;
      }
      case 'factory_worktrees': {
        const repo = normalizeRepo(policy, args.repo);
        const r = await runBinary('git', ['-C', repo, 'worktree', 'list', '--porcelain'], { timeoutMs: policy.commandTimeoutMs });
        data = { repo, text: r.stdout };
        break;
      }
      case 'factory_events': {
        data = { events: ledger.latest(args.limit || 25) };
        break;
      }
      case 'factory_agent_prompt': {
        assertWriteAllowed(policy);
        assertAgentAllowed(policy, args.target);
        const text = validatePrompt(policy, args.text);
        const wait = args.wait !== false;
        const timeout = Math.max(3000, Math.min(Number(args.timeout_ms || policy.commandTimeoutMs), 300000));
        auditArgs = { target: args.target, wait, timeout_ms: timeout, prompt: promptAudit(text) };
        const command = ['agent', 'prompt', args.target, text];
        if (wait) command.push('--wait', '--timeout', String(timeout));
        const r = await herdr(command, { ...policy, commandTimeoutMs: timeout + 5000 });
        data = { target: args.target, wait, output: parseMaybeJson(r.stdout), stderr: r.stderr || undefined };
        break;
      }
      default:
        throw new Error('UNKNOWN_TOOL');
    }

    const eventId = ledger.record({
      tool: name,
      mode,
      status: 'ok',
      durationMs: Date.now() - start,
      args: auditArgs,
      result: summarizeResult(data)
    });
    return okResult({ event_id: eventId, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const eventId = ledger.record({
      tool: name,
      mode,
      status: 'error',
      durationMs: Date.now() - start,
      args: auditArgs,
      error: message
    });
    return errorResult(`${message} [event ${eventId}]`);
  }
}

function summarizeResult(data) {
  if (data == null) return null;
  const raw = JSON.stringify(data);
  return raw.length <= 3000 ? data : { truncated: true, chars: raw.length };
}

function okResult(data) {
  return {
    content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    structuredContent: data
  };
}

function errorResult(message) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

function send(id, result, error) {
  const message = { jsonrpc: '2.0', id };
  if (error) message.error = error;
  else message.result = result;
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handle(msg) {
  if (!msg || msg.jsonrpc !== '2.0') return;
  const { id, method, params = {} } = msg;

  if (method === 'notifications/initialized' || method === 'notifications/cancelled') return;
  if (id === undefined || id === null) return;

  if (method === 'initialize') {
    send(id, {
      protocolVersion: '2025-11-25',
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'santiago-factory-bridge', version: VERSION },
      instructions: 'Use read-only tools freely. Write tools require FACTORY_BRIDGE_WRITE_ENABLED=true and obey agent allowlists plus kill switch.'
    });
    return;
  }
  if (method === 'ping') {
    send(id, {});
    return;
  }
  if (method === 'tools/list') {
    send(id, { tools });
    return;
  }
  if (method === 'tools/call') {
    const name = params.name;
    const args = params.arguments ?? {};
    send(id, await callTool(name, args));
    return;
  }
  send(id, null, { code: -32601, message: `Method not found: ${method}` });
}

const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
process.stderr.write(`[factory-bridge] ${VERSION} starting; write=${policy.writeEnabled}; killed=${isKilled(policy)}\n`);

for await (const line of rl) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  try {
    await handle(JSON.parse(trimmed));
  } catch (error) {
    process.stderr.write(`[factory-bridge] bad request: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}
