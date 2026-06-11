import { promises as fs } from "node:fs";
import path from "node:path";
import type { PoolClient } from "pg";
import { withTransaction } from "./db.js";
import { MIGRATIONS_DIR } from "./paths.js";

async function listMigrationFiles(): Promise<string[]> {
  const entries = await fs.readdir(MIGRATIONS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort();
}

async function ensureMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS bope_schema_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

export async function migrateDatabase(): Promise<void> {
  await withTransaction(async (client) => {
    await ensureMigrationsTable(client);
    const files = await listMigrationFiles();

    for (const file of files) {
      const existing = await client.query<{ id: string }>(
        "SELECT id FROM bope_schema_migrations WHERE id = $1",
        [file],
      );
      if (existing.rowCount) {
        continue;
      }

      const sql = await fs.readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      await client.query(sql);
      await client.query(
        "INSERT INTO bope_schema_migrations (id, applied_at) VALUES ($1, now())",
        [file],
      );
    }
  });
}
