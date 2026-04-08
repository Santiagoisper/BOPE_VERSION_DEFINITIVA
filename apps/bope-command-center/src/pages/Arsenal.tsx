import { useEffect, useState } from "react";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { annualUsagePercent, formatCost } from "@/lib/budget";
import { cn } from "@/lib/utils";
import type { ModelProvider, ProviderControl, ToolConnection } from "@/types";

const ENGINE_ROLE_LABELS: Record<string, string> = {
  execution: "EJECUCION",
  architecture: "ARQUITECTURA",
  review: "REVISION",
  support: "APOYO",
};

const TOOL_TYPE_ICONS: Record<string, string> = {
  VCS: "VCS",
  Deploy: "DEP",
  Database: "DB",
  Monitoring: "MON",
  Payments: "PAY",
};

type ProviderDraft = {
  enabled: boolean;
  mode: "disabled" | "shadow" | "armed";
  killSwitchActive: boolean;
  monthlyHardLimit: string;
  annualHardLimit: string;
  maxTokensPerRequest: string;
  maxRequestsPerMinute: string;
  maxRequestsPerMission: string;
  maxMissionBudget: string;
  notes: string;
  reason: string;
  missionId: string;
  requestedTokens: string;
  estimatedCost: string;
};

function EngineCard({ provider }: { provider: ModelProvider }) {
  const annualPct = (provider.accumulatedCost / provider.annualBudget) * 100;
  const ringColor = annualPct > 90 ? "hsl(0 62% 50%)" : annualPct > 75 ? "hsl(38 92% 50%)" : "hsl(40 70% 48%)";
  const statusColor =
    provider.status === "active" ? "text-green-400" : provider.status === "maintenance" ? "text-amber" : "text-red-500";

  return (
    <div className={cn("bg-card border rounded-lg p-5 space-y-5 relative overflow-hidden", provider.isPrimary ? "border-amber/30" : "border-border")}>
      {provider.isPrimary && <div className="absolute top-0 right-0 px-2.5 py-1 bg-amber text-background text-[9px] font-mono font-bold tracking-wider rounded-bl-md">PRIMARIO</div>}
      <div className="flex items-start gap-4">
        <ProgressRing percent={annualPct} size={72} strokeWidth={6} color={ringColor} label={`${annualPct.toFixed(0)}%`} sublabel="anual" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground tracking-wider">{ENGINE_ROLE_LABELS[provider.role]}</span>
            <span className={cn("text-[9px] font-mono", statusColor)}>o {provider.status.toUpperCase()}</span>
          </div>
          <h3 className="text-sm font-mono font-bold text-foreground">{provider.shortName}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{provider.description}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded p-2"><div className="text-[9px] font-mono text-muted-foreground">Anual</div><div className="text-[11px] font-mono font-semibold text-foreground">{formatCost(provider.accumulatedCost)}</div></div>
        <div className="bg-muted/50 rounded p-2"><div className="text-[9px] font-mono text-muted-foreground">Mensual</div><div className="text-[11px] font-mono font-semibold text-foreground">{formatCost(provider.monthlySpend)}</div></div>
        <div className="bg-muted/50 rounded p-2"><div className="text-[9px] font-mono text-muted-foreground">Disponible</div><div className="text-[11px] font-mono font-semibold text-green-400">{formatCost(provider.annualBudget - provider.accumulatedCost)}</div></div>
      </div>
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolConnection }) {
  const statusColor = tool.status === "connected" ? "text-green-400" : tool.status === "error" ? "text-red-500" : "text-muted-foreground";
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-card border border-border rounded-md">
      <span className="text-sm font-mono text-muted-foreground flex-shrink-0">{TOOL_TYPE_ICONS[tool.type] ?? "OPS"}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-mono font-semibold text-foreground">{tool.name}</div>
        <div className="text-[9px] font-mono text-muted-foreground">{tool.type}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={cn("text-[9px] font-mono", statusColor)}>o {tool.status.toUpperCase()}</div>
        {tool.usageCount > 0 && <div className="text-[9px] font-mono text-muted-foreground">{tool.usageCount} usos</div>}
      </div>
    </div>
  );
}

