import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const PKG_NAME = "@bope/command-center-server";

/**
 * Carga `.env` desde la raíz de este paquete (junto a `package.json`),
 * aunque el proceso se haya iniciado con otro `cwd` (típico en Windows / IDEs).
 */
export function loadPackageDotenv(): void {
  const entry = process.argv[1];
  let startDir: string | undefined;
  if (entry && !entry.includes("vitest")) {
    startDir = path.dirname(path.resolve(entry));
  }
  if (!startDir) {
    dotenv.config();
    return;
  }

  let dir = startDir;
  for (let i = 0; i < 12; i++) {
    const pkgPath = path.join(dir, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { name?: string };
        if (pkg.name === PKG_NAME) {
          dotenv.config({ path: path.join(dir, ".env") });
          return;
        }
      } catch {
        /* seguir subiendo */
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  dotenv.config();
}

loadPackageDotenv();
