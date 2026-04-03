import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createBootstrapState } from "@/seeds/bootstrap";
import {
  buildGlobalBudget,
  buildSystemStatus,
  createDirectOrderInState,
  createMissionInState,
  mapAgents,
  mapAuditLog,
  mapBudgetAlerts,
  mapMissions,
  mapProviders,
  mapTools,
  synchronizeState,
} from "@/lib/command-center";
import { createAuthConfig, createSession, loadSession, persistSession, verifyPassword } from "@/lib/auth";
import { loadPersistedState, savePersistedState } from "@/lib/persistence";
import type { CommandCenterState, SessionRecord } from "@/domain/models";
import type {
  Agent,
  AuditLogEntry,
  Budget,
  BudgetAlert,
  DirectOrder,
  Mission,
  MissionPriority,
  ModelProvider,
  SystemStatus,
  ToolConnection,
} from "@/types";

interface CreateMissionInput {
  codename: string;
  title: string;
  objective: string;
  priority: MissionPriority;
  leadAgent: string;
  assignedAgents: string[];
  estimatedBudget: number;
}

interface CreateDirectOrderInput {
  agentId: string;
  message: string;
  priority: MissionPriority;
}

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface CommandCenterContextValue {
  isReady: boolean;
  state: CommandCenterState | null;
  agents: Agent[];
  missions: Mission[];
  providers: ModelProvider[];
  tools: ToolConnection[];
  directOrders: DirectOrder[];
  globalBudget: Budget | null;
  budgetAlerts: BudgetAlert[];
  auditLog: AuditLogEntry[];
  systemStatus: SystemStatus | null;
  activeMission: Mission | null;
  session: SessionRecord | null;
  needsBootstrap: boolean;
  isAuthenticated: boolean;
  bootstrapAuth: (username: string, password: string) => Promise<AuthResult>;
  login: (username: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  createMission: (input: CreateMissionInput) => void;
  createDirectOrder: (input: CreateDirectOrderInput) => void;
}

const CommandCenterContext = createContext<CommandCenterContextValue | null>(null);

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

function makeAuditEntry(
  category: "auth" | "mission" | "budget" | "system" | "order",
  level: "info" | "warning" | "critical",
  actorLabel: string,
  message: string,
  context?: string,
) {
  return {
    id: `audit-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(),
    category,
    level,
    actorLabel,
    message,
    context,
  };
}

function mapDirectOrders(state: CommandCenterState): DirectOrder[] {
  return state.directOrders.map((order) => ({
    id: order.id,
    agentId: order.agentId,
    message: order.message,
    priority: order.priority,
    issuedAt: order.issuedAt,
  }));
}

function buildViewModel(state: CommandCenterState | null) {
  if (!state) {
    return {
      agents: [] as Agent[],
      missions: [] as Mission[],
      providers: [] as ModelProvider[],
      tools: [] as ToolConnection[],
      directOrders: [] as DirectOrder[],
      globalBudget: null as Budget | null,
      budgetAlerts: [] as BudgetAlert[],
      auditLog: [] as AuditLogEntry[],
      systemStatus: null as SystemStatus | null,
      activeMission: null as Mission | null,
    };
  }

  const missions = mapMissions(state);

  return {
    agents: mapAgents(state),
    missions,
    providers: mapProviders(state),
    tools: mapTools(state),
    directOrders: mapDirectOrders(state),
    globalBudget: buildGlobalBudget(state),
    budgetAlerts: mapBudgetAlerts(state),
    auditLog: mapAuditLog(state, 16),
    systemStatus: buildSystemStatus(state),
    activeMission: missions.find((mission) => mission.status === "active") ?? null,
  };
}

export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommandCenterState | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const didLoadRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      const persisted = await loadPersistedState();
      const initialState = synchronizeState(persisted ?? createBootstrapState());
      const restoredSession = loadSession();

      if (cancelled) {
        return;
      }

      setState(initialState);
      if (
        restoredSession &&
        initialState.authConfig &&
        restoredSession.username === initialState.authConfig.username &&
        new Date(restoredSession.expiresAt).getTime() > Date.now()
      ) {
        setSession(restoredSession);
      } else {
        persistSession(null);
      }

      didLoadRef.current = true;
      setIsReady(true);
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!didLoadRef.current || !state) {
      return;
    }

    void savePersistedState(state);
  }, [state]);

  const view = buildViewModel(state);
  const needsBootstrap = Boolean(state && !state.authConfig);
  const isAuthenticated = Boolean(
    session && new Date(session.expiresAt).getTime() > Date.now(),
  );

  async function bootstrapAuth(username: string, password: string): Promise<AuthResult> {
    if (!state) {
      return { ok: false, error: "Estado no inicializado." };
    }
    if (state.authConfig) {
      return { ok: false, error: "La autenticacion ya fue inicializada." };
    }

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      return { ok: false, error: "El usuario debe tener al menos 3 caracteres." };
    }

    const nowIso = new Date().toISOString();
    const authConfig = await createAuthConfig(cleanUsername, password, nowIso);
    const nextSession = createSession(cleanUsername, nowIso);
    const nextState = synchronizeState({
      ...state,
      authConfig,
      auditLog: [
        ...state.auditLog,
        makeAuditEntry("auth", "info", cleanUsername.toUpperCase(), "Credenciales iniciales configuradas.", "bootstrap"),
      ],
    });

    setState(nextState);
    setSession(nextSession);
    persistSession(nextSession);
    return { ok: true };
  }

  async function login(username: string, password: string): Promise<AuthResult> {
    if (!state || !state.authConfig) {
      return { ok: false, error: "La autenticacion todavia no fue configurada." };
    }

    const attemptedUser = username.trim().toLowerCase();
    const config = state.authConfig;
    const lockUntil = config.lockUntil ? new Date(config.lockUntil).getTime() : 0;
    if (lockUntil > Date.now()) {
      return { ok: false, error: "Acceso bloqueado temporalmente por intentos fallidos." };
    }

    const isValidUser = attemptedUser === config.username;
    const isValidPassword = isValidUser ? await verifyPassword(password, config) : false;

    if (!isValidUser || !isValidPassword) {
      const failedAttempts = config.failedAttempts + 1;
      const nextConfig = {
        ...config,
        failedAttempts,
        lockUntil:
          failedAttempts >= MAX_FAILED_ATTEMPTS
            ? new Date(Date.now() + LOCK_WINDOW_MS).toISOString()
            : undefined,
      };
      const nextState = synchronizeState({
        ...state,
        authConfig: nextConfig,
        auditLog: [
          ...state.auditLog,
          makeAuditEntry(
            "auth",
            failedAttempts >= MAX_FAILED_ATTEMPTS ? "critical" : "warning",
            attemptedUser.toUpperCase() || "UNKNOWN",
            "Intento de acceso rechazado.",
            "login",
          ),
        ],
      });
      setState(nextState);
      persistSession(null);
      setSession(null);
      return {
        ok: false,
        error:
          failedAttempts >= MAX_FAILED_ATTEMPTS
            ? "Acceso bloqueado temporalmente por intentos fallidos."
            : "Credenciales invalidas.",
      };
    }

    const nextSession = createSession(config.username, new Date().toISOString());
    const nextState = synchronizeState({
      ...state,
      authConfig: {
        ...config,
        failedAttempts: 0,
        lockUntil: undefined,
      },
      auditLog: [
        ...state.auditLog,
        makeAuditEntry("auth", "info", config.username.toUpperCase(), "Acceso autorizado al Command Center.", "login"),
      ],
    });

    setState(nextState);
    setSession(nextSession);
    persistSession(nextSession);
    return { ok: true };
  }

  function logout() {
    if (!state || !session) {
      persistSession(null);
      setSession(null);
      return;
    }

    const nextState = synchronizeState({
      ...state,
      auditLog: [
        ...state.auditLog,
        makeAuditEntry("auth", "info", session.username.toUpperCase(), "Sesion finalizada.", "logout"),
      ],
    });

    setState(nextState);
    setSession(null);
    persistSession(null);
  }

  function createMission(input: CreateMissionInput) {
    setState((current) => {
      if (!current) {
        return current;
      }
      return createMissionInState(current, input);
    });
  }

  function createDirectOrder(input: CreateDirectOrderInput) {
    setState((current) => {
      if (!current) {
        return current;
      }
      return createDirectOrderInState(current, input);
    });
  }

  return (
    <CommandCenterContext.Provider
      value={{
        isReady,
        state,
        agents: view.agents,
        missions: view.missions,
        providers: view.providers,
        tools: view.tools,
        directOrders: view.directOrders,
        globalBudget: view.globalBudget,
        budgetAlerts: view.budgetAlerts,
        auditLog: view.auditLog,
        systemStatus: view.systemStatus,
        activeMission: view.activeMission,
        session,
        needsBootstrap,
        isAuthenticated,
        bootstrapAuth,
        login,
        logout,
        createMission,
        createDirectOrder,
      }}
    >
      {children}
    </CommandCenterContext.Provider>
  );
}

export function useCommandCenter(): CommandCenterContextValue {
  const context = useContext(CommandCenterContext);
  if (!context) {
    throw new Error("useCommandCenter must be used within CommandCenterProvider");
  }
  return context;
}
