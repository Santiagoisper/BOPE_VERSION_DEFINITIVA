import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DATA_DIR } from "./paths.js";

export type MemoryMountId = "workspace" | "obsidianVault" | "cerebro";

export interface MemoryMountStatus {
  id: MemoryMountId;
  label: string;
  path: string | null;
  configured: boolean;
  exists: boolean;
  isDirectory: boolean;
  markdownFiles: number;
  checkedAt: string;
}

export interface MemoryIndexEntry {
  id: string;
  source: MemoryMountId;
  sourceLabel: string;
  absolutePath: string;
  relativePath: string;
  extension: string;
  title: string;
  size: number;
  mtimeMs: number;
  contentHash: string;
  summary: string;
  links: string[];
  indexedAt: string;
}

export interface MemoryIndex {
  version: 1;
  generatedAt: string;
  entries: MemoryIndexEntry[];
  stats: {
    scannedFiles: number;
    indexedFiles: number;
    changedFiles: number;
    removedFiles: number;
    skippedFiles: number;
  };
}

export interface MemoryConflict {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
  files: string[];
}

export interface MemorySyncOptions {
  env?: NodeJS.ProcessEnv;
  indexPath?: string;
}

const MAX_MARKDOWN_SCAN = 500;
const MAX_INDEX_BYTES = 200_000;
const DEFAULT_INDEX_PATH = path.join(DATA_DIR, "memory-index.json");
const ALLOWED_EXTENSIONS = new Set([".md", ".txt", ".json", ".yaml", ".yml", ".canvas"]);
const IGNORED_DIRS = new Set([
  ".git",
  ".vercel",
  ".next",
  "node_modules",
  "dist",
  "build",
  "__pycache__",
]);

function safeReadDir(dir: string): fs.Dirent[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function countMarkdownFiles(rootPath: string): number {
  let count = 0;
  const pending = [rootPath];

  while (pending.length > 0 && count < MAX_MARKDOWN_SCAN) {
    const current = pending.pop();
    if (!current) continue;

    for (const entry of safeReadDir(current)) {
      if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(nextPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
        count += 1;
        if (count >= MAX_MARKDOWN_SCAN) break;
      }
    }
  }

  return count;
}

function inspectMount(id: MemoryMountId, label: string, rawPath: string | undefined): MemoryMountStatus {
  const checkedAt = new Date().toISOString();
  const configured = Boolean(rawPath?.trim());
  const mountPath = configured ? rawPath!.trim() : null;

  if (!mountPath) {
    return {
      id,
      label,
      path: null,
      configured: false,
      exists: false,
      isDirectory: false,
      markdownFiles: 0,
      checkedAt,
    };
  }

  try {
    const stat = fs.statSync(mountPath);
    const isDirectory = stat.isDirectory();
    return {
      id,
      label,
      path: mountPath,
      configured,
      exists: true,
      isDirectory,
      markdownFiles: isDirectory ? countMarkdownFiles(mountPath) : 0,
      checkedAt,
    };
  } catch {
    return {
      id,
      label,
      path: mountPath,
      configured,
      exists: false,
      isDirectory: false,
      markdownFiles: 0,
      checkedAt,
    };
  }
}

export function getMemoryMounts(env: NodeJS.ProcessEnv = process.env): MemoryMountStatus[] {
  return [
    inspectMount("workspace", "BOPE workspace", env.BOPE_WORKSPACE_PATH),
    inspectMount("obsidianVault", "ObsidianVault", env.BOPE_OBSIDIAN_VAULT_PATH),
    inspectMount("cerebro", "Cerebro archive", env.BOPE_CEREBRO_PATH),
  ];
}

export function getMemoryStatus(
  env: NodeJS.ProcessEnv = process.env,
): { mounts: MemoryMountStatus[]; ready: boolean; indexPath: string; indexedFiles: number; generatedAt: string | null } {
  const mounts = getMemoryMounts(env);
  const index = readMemoryIndex();

  return {
    mounts,
    ready: mounts.some((mount) => mount.id === "obsidianVault" && mount.exists && mount.isDirectory),
    indexPath: DEFAULT_INDEX_PATH,
    indexedFiles: index?.entries.length ?? 0,
    generatedAt: index?.generatedAt ?? null,
  };
}

function entryId(source: MemoryMountId, relativePath: string): string {
  return crypto.createHash("sha256").update(`${source}:${relativePath}`).digest("hex").slice(0, 24);
}

function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function extractTitle(relativePath: string, content: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading.slice(0, 120);
  return path.basename(relativePath, path.extname(relativePath)).slice(0, 120);
}

function summarize(content: string): string {
  return content
    .replace(/^---[\s\S]*?---/m, "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 360);
}

function extractLinks(content: string): string[] {
  const links = new Set<string>();
  const wikiLinks = content.matchAll(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g);
  for (const match of wikiLinks) links.add(match[1].trim());
  const markdownLinks = content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g);
  for (const match of markdownLinks) {
    const target = match[1].trim();
    if (!target.startsWith("http")) links.add(target);
  }
  return [...links].slice(0, 30);
}

function walkFiles(rootPath: string): string[] {
  const files: string[] = [];
  const pending = [rootPath];

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current) continue;

    for (const entry of safeReadDir(current)) {
      if (entry.name.startsWith(".") || IGNORED_DIRS.has(entry.name)) continue;
      const nextPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(nextPath);
      } else if (entry.isFile() && ALLOWED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        files.push(nextPath);
      }
    }
  }

  return files;
}

