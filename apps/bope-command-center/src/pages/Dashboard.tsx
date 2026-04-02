import { useState, useEffect, useRef } from "react";
import { AGENTS } from "@/data/agents";
import { MISSIONS } from "@/data/missions";
import { GLOBAL_BUDGET, formatCost, annualUsagePercent, monthlyUsagePercent } from "@/lib/budget";
import { cn, agentStatusLabel, agentStatusDotClass, agentStatusColor, formatTimeAgo, missionStatusColor } from "@/lib/utils";
import type { Agent, Mission } from "@/types";

const TERMINAL_EVENTS = [
  { ts: "16:50:22", agent: "NEXUS", msg: "Conectando a API externa. Handshake en progreso..." },
  { ts: "16:47:15", agent: "JOHN RAMBO", msg: "Commit realizado. 47 archivos modificados, 2.3K líneas agregadas." },
  { ts: "16:45:03", agent: "FORGE", msg: "Pipeline CI completado. 98/98 tests pasando." },
  { ts: "16:42:00", agent: "PIXEL", msg: "Diseño responsive aprobado. Pull request abierto." },
  { ts: "16:38:44", agent: "HOUSE", msg: "Bug crítico identificado en módulo de sesiones. Investigando." },
  { ts: "16:33:10", agent: "SANTIAGO", msg: "Revisión de misión DELTA-002. Progreso: 62% completado." },
  { ts: "16:28:55", agent: "FORGE", msg: "Base de datos optimizada. Query time reducido 40%." },
  { ts: "16:25:01", agent: "MARCO AURELIO", msg: "Code review DELTA-002 iniciado. Observaciones en progreso." },
  { ts: "16:20:17", agent: "WINSTON", msg: "Reporte semanal generado. Budget: $76.10 mes actual." },
  { ts: "16:15:33", agent: "BLADE", msg: "Bundle size reducido 12%. Web Vitals: todos en verde." },
  { ts: "16:10:22", agent: "SICARIO", msg: "Deuda técnica módulo users eliminada. 3.200 líneas borradas." },
  { ts: "16:05:08", agent: "NEXUS", msg: "Webhook Stripe test conectado. Awaiting producción." },
];

function TerminalConsole() {
  const [visibleCount, setVisibleCount] = useState(6);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setCursor((c) => !c);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount((v) => Math.min(v + 1, TERMINAL_EVENTS.length));
    }, 2000);
    return () => clearTimeout(timer);
  }, [visibleCount]);

  return (
    <div className="flex-1 bg-[hsl(222_22%_7%)] border border-border rounded-lg flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border flex-shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground tracking-[0.15em]">CONSOLA</span>
        <span className="text-[10px] font-mono text-border">/</span>
        <span className="text-[10px] font-mono text-amber tracking-wide">STREAM EN VIVO</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <span className="status-dot status-dot-active" />
          <span className="text-[9px] font-mono text-muted-foreground">ACTIVO</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[11px] leading-relaxed space-y-1"
      >
        {TERMINAL_EVENTS.slice(0, visibleCount).map((evt, i) => (
          <div key={i} className="flex gap-3 items-start">
            <span className="text-muted-foreground/60 flex-shrink-0 tabular-nums">{evt.ts}</span>
            <span className="text-amber flex-shrink-0 min-w-[90px]">[{evt.agent}]</span>
            <span className="text-foreground/70">{evt.msg}</span>
          </div>
        ))}
        <div className="flex gap-3 items-center">
          <span className="text-muted-foreground/60">——</span>
          <span className="text-amber">[SISTEMA]</span>
          <span className={cn("inline-block w-1.5 h-3.5 bg-amber/80 ml-1 transition-opacity", cursor ? "opacity-100" : "opacity-0")} />
        </div>
      </div>
    </div>
  );
}

function AgentRosterPanel() {
  return (
    <div className="w-52 flex-shrink-0 flex flex-col gap-2 overflow-hidden">
      <div className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] px-1">ROSTER</div>
      <div className="flex-1 overflow-y-auto space-y-1 pr-1">
        {AGENTS.map((agent) => (
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
  const activeMission = MISSIONS.find((m) => m.status === "active");
  const annualPct = annualUsagePercent(GLOBAL_BUDGET);
  const monthlyPct = monthlyUsagePercent(GLOBAL_BUDGET);

  return (
    <div className="w-64 flex-shrink-0 flex flex-col gap-3 overflow-hidden">
      <div className="text-[10px] font-mono text-muted-foreground tracking-[0.15em] px-1">MISIÓN ACTIVA</div>

      {activeMission ? (
        <div className="bg-card border border-border rounded-lg p-3 flex flex-col gap-3">
          <div>
            <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-1">{activeMission.codename}</div>
            <div className="text-xs font-semibold text-foreground leading-snug">{activeMission.title}</div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-muted-foreground">Progreso estimado</span>
              <span className="text-amber">62%</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-amber rounded-full" style={{ width: "62%" }} />
            </div>
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
                const agent = AGENTS.find((a) => a.id === id);
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
          <span className="text-xs font-mono text-muted-foreground">Sin misión activa</span>
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
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
            <span>{formatCost(GLOBAL_BUDGET.accumulatedSpend)}</span>
            <span>{formatCost(GLOBAL_BUDGET.annual)}</span>
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
          <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
            <span>{formatCost(GLOBAL_BUDGET.currentMonthSpend)}</span>
            <span>{formatCost(GLOBAL_BUDGET.monthlyTarget)}</span>
          </div>
        </div>

        <div className="pt-1 border-t border-border space-y-1">
          {Object.entries(GLOBAL_BUDGET.byProvider).map(([key, value]) => (
            <div key={key} className="flex justify-between text-[9px] font-mono">
              <span className="text-muted-foreground uppercase tracking-wider">{key}</span>
              <span className="text-foreground/70">{formatCost(value)}</span>
            </div>
          ))}
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
        <span className="text-[10px] font-mono text-muted-foreground tracking-wider">OPERACIONES EN TIEMPO REAL</span>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        <AgentRosterPanel />
        <TerminalConsole />
        <ActiveMissionPanel />
      </div>
    </div>
  );
}