function buildProviderDraft(control?: ProviderControl): ProviderDraft {
  return {
    enabled: control?.enabled ?? false,
    mode: control?.mode ?? "disabled",
    killSwitchActive: control?.killSwitchActive ?? true,
    monthlyHardLimit: String(control?.monthlyHardLimit ?? 0),
    annualHardLimit: String(control?.annualHardLimit ?? 0),
    maxTokensPerRequest: String(control?.maxTokensPerRequest ?? 0),
    maxRequestsPerMinute: String(control?.maxRequestsPerMinute ?? 0),
    maxRequestsPerMission: String(control?.maxRequestsPerMission ?? 0),
    maxMissionBudget: String(control?.maxMissionBudget ?? 0),
    notes: control?.notes ?? "",
    reason: "",
    missionId: "",
    requestedTokens: "12000",
    estimatedCost: "15",
  };
}

export default function Arsenal() {
  const {
    providers,
    providerControls,
    providerGovernance,
    tools,
    globalBudget,
    budgetAlerts,
    auditLog,
    budgetPolicy,
    updateBudgetPolicy,
    updateProviderGovernance,
    updateProviderControl,
    recordProviderAttempt,
  } = useCommandCenter();
  const annualPct = globalBudget ? annualUsagePercent(globalBudget) : 0;
  const [annualBudget, setAnnualBudget] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("");
  const [reason, setReason] = useState("");
  const [providerBudgets, setProviderBudgets] = useState<Record<string, { annualBudget: string; monthlyBudget: string }>>({});
  const [providerDrafts, setProviderDrafts] = useState<Record<string, ProviderDraft>>({});
  const [budgetStatus, setBudgetStatus] = useState<string | null>(null);
  const [governanceStatus, setGovernanceStatus] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<Record<string, string>>({});
  const [governanceDraft, setGovernanceDraft] = useState({
    globalKillSwitchActive: true,
    defaultMissionBudgetLimit: "",
    defaultRequestsPerMission: "",
    notes: "",
    reason: "",
  });

  useEffect(() => {
    if (!budgetPolicy) {
      return;
    }
    setAnnualBudget(String(budgetPolicy.annualBudget));
    setMonthlyTarget(String(budgetPolicy.monthlyTarget));
    setProviderBudgets(
      Object.fromEntries(
        providers.map((provider) => [
          provider.id,
          { annualBudget: String(provider.annualBudget), monthlyBudget: String(provider.monthlyBudget) },
        ]),
      ),
    );
  }, [budgetPolicy, providers]);

  useEffect(() => {
    setProviderDrafts(
      Object.fromEntries(
        providers.map((provider) => [
          provider.id,
          buildProviderDraft(providerControls.find((control) => control.providerId === provider.id)),
        ]),
      ),
    );
  }, [providerControls, providers]);

  useEffect(() => {
    if (!providerGovernance) {
      return;
    }
    setGovernanceDraft({
      globalKillSwitchActive: providerGovernance.globalKillSwitchActive,
      defaultMissionBudgetLimit: String(providerGovernance.defaultMissionBudgetLimit),
      defaultRequestsPerMission: String(providerGovernance.defaultRequestsPerMission),
      notes: providerGovernance.notes,
      reason: "",
    });
  }, [providerGovernance]);

  const budgetHistory = auditLog.filter((entry) => entry.category === "budget").slice(0, 6);
  const providerHistory = auditLog.filter((entry) => entry.category === "provider").slice(0, 8);

  async function handleBudgetSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = await updateBudgetPolicy({
      annualBudget: Number(annualBudget),
      monthlyTarget: Number(monthlyTarget),
      reason: reason.trim() || "Ajuste operativo manual.",
      providerBudgets: providers.map((provider) => ({
        id: provider.id,
        annualBudget: Number(providerBudgets[provider.id]?.annualBudget ?? provider.annualBudget),
        monthlyBudget: Number(providerBudgets[provider.id]?.monthlyBudget ?? provider.monthlyBudget),
      })),
    });
    setBudgetStatus(result.ok ? "Presupuesto central actualizado." : result.error ?? "No se pudo actualizar.");
    if (result.ok) {
      setReason("");
    }
  }

  async function handleGovernanceSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = await updateProviderGovernance({
      globalKillSwitchActive: governanceDraft.globalKillSwitchActive,
      defaultMissionBudgetLimit: Number(governanceDraft.defaultMissionBudgetLimit),
      defaultRequestsPerMission: Number(governanceDraft.defaultRequestsPerMission),
      notes: governanceDraft.notes.trim(),
      reason: governanceDraft.reason.trim() || "Cambio de gobernanza global.",
    });
    setGovernanceStatus(result.ok ? "Gobernanza global actualizada." : result.error ?? "No se pudo actualizar la gobernanza.");
    if (result.ok) {
      setGovernanceDraft((current) => ({ ...current, reason: "" }));
    }
  }

  async function handleProviderSubmit(event: React.FormEvent, providerId: string) {
    event.preventDefault();
    const draft = providerDrafts[providerId];
    if (!draft) {
      return;
    }
    const result = await updateProviderControl({
      providerId,
      enabled: draft.enabled,
      mode: draft.mode,
      killSwitchActive: draft.killSwitchActive,
      monthlyHardLimit: Number(draft.monthlyHardLimit),
      annualHardLimit: Number(draft.annualHardLimit),
      maxTokensPerRequest: Number(draft.maxTokensPerRequest),
      maxRequestsPerMinute: Number(draft.maxRequestsPerMinute),
      maxRequestsPerMission: Number(draft.maxRequestsPerMission),
      maxMissionBudget: Number(draft.maxMissionBudget),
      notes: draft.notes.trim(),
      reason: draft.reason.trim() || "Cambio de control de provider.",
    });
    setProviderStatus((current) => ({ ...current, [providerId]: result.ok ? "Control de provider actualizado." : result.error ?? "No se pudo actualizar." }));
    if (result.ok) {
      setProviderDrafts((current) => ({ ...current, [providerId]: { ...current[providerId], reason: "" } }));
    }
  }

  async function handleAttempt(providerId: string) {
    const draft = providerDrafts[providerId];
    if (!draft) {
      return;
    }
    const result = await recordProviderAttempt({
      providerId,
      missionId: draft.missionId.trim() || undefined,
      requestedTokens: Number(draft.requestedTokens),
      estimatedCost: Number(draft.estimatedCost),
    });
    setProviderStatus((current) => ({
      ...current,
      [providerId]: result.ok ? (result.allowed ? "Intento admitido en modo seco." : "Intento bloqueado por gobernanza.") : result.error ?? "No se pudo registrar el intento.",
    }));
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-base font-mono font-semibold text-foreground tracking-wide">Arsenal</h1>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Gobernanza central de providers, presupuesto remoto y trazabilidad operativa</p>
      </div>
      {globalBudget && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground tracking-wider">PRESUPUESTO ANUAL GLOBAL</span>
            <span className="text-[10px] font-mono text-amber">{formatCost(globalBudget.annual)} USD</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className={cn("h-full rounded-full", annualPct > 90 ? "bg-red-500" : annualPct > 75 ? "bg-amber-500" : "bg-amber")} style={{ width: `${annualPct}%` }} />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
              <span>Gastado: {formatCost(globalBudget.accumulatedSpend)}</span>
              <span>Restante: {formatCost(globalBudget.remainingAnnual)}</span>
            </div>
          </div>
          <div className="space-y-1">
            {budgetAlerts.map((alert) => (
              <div key={alert.id} className={cn("text-[9px] font-mono", alert.level === "critical" ? "text-red-400" : "text-amber")}>{alert.message}</div>
            ))}
            {budgetAlerts.length === 0 && <div className="text-[9px] font-mono text-green-400">Sin alertas activas.</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <form onSubmit={handleBudgetSubmit} className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider">PRESUPUESTO CENTRAL EDITABLE</div>
            <p className="mt-1 text-[10px] text-muted-foreground">Todos los cambios quedan auditados en backend central.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[9px] font-mono text-muted-foreground">ANUAL GLOBAL</span>
              <input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={annualBudget} onChange={(event) => setAnnualBudget(event.target.value)} />
            </label>
            <label className="space-y-1">
              <span className="text-[9px] font-mono text-muted-foreground">OBJETIVO MENSUAL</span>
              <input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={monthlyTarget} onChange={(event) => setMonthlyTarget(event.target.value)} />
            </label>
          </div>
          <div className="space-y-3">
            <div className="text-[9px] font-mono text-muted-foreground">PROVEEDORES</div>
            {providers.map((provider) => (
              <div key={provider.id} className="grid grid-cols-[1fr_1fr_1fr] gap-3 items-end">
                <div className="text-[10px] font-mono text-foreground">{provider.shortName}</div>
                <input
                  type="number"
                  min="0"
                  className="rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono"
                  value={providerBudgets[provider.id]?.annualBudget ?? ""}
                  onChange={(event) => setProviderBudgets((current) => ({ ...current, [provider.id]: { annualBudget: event.target.value, monthlyBudget: current[provider.id]?.monthlyBudget ?? String(provider.monthlyBudget) } }))}
                />
                <input
                  type="number"
                  min="0"
                  className="rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono"
                  value={providerBudgets[provider.id]?.monthlyBudget ?? ""}
                  onChange={(event) => setProviderBudgets((current) => ({ ...current, [provider.id]: { annualBudget: current[provider.id]?.annualBudget ?? String(provider.annualBudget), monthlyBudget: event.target.value } }))}
                />
              </div>
            ))}
          </div>
          <label className="space-y-1 block">
            <span className="text-[9px] font-mono text-muted-foreground">MOTIVO OPERATIVO</span>
            <textarea className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono min-h-24" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Justifica el ajuste presupuestario central..." />
          </label>
          {budgetStatus && <div className="text-[10px] font-mono text-amber">{budgetStatus}</div>}
          <button type="submit" className="rounded border border-[#B22234]/50 bg-[#8B1A1A] px-4 py-2 text-[11px] font-mono font-semibold tracking-[0.14em] text-white hover:bg-[#B22234]">ACTUALIZAR PRESUPUESTO</button>
        </form>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider">HISTORIAL DE PRESUPUESTO</div>
          <div className="space-y-2">
            {budgetHistory.map((entry) => (
              <div key={entry.id} className="rounded border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-mono text-amber">{entry.actorLabel}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{new Date(entry.timestamp).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="mt-1 text-[10px] text-foreground/80">{entry.message}</p>
              </div>
            ))}
            {budgetHistory.length === 0 && <div className="text-[10px] font-mono text-muted-foreground">Sin cambios auditados todavia.</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <form onSubmit={handleGovernanceSubmit} className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider">GOBERNANZA GLOBAL</div>
            <p className="mt-1 text-[10px] text-muted-foreground">Kill switch central, limites por mision y politica operativa comun.</p>
          </div>
          <label className="flex items-center justify-between gap-3 rounded border border-border bg-muted/40 px-3 py-2">
            <span className="text-[10px] font-mono text-foreground">KILL SWITCH GLOBAL</span>
            <input type="checkbox" checked={governanceDraft.globalKillSwitchActive} onChange={(event) => setGovernanceDraft((current) => ({ ...current, globalKillSwitchActive: event.target.checked }))} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[9px] font-mono text-muted-foreground">TOPE COSTO/MISION</span>
              <input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={governanceDraft.defaultMissionBudgetLimit} onChange={(event) => setGovernanceDraft((current) => ({ ...current, defaultMissionBudgetLimit: event.target.value }))} />
            </label>
            <label className="space-y-1">
              <span className="text-[9px] font-mono text-muted-foreground">REQUESTS/MISION</span>
              <input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={governanceDraft.defaultRequestsPerMission} onChange={(event) => setGovernanceDraft((current) => ({ ...current, defaultRequestsPerMission: event.target.value }))} />
            </label>
          </div>
          <label className="space-y-1 block">
            <span className="text-[9px] font-mono text-muted-foreground">NOTAS DE GOBERNANZA</span>
            <textarea className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono min-h-24" value={governanceDraft.notes} onChange={(event) => setGovernanceDraft((current) => ({ ...current, notes: event.target.value }))} />
          </label>
          <label className="space-y-1 block">
            <span className="text-[9px] font-mono text-muted-foreground">MOTIVO OPERATIVO</span>
            <textarea className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono min-h-20" value={governanceDraft.reason} onChange={(event) => setGovernanceDraft((current) => ({ ...current, reason: event.target.value }))} placeholder="Justifica el cambio global..." />
          </label>
          <div className="text-[10px] font-mono text-muted-foreground">Estado: {providerGovernance?.globalKillSwitchActive ? "global locked" : "global armed"} | Periodo: {providerGovernance?.periodLabel ?? "minute"}</div>
          {governanceStatus && <div className="text-[10px] font-mono text-amber">{governanceStatus}</div>}
          <button type="submit" className="rounded border border-amber/40 bg-amber/10 px-4 py-2 text-[11px] font-mono font-semibold tracking-[0.14em] text-amber hover:bg-amber/20">ACTUALIZAR GOBERNANZA</button>
        </form>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider">AUDITORIA DE PROVIDERS</div>
          <div className="space-y-2">
            {providerHistory.map((entry) => (
              <div key={entry.id} className="rounded border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className={cn("text-[9px] font-mono", entry.level === "critical" ? "text-red-400" : entry.level === "warning" ? "text-amber" : "text-green-400")}>{entry.actorLabel}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">{new Date(entry.timestamp).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="mt-1 text-[10px] text-foreground/80">{entry.message}</p>
                {entry.context && <div className="mt-1 text-[9px] font-mono text-muted-foreground">Contexto: {entry.context}</div>}
              </div>
            ))}
            {providerHistory.length === 0 && <div className="text-[10px] font-mono text-muted-foreground">Sin eventos de provider auditados todavia.</div>}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">MOTORES PREPARADOS PARA FUTURA INTEGRACION</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {providers.map((provider) => <EngineCard key={provider.id} provider={provider} />)}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">CONTROLES DE ACTIVACION DE PROVEEDORES</div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {providers.map((provider) => {
            const control = providerControls.find((item) => item.providerId === provider.id);
            const draft = providerDrafts[provider.id] ?? buildProviderDraft(control);
            const enabledClass = draft.enabled && !draft.killSwitchActive && !providerGovernance?.globalKillSwitchActive ? "text-green-400" : "text-red-400";
            return (
              <form key={provider.id} onSubmit={(event) => void handleProviderSubmit(event, provider.id)} className="rounded-lg border border-border bg-card p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-mono text-foreground">{provider.shortName}</div>
                    <div className="text-[9px] font-mono text-muted-foreground">{provider.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-mono text-amber">{draft.mode.toUpperCase()}</div>
                    <div className={cn("text-[9px] font-mono", enabledClass)}>{draft.enabled ? "ENABLED" : "DISABLED"}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                  <label className="flex items-center justify-between rounded border border-border bg-muted/40 px-3 py-2"><span>Enabled</span><input type="checkbox" checked={draft.enabled} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, enabled: event.target.checked } }))} /></label>
                  <label className="flex items-center justify-between rounded border border-border bg-muted/40 px-3 py-2"><span>Kill switch</span><input type="checkbox" checked={draft.killSwitchActive} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, killSwitchActive: event.target.checked } }))} /></label>
                </div>
                <label className="space-y-1 block">
                  <span className="text-[9px] font-mono text-muted-foreground">MODO</span>
                  <select className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={draft.mode} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, mode: event.target.value as ProviderDraft["mode"] } }))}>
                    <option value="disabled">DISABLED</option>
                    <option value="shadow">SHADOW</option>
                    <option value="armed">ARMED</option>
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="space-y-1"><span className="text-[9px] font-mono text-muted-foreground">TOPE MENSUAL</span><input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={draft.monthlyHardLimit} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, monthlyHardLimit: event.target.value } }))} /></label>
                  <label className="space-y-1"><span className="text-[9px] font-mono text-muted-foreground">TOPE ANUAL</span><input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={draft.annualHardLimit} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, annualHardLimit: event.target.value } }))} /></label>
                  <label className="space-y-1"><span className="text-[9px] font-mono text-muted-foreground">TOKENS/REQ</span><input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={draft.maxTokensPerRequest} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, maxTokensPerRequest: event.target.value } }))} /></label>
                  <label className="space-y-1"><span className="text-[9px] font-mono text-muted-foreground">REQ/MIN</span><input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={draft.maxRequestsPerMinute} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, maxRequestsPerMinute: event.target.value } }))} /></label>
                  <label className="space-y-1"><span className="text-[9px] font-mono text-muted-foreground">REQ/MISION</span><input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={draft.maxRequestsPerMission} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, maxRequestsPerMission: event.target.value } }))} /></label>
                  <label className="space-y-1"><span className="text-[9px] font-mono text-muted-foreground">TOPE COSTO/MISION</span><input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={draft.maxMissionBudget} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, maxMissionBudget: event.target.value } }))} /></label>
                </div>
                <label className="space-y-1 block"><span className="text-[9px] font-mono text-muted-foreground">NOTAS</span><textarea className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono min-h-20" value={draft.notes} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, notes: event.target.value } }))} /></label>
                <label className="space-y-1 block"><span className="text-[9px] font-mono text-muted-foreground">MOTIVO OPERATIVO</span><textarea className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono min-h-20" value={draft.reason} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, reason: event.target.value } }))} placeholder="Justifica el cambio de activacion o limites..." /></label>
                <div className="rounded border border-border bg-muted/20 p-3 space-y-3">
                  <div className="text-[9px] font-mono text-muted-foreground tracking-wider">INTENTO CONTROLADO EN MODO SECO</div>
                  <div className="grid grid-cols-3 gap-3">
                    <label className="space-y-1"><span className="text-[9px] font-mono text-muted-foreground">MISION</span><input className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={draft.missionId} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, missionId: event.target.value } }))} placeholder="m-001" /></label>
                    <label className="space-y-1"><span className="text-[9px] font-mono text-muted-foreground">TOKENS</span><input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={draft.requestedTokens} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, requestedTokens: event.target.value } }))} /></label>
                    <label className="space-y-1"><span className="text-[9px] font-mono text-muted-foreground">COSTO EST.</span><input type="number" min="0" className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono" value={draft.estimatedCost} onChange={(event) => setProviderDrafts((current) => ({ ...current, [provider.id]: { ...draft, estimatedCost: event.target.value } }))} /></label>
                  </div>
                  <button type="button" onClick={() => void handleAttempt(provider.id)} className="rounded border border-border px-3 py-2 text-[10px] font-mono text-foreground hover:bg-muted">REGISTRAR INTENTO</button>
                </div>
                {providerStatus[provider.id] && <div className="text-[10px] font-mono text-amber">{providerStatus[provider.id]}</div>}
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[9px] font-mono text-muted-foreground">Global: {providerGovernance?.globalKillSwitchActive ? "LOCKED" : "ARMED"} | Provider kill: {draft.killSwitchActive ? "ON" : "OFF"}</div>
                  <button type="submit" className="rounded border border-[#B22234]/50 bg-[#8B1A1A] px-4 py-2 text-[11px] font-mono font-semibold tracking-[0.14em] text-white hover:bg-[#B22234]">GUARDAR CONTROL</button>
                </div>
              </form>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">CONEXIONES DE HERRAMIENTAS</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tools.map((tool) => <ToolCard key={tool.id} tool={tool} />)}
        </div>
      </div>
    </div>
  );
}
