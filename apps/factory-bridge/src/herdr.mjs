import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runBinary(file, args, { timeoutMs = 120000, cwd } = {}) {
  const { stdout, stderr } = await execFileAsync(file, args, {
    cwd,
    timeout: timeoutMs,
    windowsHide: true,
    maxBuffer: 4 * 1024 * 1024,
    encoding: 'utf8',
    shell: false
  });
  return { stdout: stdout.trim(), stderr: stderr.trim() };
}

export async function herdr(args, policy) {
  const bin = process.env.FACTORY_BRIDGE_HERDR_BIN || 'herdr';
  return runBinary(bin, args, { timeoutMs: policy.commandTimeoutMs });
}

export function parseMaybeJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { text }; }
}
