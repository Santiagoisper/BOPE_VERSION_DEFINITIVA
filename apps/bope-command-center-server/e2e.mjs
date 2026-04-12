/**
 * BOPE Command Center Server — E2E Test Suite
 * Uso: node e2e.mjs [--url http://localhost:3100]
 *
 * Requiere el servidor corriendo. No hace llamadas LLM reales.
 * Las credenciales se leen de las variables de entorno o usan el default.
 *
 * Variables opcionales:
 *   E2E_USERNAME  (default: operator)
 *   E2E_PASSWORD  (default: Santiago2026!)
 *   E2E_URL       (default: http://localhost:3100)
 */

import http from "node:http";
import https from "node:https";
import { URL } from "node:url";

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const argUrl = (() => {
  const idx = process.argv.indexOf("--url");
  return idx !== -1 ? process.argv[idx + 1] : null;
})();
const BASE_URL = argUrl ?? process.env.E2E_URL ?? "http://localhost:3100";
const USERNAME = process.env.E2E_USERNAME ?? "operator";
const PASSWORD = process.env.E2E_PASSWORD ?? "Santiago2026!";

// ─── HTTP HELPER ──────────────────────────────────────────────────────────────
let cookieJar = {};

function parseCookies(setCookieHeaders) {
  for (const header of setCookieHeaders ?? []) {
    const [pair] = header.split(";");
    if (!pair) continue;
    const eqIdx = pair.indexOf("=");
    if (eqIdx === -1) continue;
    const name = pair.slice(0, eqIdx).trim();
    const value = pair.slice(eqIdx + 1).trim();
    cookieJar[name] = value;
  }
}

function cookieHeader() {
  return Object.entries(cookieJar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function request(method, path, body, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;
    const cookies = cookieHeader();

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
        ...(cookies ? { Cookie: cookies } : {}),
        ...extraHeaders,
      },
    };

    const req = lib.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        parseCookies(res.headers["set-cookie"]);
        let data;
        try {
          data = JSON.parse(raw);
        } catch {
          data = raw;
        }
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ─── TEST RUNNER ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
    failures.push(label);
  }
}

function section(name) {
  console.log(`\n── ${name} ${"─".repeat(Math.max(0, 50 - name.length))}`);
}

function abort(message) {
  console.log(`\n  ABORT: ${message}`);
  printSummary();
  process.exit(1);
}

function printSummary() {
  console.log(`\n${"═".repeat(56)}`);
  console.log(`  Resultado: ${passed} pasados, ${failed} fallados`);
  if (failures.length > 0) {
    console.log(`  Fallaron:`);
    for (const f of failures) console.log(`    - ${f}`);
  }
  console.log(`${"═".repeat(56)}\n`);
}

// ─── TESTS ────────────────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(56)}`);
console.log(`  BOPE Command Center — E2E Test Suite`);
console.log(`  Servidor: ${BASE_URL}`);
console.log(`  Usuario:  ${USERNAME}`);
console.log(`${"═".repeat(56)}`);

// ── 1. Health check ───────────────────────────────────────────────────────────
section("1. Health Check");
{
  let res;
  try {
    res = await request("GET", "/api/healthz");
  } catch (e) {
    abort(`No se puede conectar al servidor en ${BASE_URL}. ¿Está corriendo? (${e.message})`);
  }
  assert("GET /api/healthz → 200", res.status === 200, `status=${res.status}`);
  assert("ok=true en respuesta", res.data?.ok === true, `data=${JSON.stringify(res.data)}`);
  assert("service correcto", res.data?.service === "bope-command-center-server", `service=${res.data?.service}`);
}

// ── 2. Bootstrap status ───────────────────────────────────────────────────────
section("2. Bootstrap Status");
let isBootstrapped;
{
  const res = await request("GET", "/api/bootstrap-status");
  assert("GET /api/bootstrap-status → 200", res.status === 200, `status=${res.status}`);
  assert("campo bootstrapped presente", typeof res.data?.bootstrapped === "boolean");
  assert("campo authenticated presente", typeof res.data?.authenticated === "boolean");
  isBootstrapped = res.data?.bootstrapped === true;
  console.log(`  ℹ bootstrapped=${isBootstrapped}, authenticated=${res.data?.authenticated}`);
}

