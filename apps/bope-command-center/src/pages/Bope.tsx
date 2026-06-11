import { useMemo, useState } from "react";
import { Link } from "wouter";
import { MedalRibbonBar } from "@/components/shared/MedalBadge";
import { RankBadge, RankRibbon } from "@/components/shared/RankBadge";
import { SanctionBadge } from "@/components/shared/SanctionBadge";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { formatProceduralSkill, getSkillProfile } from "@/data/skillProfiles";
import { formatCost, missionCostEfficiency } from "@/lib/budget";
import {
  MEDAL_META,
  agentStatusColor,
  agentStatusLabel,
  cn,
  formatDate,
  formatTimeAgo,
  missionStatusColor,
  missionStatusLabel,
  sanctionColor,
} from "@/lib/utils";
import type { Agent, Medal, Mission, Sanction } from "@/types";

type MedalWithAgent = Medal & { agent: Agent };
type SanctionWithAgent = Sanction & { agent: Agent };

function Metric({ label, value, tone = "text-foreground" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="border border-border bg-card rounded-lg p-3 min-w-0">
      <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider truncate">{label}</div>
      <div className={cn("mt-1 text-xl font-mono font-bold tabular-nums", tone)}>{value}</div>
    </div>
  );
}

function BootPanel({ activeMission }: { activeMission: Mission | null }) {
  return (
    <section className="border-b border-border bg-[hsl(222_22%_7%)]">
      <div className="px-4 py-5 lg:px-6 lg:py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="text-[10px] font-mono text-amber tracking-[0.22em] uppercase">/bope online</div>
            <h1 className="mt-2 text-2xl lg:text-4xl font-mono font-bold text-foreground tracking-wide">
              BOPE VERSION DEFINITIVA
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-foreground/70 leading-relaxed">
              Puerta de arranque del batallon: mando, historias personales, records, condecoraciones, tribunales y premios en una sola vista operativa.
            </p>
          </div>

          <div className="border border-amber/30 bg-amber/5 rounded-lg px-4 py-3 min-w-[260px]">
            <div className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase">Estado de mando</div>
            <div className="mt-1 text-sm font-mono font-semibold text-amber">JOHN RAMBO EN MANDO</div>
            <div className="mt-2 text-[10px] text-foreground/60 leading-relaxed">
              {activeMission ? `${activeMission.codename}: ${activeMission.title}` : "Sin mision activa. Batallon en espera de orden directa."}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChainOfCommand({ agents }: { agents: Agent[] }) {
  const command = agents.filter((agent) => agent.id === "santiago" || agent.id === "john-rambo" || agent.id === "winston");
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-mono font-semibold text-foreground">Cadena de mando</h2>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Autoridad, ejecucion y memoria</p>
        </div>
        <Link href="/execute" className="text-[10px] font-mono text-amber hover:text-amber/80">
          Emitir orden
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {command.map((agent) => (
          <div key={agent.id} className="border border-border bg-card rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base font-mono font-bold text-foreground truncate">{agent.codename}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{agent.role}</div>
              </div>
              <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border border-current/30", agentStatusColor(agent.status))}>
                {agentStatusLabel(agent.status)}
              </span>
            </div>
            <div className="mt-3">
              <RankBadge rank={agent.rank} showTitle />
            </div>
            <p className="mt-3 text-xs text-foreground/70 leading-relaxed">{agent.bio}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AgentDossier({ agents }: { agents: Agent[] }) {
  const [selectedId, setSelectedId] = useState(agents[0]?.id ?? "");
  const selected = agents.find((agent) => agent.id === selectedId) ?? agents[0];
  const skillProfile = selected ? getSkillProfile(selected.id) : undefined;

  if (!selected) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-mono font-semibold text-foreground">Historias personales</h2>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Legajo visible del efectivo seleccionado</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-3">
        <div className="border border-border bg-card rounded-lg overflow-hidden">
          <div className="max-h-[540px] overflow-auto">
            {agents.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => setSelectedId(agent.id)}
                className={cn(
                  "w-full px-3 py-2.5 flex items-center gap-3 text-left border-b border-border/50 transition-colors",
                  selected.id === agent.id ? "bg-amber/10" : "hover:bg-muted/30",
                )}
              >
                <div className="w-8 h-8 rounded-md border border-border bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-amber">{agent.codename.slice(0, 2)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-mono font-semibold text-foreground truncate">{agent.codename}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{agent.specialization}</div>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground tabular-nums">{agent.trustScore}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border border-border bg-card rounded-lg p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="text-xl font-mono font-bold text-foreground">{selected.codename}</div>
              <div className="text-xs text-muted-foreground mt-1">{selected.role}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <RankBadge rank={selected.rank} showTitle />
                <span className={cn("text-[10px] font-mono px-2 py-1 rounded border border-current/30", agentStatusColor(selected.status))}>
                  {agentStatusLabel(selected.status)}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 min-w-[260px]">
              <Metric label="Trust" value={selected.trustScore} tone="text-green-400" />
              <Metric label="OK" value={selected.missionsCompleted} tone="text-amber" />
              <Metric label="Fallos" value={selected.missionsFailed} tone={selected.missionsFailed > 0 ? "text-red-500" : "text-green-400"} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase mb-1.5">Historia</div>
                <p className="text-sm text-foreground/75 leading-relaxed">{selected.bio}</p>
              </div>
              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase mb-1.5">Especializacion</div>
                <p className="text-xs text-foreground/70 leading-relaxed">{selected.specialization}</p>
              </div>
              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase mb-2">Habilidades</div>
                <div className="flex flex-wrap gap-1.5">
                  {selected.skills.map((skill) => (
                    <span key={skill} className="text-[9px] font-mono px-2 py-1 rounded bg-muted border border-border text-foreground/70">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {skillProfile && (
                <div className="rounded-lg border border-amber/30 bg-amber/5 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase mb-1">Skill operativo activo</div>
                      <div className="text-xs font-mono font-semibold text-amber">{skillProfile.label}</div>
                    </div>
                    <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", skillProfile.activation === "restricted" ? "border-red-500/40 text-red-400" : "border-amber/40 text-amber")}>
                      {skillProfile.activation.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-foreground/70 leading-relaxed">{skillProfile.mandate}</p>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <div className="text-[9px] font-mono text-muted-foreground uppercase mb-1">SKILL.md</div>
                      <div className="text-[9px] font-mono text-foreground/70 break-all">{skillProfile.skillPath}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-mono text-muted-foreground uppercase mb-1">Prompt</div>
                      <div className="text-[9px] font-mono text-foreground/70 break-all">{skillProfile.promptPath ?? "No aplica"}</div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase mb-2">Premios y medallas</div>
                <div className="space-y-2">
                  {selected.medals.length > 0 ? (
                    selected.medals.map((medal) => (
                      <div key={medal.id} className="flex items-start gap-2 rounded-md border border-border/70 bg-muted/20 p-2">
                        <MedalRibbonBar type={medal.type} height={10} />
                        <div className="min-w-0">
                          <div className={cn("text-[10px] font-mono font-semibold", MEDAL_META[medal.type].color)}>{medal.label}</div>
                          <div className="text-[9px] text-muted-foreground leading-relaxed">{medal.description}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] font-mono text-muted-foreground">Sin premios registrados</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase mb-2">Juicios y sanciones</div>
                <div className="space-y-2">
                  {selected.sanctions.length > 0 ? (
                    selected.sanctions.map((sanction) => (
                      <div key={sanction.id} className="rounded-md border border-border/70 bg-muted/20 p-2">
                        <div className="flex items-center justify-between gap-2">
                          <SanctionBadge sanction={sanction} />
                          <span className="text-[9px] font-mono text-muted-foreground">{formatDate(sanction.issuedAt)}</span>
                        </div>
                        <div className="mt-1.5 text-[10px] text-foreground/70">{sanction.reason}</div>
                        <div className="mt-0.5 text-[9px] text-muted-foreground leading-relaxed">{sanction.details}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[10px] font-mono text-green-400">Legajo limpio</div>
                  )}
                </div>
              </div>

              <div className="text-[9px] font-mono text-muted-foreground">Ultima actividad: {formatTimeAgo(selected.lastActive)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SkillRuntime({ agents }: { agents: Agent[] }) {
  const activeProfiles = agents
    .map((agent) => ({ agent, profile: getSkillProfile(agent.id) }))
    .filter((entry): entry is { agent: Agent; profile: NonNullable<ReturnType<typeof getSkillProfile>> } => Boolean(entry.profile));

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-mono font-semibold text-foreground">Runtime de skills</h2>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Skills activos que /bope usa para asignar, ejecutar y cerrar misiones</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {activeProfiles.map(({ agent, profile }) => (
          <div key={agent.id} className="border border-border bg-card rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-mono font-bold text-foreground">{agent.codename}</div>
                <div className="text-[10px] text-amber mt-0.5">{profile.label}</div>
              </div>
              <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded border", profile.activation === "restricted" ? "border-red-500/40 text-red-400" : "border-border text-muted-foreground")}>
                {profile.activation.toUpperCase()}
              </span>
            </div>
            <p className="mt-3 text-xs text-foreground/70 leading-relaxed">{profile.mandate}</p>
            <div className="mt-3">
              <div className="text-[9px] font-mono text-muted-foreground uppercase mb-1.5">Skills procedurales</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.defaultSkills.length > 0 ? (
                  profile.defaultSkills.map((skill) => (
                    <span key={skill} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted border border-border text-foreground/70">
                      {formatProceduralSkill(skill)}
                    </span>
                  ))
                ) : (
                  <span className="text-[9px] font-mono text-muted-foreground">Autoridad directa, sin skill procedural</span>
                )}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1.5 text-[9px] font-mono">
              <div className="text-muted-foreground break-all">SKILL: <span className="text-foreground/70">{profile.skillPath}</span></div>
              {profile.promptPath && <div className="text-muted-foreground break-all">PROMPT: <span className="text-foreground/70">{profile.promptPath}</span></div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function HonorBoard({ medals, sanctions }: { medals: MedalWithAgent[]; sanctions: SanctionWithAgent[] }) {
  const topMedals = medals
    .sort((left, right) => MEDAL_META[left.type].precedence - MEDAL_META[right.type].precedence)
    .slice(0, 10);
  const latestSanctions = sanctions
    .sort((left, right) => new Date(right.issuedAt).getTime() - new Date(left.issuedAt).getTime())
    .slice(0, 6);

  return (
    <section className="grid grid-cols-1 xl:grid-cols-2 gap-3">
      <div className="border border-border bg-card rounded-lg p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-mono font-semibold text-foreground">Medallero y premios</h2>
            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Ordenado por precedencia oficial</p>
          </div>
          <Link href="/records" className="text-[10px] font-mono text-amber hover:text-amber/80">
            Ver records
          </Link>
        </div>
        <div className="space-y-2">
          {topMedals.map((medal) => (
            <div key={`${medal.agent.id}-${medal.id}`} className="flex items-start gap-3 rounded-md border border-border/70 bg-muted/20 p-2.5">
              <MedalRibbonBar type={medal.type} height={12} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-semibold text-amber">{medal.agent.codename}</span>
                  <span className={cn("text-[9px] font-mono", MEDAL_META[medal.type].color)}>{MEDAL_META[medal.type].labelEs}</span>
                </div>
                <div className="mt-0.5 text-xs text-foreground/70 leading-snug">{medal.label}</div>
                <div className="mt-0.5 text-[9px] text-muted-foreground leading-relaxed">{medal.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-border bg-card rounded-lg p-4">
        <div className="mb-3">
          <h2 className="text-sm font-mono font-semibold text-foreground">Tribunal interno</h2>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Juicios, sanciones y rehabilitaciones</p>
        </div>
        <div className="space-y-2">
          {latestSanctions.length > 0 ? (
            latestSanctions.map((sanction) => (
              <div key={`${sanction.agent.id}-${sanction.id}`} className="flex items-start gap-3 rounded-md border border-border/70 bg-muted/20 p-2.5">
                <span className={cn("mt-0.5 text-sm font-mono", sanctionColor(sanction.severity))}>{sanction.resolved ? "○" : "●"}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono font-semibold text-amber">{sanction.agent.codename}</span>
                    <SanctionBadge sanction={sanction} />
                    <span className="text-[9px] font-mono text-muted-foreground">{formatDate(sanction.issuedAt)}</span>
                  </div>
                  <div className="mt-1 text-xs text-foreground/70">{sanction.reason}</div>
                  <div className="mt-0.5 text-[9px] text-muted-foreground leading-relaxed">{sanction.details}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-[10px] font-mono text-green-400">Sin causas abiertas ni sanciones historicas.</div>
          )}
        </div>
      </div>
    </section>
  );
}

function MissionTimeline({ missions }: { missions: Mission[] }) {
  const sorted = [...missions].sort((left, right) => {
    const leftDate = left.completedAt ?? left.startedAt ?? "";
    const rightDate = right.completedAt ?? right.startedAt ?? "";
    return new Date(rightDate).getTime() - new Date(leftDate).getTime();
  });

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-mono font-semibold text-foreground">Historial de misiones</h2>
        <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Operaciones, resultados y premios asociados</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {sorted.slice(0, 6).map((mission) => {
          const efficiency = missionCostEfficiency(mission.cost.estimated, mission.cost.actual);
          const date = mission.completedAt ?? mission.startedAt;
          return (
            <div key={mission.id} className="border border-border bg-card rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[9px] font-mono text-muted-foreground">{mission.codename}</div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground leading-snug">{mission.title}</div>
                </div>
                <span className={cn("text-[9px] font-mono flex-shrink-0", missionStatusColor(mission.status))}>
                  {missionStatusLabel(mission.status).toUpperCase()}
                </span>
              </div>
              <p className="mt-2 text-xs text-foreground/70 leading-relaxed">{mission.objective}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[9px] font-mono">
                {date && <span className="text-muted-foreground">{formatDate(date)}</span>}
                <span className="text-muted-foreground">
                  Est <span className="text-foreground">{formatCost(mission.cost.estimated)}</span>
                </span>
                <span className="text-muted-foreground">
                  Real <span className="text-green-400">{formatCost(mission.cost.actual)}</span>
                </span>
                <span className={efficiency >= 0 ? "text-green-400" : "text-red-500"}>{efficiency.toFixed(1)}%</span>
              </div>
              {mission.medals.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {mission.medals.map((medal) => (
                    <div key={medal.id} className="flex items-center gap-1 rounded border border-border px-1.5 py-1">
                      <MedalRibbonBar type={medal.type} height={8} />
                      <span className={cn("text-[8px] font-mono", MEDAL_META[medal.type].color)}>{MEDAL_META[medal.type].abbreviation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function Bope() {
  const { agents, missions, activeMission, globalBudget } = useCommandCenter();

  const medals = useMemo(
    () => agents.flatMap((agent) => agent.medals.map((medal) => ({ ...medal, agent }))),
    [agents],
  );
  const sanctions = useMemo(
    () => agents.flatMap((agent) => agent.sanctions.map((sanction) => ({ ...sanction, agent }))),
    [agents],
  );
  const activeAgents = agents.filter((agent) => agent.status === "active" || agent.status === "on_mission").length;
  const completedMissions = missions.filter((mission) => mission.status === "completed").length;
  const openSanctions = sanctions.filter((sanction) => !sanction.resolved).length;

  return (
    <div className="min-h-full bg-background">
      <BootPanel activeMission={activeMission} />

      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Metric label="Efectivos" value={agents.length} tone="text-amber" />
          <Metric label="Activos" value={activeAgents} tone="text-green-400" />
          <Metric label="Misiones cerradas" value={completedMissions} tone="text-amber" />
          <Metric label="Medallas" value={medals.length} tone="text-yellow-400" />
          <Metric label="Causas abiertas" value={openSanctions} tone={openSanctions > 0 ? "text-red-500" : "text-green-400"} />
        </div>

        {globalBudget && (
          <div className="border border-border bg-card rounded-lg p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-[9px] font-mono text-muted-foreground tracking-wider uppercase">Presupuesto operativo</div>
              <div className="mt-1 text-xs text-foreground/70">
                Usado {formatCost(globalBudget.accumulatedSpend)} de {formatCost(globalBudget.annual)}. Resto anual {formatCost(globalBudget.remainingAnnual)}.
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden md:w-80">
              <div
                className="h-full bg-amber rounded-full"
                style={{ width: `${Math.min(100, (globalBudget.accumulatedSpend / globalBudget.annual) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <ChainOfCommand agents={agents} />
        <AgentDossier agents={agents} />
        <SkillRuntime agents={agents} />
        <HonorBoard medals={medals} sanctions={sanctions} />
        <MissionTimeline missions={missions} />
      </div>
    </div>
  );
}
