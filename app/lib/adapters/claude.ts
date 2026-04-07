// ============================================================
// Claude Adapter — Anthropic SDK con cost tracking exacto
// ============================================================
import Anthropic from '@anthropic-ai/sdk';
import { sql } from '../db';
import { calculateCost, billingMonth } from '../config';
import type { SoldierId, BopeProvider } from '../types';

let _client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!_client) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY no configurada — revisar .env.local');
    _client = new Anthropic({ apiKey: key });
  }
  return _client;
}

export interface ClaudeCallOptions {
  mission_id:  string;
  task_id?:    string;
  agent:       SoldierId;
  model?:      string;
  system?:     string;
  messages:    Anthropic.MessageParam[];
  max_tokens?: number;
  // Prompt caching — pasar bloques con cache_control cuando aplique
  use_cache?:  boolean;
}

export interface ClaudeCallResult {
  content:   string;
  cost:      {
    tokens_input:         number;
    tokens_output:        number;
    tokens_cache_write:   number;
    tokens_cache_read:    number;
    cost_input_usd:       number;
    cost_output_usd:      number;
    cost_cache_write_usd: number;
    cost_cache_read_usd:  number;
    cost_total_usd:       number;
  };
  stop_reason: string;
  model:       string;
}

export async function callClaude(opts: ClaudeCallOptions): Promise<ClaudeCallResult> {
  const model = opts.model ?? 'claude-sonnet-4-6';
  const max_tokens = opts.max_tokens ?? 4096;

  const response = await getClient().messages.create({
    model,
    max_tokens,
    system: opts.system,
    messages: opts.messages,
  });

  // ── Extraer tokens ────────────────────────────────────────
  const usage = response.usage;
  const tokens_input       = usage.input_tokens  ?? 0;
  const tokens_output      = usage.output_tokens ?? 0;
  // cache_creation_input_tokens y cache_read_input_tokens son campos extendidos
  const tokens_cache_write = ((usage as unknown) as Record<string, number>).cache_creation_input_tokens ?? 0;
  const tokens_cache_read  = ((usage as unknown) as Record<string, number>).cache_read_input_tokens     ?? 0;

  // ── Calcular costo exacto ────────────────────────────────
  const cost = calculateCost('anthropic', model, {
    input:       tokens_input,
    output:      tokens_output,
    cache_write: tokens_cache_write,
    cache_read:  tokens_cache_read,
  });

  // ── Persistir en bope_costs ──────────────────────────────
  await sql`
    INSERT INTO bope_costs (
      mission_id, task_id, agent, provider, model,
      tokens_input, tokens_output, tokens_cache_write, tokens_cache_read,
      cost_input_usd, cost_output_usd, cost_cache_write_usd, cost_cache_read_usd,
      cost_total_usd, billing_month
    ) VALUES (
      ${opts.mission_id}::uuid,
      ${opts.task_id ?? null}::uuid,
      ${opts.agent},
      ${'anthropic' as BopeProvider},
      ${model},
      ${tokens_input}, ${tokens_output}, ${tokens_cache_write}, ${tokens_cache_read},
      ${cost.cost_input_usd}, ${cost.cost_output_usd},
      ${cost.cost_cache_write_usd}, ${cost.cost_cache_read_usd},
      ${cost.cost_total_usd},
      ${billingMonth()}
    )
  `;

  // ── Extraer texto de la respuesta ────────────────────────
  const content = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  return {
    content,
    cost: {
      tokens_input, tokens_output, tokens_cache_write, tokens_cache_read,
      ...cost,
    },
    stop_reason: response.stop_reason ?? 'end_turn',
    model,
  };
}

// ── OpenAI adapter — Chat Completions con cost tracking exacto ───

let _openaiClient: { apiKey: string } | null = null;

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY no configurada — revisar .env.local');
  return key;
}

export interface OpenAICallOptions {
  mission_id: string;
  task_id?:   string;
  agent:      SoldierId;
  model?:     string;
  messages:   { role: 'system' | 'user' | 'assistant'; content: string }[];
  max_tokens?: number;
}

export interface OpenAICallResult {
  content:     string;
  cost: {
    tokens_input:         number;
    tokens_output:        number;
    tokens_cache_read:    number;
    cost_input_usd:       number;
    cost_output_usd:      number;
    cost_cache_read_usd:  number;
    cost_total_usd:       number;
  };
  stop_reason: string;
  model:       string;
}

export async function callOpenAI(opts: OpenAICallOptions): Promise<OpenAICallResult> {
  const apiKey    = getOpenAIKey();
  const model     = opts.model ?? 'gpt-4o-mini';
  const max_tokens = opts.max_tokens ?? 4096;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens,
      messages: opts.messages,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`[OpenAI] HTTP ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  const usage  = data.usage ?? {};

  // ── Extraer tokens ────────────────────────────────────────
  const tokens_input      = usage.prompt_tokens            ?? 0;
  const tokens_output     = usage.completion_tokens        ?? 0;
  const tokens_cache_read = usage.prompt_tokens_details?.cached_tokens ?? 0;

  // ── Calcular costo exacto ────────────────────────────────
  const cost = calculateCost('openai', model, {
    input:      tokens_input,
    output:     tokens_output,
    cache_read: tokens_cache_read,
  });

  // ── Persistir en bope_costs ──────────────────────────────
  await sql`
    INSERT INTO bope_costs (
      mission_id, task_id, agent, provider, model,
      tokens_input, tokens_output, tokens_cache_write, tokens_cache_read,
      cost_input_usd, cost_output_usd, cost_cache_write_usd, cost_cache_read_usd,
      cost_total_usd, billing_month
    ) VALUES (
      ${opts.mission_id}::uuid,
      ${opts.task_id ?? null}::uuid,
      ${opts.agent},
      ${'openai' as BopeProvider},
      ${model},
      ${tokens_input}, ${tokens_output}, ${0}, ${tokens_cache_read},
      ${cost.cost_input_usd}, ${cost.cost_output_usd},
      ${0}, ${cost.cost_cache_read_usd},
      ${cost.cost_total_usd},
      ${billingMonth()}
    )
  `;

  const content = choice?.message?.content ?? '';

  return {
    content,
    cost: {
      tokens_input,
      tokens_output,
      tokens_cache_read,
      cost_input_usd:      cost.cost_input_usd,
      cost_output_usd:     cost.cost_output_usd,
      cost_cache_read_usd: cost.cost_cache_read_usd,
      cost_total_usd:      cost.cost_total_usd,
    },
    stop_reason: choice?.finish_reason ?? 'stop',
    model,
  };
}
