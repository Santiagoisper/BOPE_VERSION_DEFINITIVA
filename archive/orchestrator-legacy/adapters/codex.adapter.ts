import { BaseAdapter } from './base';

import type { NormalizedInput, NormalizedOutput } from '../types';

interface CodexResponse {
  output?: Array<{
    content?: Array<{
      text?: string;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export class CodexAdapter extends BaseAdapter {
  readonly agentId = 'CODEX' as const;

  async execute(input: NormalizedInput): Promise<NormalizedOutput> {
    const start = Date.now();

    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('CODEX_TIMEOUT: exceeded 55s limit')), 55000),
    );

    try {
      const result = await Promise.race([this.callCodexAPI(input, start), timeout]);

      this.validateOutput(result);
      return result;
    } catch (error) {
      return this.buildFailureOutput(error, Date.now() - start);
    }
  }

  private async callCodexAPI(
    input: NormalizedInput,
    start: number,
  ): Promise<NormalizedOutput> {
    const history = (input.task.history ?? []).slice(-10);

    const prompt = [
      `Mision: ${input.mission.objective}`,
      `Tarea: ${JSON.stringify(input.task.payload)}`,
      'Historial reciente:',
      ...history.map((h) => `[${h.agent}]: ${h.content}`),
    ].join('\n');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'o4-mini',
        input: prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`CODEX_API_ERROR: ${response.status}`);
    }

    const data = (await response.json()) as CodexResponse;
    const text = data.output?.[0]?.content?.[0]?.text ?? '';
    const usage = data.usage ?? { input_tokens: 0, output_tokens: 0 };

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
