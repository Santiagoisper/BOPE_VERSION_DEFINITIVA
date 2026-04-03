import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  bootstrapAuth as bootstrapAuthRequest,
  createDirectOrderRequest,
  createMissionRequest,
  getBootstrapStatus,
  getCommandCenterState,
  login as loginRequest,
  logout as logoutRequest,
  updateBudgetPolicyRequest,
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
  providerControls: ProviderControl[];
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
  bootstrapAuth: (username: string, password: string) => Promise<AuthResult>;
  login: (username: string, password: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  refreshState: () => Promise<void>;
  createMission: (input: CreateMissionInput) => Promise<void>;
  createDirectOrder: (input: CreateDirectOrderInput) => Promise<void>;
  updateBudgetPolicy: (input: UpdateBudgetPolicyInput) => Promise<AuthResult>;
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
      traceLevel: config.traceLevel,
      notes: config.notes,
      updatedAt: config.updatedAt,
    })),
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
  const [needsBootstrap, setNeedsBootstrap] = useState(false);

  async function refreshState() {
    const response = await getCommandCenterState();
    setState(response.state);
    setSession(response.session);
  }

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        const bootstrapStatus = await getBootstrapStatus();
        if (cancelled) {
          return;
        }

        setNeedsBootstrap(!bootstrapStatus.bootstrapped);
        if (bootstrapStatus.authenticated) {
          const response = await getCommandCenterState();
          if (cancelled) {
            return;
          }
          setState(response.state);
          setSession(response.session);
        } else {
          setSession(null);
          setState(null);
        }
      } catch {
        setSession(null);
        setState(null);
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    }

    void initialize();
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <CommandCenterContext.Provider
      value={{
        isReady,
        state,
        agents: view.agents,
        missions: view.missions,
        providers: view.providers,
        providerControls: view.providerControls,
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
