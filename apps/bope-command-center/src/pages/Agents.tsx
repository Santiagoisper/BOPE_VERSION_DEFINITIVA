import { useState } from "react";
import { MedalRibbonBar } from "@/components/shared/MedalBadge";
import { ProgressRing } from "@/components/shared/ProgressRing";
import { RankRibbon, RankRow } from "@/components/shared/RankBadge";
import { SanctionBadge } from "@/components/shared/SanctionBadge";
import { useCommandCenter } from "@/context/CommandCenterContext";
import {
  MEDAL_META,
  agentStatusColor,
  agentStatusDotClass,
  agentStatusLabel,
  cn,
  formatTimeAgo,
  priorityColor,
} from "@/lib/utils";
import type { Agent, AgentStatus } from "@/types";

const ENGINE_LABELS: Record<string, string> = {
  codex: "CODEX",
  claude: "CLAUDE",
  hybrid: "HIBRIDO",
};

const STATUS_FILTERS: { value: AgentStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activo" },
  { value: "on_mission", label: "En mision" },
  { value: "standby", label: "En espera" },
  { value: "offline", label: "Offline" },
];

function AgentCard({ agent }: { agent: Agent }) {
  const [expanded, setExpanded] = useState(false);
  const { directOrders } = useCommandCenter();
  const agentOrders = directOrders.filter((order) => order.agentId === agent.id);
  const trustColor =
    agent.trustScore >= 95 ? "hsl(142 50% 45%)" : agent.trustScore >= 85 ? "hsl(40 70% 48%)" : "hsl(0 62% 50%)";

  return (
    <div className={cn("bg-card border border-border rounded-lg transition-all duration-200", expanded ? "border-amber/30" : "hover:border-border/80")}>
      <button className="w-full text-left p-4 flex items-center gap-4" onClick={() => setExpanded((value) => !value)}>
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-md bg-muted border border-border flex items-center justify-center">
            <span className="text-base font-mono font-bold text-amber">{agent.codename.charAt(0)}</span>
          </div>
          <span className={cn("status-dot absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border border-card", agentStatusDotClass(agent.status))} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-mono font-semibold text-foreground">{agent.codename}</span>
            <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border border-current/30 bg-current/5", agentStatusColor(agent.status))}>
              {agentStatusLabel(agent.status)}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground truncate">{agent.role}</div>
          <div className="mt-1">
            <RankRibbon rank={agent.rank} height={5} width={32} />
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[9px] font-mono text-muted-foreground">MOTOR</div>
            <div className="text-[10px] font-mono font-semibold text-amber">{ENGINE_LABELS[agent.preferredEngine]}</div>
          </div>
          <ProgressRing percent={agent.trustScore} size={44} strokeWidth={4} color={trustColor} label={`${agent.trustScore}`} sublabel="trust" />
          <span className={cn("text-xs font-mono text-muted-foreground transition-transform duration-200", expanded ? "rotate-180" : "")}>▾</span>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-1.5">BIO</div>
                <p className="text-xs text-foreground/70 leading-relaxed">{agent.bio}</p>
              </div>
              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-1.5">ESPECIALIZACION</div>
                <p className="text-xs text-foreground/70 leading-relaxed">{agent.specialization}</p>
              </div>
              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-1.5">HABILIDADES</div>
                <div className="flex flex-wrap gap-1">
                  {agent.skills.map((skill) => (
                    <span key={skill} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-foreground/60">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">RANGO MILITAR</div>
                <RankRow rank={agent.rank} />
              </div>

              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">CONDECORACIONES ({agent.medals.length})</div>
                {agent.medals.length > 0 ? (
                  <div className="space-y-2">
                    {agent.medals.map((medal) => {
                      const meta = MEDAL_META[medal.type];
                      return (
                        <div key={medal.id} className="flex items-start gap-2">
                          <div className="flex-shrink-0 mt-0.5 flex flex-col gap-0.5">
                            <MedalRibbonBar type={medal.type} height={10} />
                            <span className={cn("font-mono text-[8px] text-center", meta.color)}>{meta.abbreviation}</span>
                          </div>
                          <div className="min-w-0">
                            <div className={cn("text-[10px] font-mono font-semibold", meta.color)}>{medal.label}</div>
                            <div className="text-[9px] text-muted-foreground leading-relaxed">{medal.description}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[9px] font-mono text-muted-foreground">Sin condecoraciones</p>
                )}
              </div>

              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-1.5">SANCIONES ({agent.sanctions.length})</div>
                {agent.sanctions.length > 0 ? (
                  <div className="space-y-1">
                    {agent.sanctions.map((sanction) => (
                      <div key={sanction.id} className="flex items-start gap-2">
                        <SanctionBadge sanction={sanction} size="sm" />
                        <div className="text-[9px] text-muted-foreground">{sanction.reason}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] font-mono text-muted-foreground">Sin sanciones</p>
                )}
              </div>

              {agentOrders.length > 0 && (
                <div>
                  <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-1.5">ORDENES RECIBIDAS ({agentOrders.length})</div>
                  <div className="space-y-1.5">
                    {agentOrders.map((order) => (
                      <div key={order.id} className="rounded border border-[hsl(222_22%_18%)] bg-[hsl(222_22%_10%)] p-2">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[8px] font-mono text-muted-foreground/60 tabular-nums">
                            {new Date(order.issuedAt).toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className={cn("text-[8px] font-mono font-semibold", priorityColor(order.priority))}>
                            [{order.priority.toUpperCase()}]
                          </span>
                        </div>
                        <p className="text-[10px] text-foreground/70 leading-snug">{order.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[9px] font-mono text-muted-foreground">Ultimo activo: {formatTimeAgo(agent.lastActive)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Agents() {
  const { agents } = useCommandCenter();
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");
  const [search, setSearch] = useState("");

  const filtered = agents.filter((agent) => {
    if (statusFilter !== "all" && agent.status !== statusFilter) return false;
    if (search && !agent.codename.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-mono font-semibold text-foreground tracking-wide">Agentes</h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{agents.length} operativos registrados</p>
        </div>

        <input
          type="search"
          placeholder="Buscar agente..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="h-7 w-40 bg-muted border border-border rounded px-2.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-amber/50"
        />
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "px-2.5 py-1 rounded text-[10px] font-mono border transition-colors",
              statusFilter === filter.value
                ? "bg-amber/10 border-amber/40 text-amber"
                : "bg-transparent border-border text-muted-foreground hover:border-border/80 hover:text-foreground",
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  );
}