function createEntry(
  mount: MemoryMountStatus,
  absolutePath: string,
  previous?: MemoryIndexEntry,
): { entry: MemoryIndexEntry; changed: boolean; skipped: boolean } {
  const stat = fs.statSync(absolutePath);
  const relativePath = path.relative(mount.path!, absolutePath).replace(/\\/g, "/");
  const extension = path.extname(absolutePath).toLowerCase();

  if (stat.size > MAX_INDEX_BYTES) {
    return {
      entry: previous ?? {
        id: entryId(mount.id, relativePath),
        source: mount.id,
        sourceLabel: mount.label,
        absolutePath,
        relativePath,
        extension,
        title: path.basename(relativePath, extension),
        size: stat.size,
        mtimeMs: stat.mtimeMs,
        contentHash: "",
        summary: "",
        links: [],
        indexedAt: new Date().toISOString(),
      },
      changed: false,
      skipped: true,
    };
  }

  if (previous && previous.mtimeMs === stat.mtimeMs && previous.size === stat.size) {
    return { entry: previous, changed: false, skipped: false };
  }

  const content = fs.readFileSync(absolutePath, "utf-8");
  const entry: MemoryIndexEntry = {
    id: entryId(mount.id, relativePath),
    source: mount.id,
    sourceLabel: mount.label,
    absolutePath,
    relativePath,
    extension,
    title: extractTitle(relativePath, content),
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    contentHash: hashContent(content),
    summary: summarize(content),
    links: extractLinks(content),
    indexedAt: new Date().toISOString(),
  };

  return { entry, changed: previous?.contentHash !== entry.contentHash, skipped: false };
}

export function readMemoryIndex(indexPath: string = DEFAULT_INDEX_PATH): MemoryIndex | null {
  try {
    return JSON.parse(fs.readFileSync(indexPath, "utf-8")) as MemoryIndex;
  } catch {
    return null;
  }
}

