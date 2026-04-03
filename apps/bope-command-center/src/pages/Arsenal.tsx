import { ProgressRing } from "@/components/shared/ProgressRing";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { annualUsagePercent, formatCost } from "@/lib/budget";
import { cn } from "@/lib/utils";
import type { ModelProvider, ToolConnection } from "@/types";

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
  const monthlyPct = (provider.monthlySpend / provider.monthlyBudget) * 100;
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

      <div className="text-[9px] font-mono text-muted-foreground">Mes actual: {monthlyPct.toFixed(1)}%</div>
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

export default function Arsenal() {
  const { providers, tools, globalBudget, budgetAlerts } = useCommandCenter();
  const annualPct = globalBudget ? annualUsagePercent(globalBudget) : 0;

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-base font-mono font-semibold text-foreground tracking-wide">Arsenal</h1>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Motores activos, herramientas y presupuesto operativo</p>
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

      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">MOTORES DE IA</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {providers.map((provider) => (
            <EngineCard key={provider.id} provider={provider} />
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
