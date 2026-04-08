import http, { type IncomingMessage, type ServerResponse } from "node:http";
import crypto from "node:crypto";
import { URL } from "node:url";
import {
  clearFailedAttempts,
  createAuthConfig,
  createSession,
  isLocked,
  isStrongPassword,
  registerFailedAttempt,
  resolveSession,
  verifyPassword,
} from "./auth.js";
import type { MedalAwardRecord, PersistedStore, SanctionRecord, SessionRecord } from "./domain.js";
import {
  bootstrapAuthMutation,
  createMissionMutation,
  initializePersistence,
  loadStore,
  loginFailureMutation,
  loginSuccessMutation,
  logoutMutation,
  mutateIncremental,
  mutateStore,
  recordProviderAttemptMutation,
  updateProviderControlMutation,
  updateProviderGovernanceMutation,
  updateBudgetPolicyMutation,
} from "./storage.js";
import {
  awardMedalInState,
  createDirectOrderInState,
  issueSanctionInState,
  sanitizeState,
  synchronizeState,
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
    const payload = await mutateIncremental(async (client, currentStore) => {
      const authConfig = createAuthConfig(username, password, nowIso);
      const created = createSession(username, nowIso);
      const auditEntry = {
        id: `audit-${crypto.randomUUID()}`,
        timestamp: nowIso,
        category: "auth" as const,
        level: "info" as const,
        actorLabel: username.toUpperCase(),
        message: "Autenticacion central inicializada.",
        context: "bootstrap",
      };
      const nextState = await bootstrapAuthMutation(client, currentStore, authConfig, created.session, auditEntry);

      return {
        result: {
          token: created.token,
          session: {
            username,
            loginAt: created.session.loginAt,
            expiresAt: created.session.expiresAt,
          },
          state: sanitizeState(nextState),
        },
        nextStore: {
          state: nextState,
          sessions: [...currentStore.sessions, created.session],
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
      await mutateIncremental(async (client, currentStore) => {
        const failedConfig = registerFailedAttempt(config);
        const auditEntry = {
          id: `audit-${crypto.randomUUID()}`,
          timestamp: new Date().toISOString(),
          category: "auth",
          level: "warning",
          actorLabel: username.toUpperCase() || "UNKNOWN",
          message: "Intento de acceso rechazado.",
          context: "login",
        } as const;
        await loginFailureMutation(client, currentStore, failedConfig, auditEntry);
        return {
          result: null,
          nextStore: {
            state: synchronizeState({
              ...currentStore.state,
              authConfig: failedConfig,
              auditLog: [...currentStore.state.auditLog, auditEntry],
            }),
            sessions: currentStore.sessions,
          },
        };
      });
      json(response, 401, { error: "Credenciales invalidas." });
      return;
    }

    const nowIso = new Date().toISOString();
    const payload = await mutateIncremental(async (client, currentStore) => {
      const created = createSession(username, nowIso);
      const clearedConfig = clearFailedAttempts(config);
      const auditEntry = {
        id: `audit-${crypto.randomUUID()}`,
        timestamp: nowIso,
        category: "auth" as const,
        level: "info" as const,
        actorLabel: username.toUpperCase(),
        message: "Sesion central autorizada.",
        context: "login",
      };
      const nextState = await loginSuccessMutation(
        client,
        currentStore,
        clearedConfig,
        created.session,
        auditEntry,
      );

      return {
        result: {
          token: created.token,
          session: {
            username,
            loginAt: created.session.loginAt,
            expiresAt: created.session.expiresAt,
          },
          state: sanitizeState(nextState),
        },
        nextStore: {
          state: nextState,
          sessions: [...currentStore.sessions, created.session],
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
      await mutateIncremental(async (client, currentStore) => {
        await logoutMutation(client, currentStore, tokenHash);
        return {
          result: null,
          nextStore: {
            state: currentStore.state,
            sessions: currentStore.sessions.filter((session) => session.tokenHash !== tokenHash),
          },
        };
      });
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
    const state = await mutateIncremental((client, currentStore) =>
      createMissionMutation(client, currentStore, {
        codename: (body.codename ?? "").trim().toUpperCase(),
        title: (body.title ?? "").trim(),
        objective: (body.objective ?? "").trim(),
        priority: body.priority ?? "medium",
        leadAgent: body.leadAgent ?? "",
        assignedAgents: body.assignedAgents ?? [],
        estimatedBudget: Number(body.estimatedBudget ?? 0),
        actorLabel: session.username.toUpperCase(),
      }).then((nextState) => ({
        result: nextState,
        nextStore: {
          state: nextState,
          sessions: currentStore.sessions,
        },
      })),
    );
    json(response, 200, { state: sanitizeState(state) });
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

  if (method === "POST" && url.pathname === "/api/medals") {
    const session = requireSession(store, request, response);
    if (!session) {
      return;
    }
    const body = (await readBody(request)) as {
      agentId?: string;
      missionId?: string;
      type?: string;
      label?: string;
      description?: string;
      awardedBy?: string;
    };
    if (!body.agentId || !body.type || !body.label || !body.description) {
      json(response, 400, { error: "agentId, type, label y description son requeridos." });
      return;
    }
    const state = await mutateStore((currentStore) => {
      const nextState = awardMedalInState(currentStore.state, {
        agentId: body.agentId!,
        missionId: body.missionId,
        type: body.type as MedalAwardRecord["type"],
        label: body.label!,
        description: body.description!,
        awardedBy: body.awardedBy ?? session.username.toUpperCase(),
      });
      return {
        store: { state: nextState, sessions: currentStore.sessions },
        result: sanitizeState(nextState),
      };
    });
    json(response, 201, { state });
    return;
  }

  if (method === "POST" && url.pathname === "/api/sanctions") {
    const session = requireSession(store, request, response);
    if (!session) {
      return;
    }
    const body = (await readBody(request)) as {
      agentId?: string;
      missionId?: string;
      severity?: string;
      reason?: string;
      details?: string;
      issuedBy?: string;
    };
    if (!body.agentId || !body.severity || !body.reason || !body.details) {
      json(response, 400, { error: "agentId, severity, reason y details son requeridos." });
      return;
    }
    const state = await mutateStore((currentStore) => {
      const nextState = issueSanctionInState(currentStore.state, {
        agentId: body.agentId!,
        missionId: body.missionId,
        severity: body.severity as SanctionRecord["severity"],
        reason: body.reason!,
        details: body.details!,
        issuedBy: body.issuedBy ?? session.username.toUpperCase(),
      });
      return {
        store: { state: nextState, sessions: currentStore.sessions },
        result: sanitizeState(nextState),
      };
    });
    json(response, 201, { state });
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
    const state = await mutateIncremental((client, currentStore) =>
      updateBudgetPolicyMutation(client, currentStore, {
        annualBudget: Number(body.annualBudget ?? currentStore.state.budgetPolicy.annualBudget),
        monthlyTarget: Number(body.monthlyTarget ?? currentStore.state.budgetPolicy.monthlyTarget),
        providerBudgets: body.providerBudgets ?? currentStore.state.providers.map((provider) => ({
          id: provider.id,
          annualBudget: provider.annualBudget,
          monthlyBudget: provider.monthlyBudget,
        })),
        reason: (body.reason ?? "").trim() || "Sin motivo especificado.",
        actorLabel: session.username.toUpperCase(),
      }).then((nextState) => ({
        result: nextState,
        nextStore: {
          state: nextState,
          sessions: currentStore.sessions,
        },
      })),
    );
    json(response, 200, { state: sanitizeState(state) });
    return;
  }

  if (method === "PATCH" && url.pathname === "/api/providers/governance") {
    const session = requireSession(store, request, response);
    if (!session) {
      return;
    }
    const body = (await readBody(request)) as {
      globalKillSwitchActive?: boolean;
      defaultMissionBudgetLimit?: number;
      defaultRequestsPerMission?: number;
      notes?: string;
      reason?: string;
    };
    const state = await mutateIncremental((client, currentStore) =>
      updateProviderGovernanceMutation(client, currentStore, {
        globalKillSwitchActive: Boolean(
          body.globalKillSwitchActive ?? currentStore.state.providerGovernance.globalKillSwitchActive,
        ),
        defaultMissionBudgetLimit: Number(
          body.defaultMissionBudgetLimit ?? currentStore.state.providerGovernance.defaultMissionBudgetLimit,
        ),
        defaultRequestsPerMission: Number(
          body.defaultRequestsPerMission ?? currentStore.state.providerGovernance.defaultRequestsPerMission,
        ),
        notes: (body.notes ?? currentStore.state.providerGovernance.notes).trim(),
        reason: (body.reason ?? "").trim() || "Actualizacion de gobernanza de providers.",
        actorLabel: session.username.toUpperCase(),
      }).then((nextState) => ({
        result: nextState,
        nextStore: {
          state: nextState,
          sessions: currentStore.sessions,
        },
      })),
    );
    json(response, 200, { state: sanitizeState(state) });
    return;
  }

  if (method === "PATCH" && url.pathname === "/api/providers/control") {
    const session = requireSession(store, request, response);
    if (!session) {
      return;
    }
    const body = (await readBody(request)) as {
      providerId?: string;
      enabled?: boolean;
      mode?: "disabled" | "shadow" | "armed";
      killSwitchActive?: boolean;
      monthlyHardLimit?: number;
      annualHardLimit?: number;
      maxTokensPerRequest?: number;
      maxRequestsPerMinute?: number;
      maxRequestsPerMission?: number;
      maxMissionBudget?: number;
      notes?: string;
      reason?: string;
    };
    const existing = store.state.providerConfigs.find((config) => config.providerId === body.providerId);
    if (!existing || !body.providerId) {
      json(response, 404, { error: "Provider no encontrado." });
      return;
    }
    const state = await mutateIncremental((client, currentStore) =>
      updateProviderControlMutation(client, currentStore, {
        providerId: existing.providerId,
        enabled: Boolean(body.enabled ?? existing.enabled),
        mode: body.mode ?? existing.mode,
        killSwitchActive: Boolean(body.killSwitchActive ?? existing.killSwitchActive),
        monthlyHardLimit: Number(body.monthlyHardLimit ?? existing.monthlyHardLimit),
        annualHardLimit: Number(body.annualHardLimit ?? existing.annualHardLimit),
        maxTokensPerRequest: Number(body.maxTokensPerRequest ?? existing.maxTokensPerRequest),
        maxRequestsPerMinute: Number(body.maxRequestsPerMinute ?? existing.maxRequestsPerMinute),
        maxRequestsPerMission: Number(body.maxRequestsPerMission ?? existing.maxRequestsPerMission),
        maxMissionBudget: Number(body.maxMissionBudget ?? existing.maxMissionBudget),
        notes: (body.notes ?? existing.notes).trim(),
        reason: (body.reason ?? "").trim() || "Actualizacion de control de provider.",
        actorLabel: session.username.toUpperCase(),
      }).then((nextState) => ({
        result: nextState,
        nextStore: {
          state: nextState,
          sessions: currentStore.sessions,
        },
      })),
    );
    json(response, 200, { state: sanitizeState(state) });
    return;
  }

  if (method === "POST" && url.pathname === "/api/providers/attempt") {
    const session = requireSession(store, request, response);
    if (!session) {
      return;
    }
    const body = (await readBody(request)) as {
      providerId?: string;
      missionId?: string;
      requestedTokens?: number;
      estimatedCost?: number;
    };
    if (!body.providerId) {
      json(response, 400, { error: "providerId es requerido." });
      return;
    }
    const control = store.state.providerConfigs.find((config) => config.providerId === body.providerId);
    if (!control) {
      json(response, 404, { error: "Provider no encontrado." });
      return;
    }
    const requestedTokens = Number(body.requestedTokens ?? 0);
    const estimatedCost = Number(body.estimatedCost ?? 0);
    const state = await mutateIncremental((client, currentStore) =>
      recordProviderAttemptMutation(client, currentStore, {
        providerId: body.providerId!,
        missionId: body.missionId,
        requestedTokens,
        estimatedCost,
        actorLabel: session.username.toUpperCase(),
      }).then((nextState) => ({
        result: nextState,
        nextStore: {
          state: nextState,
          sessions: currentStore.sessions,
        },
      })),
    );
    const latestAttempt = state.auditLog.find(
      (entry) =>
        entry.category === "provider" &&
        entry.context === body.providerId &&
        (entry.metadata as Record<string, unknown> | undefined)?.action === "attempt",
    );
    const allowed = Boolean((latestAttempt?.metadata as Record<string, unknown> | undefined)?.allowed);
    json(response, 200, { allowed, state: sanitizeState(state) });
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
