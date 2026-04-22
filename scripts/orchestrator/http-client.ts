/**
 * BOPE Orchestrator — HTTP client
 * Publishes events to POST /api/v1/missions/:id/events (bope_messages).
 */

import type { EventPayload } from './types.ts';

export class BopeHttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly missionId: string,
  ) {}

  async postEvent(event: EventPayload): Promise<void> {
    const url = `${this.baseUrl}/api/v1/missions/${this.missionId}/events`;
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
    } catch (err) {
      throw new Error(
        `[BOPE] Cannot reach backend at ${url}. ` +
          `Make sure the Next.js server is running. Original error: ${String(err)}`,
      );
    }

    if (!res.ok) {
      let detail = '';
      try {
        const body = await res.json();
        detail = JSON.stringify(body);
      } catch {
        detail = await res.text().catch(() => '(response body is not JSON)');
      }
      throw new Error(
        `[BOPE] POST ${url} returned HTTP ${res.status}: ${detail}`,
      );
    }
  }

  /** Convenience: publish a REPORT event */
  async report(opts: {
    from: string;
    to: string;
    summary: string;
    status?: EventPayload['status'];
    taskId?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    await this.postEvent({
      from_agent: opts.from,
      to_agent: opts.to,
      direction: 'UP',
      kind: 'REPORT',
      priority: 'P1',
      summary: opts.summary,
      status: opts.status,
      task_id: opts.taskId,
      payload: opts.payload ?? {},
      evidence: {},
      requires_approval: false,
    });
  }

  /** Convenience: publish an ORDER event */
  async order(opts: {
    from: string;
    to: string;
    summary: string;
    taskId?: string;
    payload?: Record<string, unknown>;
  }): Promise<void> {
    await this.postEvent({
      from_agent: opts.from,
      to_agent: opts.to,
      direction: 'DOWN',
      kind: 'ORDER',
      priority: 'P1',
      summary: opts.summary,
      task_id: opts.taskId,
      payload: opts.payload ?? {},
      evidence: {},
      requires_approval: false,
    });
  }
}
