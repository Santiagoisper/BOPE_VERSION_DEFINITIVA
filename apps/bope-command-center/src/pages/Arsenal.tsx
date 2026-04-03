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
  VCS: "◆",
  Deploy: "▲",
  Database: "⬢",
  Monitoring: "◉",
  Payments: "◇",
};

function EngineCard({ provider }: { provider: ModelProvider }) {
  const annualPct = (provider.accumulatedCost / provider.annualBudget) * 100;
  const ringColor = annualPct > 90 ? "hsl(0 62% 50%)" : annualPct > 75 ? "hsl(38 92% 50%)" : "hsl(40 70% 48%)";
  const statusColor =
    provider.status === "active" ? "text-green-400" : provider.status === "maintenance" ? "text-amber" : "text-red-500";

  return (
    <div className={cn("bg-card border rounded-lg p-5 space-y-5 relative overflow-hidden", provider.isPrimary ? "border-amber/30" : "border-border")}>
      {provider.isPrimary && (
        <div className="absolute top-0 right-0 px-2.5 py-1 bg-amber text-background text-[9px] font-mono font-bold tracking-wider rounded-bl-md">
          PRIMARIO
        </div>
      )}

      <div className="flex items-start gap-4">
        <ProgressRing percent={annualPct} size={72} strokeWidth={6} color={ringColor} label={`${annualPct.toFixed(0)}%`} sublabel="anual" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground tracking-wider">
              {ENGINE_ROLE_LABELS[provider.role]}
            </span>
            <span className={cn("text-[9px] font-mono", statusColor)}>● {provider.status.toUpperCase()}</span>
          </div>
          <h3 className="text-sm font-mono font-bold text-foreground">{provider.shortName}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{provider.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-[9px] font-mono text-muted-foreground">Anual</div>
          <div className="text-[11px] font-mono font-semibold text-foreground">{formatCost(provider.accumulatedCost)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-[9px] font-mono text-muted-foreground">Mensual</div>
          <div className="text-[11px] font-mono font-semibold text-foreground">{formatCost(provider.monthlySpend)}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-[9px] font-mono text-muted-foreground">Disponible</div>
          <div className="text-[11px] font-mono font-semibold text-green-400">{formatCost(provider.annualBudget - provider.accumulatedCost)}</div>
        </div>
      </div>
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolConnection }) {
  const statusColor = tool.status === "connected" ? "text-green-400" : tool.status === "error" ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-card border border-border rounded-md">
      <span className="text-sm font-mono text-muted-foreground flex-shrink-0">{TOOL_TYPE_ICONS[tool.type] ?? "◆"}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-mono font-semibold text-foreground">{tool.name}</div>
        <div className="text-[9px] font-mono text-muted-foreground">{tool.type}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={cn("text-[9px] font-mono", statusColor)}>● {tool.status.toUpperCase()}</div>
        {tool.usageCount > 0 && <div className="text-[9px] font-mono text-muted-foreground">{tool.usageCount} usos</div>}
      </div>
    </div>
  );
}

function ProviderControlCard({ provider, control }: { provider: ModelProvider; control?: ProviderControl }) {
  const modeLabel = control?.mode ?? "disabled";
  const switchLabel = control?.killSwitchActive ? "KILL SWITCH ACTIVO" : "KILL SWITCH LIBERADO";

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono text-foreground">{provider.shortName}</div>
          <div className="text-[9px] font-mono text-muted-foreground">{provider.name}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-mono text-amber">{modeLabel.toUpperCase()}</div>
          <div className={cn("text-[9px] font-mono", control?.enabled ? "text-green-400" : "text-red-400")}>
            {control?.enabled ? "ENABLED" : "DISABLED"}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[9px] font-mono text-muted-foreground">
        <div>RPM LIMITE: {control?.maxRequestsPerMinute ?? 0}</div>
        <div>TOKENS/REQ: {(control?.maxTokensPerRequest ?? 0).toLocaleString("es-AR")}</div>
        <div>TOPE MENSUAL: {formatCost(control?.monthlyHardLimit ?? 0)}</div>
        <div>TOPE ANUAL: {formatCost(control?.annualHardLimit ?? 0)}</div>
      </div>
      <div className={cn("text-[9px] font-mono", control?.killSwitchActive ? "text-red-400" : "text-green-400")}>
        {switchLabel}
      </div>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        {control?.notes ?? "Proveedor sin politica cargada."}
      </p>
    </div>
  );
}

