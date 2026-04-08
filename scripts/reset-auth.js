import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
const PASSWORD_ITERATIONS = 210_000;

function deriveHash(password, salt, iterations) {
  return crypto.pbkdf2Sync(password, Buffer.from(salt, "hex"), iterations, 32, "sha256").toString("hex");
}

function createAuthConfig(username, password, nowIso) {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    username,
    passwordHash: deriveHash(password, salt, PASSWORD_ITERATIONS),
    salt,
    iterations: PASSWORD_ITERATIONS,
    createdAt: nowIso,
    lastPasswordChangeAt: nowIso,
    failedAttempts: 0,
    lockUntil: undefined,
  };
}

const PHASES = ["temp", "final"];
const phase = process.argv[2] ?? "temp";
if (!PHASES.includes(phase)) {
  console.error(`Unknown phase ${phase}`);
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const envFile = phase === "temp" ? ".operator-temp" : ".env.operator";
const envPath = path.join(projectRoot, envFile);

const password = (() => {
  const base = crypto.randomBytes(16).toString("base64url");
  return `${base}Aa1!`;
})();

const nowIso = new Date().toISOString();
const envFilePath = path.join(projectRoot, "apps", "bope-command-center-server", ".env");
const rawEnv = fs.readFileSync(envFilePath, "utf8");
const envVars = Object.fromEntries(
  rawEnv
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1)];
    }),
);
const appPackage = path.join(projectRoot, "apps", "bope-command-center-server", "package.json");
const require = createRequire(pathToFileURL(appPackage).href);
const { Client } = require("pg");
const client = new Client({
  connectionString: process.env.BOPE_COMMAND_CENTER_DATABASE_URL ?? envVars.BOPE_COMMAND_CENTER_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await client.connect();
  const authConfig = createAuthConfig("operator", password, nowIso);
  await client.query(
    `INSERT INTO bope_auth_config
     (singleton_key, username, password_hash, salt, iterations, created_at, last_password_change_at, failed_attempts, lock_until)
     VALUES ('auth', $1, $2, $3, $4, $5, $6, 0, NULL)
     ON CONFLICT (singleton_key) DO UPDATE SET
       username = EXCLUDED.username,
       password_hash = EXCLUDED.password_hash,
       salt = EXCLUDED.salt,
       iterations = EXCLUDED.iterations,
       created_at = EXCLUDED.created_at,
       last_password_change_at = EXCLUDED.last_password_change_at,
       failed_attempts = 0,
       lock_until = NULL`,
    [
      authConfig.username,
      authConfig.passwordHash,
      authConfig.salt,
      authConfig.iterations,
      authConfig.createdAt,
      authConfig.lastPasswordChangeAt,
    ],
  );

  const { rows } = await client.query("SELECT * FROM bope_auth_config WHERE singleton_key = 'auth'");
  if (!rows.length) {
    throw new Error("Auth row disappeared");
  }

  const targetRow = rows[0];
  fs.writeFileSync(envPath, `OPERATOR_PASSWORD=${password}\n`, { mode: 0o600 });
  if (phase === "final" && fs.existsSync(path.join(projectRoot, ".operator-temp"))) {
    fs.unlinkSync(path.join(projectRoot, ".operator-temp"));
  }

  console.log(JSON.stringify({ phase, updatedAt: nowIso, passwordHash: targetRow.password_hash }, null, 2));

  await client.end();
})();
