import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getMemoryConflicts, getMemoryStatus, searchMemoryIndex, syncMemoryIndex } from "../memory.js";

const created: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bope-memory-"));
  created.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of created.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("getMemoryStatus", () => {
  it("reports unconfigured mounts without throwing", () => {
    const status = getMemoryStatus({});

    expect(status.ready).toBe(false);
    expect(status.mounts).toHaveLength(3);
    expect(status.mounts.every((mount) => !mount.configured)).toBe(true);
  });

  it("reports the obsidian vault as ready when the directory exists", () => {
    const vault = makeTempDir();
    fs.writeFileSync(path.join(vault, "Inicio.md"), "# Inicio\n", "utf-8");

    const status = getMemoryStatus({
      BOPE_OBSIDIAN_VAULT_PATH: vault,
    });

    const obsidian = status.mounts.find((mount) => mount.id === "obsidianVault");
    expect(status.ready).toBe(true);
    expect(obsidian?.exists).toBe(true);
    expect(obsidian?.isDirectory).toBe(true);
    expect(obsidian?.markdownFiles).toBe(1);
  });
});

describe("syncMemoryIndex", () => {
  it("indexes allowed files and supports search", () => {
    const vault = makeTempDir();
    const indexPath = path.join(makeTempDir(), "memory-index.json");
    fs.writeFileSync(
      path.join(vault, "BOPE.md"),
      "# BOPE Proyecto\n\nSistema operativo de ejecucion con medallas y jerarquia.\n",
      "utf-8",
    );
    fs.writeFileSync(path.join(vault, "ignored.bin"), "BOPE invisible", "utf-8");

    const index = syncMemoryIndex({
      env: { BOPE_OBSIDIAN_VAULT_PATH: vault },
      indexPath,
    });
    const results = searchMemoryIndex("medallas", indexPath);

    expect(index.stats.indexedFiles).toBe(1);
    expect(index.stats.changedFiles).toBe(1);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("BOPE Proyecto");
  });

  it("removes deleted files from the next index", () => {
    const vault = makeTempDir();
    const indexPath = path.join(makeTempDir(), "memory-index.json");
    const notePath = path.join(vault, "Temporal.md");
    fs.writeFileSync(notePath, "# Temporal\n\nEntrada transitoria.\n", "utf-8");

    syncMemoryIndex({ env: { BOPE_OBSIDIAN_VAULT_PATH: vault }, indexPath });
    fs.unlinkSync(notePath);
    const index = syncMemoryIndex({ env: { BOPE_OBSIDIAN_VAULT_PATH: vault }, indexPath });

    expect(index.stats.indexedFiles).toBe(0);
    expect(index.stats.removedFiles).toBe(1);
  });

  it("detects the legacy architecture reference conflict", () => {
    const workspace = makeTempDir();
    const docsDir = path.join(workspace, "docs");
    const indexPath = path.join(makeTempDir(), "memory-index.json");
    fs.mkdirSync(docsDir);
    fs.writeFileSync(
      path.join(docsDir, "ARCHITECTURE.md"),
      "# ARCHITECTURE\n\nPlatform Layer: app/, orchestrator/, db/\n",
      "utf-8",
    );

    syncMemoryIndex({ env: { BOPE_WORKSPACE_PATH: workspace }, indexPath });
    const conflicts = getMemoryConflicts(indexPath);

    expect(conflicts.some((conflict) => conflict.id === "legacy-architecture-orchestrator")).toBe(true);
  });
});
