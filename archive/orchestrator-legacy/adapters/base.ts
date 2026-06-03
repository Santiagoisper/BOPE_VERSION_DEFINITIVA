import type { AgentId, NormalizedInput, NormalizedOutput } from '../types';

export abstract class BaseAdapter {
  abstract readonly agentId: AgentId;

  abstract execute(input: NormalizedInput): Promise<NormalizedOutput>;

  protected validateOutput(output: NormalizedOutput): void {
    if (!output.reasoning) {
      throw new Error('ADAPTER_CONTRACT_VIOLATION: missing reasoning');
    }

    if (!output.status) {
      throw new Error('ADAPTER_CONTRACT_VIOLATION: missing status');
    }

    if (!output.nextAgent) {
      throw new Error('ADAPTER_CONTRACT_VIOLATION: missing nextAgent');
    }
  }

  protected buildFailureOutput(
    error: unknown,
    latencyMs: number,
  ): NormalizedOutput {
    return {
      reasoning: error instanceof Error ? error.message : 'Unknown adapter error',
      status: 'failed',
      nextAgent: 'COMMANDER',
      result: '',
      tokens: { in: 0, out: 0 },
      latencyMs,
    };
  }
}
