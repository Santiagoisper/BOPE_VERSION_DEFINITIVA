import { cwd } from 'node:process';
import { BOPE_DIR } from '../lib/config.js';
import { pathExists } from '../lib/fs.js';
import { detectGitContext } from '../lib/git.js';
import { commandExists } from '../lib/system.js';

function statusBadge(ok: boolean): string {
  return ok ? 'OK ' : 'ERR';
}

export async function runDoctorCommand(): Promise<void> {
  const workdir = cwd();

  const checks = await Promise.all([
    commandExists('node'),
    commandExists('npm'),
    commandExists('git'),
    commandExists('claude')
  ]);

  const bopeExists = await pathExists(BOPE_DIR);
  const git = await detectGitContext(workdir);
  const gitTool = checks.find((item) => item.command === 'git');

  console.log('=== BOPE Doctor ===');
  console.log(`Directorio actual: ${workdir}`);
  console.log('');
  console.log('Herramientas:');

  for (const check of checks) {
    console.log(`- [${statusBadge(check.available)}] ${check.command}: ${check.detail}`);
  }

  console.log('');
  console.log('Estado BOPE:');
  console.log(`- [${statusBadge(bopeExists)}] ${BOPE_DIR}`);

  console.log('');
  console.log('Estado Git:');
  if (!gitTool?.available) {
    console.log(`- [ERR] git no disponible: ${gitTool?.detail ?? 'No detectado'}`);
  }
  console.log(`- [${statusBadge(git.insideWorkTree)}] Dentro de repo: ${git.insideWorkTree ? 'si' : 'no'}`);

  if (git.insideWorkTree) {
    console.log(`- [OK ] Repo root: ${git.repoRoot}`);
    console.log(`- [OK ] Branch actual: ${git.branch}`);
    console.log(`- [OK ] Repo nombre: ${git.repoName}`);
  } else {
    console.log(`- [ERR] No se pudo detectar repo root ni branch. Motivo: ${git.error ?? 'sin detalle'}`);
  }

  console.log('');
  if (!bopeExists || !git.insideWorkTree) {
    console.log('Sugerencia: ejecuta `bope init` y luego corre `bope` dentro de un repositorio git.');
  } else {
    console.log('Diagnostico completo: entorno listo para bootstrap BOPE.');
  }
}
