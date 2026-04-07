import { Pool } from 'pg';

import type { AgentId, RouterId } from '../types';

type TaskCompletionStatus = 'completed' | 'failed';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required for missionState operations');
}

const pool = new Pool({ connectionString });

export async function createTask(
  missionSlug: string,
  agentId: RouterId,
  payload: Record<string, any>,
): Promise<string> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const missionResult = await client.query<{ id: string }>(
      'SELECT id FROM missions WHERE slug = $1 LIMIT 1',
      [missionSlug],
    );

    if (missionResult.rowCount === 0) {
      throw new Error(`MISSION_NOT_FOUND: ${missionSlug}`);
    }

    const missionId = missionResult.rows[0].id;

    const taskResult = await client.query<{ id: string }>(
      `
        INSERT INTO tasks (mission_id, current_agent, next_agent, status, payload)
        VALUES ($1, $2, NULL, 'pending', $3::jsonb)
        RETURNING id
      `,
      [missionId, agentId, JSON.stringify(payload)],
    );

    const taskId = taskResult.rows[0].id;

    await client.query(
      `
        INSERT INTO events (mission_id, task_id, type, agent, content)
        VALUES ($1, $2, 'system_log', $3, $4::jsonb)
      `,
      [
        missionId,
        taskId,
        agentId,
        JSON.stringify({ action: 'task_created', taskId }),
      ],
    );

    await client.query('COMMIT');

    return taskId;
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof Error) {
      if (error.message.startsWith('MISSION_NOT_FOUND:')) {
        throw error;
      }

      throw new Error(`CREATE_TASK_FAILED: ${error.message}`);
    }

    throw new Error(`CREATE_TASK_FAILED: ${String(error)}`);
  } finally {
    client.release();
  }
}

export async function completeTask(
  taskId: string,
  result: string,
  status: TaskCompletionStatus,
  nextAgent: RouterId,
): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const taskResult = await client.query<{ current_agent: RouterId; mission_id: string }>(
      `
        UPDATE tasks
        SET
          status = $2,
          result = $3,
          next_agent = $4,
          updated_at = NOW()
        WHERE id = $1
        RETURNING current_agent, mission_id
      `,
      [taskId, status, result, nextAgent],
    );

    if (taskResult.rowCount === 0) {
      throw new Error(`TASK_NOT_FOUND: ${taskId}`);
    }

    const { current_agent: currentAgent, mission_id: missionId } = taskResult.rows[0];

    await client.query(
      `
        INSERT INTO events (mission_id, task_id, type, agent, content)
        VALUES ($1, $2, 'agent_response', $3, $4::jsonb)
      `,
      [
        missionId,
        taskId,
        currentAgent,
        JSON.stringify({ taskId, status, nextAgent }),
      ],
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');

    if (error instanceof Error) {
      if (error.message.startsWith('TASK_NOT_FOUND:')) {
        throw error;
      }

      throw new Error(`COMPLETE_TASK_FAILED: ${error.message}`);
    }

    throw new Error(`COMPLETE_TASK_FAILED: ${String(error)}`);
  } finally {
    client.release();
  }
}

export async function updateReputation(
  agentId: AgentId,
  success: boolean,
  latencyMs: number,
): Promise<void> {
  try {
    const successCount = success ? 1 : 0;
    const failCount = success ? 0 : 1;

    await pool.query(
      `
        INSERT INTO agent_reputation (
          agent_id,
          success_count,
          fail_count,
          avg_latency_ms,
          last_active
        )
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (agent_id) DO UPDATE
        SET
          success_count = agent_reputation.success_count + EXCLUDED.success_count,
          fail_count = agent_reputation.fail_count + EXCLUDED.fail_count,
          avg_latency_ms = (
            (
              agent_reputation.avg_latency_ms
              * (agent_reputation.success_count + agent_reputation.fail_count)
            ) + $4
          ) / (
            agent_reputation.success_count
            + agent_reputation.fail_count
            + EXCLUDED.success_count
            + EXCLUDED.fail_count
          ),
          last_active = NOW()
      `,
      [agentId, successCount, failCount, latencyMs],
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`UPDATE_REPUTATION_FAILED: ${error.message}`);
    }

    throw new Error(`UPDATE_REPUTATION_FAILED: ${String(error)}`);
  }
}
