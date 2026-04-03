import { useCommandCenter } from "@/context/CommandCenterContext";
import { annualUsagePercent, formatCost, monthlyUsagePercent } from "@/lib/budget";
import { agentStatusColor, agentStatusDotClass, agentStatusLabel, cn } from "@/lib/utils";

function TerminalConsole() {
  const { auditLog } = useCommandCenter();

  return (
    <div className="flex-1 bg-[hsl(222_22%_7%)] border border-border rounded-lg flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground tracking-[0.15em]">CONSOLA</span>
        <span className="text-[10px] font-mono text-border">/</span>
        <span className="text-[10px] font-mono text-amber tracking-wide">AUDITORIA EN VIVO</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <span className="status-dot status-dot-active" />
          <span className="text-[9px] font-mono text-muted-foreground">ACTIVO</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1">
        {auditLog.map((entry) => (
          <div key={entry.id} className="flex gap-3 items-start">
            <span className="text-muted-foreground/60 flex-shrink-0 tabular-nums">
              {new Date(entry.timestamp).toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
            <span className="text-amber flex-shrink-0 min-w-[90px]">[{entry.actorLabel}]</span>
            <span className="text-foreground/70">{entry.message}</span>
          </div>
        ))}
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
