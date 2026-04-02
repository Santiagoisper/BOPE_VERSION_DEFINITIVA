import { MODEL_PROVIDERS, TOOL_CONNECTIONS } from "@/data/arsenal";
import { GLOBAL_BUDGET, formatCost, annualUsagePercent } from "@/lib/budget";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { cn } from "@/lib/utils";
import type { ModelProvider, ToolConnection } from "@/types";

const ENGINE_ROLE_LABELS: Record<string, string> = {
  execution: "EJECUCIÓN",
  architecture: "ARQUITECTURA",
  review: "REVISIÓN",
  support: "APOYO",
};

const TOOL_TYPE_ICONS: Record<string, string> = {
  VCS: "◈",
  Deploy: "▲",
  Database: "◆",
  Monitoring: "◉",
  Payments: "◇",
};

function EngineCard({ provider }: { provider: ModelProvider }) {
  const annualPct = (provider.accumulatedCost / provider.annualBudget) * 100;
  const monthlyPct = (provider.monthlySpend / provider.monthlyBudget) * 100;

  const ringColor =
    annualPct > 90 ? "hsl(0 62% 50%)" :
    annualPct > 75 ? "hsl(38 92% 50%)" :
    "hsl(40 70% 48%)";

  const statusColor =
    provider.status === "active" ? "text-green-400" :
    provider.status === "maintenance" ? "text-amber" : "text-red-500";

  return (
    <div className={cn(
      "bg-card border rounded-lg p-5 space-y-5 relative overflow-hidden",
      provider.isPrimary ? "border-amber/30" : "border-border"
    )}>
      {provider.isPrimary && (
        <div className="absolute top-0 right-0 px-2.5 py-1 bg-amber text-background text-[9px] font-mono font-bold tracking-wider rounded-bl-md">
          PRIMARIO
        </div>
      )}

      <div className="flex items-start gap-4">
        <ProgressRing
          percent={annualPct}
          size={72}
          strokeWidth={6}
          color={ringColor}
          label={`${annualPct.toFixed(0)}%`}
          sublabel="anual"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-muted-foreground tracking-wider">
              {ENGINE_ROLE_LABELS[provider.role]}
            </span>
            <span className={cn("text-[9px] font-mono", statusColor)}>
              ● {provider.status === "active" ? "ACTIVO" : provider.status === "maintenance" ? "MANTENIMIENTO" : "LIMITADO"}
            </span>
          </div>
          <h3 className="text-sm font-mono font-bold text-foreground">{provider.shortName}</h3>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{provider.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <div className="text-[9px] font-mono text-muted-foreground tracking-wider">BUDGET ANUAL</div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-foreground">{formatCost(provider.accumulatedCost)}</span>
              <span className="text-muted-foreground">{formatCost(provider.annualBudget)}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", annualPct > 90 ? "bg-red-500" : annualPct > 75 ? "bg-amber-500" : "bg-amber")}
                style={{ width: `${Math.min(annualPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="text-[9px] font-mono text-muted-foreground tracking-wider">MES ACTUAL</div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-foreground">{formatCost(provider.monthlySpend)}</span>
              <span className="text-muted-foreground">{formatCost(provider.monthlyBudget)}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", monthlyPct > 100 ? "bg-red-500" : monthlyPct > 85 ? "bg-amber-500" : "bg-amber/70")}
                style={{ width: `${Math.min(monthlyPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-[9px] font-mono text-muted-foreground">Requests/mes</div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {provider.requestsThisMonth.toLocaleString()}
          </div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-[9px] font-mono text-muted-foreground">Tokens/mes</div>
          <div className="text-[11px] font-mono font-semibold text-foreground">
            {(provider.tokensThisMonth / 1_000_000).toFixed(1)}M
          </div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-[9px] font-mono text-muted-foreground">Disponible</div>
          <div className="text-[11px] font-mono font-semibold text-green-400">
            {formatCost(provider.annualBudget - provider.accumulatedCost)}
          </div>
        </div>
      </div>

      <div>
        <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">CAPACIDADES</div>
        <div className="flex flex-wrap gap-1">
          {provider.capabilities.map((cap) => (
            <span key={cap} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-foreground/60">
              {cap}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FutureEngineSlot() {
  return (
    <div className="bg-card border border-dashed border-border rounded-lg p-5 flex flex-col items-center justify-center gap-2 min-h-[200px] opacity-40">
      <span className="text-2xl font-mono text-muted-foreground">+</span>
      <span className="text-xs font-mono text-muted-foreground tracking-wider">INTEGRACIÓN FUTURA</span>
      <span className="text-[9px] font-mono text-muted-foreground/60">Sin configurar</span>
    </div>
  );
}

function ToolCard({ tool }: { tool: ToolConnection }) {
  const statusColor =
    tool.status === "connected" ? "text-green-400" :
    tool.status === "error" ? "text-red-500" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-card border border-border rounded-md">
      <span className="text-sm font-mono text-muted-foreground flex-shrink-0">
        {TOOL_TYPE_ICONS[tool.type] ?? "◈"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-mono font-semibold text-foreground">{tool.name}</div>
        <div className="text-[9px] font-mono text-muted-foreground">{tool.type}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className={cn("text-[9px] font-mono", statusColor)}>
          {tool.status === "connected" ? "● CONECTADO" : tool.status === "error" ? "● ERROR" : "○ DESCONECTADO"}
        </div>
        {tool.usageCount > 0 && (
          <div className="text-[9px] font-mono text-muted-foreground">{tool.usageCount} usos</div>
        )}
      </div>
    </div>
  );
}

function BudgetSummary() {
  const annualPct = annualUsagePercent(GLOBAL_BUDGET);

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground tracking-wider">PRESUPUESTO ANUAL GLOBAL</span>
        <span className="text-[10px] font-mono text-amber">{formatCost(GLOBAL_BUDGET.annual)} USD</span>
      </div>

      <div className="space-y-1.5">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full", annualPct > 90 ? "bg-red-500" : annualPct > 75 ? "bg-amber-500" : "bg-amber")}
            style={{ width: `${annualPct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
          <span>Gastado: {formatCost(GLOBAL_BUDGET.accumulatedSpend)} ({annualPct.toFixed(1)}%)</span>
          <span>Restante: {formatCost(GLOBAL_BUDGET.remainingAnnual)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MODEL_PROVIDERS.map((p) => {
          const pct = (p.accumulatedCost / GLOBAL_BUDGET.accumulatedSpend) * 100;
          return (
            <div key={p.id} className="space-y-1">
              <div className="flex justify-between text-[9px] font-mono">
                <span className="text-muted-foreground uppercase">{p.shortName}</span>
                <span className="text-foreground/70">{pct.toFixed(1)}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber/60 rounded-full" style={{ width: `${pct}%` }} />
              </div>
              <div className="text-[9px] font-mono text-muted-foreground">{formatCost(p.accumulatedCost)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Arsenal() {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-base font-mono font-semibold text-foreground tracking-wide">Arsenal</h1>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Motores activos y herramientas operativas</p>
      </div>

      <BudgetSummary />

      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">MOTORES DE IA</div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {MODEL_PROVIDERS.map((p) => (
            <EngineCard key={p.id} provider={p} />
          ))}
          <FutureEngineSlot />
        </div>
      </div>

      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-3">CONEXIONES DE HERRAMIENTAS</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TOOL_CONNECTIONS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </div>
  );
}
