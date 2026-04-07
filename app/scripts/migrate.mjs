// Migration runner — ejecuta 002_bope_runtime.sql en Neon
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_URL = process.env.DATABASE_URL || process.argv[2];

if (!DB_URL) {
  console.error('Usage: node scripts/migrate.mjs <DATABASE_URL>');
  process.exit(1);
}

const sql = neon(DB_URL);

// Emula tagged template: sql`stmt` === sql(tagArr(stmt))
function tagArr(s) {
  const arr = [s];
  arr.raw = [s];
  return arr;
}

// Parser SQL que respeta bloques $$ ... $$ (PL/pgSQL)
function splitSQL(raw) {
  const stmts = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';

  // Eliminar comentarios de línea (-- ...) pero respetar el resto
  const text = raw
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  let i = 0;
  while (i < text.length) {
    // Detectar inicio/fin de dollar-quote ($$ o $TAG$)
    if (text[i] === '$') {
      let j = i + 1;
      while (j < text.length && text[j] !== '$' && text[j] !== '\n') j++;
      if (j < text.length && text[j] === '$') {
        const tag = text.slice(i, j + 1); // e.g. "$$" or "$BODY$"
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = tag;
          current += tag;
          i = j + 1;
          continue;
        } else if (tag === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
          current += tag;
          i = j + 1;
          continue;
        }
      }
    }

    if (text[i] === ';' && !inDollarQuote) {
      const stmt = current.trim();
      if (stmt.length > 5) stmts.push(stmt);
      current = '';
    } else {
      current += text[i];
    }
    i++;
  }

  const remaining = current.trim();
  if (remaining.length > 5) stmts.push(remaining);

  return stmts;
}

const migFile = join(__dirname, '../db/migrations/002_bope_runtime.sql');
const raw = readFileSync(migFile, 'utf8');
const stmts = splitSQL(raw);

console.log(`[MIGRATE] ${stmts.length} statements a ejecutar en Neon...`);

let ok = 0, skip = 0, errors = 0;

for (const stmt of stmts) {
  const preview = stmt.slice(0, 60).replace(/\s+/g, ' ');
  try {
    await sql(tagArr(stmt));
    ok++;
    console.log(`  ✓ ${preview}...`);
  } catch (e) {
    const msg = e?.message ?? String(e);
    if (
      msg.includes('already exists') ||
      msg.includes('IF NOT EXISTS')
    ) {
      skip++;
      console.log(`  ~ SKIP: ${preview}...`);
    } else {
      errors++;
      console.error(`  ✗ ERROR: ${preview}\n    → ${msg.slice(0, 200)}`);
    }
  }
}

console.log(`\n[MIGRATE] Listo — OK: ${ok}  SKIP: ${skip}  ERRORES: ${errors}`);

// Verificar tablas y objetos creados
const tables = await sql(tagArr(`
  SELECT table_name FROM information_schema.tables
  WHERE table_schema='public' AND table_name LIKE 'bope_%'
  ORDER BY table_name
`));

console.log('\n[TABLAS EN NEON]:');
tables.forEach(t => console.log('  -', t.table_name));

const funcs = await sql(tagArr(`
  SELECT routine_name FROM information_schema.routines
  WHERE routine_schema='public' AND routine_name LIKE 'bope_%'
`));
if (funcs.length > 0) {
  console.log('\n[FUNCIONES]:');
  funcs.forEach(f => console.log('  -', f.routine_name));
}

const seqs = await sql(tagArr(`
  SELECT sequence_name FROM information_schema.sequences
  WHERE sequence_schema='public' AND sequence_name LIKE 'bope_%'
  ORDER BY sequence_name
`));
if (seqs.length > 0) {
  console.log('\n[SECUENCIAS]:');
  seqs.forEach(s => console.log('  -', s.sequence_name));
}
