import { cwd } from 'node:process';
import { join } from 'node:path';
import { BOPE_CONSTITUTION_PATH, BOPE_DIR, BOPE_PROMPTS_DIR, readBopeConfig } from '../lib/config.js';
import { pathExists, readTextFile, writeTextFile } from '../lib/fs.js';
import { detectGitContext } from '../lib/git.js';
import { buildBootstrapPrompt } from '../lib/prompt.js';

export interface BootstrapOptions {
  writeLocalFile: boolean;
  aliasMode?: boolean;
}

export async function runBootstrapCommand(options: BootstrapOptions): Promise<string | null> {
  const workdir = cwd();
  const git = await detectGitContext(workdir);

  if (!git.insideWorkTree || !git.repoRoot || !git.branch || !git.repoName) {
    console.error('BOPE necesita contexto git local para bootstrap.');
    if (git.error) {
      console.error(`Detalle git: ${git.error}`);
    }
    console.error('Entra a un repo y reintenta. Sugerencia: `bope doctor`.');
    return null;
  }

  const bopeExists = await pathExists(BOPE_DIR);
  if (!bopeExists) {
    console.error('No existe ~/.bope. Ejecuta `bope init` primero.');
    return null;
  }

  const constitutionExists = await pathExists(BOPE_CONSTITUTION_PATH);
  const bootstrapPath = join(BOPE_PROMPTS_DIR, 'bootstrap.md');
  const bootstrapExists = await pathExists(bootstrapPath);

  if (!constitutionExists || !bootstrapExists) {
    console.error('Faltan archivos base de BOPE en ~/.bope. Ejecuta `bope init`.');
    return null;
  }

  const [config, constitution, bootstrapPrompt] = await Promise.all([
    readBopeConfig(),
    readTextFile(BOPE_CONSTITUTION_PATH),
    readTextFile(bootstrapPath)
  ]);

  const finalPrompt = buildBootstrapPrompt({
    git,
    cwd: workdir,
    constitution,
    bootstrapPrompt,
    config
  });

  console.log(finalPrompt);

  const shouldWrite = options.writeLocalFile || config.output.writeBootstrapFileByDefault;
  if (shouldWrite) {
    const localPath = join(workdir, '.bope-bootstrap.txt');
    await writeTextFile(localPath, finalPrompt);
    console.log(`\nPrompt guardado en: ${localPath}`);
  }

  if (options.aliasMode) {
    console.log('\nAlias activo: `bope` ejecuta `bope bootstrap`.');
  }

  return finalPrompt;
}