import fs from "node:fs";
import path from "node:path";
import type { CommandCenterState } from "./domain.js";
import { getMemoryStatus, syncMemoryIndex, type MemoryIndex } from "./memory.js";

const BOPE_START = "<!-- BOPE:START -->";
const BOPE_END = "<!-- BOPE:END -->";

export interface ObsidianSyncFileResult {
  path: string;
  status: "created" | "updated" | "unchanged";
}

export interface ObsidianSyncResult {
  vaultPath: string;
  syncedAt: string;
  files: ObsidianSyncFileResult[];
  memoryIndex: {
    generatedAt: string;
    indexedFiles: number;
  };
}

interface TargetNote {
  relativePath: string;
  title: string;
  body: string;
}

function replaceBopeBlock(existing: string, block: string): string {
  const normalizedBlock = `${BOPE_START}\n${block.trim()}\n${BOPE_END}`;
  const pattern = new RegExp(`${BOPE_START}[\\s\\S]*?${BOPE_END}`);

  if (pattern.test(existing)) {
    return existing.replace(pattern, normalizedBlock);
  }

  return `${existing.trimEnd()}\n\n${normalizedBlock}\n`;
}

function writeControlledNote(vaultPath: string, note: TargetNote): ObsidianSyncFileResult {
  const absolutePath = path.join(vaultPath, note.relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

  const existed = fs.existsSync(absolutePath);
  const base = existed
    ? fs.readFileSync(absolutePath, "utf-8")
    : `# ${note.title}\n`;
  const next = replaceBopeBlock(base, note.body);

  if (base === next) {
    return { path: note.relativePath, status: "unchanged" };
  }

  fs.writeFileSync(absolutePath, next, "utf-8");
  return { path: note.relativePath, status: existed ? "updated" : "created" };
}

function formatAgentLine(state: CommandCenterState, agentId: string): string {
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) return `- ${agentId}`;
  const performance = state.agentPerformance.find((item) => item.agentId === agentId);
  const medals = state.medals.filter((item) => item.agentId === agentId && item.status === "active");
  return `- **${agent.codename}** — ${agent.role}; estado=${agent.status}; misiones=${performance?.missionsCompleted ?? 0}; medallas=${medals.length}`;
}

function buildRosterBlock(state: CommandCenterState, syncedAt: string): string {
  const command = state.agents.filter((agent) => agent.isCommand).map((agent) => formatAgentLine(state, agent.id));
  const specialists = state.agents.filter((agent) => !agent.isCommand).map((agent) => formatAgentLine(state, agent.id));

  return [
    `## Sincronización BOPE`,
    `Actualizado: ${syncedAt}`,
    "",
    "### Cadena de mando",
    ...command,
    "",
    "### Especialistas",
    ...specialists,
    "",
    "### Regla operativa",
    "Toda misión entra por JOHN RAMBO. WINSTON registra cierre y memoria. MARCO AURELIO evalúa doctrina, sanciones y condecoraciones.",
  ].join("\n");
}

function buildRepoBlock(state: CommandCenterState, index: MemoryIndex, syncedAt: string): string {
  const activeMission = state.missions.find((mission) => mission.status === "active");
  const completed = state.missions.filter((mission) => mission.status === "completed").length;
  const medals = state.medals.filter((medal) => medal.status === "active").length;

  return [
    `## Estado operativo BOPE`,
    `Actualizado: ${syncedAt}`,
    "",
    `- Backend/UI: Command Center en Docker con Postgres.`,
    `- Memoria indexada: ${index.stats.indexedFiles} archivos.`,
    `- Misiones completadas: ${completed}.`,
    `- Misión activa: ${activeMission ? `${activeMission.codename} — ${activeMission.title}` : "sin misión activa"}.`,
    `- Medallas activas registradas: ${medals}.`,
    "",
    "### Endpoints de cerebro",
    "- `GET /api/memory/status`",
    "- `POST /api/memory/sync`",
    "- `GET /api/memory/search?q=...`",
    "- `GET /api/memory/conflicts`",
  ].join("\n");
}

function buildProjectBlock(state: CommandCenterState, syncedAt: string): string {
  const recentMissions = [...state.missions]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)
    .map((mission) => `- ${mission.codename} — ${mission.title} (${mission.status})`);

  return [
    `## Pulso del proyecto`,
    `Actualizado: ${syncedAt}`,
    "",
    "### Arquitectura vigente",
    "- BOPE repo: ejecución, doctrina versionada e historia.",
    "- Postgres: estado vivo.",
    "- ObsidianVault: cerebro estratégico.",
    "- Docker: runtime reproducible.",
    "- CLAUDIO: aliado/capability externo, no núcleo.",
    "",
    "### Misiones recientes",
    ...recentMissions,
  ].join("\n");
}

function buildDecisionBlock(syncedAt: string): string {
  return [
    "## Decisión",
    "BOPE usa ObsidianVault como cerebro estratégico y memoria navegable, mientras Postgres conserva el estado vivo transaccional.",
    "",
    "## Razón",
    "Markdown preserva historia, doctrina, jerarquía y épica. Postgres preserva ejecución, auditoría y consistencia operativa.",
    "",
    "## Estado",
    `Actualizado por BOPE Command Center: ${syncedAt}`,
    "",
    "## Próximo paso",
    "Exponer la sincronización en la UI y revisar conflictos antes de promover cambios doctrinales.",
  ].join("\n");
}

function buildTargetNotes(state: CommandCenterState, index: MemoryIndex, syncedAt: string): TargetNote[] {
  return [
    {
      relativePath: "20 - Repos/BOPE_VERSION_DEFINITIVA.md",
      title: "BOPE_VERSION_DEFINITIVA",
      body: buildRepoBlock(state, index, syncedAt),
    },
    {
      relativePath: "10 - Proyectos/BOPE - Proyecto Maestro.md",
      title: "BOPE - Proyecto Maestro",
      body: buildProjectBlock(state, syncedAt),
    },
    {
      relativePath: "70 - Agentes AI/BOPE Command Center.md",
      title: "BOPE Command Center",
      body: buildRosterBlock(state, syncedAt),
    },
    {
      relativePath: "50 - Decisiones/BOPE Arquitectura Docker Obsidian.md",
      title: "BOPE Arquitectura Docker Obsidian",
      body: buildDecisionBlock(syncedAt),
    },
  ];
}

export function syncObsidianVault(state: CommandCenterState, env: NodeJS.ProcessEnv = process.env): ObsidianSyncResult {
  const vaultPath = env.BOPE_OBSIDIAN_VAULT_PATH?.trim();
  if (!vaultPath) {
    throw new Error("BOPE_OBSIDIAN_VAULT_PATH no está configurado.");
  }

  const status = getMemoryStatus(env);
  const vault = status.mounts.find((mount) => mount.id === "obsidianVault");
  if (!vault?.exists || !vault.isDirectory) {
    throw new Error("ObsidianVault no está disponible para sincronización.");
  }

  const index = syncMemoryIndex({ env, indexPath: env.BOPE_MEMORY_INDEX_PATH });
  const syncedAt = new Date().toISOString();
  const files = buildTargetNotes(state, index, syncedAt).map((note) => writeControlledNote(vaultPath, note));

  return {
    vaultPath,
    syncedAt,
    files,
    memoryIndex: {
      generatedAt: index.generatedAt,
      indexedFiles: index.entries.length,
    },
  };
}
