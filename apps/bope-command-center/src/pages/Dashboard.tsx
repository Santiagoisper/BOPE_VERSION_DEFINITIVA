import { useRef, useState } from "react";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { annualUsagePercent, formatCost, monthlyUsagePercent } from "@/lib/budget";
import { agentStatusColor, agentStatusDotClass, agentStatusLabel, cn } from "@/lib/utils";

function TerminalConsole() {
  const { auditLog, executionLog, isExecuting, executeOrder } = useCommandCenter();
  const [order, setOrder] = useState("");
  const [provider, setProvider] = useState<"auto" | "claude" | "codex">("auto");
  const [error, setError] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  async function handleExecute() {
    if (!order.trim() || isExecuting) return;
    setError(null);
    try {
      await executeOrder({ order: order.trim(), provider });
      setOrder("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al ejecutar.");
    }
  }

  // Combinar audit log + execution log y mostrar juntos
  type LogLine =
    | { kind: "audit"; id: string; timestamp: string; label: string; message: string }
    | { kind: "exec"; id: string; timestamp: string; type: string; provider?: string; message: string; costUSD?: number };

  const combined: LogLine[] = [
    ...auditLog.map((e) => ({ kind: "audit" as const, id: e.id, timestamp: e.timestamp, label: e.actorLabel, message: e.message })),
    ...executionLog.map((e) => ({ kind: "exec" as const, id: e.id, timestamp: e.timestamp, type: e.type, provider: e.provider, message: e.message, costUSD: e.costUSD })),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return (
    <div className="flex-1 bg-[hsl(222_22%_7%)] border border-border rounded-lg flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground tracking-[0.15em]">CONSOLA</span>
        <span className="text-[10px] font-mono text-border">/</span>
        <span className="text-[10px] font-mono text-amber tracking-wide">OPERACIONES EN VIVO</span>
        <div className="flex-1" />
        {isExecuting && (
          <div className="flex items-center gap-1.5">
            <span className="status-dot status-dot-active animate-pulse" />
            <span className="text-[9px] font-mono text-amber">EJECUTANDO</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1">
        {combined.map((entry) =>
          entry.kind === "audit" ? (
            <div key={entry.id} className="flex gap-3 items-start">
              <span className="text-muted-foreground/60 flex-shrink-0 tabular-nums">
                {new Date(entry.timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className="text-amber flex-shrink-0 min-w-[90px]">[{entry.label}]</span>
              <span className="text-foreground/70">{entry.message}</span>
            </div>
          ) : (
            <div key={entry.id} className={cn("flex gap-3 items-start", entry.type === "error" && "text-red-400", entry.type === "completed" && "text-green-400")}>
              <span className="text-muted-foreground/60 flex-shrink-0 tabular-nums">
                {new Date(entry.timestamp).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className="text-cyan-400 flex-shrink-0 min-w-[90px]">[{(entry.provider ?? "BOT").toUpperCase()}]</span>
              <span className="text-foreground/80 whitespace-pre-wrap break-all">{entry.message}</span>
            </div>
          )
        )}
        <div ref={logEndRef} />
      </div>

      {/* INPUT DE EJECUCIÓN */}
      <div className="border-t border-border p-3 flex-shrink-0 space-y-2">
        {error && <div className="text-[10px] font-mono text-red-400">{error}</div>}
        <div className="flex gap-2">
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as "auto" | "claude" | "codex")}
            className="bg-muted border border-border rounded px-2 py-1.5 text-[10px] font-mono text-foreground focus:outline-none focus:border-amber"
          >
            <option value="auto">AUTO</option>
            <option value="claude">CLAUDE</option>
            <option value="codex">CODEX</option>
          </select>
          <input
            type="text"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && void handleExecute()}
            placeholder="Dar orden al batallón... (Enter para ejecutar)"
            disabled={isExecuting}
            className="flex-1 bg-muted border border-border rounded px-3 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber disabled:opacity-50"
          />
          <button
            onClick={() => void handleExecute()}
            disabled={isExecuting || !order.trim()}
            className="px-3 py-1.5 bg-amber text-background text-[10px] font-mono font-bold rounded hover:bg-amber/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isExecuting ? "..." : "EJECUTAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

function AgentRosterPanel() {
  const { agents } = useCommandCenter();

  return (
    <div className="w-52 flex-shrink-0 flex flex-col gap-2 overflow-hidden">
      <div className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] px-1">ROSTER</div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-md bg-card border border-border hover:border-border/80 transition-colors group"
          >
            <span className={cn("status-dot flex-shrink-0", agentStatusDotClass(agent.status))} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono font-semibold text-foreground/90 truncate group-hover:text-amber transition-colors">
                {agent.codename}
              </div>
              <div className={cn("text-[9px] font-mono", agentStatusColor(agent.status))}>
                {agentStatusLabel(agent.status)}
              </div>
            </div>
            <div className="text-[9px] font-mono text-muted-foreground text-right flex-shrink-0">
              <div>T:{agent.trustScore}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveMissionPanel() {
  const { activeMission, agents, globalBudget, budgetAlerts } = useCommandCenter();

  if (!globalBudget) {
    return null;
  }

  const annualPct = annualUsagePercent(globalBudget);
  const monthlyPct = monthlyUsagePercent(globalBudget);

  return (
    <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
      <div className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] px-1">MISION ACTIVA</div>

      {activeMission ? (
        <div className="bg-card border border-border rounded-lg p-3 flex flex-col gap-3">
          <div>
            <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-1">{activeMission.codename}</div>
            <div className="text-xs font-semibold text-foreground leading-snug">{activeMission.title}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded p-2">
              <div className="text-[9px] font-mono text-muted-foreground">Est.</div>
              <div className="text-xs font-mono font-semibold text-foreground">{formatCost(activeMission.cost.estimated)}</div>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <div className="text-[9px] font-mono text-muted-foreground">Real</div>
              <div className="text-xs font-mono font-semibold text-green-400">{formatCost(activeMission.cost.actual)}</div>
            </div>
          </div>

          <div>
            <div className="text-[9px] font-mono text-muted-foreground mb-1">Agentes asignados</div>
            <div className="flex flex-wrap gap-1">
              {activeMission.assignedAgents.map((id) => {
                const agent = agents.find((item) => item.id === id);
                return agent ? (
                  <span key={id} className="text-[9px] font-mono px-1.5 py-0.5 bg-muted rounded text-amber">
                    {agent.codename}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <span className="text-xs font-mono text-muted-foreground">Sin mision activa</span>
        </div>
      )}

      <div className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] px-1 mt-1">PRESUPUESTO</div>

      <div className="bg-card border border-border rounded-lg p-3 space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-muted-foreground">Anual</span>
            <span className="text-amber">{annualPct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", annualPct > 90 ? "bg-red-500" : annualPct > 75 ? "bg-amber-500" : "bg-amber")}
              style={{ width: `${annualPct}%` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-mono">
            <span className="text-muted-foreground">Mes actual</span>
            <span className={monthlyPct > 100 ? "text-red-500" : "text-amber"}>{monthlyPct.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", monthlyPct > 100 ? "bg-red-500" : monthlyPct > 85 ? "bg-amber-500" : "bg-amber")}
              style={{ width: `${Math.min(monthlyPct, 100)}%` }}
            />
          </div>
        </div>

        <div className="pt-1 border-t border-border space-y-1">
          {budgetAlerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className="text-[9px] font-mono text-amber">
              {alert.message}
            </div>
          ))}
          {budgetAlerts.length === 0 && (
            <div className="text-[9px] font-mono text-green-400">Sin alertas de presupuesto.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden">
      <div className="flex items-baseline gap-3 flex-shrink-0">
        <h1 className="text-base font-mono font-semibold text-foreground tracking-wide">Centro de Mando</h1>
        <span className="text-[10px] font-mono text-muted-foreground tracking-wider">OPERACIONES CON PERSISTENCIA LOCAL</span>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        <AgentRosterPanel />
        <TerminalConsole />
        <ActiveMissionPanel />
      </div>
    </div>
  );
}
