import http, { type IncomingMessage, type ServerResponse } from "node:http";
import crypto from "node:crypto";
import { URL } from "node:url";
import {
  clearFailedAttempts,
  createAuthConfig,
  createSession,
  filterActiveSessions,
  isLocked,
  isStrongPassword,
  registerFailedAttempt,
  resolveSession,
  verifyPassword,
} from "./auth.js";
import type { PersistedStore, SessionRecord } from "./domain.js";
import { initializePersistence, loadStore, mutateStore } from "./storage.js";
import {
  createDirectOrderInState,
  createMissionInState,
  sanitizeState,
  synchronizeState,
  updateBudgetPolicyInState,
} from "./state.js";

const PORT = Number(process.env.BOPE_COMMAND_CENTER_SERVER_PORT ?? "3100");
const SESSION_COOKIE = "bope_command_center_session";

function json(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function readBody(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function parseCookies(request: IncomingMessage): Record<string, string> {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(";").map((entry: string) => {
      const [rawKey, ...rawValue] = entry.trim().split("=");
      return [rawKey, decodeURIComponent(rawValue.join("="))];
    }),
  );
}

function writeSessionCookie(response: ServerResponse, sessionToken: string): void {
  response.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(sessionToken)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${60 * 60 * 12}`,
  );
}

function clearSessionCookie(response: ServerResponse): void {
  response.setHeader("Set-Cookie", `${SESSION_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

function currentSession(store: PersistedStore, request: IncomingMessage): SessionRecord | null {
  const cookies = parseCookies(request);
  return resolveSession(store.sessions, cookies[SESSION_COOKIE]);
}

function requireSession(store: PersistedStore, request: IncomingMessage, response: ServerResponse): SessionRecord | null {
  const session = currentSession(store, request);
  if (!session) {
    json(response, 401, { error: "Sesion requerida." });
    return null;
  }
  return session;
}

async function handler(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  if (method === "GET" && url.pathname === "/api/healthz") {
    json(response, 200, { ok: true, service: "bope-command-center-server" });
    return;
  }

  const store = await loadStore();

  if (method === "GET" && url.pathname === "/api/bootstrap-status") {
    json(response, 200, {
      bootstrapped: Boolean(store.state.authConfig),
      authenticated: Boolean(currentSession(store, request)),
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/bootstrap") {
    const body = (await readBody(request)) as { username?: string; password?: string };
    if (store.state.authConfig) {
      json(response, 409, { error: "La autenticacion central ya fue configurada." });
      return;
    }
    const username = body.username?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (username.length < 3) {
      json(response, 400, { error: "El usuario debe tener al menos 3 caracteres." });
      return;
    }
    if (!isStrongPassword(password)) {
      json(response, 400, { error: "La contraseña no cumple la politica minima." });
      return;
    }

    const nowIso = new Date().toISOString();
    const payload = await mutateStore((currentStore) => {
      const nextState = synchronizeState({
        ...currentStore.state,
        authConfig: createAuthConfig(username, password, nowIso),
        auditLog: [
          ...currentStore.state.auditLog,
          {
            id: `audit-${crypto.randomUUID()}`,
            timestamp: nowIso,
            category: "auth",
            level: "info",
            actorLabel: username.toUpperCase(),
            message: "Autenticacion central inicializada.",
            context: "bootstrap",
          },
        ],
      });
      const created = createSession(username, nowIso);
      const nextStore: PersistedStore = {
        state: nextState,
        sessions: filterActiveSessions([...currentStore.sessions, created.session]),
      };

      return {
        store: nextStore,
        result: {
          token: created.token,
          session: {
            username,
            loginAt: created.session.loginAt,
            expiresAt: created.session.expiresAt,
          },
          state: sanitizeState(nextState),
        },
      };
    });
    writeSessionCookie(response, payload.token);
    json(response, 200, {
      session: payload.session,
      state: payload.state,
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/login") {
    const body = (await readBody(request)) as { username?: string; password?: string };
    if (!store.state.authConfig) {
      json(response, 409, { error: "La autenticacion central aun no fue configurada." });
      return;
    }
    if (isLocked(store.state.authConfig)) {
      json(response, 423, { error: "Acceso bloqueado temporalmente por intentos fallidos." });
      return;
    }

    const username = body.username?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    const config = store.state.authConfig;
    const validUser = username === config.username;
    const validPassword = validUser ? verifyPassword(password, config) : false;

    if (!validUser || !validPassword) {
      await mutateStore((currentStore) => ({
        store: {
          state: synchronizeState({
            ...currentStore.state,
            authConfig: registerFailedAttempt(config),
            auditLog: [
              ...currentStore.state.auditLog,
              {
                id: `audit-${crypto.randomUUID()}`,
                timestamp: new Date().toISOString(),
                category: "auth",
                level: "warning",
                actorLabel: username.toUpperCase() || "UNKNOWN",
                message: "Intento de acceso rechazado.",
                context: "login",
              },
            ],
          }),
          sessions: currentStore.sessions,
        },
        result: null,
      }));
      json(response, 401, { error: "Credenciales invalidas." });
      return;
    }

    const nowIso = new Date().toISOString();
    const payload = await mutateStore((currentStore) => {
      const nextState = synchronizeState({
        ...currentStore.state,
        authConfig: clearFailedAttempts(config),
        auditLog: [
          ...currentStore.state.auditLog,
          {
            id: `audit-${crypto.randomUUID()}`,
            timestamp: nowIso,
            category: "auth",
            level: "info",
            actorLabel: username.toUpperCase(),
            message: "Sesion central autorizada.",
            context: "login",
          },
        ],
      });
      const created = createSession(username, nowIso);
      const nextStore: PersistedStore = {
        state: nextState,
        sessions: filterActiveSessions([...currentStore.sessions, created.session]),
      };

      return {
        store: nextStore,
        result: {
          token: created.token,
          session: {
            username,
            loginAt: created.session.loginAt,
            expiresAt: created.session.expiresAt,
          },
          state: sanitizeState(nextState),
        },
      };
    });
    writeSessionCookie(response, payload.token);
    json(response, 200, {
      session: payload.session,
      state: payload.state,
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/auth/logout") {
    const cookies = parseCookies(request);
    const token = cookies[SESSION_COOKIE];
    if (token) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      await mutateStore((currentStore) => ({
        store: {
          state: currentStore.state,
          sessions: currentStore.sessions.filter((session) => session.tokenHash !== tokenHash),
        },
        result: null,
      }));
    }
    clearSessionCookie(response);
    json(response, 200, { ok: true });
    return;
  }

  if (method === "GET" && url.pathname === "/api/auth/me") {
    const session = currentSession(store, request);
    if (!session) {
      json(response, 401, { error: "Sesion requerida." });
      return;
    }
    json(response, 200, { session });
    return;
  }

  if (method === "GET" && url.pathname === "/api/command-center/state") {
    const session = requireSession(store, request, response);
    if (!session) {
      return;
    }
    json(response, 200, {
      session,
      state: sanitizeState(store.state),
    });
    return;
  }

  if (method === "POST" && url.pathname === "/api/missions") {
    const session = requireSession(store, request, response);
    if (!session) {
      return;
    }
    const body = (await readBody(request)) as {
      codename?: string;
      title?: string;
      objective?: string;
      priority?: "low" | "medium" | "high" | "critical";
      leadAgent?: string;
      assignedAgents?: string[];
      estimatedBudget?: number;
    };
    const state = await mutateStore((currentStore) => {
      const nextState = createMissionInState(currentStore.state, {
        codename: (body.codename ?? "").trim().toUpperCase(),
        title: (body.title ?? "").trim(),
        objective: (body.objective ?? "").trim(),
        priority: body.priority ?? "medium",
        leadAgent: body.leadAgent ?? "",
        assignedAgents: body.assignedAgents ?? [],
        estimatedBudget: Number(body.estimatedBudget ?? 0),
        actorLabel: session.username.toUpperCase(),
      });
      return {
        store: {
          state: nextState,
          sessions: currentStore.sessions,
        },
        result: sanitizeState(nextState),
      };
    });
    json(response, 200, { state });
    return;
  }

  if (method === "POST" && url.pathname === "/api/orders/direct") {
    const session = requireSession(store, request, response);
    if (!session) {
      return;
    }
    const body = (await readBody(request)) as {
      agentId?: string;
      message?: string;
      priority?: "low" | "medium" | "high" | "critical";
    };
    const state = await mutateStore((currentStore) => {
      const nextState = createDirectOrderInState(currentStore.state, {
        agentId: body.agentId ?? "",
        message: (body.message ?? "").trim(),
        priority: body.priority ?? "medium",
        actorLabel: session.username.toUpperCase(),
      });
      return {
        store: {
          state: nextState,
          sessions: currentStore.sessions,
        },
        result: sanitizeState(nextState),
      };
    });
    json(response, 200, { state });
    return;
  }

  if (method === "PATCH" && url.pathname === "/api/budget/policy") {
    const session = requireSession(store, request, response);
    if (!session) {
      return;
    }
    const body = (await readBody(request)) as {
      annualBudget?: number;
      monthlyTarget?: number;
      providerBudgets?: Array<{ id: string; annualBudget: number; monthlyBudget: number }>;
      reason?: string;
    };
    const state = await mutateStore((currentStore) => {
      const nextState = updateBudgetPolicyInState(currentStore.state, {
        annualBudget: Number(body.annualBudget ?? currentStore.state.budgetPolicy.annualBudget),
        monthlyTarget: Number(body.monthlyTarget ?? currentStore.state.budgetPolicy.monthlyTarget),
        providerBudgets: body.providerBudgets ?? currentStore.state.providers.map((provider) => ({
          id: provider.id,
          annualBudget: provider.annualBudget,
          monthlyBudget: provider.monthlyBudget,
        })),
        reason: (body.reason ?? "").trim() || "Sin motivo especificado.",
        actorLabel: session.username.toUpperCase(),
      });
      return {
        store: {
          state: nextState,
          sessions: currentStore.sessions,
        },
        result: sanitizeState(nextState),
      };
    });
    json(response, 200, { state });
    return;
  }

  json(response, 404, { error: "Ruta no encontrada." });
}

await initializePersistence();

const server = http.createServer((request: IncomingMessage, response: ServerResponse) => {
  void handler(request, response).catch((error) => {
    console.error(error);
    json(response, 500, { error: "Fallo interno del servidor." });
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`BOPE Command Center server listening on http://0.0.0.0:${PORT}`);
});
