import { cwd } from 'node:process';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { runBootstrapCommand } from './bootstrap.js';
import { commandExists } from '../lib/system.js';
import { writePromptTempFile } from '../lib/prompt.js';
import { writeTextFile } from '../lib/fs.js';

export interface ClaudeOptions {
  writeLocalFile: boolean;
}

export async function runClaudeCommand(options: ClaudeOptions): Promise<void> {
  const prompt = await runBootstrapCommand({ writeLocalFile: options.writeLocalFile });
  if (!prompt) {
    return;
  }

  const tempPath = await writePromptTempFile(prompt);
  console.log(`\nCopia temporal guardada en: ${tempPath}`);

  const localCopyPath = join(cwd(), '.bope-bootstrap.txt');
  await writeTextFile(localCopyPath, prompt);
  console.log(`Copia local guardada en: ${localCopyPath}`);

  const claudeCheck = await commandExists('claude');
  if (!claudeCheck.available) {
    console.log('\nNo se detecto `claude` en PATH.');
    console.log('Abri Claude Code manualmente y pega el prompt mostrado arriba.');
    return;
  }

  console.log('\nIntentando abrir Claude Code en el directorio actual...');

  const child = spawn('claude', [], {
    cwd: cwd(),
    stdio: 'inherit',
    windowsHide: false
  });

  child.on('error', (error) => {
    console.error(`No se pudo abrir Claude Code: ${error.message}`);
    console.error('Usa el prompt mostrado y pegalo manualmente en Claude Code.');
  });

  console.log('Si Claude Code no permite inyeccion automatica de prompt, copia y pega el texto mostrado.');
}