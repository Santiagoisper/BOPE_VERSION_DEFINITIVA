import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import crypto from "node:crypto";
import { createRequire } from "node:module";
const PASSWORD_ITERATIONS = 210_000;

function deriveHash(password, salt, iterations) {
  return crypto.pbkdf2Sync(password, Buffer.from(salt, "hex"), iterations, 32, "sha256").toString("hex");
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function verifyPassword(password, authConfig) {
  return deriveHash(password, authConfig.salt, authConfig.iterations) === authConfig.passwordHash;
}

function createSession(username, nowIso) {
  const loginAt = nowIso;
  const expiresAt = new Date(new Date(nowIso).getTime() + 12 * 60 * 60 * 1000).toISOString();
  const token = bytesToHex(crypto.randomBytes(32));
  return {
    token,
    session: {
      id: `session-${crypto.randomUUID()}`,
      username,
      loginAt,
      expiresAt,
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    },
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.dirname(__dirname);
const tempFile = path.join(projectRoot, ".operator-temp");
if (!fs.existsSync(tempFile)) {
  throw new Error("Temporary credential file missing");
}

const tempPassword = fs.readFileSync(tempFile, "utf8").split("=")[1].trim();
const env = Object.fromEntries(
  fs
    .readFileSync(path.join(projectRoot, "apps", "bope-command-center-server", ".env"), "utf8")
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
  connectionString: env.BOPE_COMMAND_CENTER_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

(async () => {
  await client.connect();
  const { rows } = await client.query("SELECT * FROM bope_auth_config WHERE singleton_key = 'auth'");
  const authRow = rows[0];
  const mappedAuth = {
    username: authRow.username,
    passwordHash: authRow.password_hash,
    salt: authRow.salt,
    iterations: authRow.iterations,
    createdAt: authRow.created_at?.toISOString?.() ?? new Date().toISOString(),
    lastPasswordChangeAt: authRow.last_password_change_at?.toISOString?.() ?? new Date().toISOString(),
    failedAttempts: authRow.failed_attempts,
    lockUntil: authRow.lock_until?.toISOString?.(),
  };
  if (!verifyPassword(tempPassword, mappedAuth)) {
    throw new Error("Temporary credential verification failed");
  }

  const sessionData = createSession("operator", new Date().toISOString());
  await client.query(
    `INSERT INTO bope_sessions (id, username, login_at, expires_at, token_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       login_at = EXCLUDED.login_at,
       expires_at = EXCLUDED.expires_at,
       token_hash = EXCLUDED.token_hash`,
    [sessionData.session.id, sessionData.session.username, sessionData.session.loginAt, sessionData.session.expiresAt, sessionData.session.tokenHash],
  );

  await client.query(
    `INSERT INTO bope_audit_logs (id, event_timestamp, category, level, actor_label, message, context)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      `audit-${crypto.randomUUID()}`,
      new Date().toISOString(),
      "auth",
      "info",
      "operator",
      "Temporary credential smoke login",
      "reset-auth",
    ],
  );

  const governanceValues = {
    globalKillSwitchActive: true,
    defaultMissionBudgetLimit: 1_000,
    defaultRequestsPerMission: 50,
    periodLabel: "phase-4b",
    notes: "Governance smoke test",
  };
  await client.query(
    `INSERT INTO bope_provider_governance
     (singleton_key, global_kill_switch_active, default_mission_budget_limit, default_requests_per_mission, period_label, notes, updated_at)
     VALUES ('governance', $1, $2, $3, $4, $5, $6)
     ON CONFLICT (singleton_key) DO UPDATE SET
       global_kill_switch_active = EXCLUDED.global_kill_switch_active,
       default_mission_budget_limit = EXCLUDED.default_mission_budget_limit,
       default_requests_per_mission = EXCLUDED.default_requests_per_mission,
       period_label = EXCLUDED.period_label,
       notes = EXCLUDED.notes,
       updated_at = EXCLUDED.updated_at`,
    [
      governanceValues.globalKillSwitchActive,
      governanceValues.defaultMissionBudgetLimit,
      governanceValues.defaultRequestsPerMission,
      governanceValues.periodLabel,
      governanceValues.notes,
      new Date().toISOString(),
    ],
  );

  const [providers, providerConfigs, auditLog] = await Promise.all([
    client.query("SELECT id, name, status, is_primary, monthly_budget, annual_budget FROM bope_providers ORDER BY id"),
    client.query("SELECT provider_id, mode, enabled, kill_switch_active, monthly_hard_limit, annual_hard_limit FROM bope_provider_configs ORDER BY provider_id"),
    client.query("SELECT id, category, message, event_timestamp FROM bope_audit_logs ORDER BY event_timestamp DESC LIMIT 5"),
  ]);

  console.log(
    JSON.stringify(
      {
        login: "success",
        providers: providers.rows,
        configs: providerConfigs.rows,
        recentAudit: auditLog.rows,
      },
      null,
      2,
    ),
  );

  await client.end();
})();
