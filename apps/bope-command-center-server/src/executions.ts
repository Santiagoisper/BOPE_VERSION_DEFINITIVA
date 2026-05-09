import { withClient } from "./db.js";

export interface ExecutionRecord {
  id: string;
  agentId: string;
  provider: "claude" | "codex";
  model: string;
  order: string;
  output: string;
  costUSD: number;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  viaCliTool: boolean;
  status: "completed" | "failed" | "shadow";
  timestamp: string; // ISO 8601, mapeado desde created_at
}

function mapExecution(row: Record<string, unknown>): ExecutionRecord {
  return {
    id: String(row.id),
    agentId: String(row.agent_id),
    provider: row.provider as ExecutionRecord["provider"],
    model: String(row.model),
    order: String(row.order),
    output: String(row.output),
    costUSD: Number(row.cost_usd),
    inputTokens: Number(row.input_tokens),
    outputTokens: Number(row.output_tokens),
    durationMs: Number(row.duration_ms),
    viaCliTool: Boolean(row.via_cli_tool),
    status: row.status as ExecutionRecord["status"],
    timestamp: row.created_at instanceof Date
      ? row.created_at.toISOString()
      : String(row.created_at),
  };
}

/**
 * Persiste un registro de ejecución en la tabla bope_executions.
 * Requirements: 4.1
 */
export async function persistExecution(record: ExecutionRecord): Promise<void> {
  await withClient(async (client) => {
    await client.query(
      `INSERT INTO bope_executions
       (id, agent_id, provider, model, "order", output, cost_usd, input_tokens, output_tokens, duration_ms, via_cli_tool, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (id) DO NOTHING`,
      [
        record.id,
        record.agentId,
        record.provider,
        record.model,
        record.order,
        record.output,
        record.costUSD,
        record.inputTokens,
        record.outputTokens,
        record.durationMs,
        record.viaCliTool,
        record.status,
        record.timestamp,
      ],
    );
  });
}

/**
 * Retorna el historial de ejecuciones paginado, ordenado por created_at DESC.
 * Requirements: 4.2
 */
export async function getExecutions(
  limit: number,
  offset: number,
): Promise<{ rows: ExecutionRecord[]; total: number }> {
  return withClient(async (client) => {
    const countResult = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM bope_executions",
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const rowsResult = await client.query(
      `SELECT id, agent_id, provider, model, "order", output, cost_usd, input_tokens, output_tokens, duration_ms, via_cli_tool, status, created_at
       FROM bope_executions
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    return {
      rows: rowsResult.rows.map(mapExecution),
      total,
    };
  });
}

/**
 * Retorna el detalle completo de una ejecución por su id, o null si no existe.
 * Requirements: 4.3
 */
export async function getExecutionById(id: string): Promise<ExecutionRecord | null> {
  return withClient(async (client) => {
    const result = await client.query(
      `SELECT id, agent_id, provider, model, "order", output, cost_usd, input_tokens, output_tokens, duration_ms, via_cli_tool, status, created_at
       FROM bope_executions
       WHERE id = $1`,
      [id],
    );

    if (!result.rowCount) {
      return null;
    }

    return mapExecution(result.rows[0]);
  });
}