export function syncMemoryIndex(options: MemorySyncOptions = {}): MemoryIndex {
  const indexPath = options.indexPath ?? DEFAULT_INDEX_PATH;
  const previous = readMemoryIndex(indexPath);
  const previousByKey = new Map(
    (previous?.entries ?? []).map((entry) => [`${entry.source}:${entry.relativePath}`, entry]),
  );

  const mounts = getMemoryMounts(options.env ?? process.env).filter((mount) => mount.exists && mount.isDirectory && mount.path);
  const entries: MemoryIndexEntry[] = [];
  let scannedFiles = 0;
  let changedFiles = 0;
  let skippedFiles = 0;

  for (const mount of mounts) {
    for (const filePath of walkFiles(mount.path!)) {
      scannedFiles += 1;
      const relativePath = path.relative(mount.path!, filePath).replace(/\\/g, "/");
      const previousEntry = previousByKey.get(`${mount.id}:${relativePath}`);
      const result = createEntry(mount, filePath, previousEntry);
      skippedFiles += result.skipped ? 1 : 0;
      changedFiles += result.changed ? 1 : 0;
      if (!result.skipped) entries.push(result.entry);
    }
  }

  const currentKeys = new Set(entries.map((entry) => `${entry.source}:${entry.relativePath}`));
  const removedFiles = [...previousByKey.keys()].filter((key) => !currentKeys.has(key)).length;
  const index: MemoryIndex = {
    version: 1,
    generatedAt: new Date().toISOString(),
    entries: entries.sort((a, b) => `${a.source}:${a.relativePath}`.localeCompare(`${b.source}:${b.relativePath}`)),
    stats: {
      scannedFiles,
      indexedFiles: entries.length,
      changedFiles,
      removedFiles,
      skippedFiles,
    },
  };

  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), "utf-8");
  return index;
}

export function searchMemoryIndex(query: string, indexPath: string = DEFAULT_INDEX_PATH, limit = 25): MemoryIndexEntry[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  const index = readMemoryIndex(indexPath);
  if (!index) return [];

  return index.entries
    .map((entry) => {
      const haystack = `${entry.title}\n${entry.relativePath}\n${entry.summary}\n${entry.links.join("\n")}`.toLowerCase();
      const titleHit = entry.title.toLowerCase().includes(normalized) ? 3 : 0;
      const pathHit = entry.relativePath.toLowerCase().includes(normalized) ? 2 : 0;
      const bodyHit = haystack.includes(normalized) ? 1 : 0;
      return { entry, score: titleHit + pathHit + bodyHit };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.relativePath.localeCompare(b.entry.relativePath))
    .slice(0, Math.max(1, Math.min(limit, 100)))
    .map((result) => result.entry);
}

export function getMemoryConflicts(indexPath: string = DEFAULT_INDEX_PATH): MemoryConflict[] {
  const index = readMemoryIndex(indexPath);
  if (!index) return [];

  const conflicts: MemoryConflict[] = [];
  const bySourcePath = new Map(index.entries.map((entry) => [`${entry.source}:${entry.relativePath}`, entry]));
  const architecture = bySourcePath.get("workspace:docs/ARCHITECTURE.md");

  if (architecture?.summary.includes("orchestrator/")) {
    conflicts.push({
      id: "legacy-architecture-orchestrator",
      severity: "warning",
      title: "Arquitectura BOPE con referencia legacy",
      description: "docs/ARCHITECTURE.md todavia menciona orchestrator/, pero el stack canonico actual vive en apps/bope-command-center y apps/bope-command-center-server.",
      files: [architecture.relativePath],
    });
  }

  const vaultBope = bySourcePath.get("obsidianVault:20 - Repos/BOPE_VERSION_DEFINITIVA.md");
  const projectBope = bySourcePath.get("obsidianVault:10 - Proyectos/BOPE - Proyecto Maestro.md");
  if (!vaultBope || !projectBope) {
    conflicts.push({
      id: "obsidian-bope-map-incomplete",
      severity: "info",
      title: "Mapa BOPE en Obsidian incompleto",
      description: "El cerebro Obsidian deberia tener ficha de repo y proyecto maestro BOPE enlazadas.",
      files: [vaultBope?.relativePath, projectBope?.relativePath].filter(Boolean) as string[],
    });
  }

  return conflicts;
}
