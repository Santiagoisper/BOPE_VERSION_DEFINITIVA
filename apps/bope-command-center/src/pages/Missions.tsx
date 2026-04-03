import { useState } from "react";
import { MedalBadge } from "@/components/shared/MedalBadge";
import { SanctionBadge } from "@/components/shared/SanctionBadge";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { formatCost, missionCostEfficiency } from "@/lib/budget";
import {
  cn,
  formatDateTime,
  missionStatusColor,
  missionStatusLabel,
  priorityBadgeClass,
  priorityLabel,
} from "@/lib/utils";
import type { Mission, MissionStatus } from "@/types";

const EVENT_ICONS: Record<string, string> = {
  mission_start: "▶",
  checkpoint: "◆",
  tool_call: "⚙",
  cost_alert: "⚠",
  completion: "✓",
  error: "✕",
  review: "◎",
  handoff: "→",
};

const EVENT_COLORS: Record<string, string> = {
  mission_start: "text-blue-400",
  checkpoint: "text-amber",
  tool_call: "text-foreground/60",
  cost_alert: "text-orange-400",
  completion: "text-green-400",
  error: "text-red-500",
  review: "text-purple-400",
  handoff: "text-cyan-400",
};

const STATUS_FILTERS: { value: MissionStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Activa" },
  { value: "planning", label: "Planificacion" },
  { value: "completed", label: "Completada" },
  { value: "failed", label: "Fallida" },
];