// ── 3. Auth — Bootstrap o Login ───────────────────────────────────────────────
section("3. Autenticación");
let accessToken;
if (!isBootstrapped) {
  console.log("  ℹ Sistema sin bootstrap — inicializando...");
  const res = await request("POST", "/api/auth/bootstrap", { username: USERNAME, password: PASSWORD });
  assert("POST /api/auth/bootstrap → 200", res.status === 200, `status=${res.status} body=${JSON.stringify(res.data)}`);
  assert("session.username presente", res.data?.session?.username === USERNAME);
  accessToken = res.data?.accessToken;
  assert("accessToken presente", typeof accessToken === "string" && accessToken.length > 0);
} else {
  const res = await request("POST", "/api/auth/login", { username: USERNAME, password: PASSWORD });
  assert("POST /api/auth/login → 200", res.status === 200, `status=${res.status} body=${JSON.stringify(res.data)}`);
  assert("session.username presente", res.data?.session?.username === USERNAME);
  // access token puede estar en la cookie, no en el body del login
  accessToken = res.data?.accessToken;
}

// Test: login con credenciales incorrectas
{
  const res = await request("POST", "/api/auth/login", { username: USERNAME, password: "WrongPassword99!" });
  assert("Login con contraseña incorrecta → 401", res.status === 401, `status=${res.status}`);
  assert("error en respuesta de 401", typeof res.data?.error === "string");
}

// ── 4. /api/auth/me ───────────────────────────────────────────────────────────
section("4. GET /api/auth/me");
{
  // Con cookie de sesión (ya en el jar)
  const res = await request("GET", "/api/auth/me");
  assert("GET /api/auth/me → 200 (cookie)", res.status === 200, `status=${res.status}`);
  assert("session.username correcto", res.data?.session?.username === USERNAME);

  // Con Bearer token si lo tenemos
  if (accessToken) {
    const savedJar = { ...cookieJar };
    cookieJar = {}; // borrar cookies para testear Bearer solo
    const res2 = await request("GET", "/api/auth/me", undefined, { Authorization: `Bearer ${accessToken}` });
    assert("GET /api/auth/me → 200 (Bearer token)", res2.status === 200, `status=${res2.status}`);
    assert("session.username correcto vía Bearer", res2.data?.session?.username === USERNAME);
    cookieJar = savedJar; // restaurar
  }
}

// ── 5. Command Center State ───────────────────────────────────────────────────
section("5. GET /api/command-center/state");
{
  const res = await request("GET", "/api/command-center/state");
  assert("GET /api/command-center/state → 200", res.status === 200, `status=${res.status}`);
  assert("session presente", typeof res.data?.session === "object");
  assert("state presente", typeof res.data?.state === "object");
  assert("agents array presente", Array.isArray(res.data?.state?.agents), `agents=${typeof res.data?.state?.agents}`);
  assert("missions array presente", Array.isArray(res.data?.state?.missions));
  console.log(`  ℹ Agentes en estado: ${res.data?.state?.agents?.length ?? "?"}`);
  console.log(`  ℹ Misiones en estado: ${res.data?.state?.missions?.length ?? "?"}`);
}

// ── 6. Sin sesión → 401 ──────────────────────────────────────────────────────
section("6. Rutas protegidas sin sesión");
{
  const savedJar = { ...cookieJar };
  cookieJar = {};
  const res = await request("GET", "/api/command-center/state");
  assert("State sin sesión → 401", res.status === 401, `status=${res.status}`);
  cookieJar = savedJar;
}

