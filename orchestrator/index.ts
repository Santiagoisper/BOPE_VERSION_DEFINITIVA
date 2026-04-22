import { ClaudeAdapter } from './adapters/claude.adapter';
import { CodexAdapter } from './adapters/codex.adapter';
import { decideNextAgent } from './logic/decideNextAgent';

import type { AgentId, NormalizedInput, NormalizedOutput, RouterId } from './types';

export type { NormalizedInput, NormalizedOutput } from './types';

type SupportedAdapter = ClaudeAdapter | CodexAdapter;

const ADAPTERS: Partial<Record<AgentId, SupportedAdapter>> = {
  CLAUDE: new ClaudeAdapter(),
  CODEX: new CodexAdapter(),
  // GEMINI: pendiente Phase 2
};

export interface OrchestratorResult {
  output: NormalizedOutput;
  nextAgent: RouterId;
}

export class Orchestrator {
  /**
   * Ejecuta un agente dado un input normalizado y decide quién sigue.
   * Si el agente no tiene adapter disponible, falla con nextAgent = COMMANDER.
   */
  async run(agentId: AgentId, input: NormalizedInput): Promise<OrchestratorResult> {
    const adapter = ADAPTERS[agentId];

    if (!adapter) {
      const output: NormalizedOutput = {
        reasoning: `ADAPTER_NOT_FOUND: ${agentId} no tiene adaptador disponible en esta fase`,
        status: 'failed',
        nextAgent: 'COMMANDER',
        result: '',
        tokens: { in: 0, out: 0 },
        latencyMs: 0,
      };
      return { output, nextAgent: 'COMMANDER' };
    }

    const output = await adapter.execute(input);
    const nextAgent = decideNextAgent(output.reasoning, agentId, output.nextAgent);

    return { output, nextAgent };
  }

  /**
   * Construye un NormalizedInput a partir de parámetros básicos.
   */
  static buildInput(
    missionSlug: string,
    missionObjective: string,
    taskId: string,
    taskPayload: Record<string, unknown>,
    history: Array<{ agent: RouterId; content: string }> = [],
  ): NormalizedInput {
    return {
      mission: {
        slug: missionSlug,
        objective: missionObjective,
        metadata: {},
      },
      task: {
        id: taskId,
        payload: taskPayload,
        history,
      },
    };
  }
}