function MissionTimeline({ mission }: { mission: Mission }) {
  const { agents } = useCommandCenter();

  return (
    <div className="space-y-2">
      {mission.events.map((event, index) => {
        const agent = event.agentId ? agents.find((item) => item.id === event.agentId) : null;
        const isLast = index === mission.events.length - 1;
        return (
          <div key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span className={cn("text-xs font-mono flex-shrink-0 w-4 text-center", EVENT_COLORS[event.type])}>
                {EVENT_ICONS[event.type]}
              </span>
              {!isLast && <div className="w-px flex-1 bg-border mt-1" />}
            </div>
            <div className="pb-3 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-mono text-muted-foreground tabular-nums">{formatDateTime(event.timestamp)}</span>
                {agent && <span className="text-[9px] font-mono text-amber">[{agent.codename}]</span>}
              </div>
              <p className="text-xs text-foreground/70 mt-0.5">{event.message}</p>
              {event.cost !== undefined && event.cost > 0 && (
                <span className="text-[9px] font-mono text-amber/60 mt-0.5 inline-block">+{formatCost(event.cost)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MissionDetail({ mission }: { mission: Mission }) {
  const { agents } = useCommandCenter();
  const efficiency = missionCostEfficiency(mission.cost.estimated, mission.cost.actual);
  const costDiff = mission.cost.estimated - mission.cost.actual;
  const hasCost = mission.cost.actual > 0;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[9px] font-mono text-muted-foreground tracking-wider">{mission.codename}</span>
          <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded", priorityBadgeClass(mission.priority))}>{priorityLabel(mission.priority)}</span>
          <span className={cn("text-[9px] font-mono", missionStatusColor(mission.status))}>{missionStatusLabel(mission.status)}</span>
        </div>
        <h2 className="text-sm font-semibold text-foreground">{mission.title}</h2>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{mission.objective}</p>
      </div>

      <div>
        <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">AGENTES</div>
        <div className="flex flex-wrap gap-1.5">
          {mission.assignedAgents.map((id) => {
            const agent = agents.find((item) => item.id === id);
            if (!agent) return null;
            const isLead = id === mission.leadAgent;
            return (
              <div key={id} className={cn("flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono", isLead ? "border-amber/40 bg-amber/5 text-amber" : "border-border text-muted-foreground")}>
                {isLead && <span className="text-amber">★</span>}
                {agent.codename}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">PRESUPUESTO DE MISION</div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-muted/50 rounded p-2.5">
            <div className="text-[9px] font-mono text-muted-foreground">Estimado</div>
            <div className="text-sm font-mono font-semibold text-foreground">{formatCost(mission.cost.estimated)}</div>
          </div>
          <div className="bg-muted/50 rounded p-2.5">
            <div className="text-[9px] font-mono text-muted-foreground">Real</div>
            <div className={cn("text-sm font-mono font-semibold", hasCost ? (costDiff >= 0 ? "text-green-400" : "text-red-500") : "text-muted-foreground")}>
              {hasCost ? formatCost(mission.cost.actual) : "-"}
            </div>
          </div>
          <div className="bg-muted/50 rounded p-2.5">
            <div className="text-[9px] font-mono text-muted-foreground">Eficiencia</div>
            <div className={cn("text-sm font-mono font-semibold", hasCost ? (efficiency >= 0 ? "text-green-400" : "text-red-500") : "text-muted-foreground")}>
              {hasCost ? `${efficiency >= 0 ? "+" : ""}${efficiency.toFixed(1)}%` : "-"}
            </div>
          </div>
        </div>
      </div>

      {(mission.medals.length > 0 || mission.sanctions.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {mission.medals.length > 0 && (
            <div>
              <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-1.5">MEDALLAS</div>
              <div className="space-y-1">
                {mission.medals.map((medal) => (
                  <MedalBadge key={medal.id} medal={medal} size="sm" showLabel />
                ))}
              </div>
            </div>
          )}
          {mission.sanctions.length > 0 && (
            <div>
              <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-1.5">SANCIONES</div>
              <div className="space-y-1">
                {mission.sanctions.map((sanction) => (
                  <SanctionBadge key={sanction.id} sanction={sanction} size="sm" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mission.events.length > 0 && (
        <div>
          <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-3">TIMELINE ({mission.events.length} eventos)</div>
          <MissionTimeline mission={mission} />
        </div>
      )}
    </div>
  );
}

export default function Missions() {
  const { missions } = useCommandCenter();
  const [statusFilter, setStatusFilter] = useState<MissionStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(missions[0]?.id ?? null);

  const filtered = missions.filter((mission) => statusFilter === "all" || mission.status === statusFilter);
  const selected = missions.find((mission) => mission.id === selectedId) ?? filtered[0];

  return (
    <div className="h-full flex overflow-hidden">
      <div className="w-72 flex-shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex-shrink-0 space-y-3">
          <div>
            <h1 className="text-base font-mono font-semibold text-foreground">Misiones</h1>
            <p className="text-[10px] font-mono text-muted-foreground">{missions.length} registradas</p>
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-mono border transition-colors",
                  statusFilter === filter.value ? "bg-amber/10 border-amber/40 text-amber" : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
          {filtered.map((mission) => (
            <button
              key={mission.id}
              onClick={() => setSelectedId(mission.id)}
              className={cn("w-full text-left rounded-md p-3 border transition-all", selected?.id === mission.id ? "border-amber/30 bg-amber/5" : "border-border hover:border-border/80 bg-card")}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono text-muted-foreground">{mission.codename}</span>
                <span className={cn("text-[9px] font-mono px-1 rounded", priorityBadgeClass(mission.priority))}>{priorityLabel(mission.priority)}</span>
              </div>
              <div className="text-[11px] font-semibold text-foreground leading-snug mb-1 line-clamp-2">{mission.title}</div>
              <div className="flex items-center justify-between">
                <span className={cn("text-[9px] font-mono", missionStatusColor(mission.status))}>{missionStatusLabel(mission.status)}</span>
                <span className="text-[9px] font-mono text-muted-foreground">{formatCost(mission.cost.estimated)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {selected ? (
          <MissionDetail mission={selected} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-muted-foreground text-sm font-mono">Selecciona una mision</p>
          </div>
        )}
      </div>
    </div>
  );
}
