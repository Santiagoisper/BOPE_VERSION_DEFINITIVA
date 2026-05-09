#!/usr/bin/env node
/**
 * Valida bope/roster.json y que existan los promptFile declarados.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const rosterPath = path.join(root, "bope", "roster.json");

let roster;
try {
  roster = JSON.parse(fs.readFileSync(rosterPath, "utf8"));
} catch (e) {
  console.error("bope/roster.json inválido o ausente:", e.message);
  process.exit(1);
}

const agents = roster.agents;
if (!Array.isArray(agents)) {
  console.error("roster.agents debe ser un array");
  process.exit(1);
}

let errors = 0;
for (const a of agents) {
  if (a.promptFile) {
    const p = path.join(root, a.promptFile.replace(/\//g, path.sep));
    if (!fs.existsSync(p)) {
      console.error(`Falta promptFile para ${a.id}: ${a.promptFile}`);
      errors++;
    }
  }
}

const requiredAgents = [
  "john-rambo",
  "winston-scribe",
  "forge-back",
  "pixel-front",
  "cerberus-guardian",
  "house-doctor",
  "sicario-loco",
  "nexus-wire",
  "marco-aurelio-herald",
  "blade-killer",
];
const ids = new Set(agents.map((a) => a.id));
for (const id of requiredAgents) {
  if (!ids.has(id)) {
    console.error(`Falta agente requerido en roster: ${id}`);
    errors++;
  }
}

if (errors > 0) {
  process.exit(1);
}
console.log("BOPE export OK:", agents.length, "efectivos");
