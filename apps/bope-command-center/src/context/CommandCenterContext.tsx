import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  bootstrapAuth as bootstrapAuthRequest,
  createDirectOrderRequest,
  createMissionRequest,
  executeOrderRequest,
  getBootstrapStatus,
  getCommandCenterState,
  login as loginRequest,
  logout as logoutRequest,
  openEventStream,
  recordProviderAttemptRequest,
  updateProviderControlRequest,
  updateBudgetPolicyRequest,
  updateProviderGovernanceRequest,
  type ExecuteOrderInput,
  type ExecuteOrderResult,
  type ExecutionRecordDto,
  getExecutionsRequest,
} from "@/lib/api";
import {
  buildGlobalBudget,
  buildSystemStatus,
  mapAgents,
  mapAuditLog,
  mapBudgetAlerts,
  mapMissions,
  mapProviders,
  mapTools,
} from "@/lib/command-center";
import type { CommandCenterState, SessionRecord } from "@/domain/models";
import type {
  Agent,
  AuditLogEntry,
  Budget,
  BudgetAlert,
  BudgetPolicySnapshot,
  DirectOrder,
  Mission,
  MissionPriority,
  ProviderControl,
  ModelProvider,
  ProviderBudgetInput,
  SystemStatus,
  ToolConnection,
  ProviderGovernance,
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

interface UpdateBudgetPolicyInput {
  annualBudget: number;
  monthlyTarget: number;
  providerBudgets: ProviderBudgetInput[];
  reason: string;
}

interface UpdateProviderGovernanceInput {
  globalKillSwitchActive: boolean;
  defaultMissionBudgetLimit: number;
  defaultRequestsPerMission: number;
  notes: string;
  reason: string;
}

interface UpdateProviderControlInput {
  providerId: string;
  enabled: boolean;
  mode: "disabled" | "shadow" | "armed";
  killSwitchActive: boolean;
  monthlyHardLimit: number;
  annualHardLimit: number;
  maxTokensPerRequest: number;
  maxRequestsPerMinute: number;
  maxRequestsPerMission: number;
  maxMissionBudget: number;
  notes: string;
  reason: string;
}

interface ProviderAttemptInput {
  providerId: string;
  missionId?: string;
  requestedTokens: number;
  estimatedCost: number;
}

interface AuthResult {
  ok: boolean;
  error?: string;
}

export interface ExecutionLogEntry {
  id: string;
  executionId: string;
  type: string;
  provider?: string;
  message: string;
  timestamp: string;
  costUSD?: number;
  model?: string;
  durationMs?: number;
  shadow?: boolean;
}

interface CommandCenterContextValue {
  isReady: boolean;
  initError: string | null;
  state: CommandCenterState | null;
  agents: Agent[];
  missions: Mission[];
  providers: ModelProvider[];
  providerControls: ProviderControl[];
  providerGovernance: ProviderGovernance | null;
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
  budgetPolicy: BudgetPolicySnapshot | null;
  executionLog: ExecutionLogEntry[];
  /** Texto acumulado por executionId mientras llegan chunks SSE (no duplica líneas en el log). */
  activeChunks: Record<string, string>;
  executionHistory: ExecutionRecordDto[];
  refreshExecutionHistory: () => Promise<void>;
  isExecuting: boolean;
  bootstrapAuth: (username: string, password: string) => Promise<AuthResult>;
  login: (username: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshState: () => Promise<void>;
  createMission: (input: CreateMissionInput) => Promise<void>;
  createDirectOrder: (input: CreateDirectOrderInput) => Promise<void>;
  updateBudgetPolicy: (input: UpdateBudgetPolicyInput) => Promise<AuthResult>;
  updateProviderGovernance: (input: UpdateProviderGovernanceInput) => Promise<AuthResult>;
  updateProviderControl: (input: UpdateProviderControlInput) => Promise<AuthResult>;
  recordProviderAttempt: (input: ProviderAttemptInput) => Promise<AuthResult & { allowed?: boolean }>;
  executeOrder: (input: ExecuteOrderInput) => Promise<ExecuteOrderResult>;
}

const CommandCenterContext = createContext<CommandCenterContextValue | null>(null);

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
      providerControls: [] as ProviderControl[],
      tools: [] as ToolConnection[],
      directOrders: [] as DirectOrder[],
      globalBudget: null as Budget | null,
      budgetAlerts: [] as BudgetAlert[],
      auditLog: [] as AuditLogEntry[],
      systemStatus: null as SystemStatus | null,
      activeMission: null as Mission | null,
      budgetPolicy: null as BudgetPolicySnapshot | null,
      providerGovernance: null as ProviderGovernance | null,
    };
  }

  const missions = mapMissions(state);

  return {
    agents: mapAgents(state),
    missions,
    providers: mapProviders(state),
    providerControls: state.providerConfigs.map((config) => ({
      providerId: config.providerId,
      mode: config.mode,
      enabled: config.enabled,
      killSwitchActive: config.killSwitchActive,
      monthlyHardLimit: config.monthlyHardLimit,
      annualHardLimit: config.annualHardLimit,
      maxTokensPerRequest: config.maxTokensPerRequest,
      maxRequestsPerMinute: config.maxRequestsPerMinute,
      maxRequestsPerMission: config.maxRequestsPerMission,
      maxMissionBudget: config.maxMissionBudget,
      traceLevel: config.traceLevel,
      notes: config.notes,
      updatedAt: config.updatedAt,
    })),
    providerGovernance: state.providerGovernance,
    tools: mapTools(state),
    directOrders: mapDirectOrders(state),
    globalBudget: buildGlobalBudget(state),
    budgetAlerts: mapBudgetAlerts(state),
    auditLog: mapAuditLog(state, 20),
    systemStatus: buildSystemStatus(state),
    activeMission: missions.find((mission) => mission.status === "active") ?? null,
    budgetPolicy: state.budgetPolicy,
  };
}