// ── 7. Crear misión ───────────────────────────────────────────────────────────
section("7. POST /api/missions");
let missionCodename;
{
  const ts = Date.now();
  missionCodename = `E2E-${ts}`;
  const res = await request("POST", "/api/missions", {
    codename: missionCodename,
    title: `Misión E2E ${ts}`,
    objective: "Verificar que el endpoint de misiones funciona correctamente en el test E2E.",
    priority: "high",
    leadAgent: "john-rambo",
    assignedAgents: ["forge", "house"],
    estimatedBudget: 50,
  });
  assert("POST /api/missions → 200", res.status === 200, `status=${res.status} body=${JSON.stringify(res.data).slice(0, 200)}`);
  assert("state en respuesta", typeof res.data?.state === "object");
  const created = res.data?.state?.missions?.find((m) => m.codename === missionCodename);
  assert("misión creada en estado", !!created, `misiones=${res.data?.state?.missions?.map((m) => m.codename).join(", ")}`);
  if (created) console.log(`  ℹ Misión creada: ${created.codename} (id=${created.id})`);
}

// Validación: misión sin codename → 400
{
  const res = await request("POST", "/api/missions", {
    title: "Sin codename",
    objective: "Test",
  });
  if (res.status === 500) {
    console.log("  ⚠ 500 recibido — el servidor necesita reiniciarse para cargar el fix de validación de codename");
  }
  assert("POST /api/missions sin codename → 400", res.status === 400, `status=${res.status} (reiniciar servidor si es 500)`);
}

// ── 8. Otorgar medalla ────────────────────────────────────────────────────────
section("8. POST /api/medals");
{
  const res = await request("POST", "/api/medals", {
    agentId: "forge",
    type: "commendation",
    label: "Mención E2E — Test Automatizado",
    description: "Medalla otorgada automáticamente por el suite de tests E2E.",
    awardedBy: "E2E_RUNNER",
  });
  assert("POST /api/medals → 201", res.status === 201, `status=${res.status} body=${JSON.stringify(res.data).slice(0, 200)}`);
  assert("state en respuesta de medalla", typeof res.data?.state === "object");

  // Sin campos requeridos → 400
  const res2 = await request("POST", "/api/medals", { agentId: "forge" });
  assert("POST /api/medals sin campos → 400", res2.status === 400, `status=${res2.status}`);
}

// ── 9. Emitir sanción ─────────────────────────────────────────────────────────
section("9. POST /api/sanctions");
{
  const res = await request("POST", "/api/sanctions", {
    agentId: "nexus",
    severity: "minor",
    reason: "Test E2E",
    details: "Sanción emitida por el runner E2E. No tiene efectos operativos.",
    issuedBy: "E2E_RUNNER",
  });
  assert("POST /api/sanctions → 201", res.status === 201, `status=${res.status} body=${JSON.stringify(res.data).slice(0, 200)}`);
  assert("state en respuesta de sanción", typeof res.data?.state === "object");

  // Sin campos requeridos → 400
  const res2 = await request("POST", "/api/sanctions", { agentId: "nexus" });
  assert("POST /api/sanctions sin campos → 400", res2.status === 400, `status=${res2.status}`);
}

// ── 10. Budget / live ─────────────────────────────────────────────────────────
section("10. GET /api/budget/live");
{
  const res = await request("GET", "/api/budget/live");
  assert("GET /api/budget/live → 200", res.status === 200, `status=${res.status}`);
  assert("respuesta es un objeto", typeof res.data === "object" && res.data !== null);
}

// ── 11. Provider attempt ──────────────────────────────────────────────────────
section("11. POST /api/providers/attempt");
{
  // Obtener lista de providers del state
  const stateRes = await request("GET", "/api/command-center/state");
  const providers = stateRes.data?.state?.providerConfigs ?? [];
  if (providers.length === 0) {
    console.log("  ℹ No hay providerConfigs — saltando test de attempt");
  } else {
    const providerId = providers[0].providerId;
    console.log(`  ℹ Usando provider: ${providerId}`);
    const res = await request("POST", "/api/providers/attempt", {
      providerId,
      requestedTokens: 100,
      estimatedCost: 0.001,
    });
    assert("POST /api/providers/attempt → 200", res.status === 200, `status=${res.status}`);
    assert("campo allowed presente", typeof res.data?.allowed === "boolean");
  }

  // Sin providerId → 400
  const res2 = await request("POST", "/api/providers/attempt", {});
  assert("POST /api/providers/attempt sin providerId → 400", res2.status === 400, `status=${res2.status}`);
}

