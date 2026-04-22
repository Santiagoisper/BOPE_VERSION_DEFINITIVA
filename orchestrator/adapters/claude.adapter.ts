import { BaseAdapter } from './base';

import type { NormalizedInput, NormalizedOutput } from '../types';

interface AnthropicTextBlock {
  type: 'text';
  text: string;
}

interface AnthropicResponse {
  content?: AnthropicTextBlock[];
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export class ClaudeAdapter extends BaseAdapter {
  readonly agentId = 'CLAUDE' as const;

  async execute(input: NormalizedInput): Promise<NormalizedOutput> {
    const start = Date.now();

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('CLAUDE_TIMEOUT: exceeded 55s limit')), 55000),
    );

    try {
      const result = await Promise.race([this.callClaudeAPI(input, start), timeout]);

      this.validateOutput(result);
      return result;
    } catch (error) {
      return this.buildFailureOutput(error, Date.now() - start);
    }
  }

  private async callClaudeAPI(
    input: NormalizedInput,
    start: number,
  ): Promise<NormalizedOutput> {
    const history = (input.task.history ?? []).slice(-10);

    const userMessage = [
      `Mision: ${input.mission.objective}`,
      `Tarea: ${JSON.stringify(input.task.payload)}`,
      'Historial reciente:',
      ...history.map((h) => `[${h.agent}]: ${h.content}`),
    ].join('\n');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!response.ok) {
      throw new Error(`CLAUDE_API_ERROR: ${response.status}`);
    }

    const data = (await response.json()) as AnthropicResponse;
    const text = data.content?.[0]?.text ?? '';
    const usage = data.usage ?? {};

    return {
      reasoning: text,
      status: 'completed',
      nextAgent: 'COMMANDER',
      result: text,
      tokens: {
        in: usage.input_tokens ?? 0,
        out: usage.output_tokens ?? 0,
      },
      latencyMs: Date.now() - start,
    };
  }
}
