import { AGENTS } from "@/data/agents";
import { MISSIONS } from "@/data/missions";
import { cn, sanctionColor, sanctionLabel, formatDate, missionStatusColor, MEDAL_META, RANK_META } from "@/lib/utils";
import { formatCost, missionCostEfficiency } from "@/lib/budget";
import { MedalRibbonBar } from "@/components/shared/MedalBadge";
import { RankRibbon } from "@/components/shared/RankBadge";
import type { Sanction } from "@/types";

function HallOfHonor() {
  const sorted = [...AGENTS].sort((a, b) => b.trustScore - a.trustScore);
  const top3 = sorted.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-muted-foreground tracking-wider">CUADRO DE HONOR</div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {top3.map((agent, i) => {
          const posColors = ["text-yellow-400", "text-slate-300", "text-amber-700"];
          const posBg = ["border-yellow-400/30 bg-yellow-400/5", "border-slate-400/20 bg-slate-400/5", "border-amber-700/20 bg-amber-700/5"];
          const posLabels = ["1°", "2°", "3°"];
          const rankMeta = RANK_META[agent.rank];

          return (
            <div key={agent.id} className={cn("border rounded-lg p-4 space-y-3", posBg[i])}>
              <div className="flex items-start gap-3">
                <span className={cn("text-xl font-mono font-bold flex-shrink-0 mt-0.5", posColors[i])}>
                  {posLabels[i]}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-mono font-bold text-foreground">{agent.codename}</div>
                  <div className="text-[9px] text-muted-foreground">{agent.role}</div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <RankRibbon rank={agent.rank} height={7} width={32} />
                    <span className="text-[8px] font-mono text-muted-foreground uppercase">{rankMeta.abbreviation}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[9px] font-mono text-muted-foreground">Trust</div>
                  <div className={cn("text-lg font-mono font-bold", posColors[i])}>{agent.trustScore}</div>
                </div>
                <div>
                  <div className="text-[9px] font-mono text-muted-foreground">Misiones</div>
                  <div className="text-lg font-mono font-bold text-green-400">{agent.missionsCompleted}</div>
                </div>
              </div>

              {agent.medals.length > 0 && (
                <div>
                  <div className="text-[8px] font-mono text-muted-foreground tracking-wider mb-1.5">CONDECORACIONES</div>
                  <div className="flex flex-col gap-1">
                    {agent.medals.map((medal) => {
                      const meta = MEDAL_META[medal.type];
                      return (
                        <div key={medal.id} className="flex items-center gap-1.5" title={`${meta.label}: ${medal.description}`}>
                          <MedalRibbonBar type={medal.type} height={8} />
                          <span className={cn("font-mono text-[8px] uppercase tracking-wide", meta.color)}>
                            {meta.abbreviation}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-3 py-2 text-[9px] text-muted-foreground font-medium tracking-wider">AGENTE</th>
              <th className="text-left px-3 py-2 text-[9px] text-muted-foreground font-medium tracking-wider hidden sm:table-cell">RANGO</th>
              <th className="text-right px-3 py-2 text-[9px] text-muted-foreground font-medium tracking-wider">TRUST</th>
              <th className="text-right px-3 py-2 text-[9px] text-muted-foreground font-medium tracking-wider">COMPLETADAS</th>
              <th className="text-right px-3 py-2 text-[9px] text-muted-foreground font-medium tracking-wider">FALLIDAS</th>
              <th className="text-right px-3 py-2 text-[9px] text-muted-foreground font-medium tracking-wider">COSTO</th>
              <th className="text-right px-3 py-2 text-[9px] text-muted-foreground font-medium tracking-wider">CONDECORACIONES</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((agent, i) => (
              <tr key={agent.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                    <span className="text-foreground font-semibold">{agent.codename}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    <RankRibbon rank={agent.rank} height={6} width={28} />
                    <span className="text-[8px] text-muted-foreground">{RANK_META[agent.rank].abbreviation}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className={cn(
                    "font-semibold",
                    agent.trustScore >= 95 ? "text-green-400" :
                    agent.trustScore >= 85 ? "text-amber" : "text-red-500"
                  )}>
                    {agent.trustScore}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right text-green-400">{agent.missionsCompleted}</td>
                <td className="px-3 py-2.5 text-right text-red-500">{agent.missionsFailed}</td>
                <td className="px-3 py-2.5 text-right text-foreground/70">{formatCost(agent.historicalCost)}</td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex gap-0.5 justify-end items-center">
                    {agent.medals.slice(0, 3).map((m) => (
                      <MedalRibbonBar key={m.id} type={m.type} height={8} />
                    ))}
                    {agent.medals.length > 3 && (
                      <span className="text-[8px] text-muted-foreground ml-0.5">+{agent.medals.length - 3}</span>
                    )}
                    {agent.medals.length === 0 && (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SanctionsLog() {
  const allSanctions: Array<Sanction & { agentCodename: string }> = AGENTS.flatMap((a) =>
    a.sanctions.map((s) => ({ ...s, agentCodename: a.codename }))
  );
  const sorted = [...allSanctions].sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-muted-foreground tracking-wider">HISTORIAL DE SANCIONES</div>

      {sorted.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs font-mono">
          Sin sanciones registradas
        </div>
      ) : (
        <div className="space-y-2">
          {sorted.map((sanction) => (
            <div
              key={sanction.id}
              className={cn(
                "border rounded-lg p-3 flex items-start gap-3",
                sanction.resolved ? "border-border opacity-60" : "border-current/20"
              )}
            >
              <span className={cn("text-sm font-mono flex-shrink-0 mt-0.5", sanctionColor(sanction.severity))}>
                {sanction.resolved ? "○" : "●"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-mono font-semibold text-amber">{sanction.agentCodename}</span>
                  <span className={cn("text-[9px] font-mono px-1 rounded border border-current/30", sanctionColor(sanction.severity))}>
                    {sanctionLabel(sanction.severity).toUpperCase()}
                  </span>
                  {sanction.resolved && (
                    <span className="text-[9px] font-mono text-green-400/70">RESUELTO</span>
                  )}
                </div>
                <div className="text-xs text-foreground/70">{sanction.reason}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{sanction.details}</div>
              </div>
              <div className="text-[9px] font-mono text-muted-foreground flex-shrink-0">
                {formatDate(sanction.issuedAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeaturedMissions() {
  const completed = MISSIONS.filter((m) => m.status === "completed");
  const failed = MISSIONS.filter((m) => m.status === "failed");

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-mono text-muted-foreground tracking-wider">MISIONES DESTACADAS</div>

      <div className="grid grid-cols-1 gap-3">
        {completed.map((mission) => {
          const efficiency = missionCostEfficiency(mission.cost.estimated, mission.cost.actual);
          return (
            <div key={mission.id} className="bg-card border border-green-900/30 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-[9px] font-mono text-muted-foreground mb-0.5">{mission.codename}</div>
                  <div className="text-xs font-semibold text-foreground">{mission.title}</div>
                </div>
                <span className="text-[9px] font-mono text-green-400 flex-shrink-0">COMPLETADA</span>
              </div>

              {mission.outcome && (
                <p className="text-[9px] text-muted-foreground leading-relaxed line-clamp-2">{mission.outcome}</p>
              )}

              <div className="flex items-center gap-4 text-[9px] font-mono">
                <span className="text-muted-foreground">
                  Est: <span className="text-foreground">{formatCost(mission.cost.estimated)}</span>
                </span>
                <span className="text-muted-foreground">
                  Real: <span className="text-green-400">{formatCost(mission.cost.actual)}</span>
                </span>
                <span className={cn(efficiency >= 0 ? "text-green-400" : "text-red-500")}>
                  {efficiency >= 0 ? "+" : ""}{efficiency.toFixed(1)}%
                </span>
              </div>

              {mission.medals.length > 0 && (
                <div className="flex gap-1 flex-wrap items-center">
                  {mission.medals.map((medal) => {
                    const meta = MEDAL_META[medal.type];
                    return (
                      <div key={medal.id} className="flex items-center gap-1" title={`${meta.label}: ${medal.description}`}>
                        <MedalRibbonBar type={medal.type} height={8} />
                        <span className={cn("text-[8px] font-mono", meta.color)}>{meta.abbreviation}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {failed.map((mission) => (
          <div key={mission.id} className="bg-card border border-red-900/30 rounded-lg p-4 space-y-2 opacity-70">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-[9px] font-mono text-muted-foreground mb-0.5">{mission.codename}</div>
                <div className="text-xs font-semibold text-foreground">{mission.title}</div>
              </div>
              <span className="text-[9px] font-mono text-red-500 flex-shrink-0">FALLIDA</span>
            </div>
            {mission.outcome && (
              <p className="text-[9px] text-muted-foreground leading-relaxed">{mission.outcome}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentStats() {
  const stats = {
    totalAgents: AGENTS.length,
    totalMissions: AGENTS.reduce((sum, a) => sum + a.missionsCompleted + a.missionsFailed, 0),
    totalMedals: AGENTS.reduce((sum, a) => sum + a.medals.length, 0),
    totalSanctions: AGENTS.reduce((sum, a) => sum + a.sanctions.length, 0),
    activeSanctions: AGENTS.reduce((sum, a) => sum + a.sanctions.filter((s) => !s.resolved).length, 0),
    avgTrust: (AGENTS.reduce((sum, a) => sum + a.trustScore, 0) / AGENTS.length).toFixed(1),
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[
        { label: "Agentes", value: stats.totalAgents, color: "text-amber" },
        { label: "Misiones totales", value: stats.totalMissions, color: "text-amber" },
        { label: "Condecoraciones", value: stats.totalMedals, color: "text-yellow-400" },
        { label: "Sanciones emitidas", value: stats.totalSanctions, color: "text-red-500" },
        { label: "Sanciones activas", value: stats.activeSanctions, color: stats.activeSanctions > 0 ? "text-orange-400" : "text-green-400" },
        { label: "Trust promedio", value: `${stats.avgTrust}`, color: "text-green-400" },
      ].map((stat) => (
        <div key={stat.label} className="bg-card border border-border rounded-lg p-3">
          <div className="text-[9px] font-mono text-muted-foreground mb-1">{stat.label.toUpperCase()}</div>
          <div className={cn("text-xl font-mono font-bold", stat.color)}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function Records() {
  return (
    <div className="p-4 space-y-8">
      <div>
        <h1 className="text-base font-mono font-semibold text-foreground tracking-wide">Registros</h1>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Historial operativo del batallón</p>
      </div>

      <AgentStats />
      <HallOfHonor />
      <SanctionsLog />
      <FeaturedMissions />
    </div>
  );
}