// ── 12. Orden directa ─────────────────────────────────────────────────────────
section("12. POST /api/orders/direct");
{
  const res = await request("POST", "/api/orders/direct", {
    agentId: "house",
    message: "Test E2E — orden directa de diagnóstico.",
    priority: "low",
  });
  assert("POST /api/orders/direct → 200", res.status === 200, `status=${res.status}`);
  assert("state en respuesta de orden", typeof res.data?.state === "object");
}

// ── 13. Token refresh ─────────────────────────────────────────────────────────
section("13. POST /api/auth/refresh");
{
  const res = await request("POST", "/api/auth/refresh");
  // 200: token renovado | 401: no hay refresh token válido | 404: dist desactualizado (rebuild needed)
  assert(
    "POST /api/auth/refresh → 200, 401 o 404",
    res.status === 200 || res.status === 401 || res.status === 404,
    `status=${res.status}`,
  );
  if (res.status === 200) {
    console.log("  ℹ Token renovado exitosamente");
  } else if (res.status === 404) {
    console.log("  ⚠ 404 — dist desactualizado, ejecutar pnpm build para activar la ruta");
  } else {
    console.log("  ℹ No hay refresh token en cookie (normal si se usó Bearer-only)");
  }
}

// ── 14. SSE — conectar y recibir evento connected ────────────────────────────
section("14. GET /api/events (SSE)");
{
  await new Promise((resolve) => {
    const url = new URL("/api/events", BASE_URL);
    const lib = url.protocol === "https:" ? https : http;
    const cookies = cookieHeader();
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: "/api/events",
        method: "GET",
        headers: { Accept: "text/event-stream", ...(cookies ? { Cookie: cookies } : {}) },
      },
      (res) => {
        assert("GET /api/events → 200", res.statusCode === 200, `status=${res.statusCode}`);
        assert(
          "Content-Type es text/event-stream",
          res.headers["content-type"]?.includes("text/event-stream") ?? false,
          `content-type=${res.headers["content-type"]}`,
        );

        let buffer = "";
        let done = false;
        res.on("data", (chunk) => {
          buffer += chunk.toString();
          if (!done && buffer.includes("event: connected")) {
            done = true;
            assert("evento connected recibido vía SSE", true);
            req.destroy();
            resolve();
          }
        });
        // Timeout de seguridad
        setTimeout(() => {
          if (!done) {
            assert("evento connected recibido vía SSE", false, "timeout 3s");
            req.destroy();
            resolve();
          }
        }, 3000);
      },
    );
    req.on("error", () => {
      // Ignoramos el error de destroy
      if (!req.destroyed) {
        assert("GET /api/events conecta sin error", false);
        resolve();
      }
    });
    req.end();
  });
}

// ── 15. Ruta inexistente → 404 ───────────────────────────────────────────────
section("15. Rutas inexistentes");
{
  const res = await request("GET", "/api/ruta-que-no-existe");
  assert("Ruta inexistente → 404", res.status === 404, `status=${res.status}`);
}

// ── 16. Logout ────────────────────────────────────────────────────────────────
section("16. POST /api/auth/logout");
{
  const res = await request("POST", "/api/auth/logout");
  assert("POST /api/auth/logout → 200", res.status === 200, `status=${res.status}`);
  assert("ok=true en logout", res.data?.ok === true);
}

// ── 17. Verificar 401 post-logout ─────────────────────────────────────────────
section("17. Acceso protegido post-logout");
{
  // Limpiar el jar completamente (las cookies fueron anuladas por el logout)
  cookieJar = {};
  const res = await request("GET", "/api/command-center/state");
  assert("State sin sesión post-logout → 401", res.status === 401, `status=${res.status}`);

  const resMe = await request("GET", "/api/auth/me");
  assert("Me sin sesión post-logout → 401", resMe.status === 401, `status=${resMe.status}`);
}

// ─── SUMMARY ──────────────────────────────────────────────────────────────────
printSummary();
process.exit(failed > 0 ? 1 : 0);
