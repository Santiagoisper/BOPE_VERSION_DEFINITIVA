import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { BopeConfig } from './config.js';
import { GitContext } from './git.js';
import { writeTextFile } from './fs.js';

export interface PromptInputs {
  git: GitContext;
  cwd: string;
  constitution: string;
  bootstrapPrompt: string;
  config: BopeConfig;
}

export function buildBootstrapPrompt(inputs: PromptInputs): string {
  const { git, cwd, constitution, bootstrapPrompt, config } = inputs;

  return [
    '# BOPE Bootstrap Prompt',
    '',
    `- Repo: ${git.repoName ?? 'desconocido'}`,
    `- Branch: ${git.branch ?? 'desconocida'}`,
    `- Repo root: ${git.repoRoot ?? 'no detectado'}`,
    `- Working dir actual: ${cwd}`,
    `- Perfil BOPE global: ${config.profile}`,
    '',
    '## Reglas Operativas BOPE (obligatorias)',
    '1. JOHN RAMBO es el orquestador principal.',
    '2. Arquitectura centralized-by-default.',
    '3. Minimizar contexto innecesario y enfocarse en evidencia local.',
    '4. Priorizar artefactos concretos y resultados verificables.',
    '5. Leer el repositorio real antes de actuar.',
    '6. No inventar rutas, scripts ni capacidades inexistentes.',
    '7. Antes de editar: resumir estructura relevante y plan corto.',
    '8. Usar presupuesto de inferencia con prudencia.',
    '9. Escalar solo si hay evidencia real de progreso.',
    '',
    '## Constitución Global (~/.bope/constitution.md)',
    constitution.trim(),
    '',
    '## Prompt Base de Arranque (~/.bope/prompts/bootstrap.md)',
    bootstrapPrompt.trim(),
    '',
    '## Instrucción final para Claude Code',
    'Lee primero el repo real (archivos y estructura) antes de proponer cambios. No ejecutes acciones destructivas sin justificar impacto y validar contexto.',
    ''
  ].join('\n');
}

export async function writePromptTempFile(content: string): Promise<string> {
  const path = join(tmpdir(), `bope-bootstrap-${randomUUID()}.txt`);
  await writeTextFile(path, content);
  return path;
}