export default function Arsenal() {
  const { providers, providerControls, tools, globalBudget, budgetAlerts, auditLog, budgetPolicy, updateBudgetPolicy } = useCommandCenter();
  const annualPct = globalBudget ? annualUsagePercent(globalBudget) : 0;
  const [annualBudget, setAnnualBudget] = useState("");
  const [monthlyTarget, setMonthlyTarget] = useState("");
  const [reason, setReason] = useState("");
  const [providerDrafts, setProviderDrafts] = useState<Record<string, { annualBudget: string; monthlyBudget: string }>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!budgetPolicy) {
      return;
    }

    setAnnualBudget(String(budgetPolicy.annualBudget));
    setMonthlyTarget(String(budgetPolicy.monthlyTarget));
    setProviderDrafts(
      Object.fromEntries(
        providers.map((provider) => [
          provider.id,
          {
            annualBudget: String(provider.annualBudget),
            monthlyBudget: String(provider.monthlyBudget),
          },
        ]),
      ),
    );
  }, [budgetPolicy, providers]);

  const budgetHistory = auditLog.filter((entry) => entry.category === "budget").slice(0, 6);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const result = await updateBudgetPolicy({
      annualBudget: Number(annualBudget),
      monthlyTarget: Number(monthlyTarget),
      reason: reason.trim() || "Ajuste operativo manual.",
      providerBudgets: providers.map((provider) => ({
        id: provider.id,
        annualBudget: Number(providerDrafts[provider.id]?.annualBudget ?? provider.annualBudget),
        monthlyBudget: Number(providerDrafts[provider.id]?.monthlyBudget ?? provider.monthlyBudget),
      })),
    });

    setStatus(result.ok ? "Presupuesto central actualizado." : result.error ?? "No se pudo actualizar.");
    if (result.ok) {
      setReason("");
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-base font-mono font-semibold text-foreground tracking-wide">Arsenal</h1>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Motores activos, herramientas y presupuesto remoto central</p>
      </div>

      {globalBudget && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted-foreground tracking-wider">PRESUPUESTO ANUAL GLOBAL</span>
            <span className="text-[10px] font-mono text-amber">{formatCost(globalBudget.annual)} USD</span>
          </div>
          <div className="space-y-1.5">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full", annualPct > 90 ? "bg-red-500" : annualPct > 75 ? "bg-amber-500" : "bg-amber")}
                style={{ width: `${annualPct}%` }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
              <span>Gastado: {formatCost(globalBudget.accumulatedSpend)}</span>
              <span>Restante: {formatCost(globalBudget.remainingAnnual)}</span>
            </div>
          </div>
          <div className="space-y-1">
            {budgetAlerts.map((alert) => (
              <div key={alert.id} className={cn("text-[9px] font-mono", alert.level === "critical" ? "text-red-400" : "text-amber")}>
                {alert.message}
              </div>
            ))}
            {budgetAlerts.length === 0 && <div className="text-[9px] font-mono text-green-400">Sin alertas activas.</div>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div>
            <div className="text-[10px] font-mono text-muted-foreground tracking-wider">PRESUPUESTO CENTRAL EDITABLE</div>
            <p className="mt-1 text-[10px] text-muted-foreground">Todos los cambios quedan auditados en backend central.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[9px] font-mono text-muted-foreground">ANUAL GLOBAL</span>
              <input
                type="number"
                min="0"
                className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono"
                value={annualBudget}
                onChange={(event) => setAnnualBudget(event.target.value)}
              />
            </label>
            <label className="space-y-1">
              <span className="text-[9px] font-mono text-muted-foreground">OBJETIVO MENSUAL</span>
              <input
                type="number"
                min="0"
                className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono"
                value={monthlyTarget}
                onChange={(event) => setMonthlyTarget(event.target.value)}
              />
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
                  value={providerDrafts[provider.id]?.annualBudget ?? ""}
                  onChange={(event) =>
                    setProviderDrafts((current) => ({
                      ...current,
                      [provider.id]: {
                        annualBudget: event.target.value,
                        monthlyBudget: current[provider.id]?.monthlyBudget ?? String(provider.monthlyBudget),
                      },
                    }))
                  }
                />
                <input
                  type="number"
                  min="0"
                  className="rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono"
                  value={providerDrafts[provider.id]?.monthlyBudget ?? ""}
                  onChange={(event) =>
                    setProviderDrafts((current) => ({
                      ...current,
                      [provider.id]: {
                        annualBudget: current[provider.id]?.annualBudget ?? String(provider.annualBudget),
                        monthlyBudget: event.target.value,
                      },
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <label className="space-y-1 block">
            <span className="text-[9px] font-mono text-muted-foreground">MOTIVO OPERATIVO</span>
            <textarea
              className="w-full rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono min-h-24"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Justifica el ajuste presupuestario central..."
            />
          </label>

          {status && <div className="text-[10px] font-mono text-amber">{status}</div>}

          <button
            type="submit"
            className="rounded border border-[#B22234]/50 bg-[#8B1A1A] px-4 py-2 text-[11px] font-mono font-semibold tracking-[0.14em] text-white hover:bg-[#B22234]"
          >
            ACTUALIZAR PRESUPUESTO
          </button>
        </form>

        <div className="bg-card border border-border rounded-lg p-4 space-y-3">
          <div className="text-[10px] font-mono text-muted-foreground tracking-wider">HISTORIAL DE PRESUPUESTO</div>
          <div className="space-y-2">
            {budgetHistory.map((entry) => (
              <div key={entry.id} className="rounded border border-border bg-muted/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-mono text-amber">{entry.actorLabel}</span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-foreground/80">{entry.message}</p>
              </div>
            ))}
            {budgetHistory.length === 0 && <div className="text-[10px] font-mono text-muted-foreground">Sin cambios auditados todavia.</div>}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">MOTORES PREPARADOS PARA FUTURA INTEGRACION</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <EngineCard key={provider.id} provider={provider} />
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">CONTROLES DE ACTIVACION DE PROVEEDORES</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {providers.map((provider) => (
            <ProviderControlCard
              key={provider.id}
              provider={provider}
              control={providerControls.find((control) => control.providerId === provider.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">CONEXIONES DE HERRAMIENTAS</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
