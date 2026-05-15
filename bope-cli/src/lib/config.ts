import { homedir } from 'node:os';
import { join } from 'node:path';
import { pathExists, readTextFile } from './fs.js';

export interface BopeConfig {
  profile: string;
  output: {
    writeBootstrapFileByDefault: boolean;
  };
}

export const BOPE_DIR = join(homedir(), '.bope');
export const BOPE_PROMPTS_DIR = join(BOPE_DIR, 'prompts');
export const BOPE_CONFIG_PATH = join(BOPE_DIR, 'config.json');
export const BOPE_CONSTITUTION_PATH = join(BOPE_DIR, 'constitution.md');

export const DEFAULT_CONFIG: BopeConfig = {
  profile: 'default',
  output: {
    writeBootstrapFileByDefault: false
  }
};

export async function readBopeConfig(): Promise<BopeConfig> {
  const exists = await pathExists(BOPE_CONFIG_PATH);
  if (!exists) {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = await readTextFile(BOPE_CONFIG_PATH);
    const parsed = JSON.parse(raw) as Partial<BopeConfig>;
    return {
      profile: parsed.profile ?? DEFAULT_CONFIG.profile,
      output: {
        writeBootstrapFileByDefault:
          parsed.output?.writeBootstrapFileByDefault ?? DEFAULT_CONFIG.output.writeBootstrapFileByDefault
      }
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}