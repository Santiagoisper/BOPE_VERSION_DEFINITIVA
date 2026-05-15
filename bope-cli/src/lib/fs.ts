import { access, copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { dirname } from 'node:path';

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export async function readTextFile(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

export async function writeTextFile(path: string, content: string): Promise<void> {
  await ensureDir(dirname(path));
  await writeFile(path, content, 'utf8');
}

export async function copyFileSafe(from: string, to: string, force: boolean): Promise<'created' | 'skipped'> {
  const exists = await pathExists(to);
  if (exists && !force) {
    return 'skipped';
  }
  await ensureDir(dirname(to));
  await copyFile(from, to);
  return exists ? 'created' : 'created';
}

export async function isDirectory(path: string): Promise<boolean> {
  try {
    const details = await stat(path);
    return details.isDirectory();
  } catch {
    return false;
  }
}