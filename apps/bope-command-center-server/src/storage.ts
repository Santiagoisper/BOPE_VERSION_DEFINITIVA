import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import type { PersistedStore } from "./domain.js";
import { createBootstrapState } from "./seed.js";
import { filterActiveSessions } from "./auth.js";
import { synchronizeState } from "./state.js";

const DATA_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../data/command-center.json");

async function ensureDirectory(): Promise<void> {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
}

export async function loadStore(): Promise<PersistedStore> {
  await ensureDirectory();

  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    const parsed = JSON.parse(raw) as PersistedStore;
    return {
      state: synchronizeState(parsed.state),
      sessions: filterActiveSessions(parsed.sessions ?? []),
    };
  } catch {
    const initialStore: PersistedStore = {
      state: synchronizeState(createBootstrapState()),
      sessions: [],
    };
    await saveStore(initialStore);
    return initialStore;
  }
}

export async function saveStore(store: PersistedStore): Promise<void> {
  await ensureDirectory();
  await fs.writeFile(
    DATA_PATH,
    JSON.stringify(
      {
        state: store.state,
        sessions: filterActiveSessions(store.sessions),
      },
      null,
      2,
    ),
    "utf8",
  );
}
