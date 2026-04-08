import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

export interface DetectedTool {
  type: "read_file" | "run_command";
  target: string;
}

export interface ToolResult {
  tool: DetectedTool;
  output: string;
  error?: string;
}

// Only these base commands are allowed in run_command
const WHITELISTED_COMMANDS = new Set(["git", "ls", "cat", "node", "npm", "pnpm"]);

// Patterns for read_file detection
const READ_PATTERNS = [
  /(?:leé|lee|mirá|mira|read|ver|abrí|abri)\s+([\w./\-]+(?:\.\w+)?)/i,
];

// Patterns for run_command detection
const RUN_PATTERNS = [
  /(?:ejecutá|ejecuta|corré|corre|run)\s+([\w][\w\s./\-]*?)(?:\s+y\s+|\s+después\s+|\s*$)/i,
];

/**
 * Detects tool invocations in the order text. Zero LLM tokens.
 */
export function detectTools(order: string): DetectedTool[] {
  const tools: DetectedTool[] = [];

  for (const pattern of READ_PATTERNS) {
    const match = order.match(pattern);
    if (match?.[1]) {
      tools.push({ type: "read_file", target: match[1].trim() });
    }
  }

  for (const pattern of RUN_PATTERNS) {
    const match = order.match(pattern);
    if (match?.[1]) {
      tools.push({ type: "run_command", target: match[1].trim() });
    }
  }

  return tools;
}

function isPathSafe(filePath: string): boolean {
  if (path.isAbsolute(filePath)) return false;
  const normalized = path.normalize(filePath);
  // Prevent traversal outside CWD
  if (normalized.startsWith("..")) return false;
  return true;
}

function isCommandSafe(cmd: string): boolean {
  const base = cmd.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return WHITELISTED_COMMANDS.has(base);
}

/**
 * Executes a detected tool. Zero LLM tokens.
 */
export async function executeTool(tool: DetectedTool): Promise<ToolResult> {
  if (tool.type === "read_file") {
    if (!isPathSafe(tool.target)) {
      return { tool, output: "", error: `Ruta no permitida: ${tool.target}` };
    }
    try {
      const content = await readFile(tool.target, "utf8");
      // Limit content size to avoid bloating the prompt
      const truncated = content.length > 8000 ? content.slice(0, 8000) + "\n... [truncado a 8000 chars]" : content;
      return { tool, output: truncated };
    } catch (err) {
      return { tool, output: "", error: `No se pudo leer el archivo: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  if (tool.type === "run_command") {
    if (!isCommandSafe(tool.target)) {
      const allowed = [...WHITELISTED_COMMANDS].join(", ");
      return { tool, output: "", error: `Comando no permitido: "${tool.target}". Comandos permitidos: ${allowed}` };
    }
    try {
      const parts = tool.target.trim().split(/\s+/);
      const cmd = parts[0]!;
      const args = parts.slice(1);
      const { stdout, stderr } = await execFileAsync(cmd, args, {
        timeout: 10_000,
        maxBuffer: 64 * 1024, // 64 KB max output
        shell: process.platform === "win32",
      });
      const output = stdout + (stderr ? `\n[stderr]\n${stderr}` : "");
      return { tool, output: output.trim() };
    } catch (err) {
      return { tool, output: "", error: `Error ejecutando comando: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  return { tool, output: "", error: "Tipo de herramienta desconocido" };
}

/**
 * Formats tool results as a string to inject into the LLM prompt.
 */
export function formatToolResults(results: ToolResult[]): string {
  if (results.length === 0) return "";

  const parts = results.map((r) => {
    const header =
      r.tool.type === "read_file"
        ? `[HERRAMIENTA: read_file]\nRuta: ${r.tool.target}`
        : `[HERRAMIENTA: run_command]\nComando: ${r.tool.target}`;

    if (r.error) {
      return `${header}\nError: ${r.error}`;
    }
    return `${header}\nContenido:\n${r.output}`;
  });

  return "\n\n" + parts.join("\n---\n") + "\n---";
}
