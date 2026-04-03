import { Pool, type PoolClient } from "pg";

const DEFAULT_DATABASE_URL = "postgres://postgres:postgres@127.0.0.1:5432/bope_command_center";

let pool: Pool | null = null;

function getDatabaseUrl(): string {
  return (
    process.env.BOPE_COMMAND_CENTER_DATABASE_URL ??
    process.env.DATABASE_URL ??
    DEFAULT_DATABASE_URL
  );
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
      ssl:
        process.env.BOPE_COMMAND_CENTER_DATABASE_SSL === "true"
          ? { rejectUnauthorized: false }
          : undefined,
    });
  }

  return pool;
}

export async function withClient<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  return withClient(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await callback(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
