// ============================================================
// Neon DB — conexión serverless + helpers de query
// DATABASE_URL se valida en runtime, no en build time.
// ============================================================
import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL no configurada — revisar .env.local');
    _sql = neon(url);
  }
  return _sql;
}

// sql es un tagged template que delega al cliente lazy
export const sql: NeonQueryFunction<false, false> = new Proxy(
  ((...args: Parameters<NeonQueryFunction<false, false>>) =>
    getClient()(...args)) as NeonQueryFunction<false, false>,
  {
    get(_, prop) {
      return getClient()[prop as keyof NeonQueryFunction<false, false>];
    },
  }
);

// Helper: generar mission_id legible
export async function nextMissionId(): Promise<string> {
  const rows = await sql`SELECT nextval('bope_mission_seq') AS n`;
  const n = String(rows[0].n).padStart(5, '0');
  const today = new Date().toISOString().slice(0, 10);
  return `M-${today}-${n}`;
}

// Helper: generar task_id legible
export async function nextTaskId(): Promise<string> {
  const rows = await sql`SELECT nextval('bope_task_seq') AS n`;
  const n = String(rows[0].n).padStart(4, '0');
  return `T-${n}`;
}

// Helper: generar approval_id legible
export async function nextApprovalId(): Promise<string> {
  const rows = await sql`SELECT nextval('bope_approval_seq') AS n`;
  const n = String(rows[0].n).padStart(4, '0');
  return `APR-${n}`;
}
