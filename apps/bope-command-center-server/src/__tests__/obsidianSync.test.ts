import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createBootstrapState } from "../seed.js";
import { syncObsidianVault } from "../obsidianSync.js";

const created: string[] = [];

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bope-obsidian-"));
  created.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of created.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("syncObsidianVault", () => {
  it("writes controlled BOPE blocks without replacing human content", () => {
    const vault = makeTempDir();
    const indexPath = path.join(makeTempDir(), "memory-index.json");
    const repoDir = path.join(vault, "20 - Repos");
    fs.mkdirSync(repoDir, { recursive: true });
    const repoNote = path.join(repoDir, "BOPE_VERSION_DEFINITIVA.md");
    fs.writeFileSync(repoNote, "# BOPE_VERSION_DEFINITIVA\n\n## Propósito\nContenido humano.\n", "utf-8");

    const result = syncObsidianVault(createBootstrapState(), {
      BOPE_OBSIDIAN_VAULT_PATH: vault,
      BOPE_MEMORY_INDEX_PATH: indexPath,
    });
    const content = fs.readFileSync(repoNote, "utf-8");

    expect(result.files.some((file) => file.path === "20 - Repos/BOPE_VERSION_DEFINITIVA.md")).toBe(true);
    expect(content).toContain("## Propósito\nContenido humano.");
    expect(content).toContain("<!-- BOPE:START -->");
    expect(content).toContain("## Estado operativo BOPE");
    expect(content).toContain("<!-- BOPE:END -->");
  });

  it("updates the existing BOPE block instead of appending duplicates", () => {
    const vault = makeTempDir();
    const indexPath = path.join(makeTempDir(), "memory-index.json");
    const state = createBootstrapState();

    syncObsidianVault(state, { BOPE_OBSIDIAN_VAULT_PATH: vault, BOPE_MEMORY_INDEX_PATH: indexPath });
    syncObsidianVault(state, { BOPE_OBSIDIAN_VAULT_PATH: vault, BOPE_MEMORY_INDEX_PATH: indexPath });

    const repoNote = fs.readFileSync(path.join(vault, "20 - Repos", "BOPE_VERSION_DEFINITIVA.md"), "utf-8");
    const starts = repoNote.match(/<!-- BOPE:START -->/g) ?? [];
    const ends = repoNote.match(/<!-- BOPE:END -->/g) ?? [];

    expect(starts).toHaveLength(1);
    expect(ends).toHaveLength(1);
  });
});
