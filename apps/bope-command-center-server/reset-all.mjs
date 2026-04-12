// Reset completo del War Room — limpia toda la data de Neon
import pg from 'pg';
import { readFileSync } from 'node:fs';
import { unlink } from 'node:fs/promises';
import path from 'node:path';

const pool = new pg.Pool({
  connectionString: process.env.BOPE_COMMAND_CENTER_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const tables = [
  'bope_sessions',
  'bope_audit_logs',
  'bope_mission_events',
  'bope_direct_orders',
  'bope_medals',
  'bope_sanctions',
  'bope_agent_performance',
  'bope_budget_alerts',
  'bope_missions',
  'bope_provider_configs',
  'bope_providers',
  'bope_tools',
  'bope_agents',
  'bope_budget_policy',
  'bope_provider_governance',
  'bope_auth_config',
  'bope_meta',
  'bope_schema_migrations',
];

const client = await pool.connect();
try {
  console.log('🔴 Reseteando War Room...\n');

  for (const table of tables) {
    try {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`  ✓ Dropped ${table}`);
    } catch (e) {
      console.log(`  ✗ ${table}: ${e.message}`);
    }
  }

  // Borrar budget.json local
  const budgetFile = path.resolve(process.cwd(), 'data/budget.json');
  try {
    await unlink(budgetFile);
    console.log('\n  ✓ Deleted data/budget.json');
  } catch {
    console.log('\n  ℹ No budget.json encontrado (ok)');
  }

  console.log('\n✅ Reset completo. El server va a re-inicializar con el próximo arranque.');
} finally {
  client.release();
  await pool.end();
}
