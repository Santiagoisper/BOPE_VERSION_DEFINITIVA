import { Command } from 'commander';
import { runInitCommand } from './commands/init.js';
import { runDoctorCommand } from './commands/doctor.js';
import { runBootstrapCommand } from './commands/bootstrap.js';
import { runClaudeCommand } from './commands/claude.js';

const program = new Command();

program
  .name('bope')
  .description('CLI BOPE para preparar contexto operativo con Claude Code')
  .version('1.0.0');

program
  .command('init')
  .description('Inicializa configuracion global de BOPE en ~/.bope')
  .option('-f, --force', 'Sobrescribe archivos existentes')
  .action(async (options: { force?: boolean }) => {
    await runInitCommand({ force: Boolean(options.force) });
  });

program
  .command('doctor')
  .description('Diagnostica entorno local y contexto git')
  .action(async () => {
    await runDoctorCommand();
  });

program
  .command('bootstrap')
  .description('Construye prompt BOPE de arranque para Claude Code')
  .option('-w, --write', 'Guarda prompt en .bope-bootstrap.txt en el repo actual')
  .action(async (options: { write?: boolean }) => {
    await runBootstrapCommand({ writeLocalFile: Boolean(options.write) });
  });

program
  .command('claude')
  .description('Prepara prompt BOPE, lo guarda en temporal e intenta abrir Claude Code')
  .option('-w, --write', 'Guarda prompt en .bope-bootstrap.txt en el repo actual')
  .action(async (options: { write?: boolean }) => {
    await runClaudeCommand({ writeLocalFile: Boolean(options.write) });
  });

program.action(async () => {
  await runBootstrapCommand({ writeLocalFile: false, aliasMode: true });
});

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  console.error(`\n[bope] ${message}`);
  process.exit(1);
});