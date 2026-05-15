import { join } from 'node:path';
import { BOPE_CONFIG_PATH, BOPE_CONSTITUTION_PATH, BOPE_DIR, BOPE_PROMPTS_DIR, DEFAULT_CONFIG } from '../lib/config.js';
import { copyFileSafe, ensureDir, isDirectory, pathExists, readTextFile, writeTextFile } from '../lib/fs.js';

export interface InitOptions {
  force: boolean;
}

async function resolveTemplatePath(fileName: string): Promise<string> {
  const candidatePaths = [
    join(import.meta.dirname, '..', 'templates', fileName),
    join(import.meta.dirname, '..', '..', 'src', 'templates', fileName)
  ];

  for (const candidate of candidatePaths) {
    if (await pathExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(`No se encontro la plantilla ${fileName}. Revisa la instalacion de bope-cli.`);
}

async function writeConfigIfNeeded(force: boolean): Promise<'created' | 'skipped'> {
  const exists = await pathExists(BOPE_CONFIG_PATH);
  if (exists && !force) {
    return 'skipped';
  }

  await writeTextFile(BOPE_CONFIG_PATH, `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`);
  return 'created';
}

export async function runInitCommand(options: InitOptions): Promise<void> {
  const bopeExists = await pathExists(BOPE_DIR);
  if (bopeExists && !(await isDirectory(BOPE_DIR))) {
    throw new Error(`La ruta ${BOPE_DIR} existe pero no es una carpeta.`);
  }

  await ensureDir(BOPE_DIR);
  await ensureDir(BOPE_PROMPTS_DIR);

  const results: Array<{ file: string; status: 'created' | 'skipped' }> = [];
  results.push({ file: BOPE_CONFIG_PATH, status: await writeConfigIfNeeded(options.force) });

  const constitutionSource = await resolveTemplatePath('constitution.md');
  const bootstrapSource = await resolveTemplatePath('bootstrap.md');
  const ramboSource = await resolveTemplatePath('rambo.md');
  const missionImplementSource = await resolveTemplatePath('mission-implement.md');
  const missionCloseSource = await resolveTemplatePath('mission-close.md');

  results.push({ file: BOPE_CONSTITUTION_PATH, status: await copyFileSafe(constitutionSource, BOPE_CONSTITUTION_PATH, options.force) });
  results.push({ file: join(BOPE_PROMPTS_DIR, 'bootstrap.md'), status: await copyFileSafe(bootstrapSource, join(BOPE_PROMPTS_DIR, 'bootstrap.md'), options.force) });
  results.push({ file: join(BOPE_PROMPTS_DIR, 'rambo.md'), status: await copyFileSafe(ramboSource, join(BOPE_PROMPTS_DIR, 'rambo.md'), options.force) });
  results.push({ file: join(BOPE_PROMPTS_DIR, 'mission-implement.md'), status: await copyFileSafe(missionImplementSource, join(BOPE_PROMPTS_DIR, 'mission-implement.md'), options.force) });
  results.push({ file: join(BOPE_PROMPTS_DIR, 'mission-close.md'), status: await copyFileSafe(missionCloseSource, join(BOPE_PROMPTS_DIR, 'mission-close.md'), options.force) });

  console.log('BOPE init completado:\n');
  for (const entry of results) {
    const marker = entry.status === 'created' ? 'OK' : 'SKIP';
    console.log(`[${marker}] ${entry.file}`);
  }

  if (!options.force) {
    console.log('\nTip: usa `bope init --force` para sobrescribir plantillas existentes.');
  }

  const bootstrapContent = await readTextFile(join(BOPE_PROMPTS_DIR, 'bootstrap.md'));
  if (!bootstrapContent.trim()) {
    console.log('\nAviso: bootstrap.md quedo vacio, revisalo manualmente.');
  }
}