export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CommandCenterState | null>(null);
  const [session, setSession] = useState<SessionRecord | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [executionLog, setExecutionLog] = useState<ExecutionLogEntry[]>([]);
  const [activeChunks, setActiveChunks] = useState<Record<string, string>>({});
  const [executionHistory, setExecutionHistory] = useState<ExecutionRecordDto[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const sseCleanupRef = useRef<(() => void) | null>(null);
  const chunkAccRef = useRef<Record<string, string>>({});

  async function refreshState() {
    const response = await getCommandCenterState();
    setState(response.state);
    setSession(response.session);
  }

  const addToLog = useCallback((entry: ExecutionLogEntry) => {
    setExecutionLog((prev) => [...prev.slice(-499), entry]);
  }, []);

  const refreshExecutionHistory = useCallback(async () => {
    try {
      const res = await getExecutionsRequest(100, 0);
      setExecutionHistory(res.rows);
    } catch {
      // sin sesión o error de red: no romper la UI
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const bootstrapStatus = await getBootstrapStatus();
        if (cancelled) return;

        setNeedsBootstrap(!bootstrapStatus.bootstrapped);
        if (bootstrapStatus.authenticated) {
          const response = await getCommandCenterState();
          if (cancelled) return;
          setState(response.state);
          setSession(response.session);

          // Abrimos el stream SSE para recibir eventos de ejecución
          const cleanup = openEventStream((event) => {
            if (event.type !== "execution") return;
            const raw = event.data as Record<string, unknown>;
            const executionId = String(raw.executionId ?? "");
            const evType = String(raw.type ?? "");

            if (evType === "chunk" && executionId) {
              const piece = String(raw.message ?? "");
              chunkAccRef.current[executionId] = (chunkAccRef.current[executionId] ?? "") + piece;
              setActiveChunks({ ...chunkAccRef.current });
              return;
            }

            if ((evType === "completed" || evType === "error") && executionId) {
              const accumulated = chunkAccRef.current[executionId] ?? "";
              delete chunkAccRef.current[executionId];
              setActiveChunks({ ...chunkAccRef.current });
              const baseMsg = String(raw.message ?? "");
              const message =
                evType === "completed" && accumulated
                  ? `${accumulated}\n\n${baseMsg}`
                  : accumulated && evType === "error"
                    ? `${accumulated}\n\n${baseMsg}`
                    : baseMsg;
              addToLog({
                id: String(raw.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`),
                executionId,
                type: evType,
                provider: raw.provider as string | undefined,
                message,
                timestamp: String(raw.timestamp ?? new Date().toISOString()),
                costUSD: typeof raw.costUSD === "number" ? raw.costUSD : undefined,
                model: raw.model as string | undefined,
                durationMs: typeof raw.durationMs === "number" ? raw.durationMs : undefined,
                shadow: raw.shadow === true,
              });
              void refreshExecutionHistory();
              return;
            }

            if (evType === "started" || evType === "budget_warning") {
              addToLog({
                id: String(raw.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`),
                executionId: executionId || String(raw.id ?? ""),
                type: evType,
                provider: raw.provider as string | undefined,
                message: String(raw.message ?? ""),
                timestamp: String(raw.timestamp ?? new Date().toISOString()),
                costUSD: typeof raw.costUSD === "number" ? raw.costUSD : undefined,
              });
            }
          });
          sseCleanupRef.current = cleanup;
        } else {
          setSession(null);
          setState(null);
        }
      } catch (err) {
        setSession(null);
        setState(null);
        setInitError(err instanceof Error ? err.message : "No se pudo conectar con el servidor.");
      } finally {
        if (!cancelled) setIsReady(true);
      }
    }

    void initialize();
    return () => {
      cancelled = true;
      sseCleanupRef.current?.();
    };
  }, [addToLog, refreshExecutionHistory]);

  const view = buildViewModel(state);

  async function bootstrapAuth(username: string, password: string): Promise<AuthResult> {
    try {
      const response = await bootstrapAuthRequest(username, password);
      setState(response.state);
      setSession(response.session);
      setNeedsBootstrap(false);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "No se pudo inicializar la autenticacion." };
    }
  }

  async function login(username: string, password: string): Promise<AuthResult> {
    try {
      const response = await loginRequest(username, password);
      setState(response.state);
      setSession(response.session);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Acceso rechazado." };
    }
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setSession(null);
      setState(null);
    }
  }

  async function createMission(input: CreateMissionInput) {
    const response = await createMissionRequest(input);
    setState(response.state);
  }

  async function createDirectOrder(input: CreateDirectOrderInput) {
    const response = await createDirectOrderRequest(input);
    setState(response.state);
  }

  async function updateBudgetPolicy(input: UpdateBudgetPolicyInput): Promise<AuthResult> {
    try {
      const response = await updateBudgetPolicyRequest(input);
      setState(response.state);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "No se pudo actualizar el presupuesto central." };
    }
  }

  async function updateProviderGovernance(input: UpdateProviderGovernanceInput): Promise<AuthResult> {
    try {
      const response = await updateProviderGovernanceRequest(input);
      setState(response.state);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "No se pudo actualizar la gobernanza global." };
    }
  }

  async function updateProviderControl(input: UpdateProviderControlInput): Promise<AuthResult> {
    try {
      const response = await updateProviderControlRequest(input);
      setState(response.state);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "No se pudo actualizar el control del provider." };
    }
  }

  async function recordProviderAttempt(input: ProviderAttemptInput): Promise<AuthResult & { allowed?: boolean }> {
    try {
      const response = await recordProviderAttemptRequest(input);
      setState(response.state);
      return { ok: true, allowed: response.allowed };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "No se pudo registrar el intento de uso." };
    }
  }

  async function executeOrder(input: ExecuteOrderInput): Promise<ExecuteOrderResult> {
    setIsExecuting(true);
    try {
      const result = await executeOrderRequest(input);
      // Refresh state so budget and audit log reflect the execution
      await refreshState().catch(() => {});
      return result;
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <CommandCenterContext.Provider
      value={{
        isReady,
        initError,
        state,
        agents: view.agents,
        missions: view.missions,
        providers: view.providers,
        providerControls: view.providerControls,
        providerGovernance: view.providerGovernance,
        tools: view.tools,
        directOrders: view.directOrders,
        globalBudget: view.globalBudget,
        budgetAlerts: view.budgetAlerts,
        auditLog: view.auditLog,
        systemStatus: view.systemStatus,
        activeMission: view.activeMission,
        session,
        needsBootstrap,
        isAuthenticated: Boolean(session),
        budgetPolicy: view.budgetPolicy,
        bootstrapAuth,
        login,
        logout,
        refreshState,
        createMission,
        createDirectOrder,
        updateBudgetPolicy,
        updateProviderGovernance,
        updateProviderControl,
        recordProviderAttempt,
        executionLog,
        activeChunks,
        executionHistory,
        refreshExecutionHistory,
        isExecuting,
        executeOrder,
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
