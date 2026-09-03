import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

function defaultDbPath() {
  const base = process.env.LOCALAPPDATA || process.env.XDG_STATE_HOME || path.join(process.env.HOME || process.cwd(), '.factory-os');
  return path.join(base, 'SantiagoFactory', 'factory-bridge.db');
}

export class EventLedger {
  constructor(dbPath = process.env.FACTORY_BRIDGE_DB || defaultDbPath()) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS factory_events (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        tool TEXT NOT NULL,
        mode TEXT NOT NULL,
        status TEXT NOT NULL,
        duration_ms INTEGER NOT NULL,
        args_json TEXT NOT NULL,
        result_json TEXT,
        error TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_factory_events_timestamp ON factory_events(timestamp DESC);
    `);
    this.insert = this.db.prepare(`
      INSERT INTO factory_events
      (id, timestamp, tool, mode, status, duration_ms, args_json, result_json, error)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    this.latestStmt = this.db.prepare(`
      SELECT id, timestamp, tool, mode, status, duration_ms, args_json, result_json, error
      FROM factory_events ORDER BY timestamp DESC LIMIT ?
    `);
  }

  record({ tool, mode, status, durationMs, args, result = null, error = null }) {
    const id = `evt_${crypto.randomUUID()}`;
    this.insert.run(
      id,
      new Date().toISOString(),
      tool,
      mode,
      status,
      Math.max(0, Math.round(durationMs || 0)),
      JSON.stringify(args ?? {}),
      result == null ? null : JSON.stringify(result),
      error == null ? null : String(error).slice(0, 4000)
    );
    return id;
  }

  latest(limit = 25) {
    const safe = Math.max(1, Math.min(Number(limit) || 25, 100));
    return this.latestStmt.all(safe).map((row) => ({
      ...row,
      args: safeJson(row.args_json),
      result: safeJson(row.result_json)
    }));
  }
}

function safeJson(value) {
  if (value == null) return null;
  try { return JSON.parse(value); } catch { return value; }
}
