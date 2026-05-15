import { execFile } from 'node:child_process';
import { platform } from 'node:os';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export interface CommandCheck {
  command: string;
  available: boolean;
  detail: string;
}

function resolveExecutable(command: string): string {
  if (platform() === 'win32' && command === 'npm') {
    return 'npm.cmd';
  }
  return command;
}

export async function commandExists(command: string): Promise<CommandCheck> {
  if (platform() === 'win32' && command === 'npm') {
    try {
      const { stdout } = await execFileAsync('where', ['npm'], { windowsHide: true, timeout: 5000 });
      const firstLine = stdout.trim().split('\n')[0] || 'npm encontrado en PATH';
      return {
        command,
        available: true,
        detail: firstLine
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No disponible';
      return {
        command,
        available: false,
        detail: message
      };
    }
  }

  const args = command === 'node' ? ['--version'] : ['--help'];
  const executable = resolveExecutable(command);

  try {
    const { stdout, stderr } = await execFileAsync(executable, args, { windowsHide: true, timeout: 5000 });
    const output = `${stdout}${stderr}`.trim();
    return {
      command,
      available: true,
      detail: output.split('\n')[0] || 'OK'
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No disponible';
    return {
      command,
      available: false,
      detail: message
    };
  }
}

export async function runCommand(command: string, args: string[], cwd?: string): Promise<string> {
  const executable = resolveExecutable(command);
  const result = await execFileAsync(executable, args, {
    windowsHide: true,
    cwd,
    timeout: 10000
  });

  return result.stdout.trim();
}
