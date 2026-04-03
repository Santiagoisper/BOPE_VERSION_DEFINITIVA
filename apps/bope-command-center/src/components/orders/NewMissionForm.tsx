import { useState } from "react";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { cn, priorityLabel } from "@/lib/utils";
import type { MissionPriority } from "@/types";

interface Props {
  onSuccess: () => void;
}

export function NewMissionForm({ onSuccess }: Props) {
  const { agents, createMission } = useCommandCenter();
  const [codename, setCodename] = useState("");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [priority, setPriority] = useState<MissionPriority>("medium");
  const [leadAgent, setLeadAgent] = useState(agents[0]?.id ?? "");
  const [extraAgents, setExtraAgents] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");

  const priorities: MissionPriority[] = ["low", "medium", "high", "critical"];

  function toggleExtra(id: string) {
    setExtraAgents((previous) =>
      previous.includes(id) ? previous.filter((value) => value !== id) : [...previous, id],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalizedCodename = codename.trim().toUpperCase();
    if (!normalizedCodename || !title.trim() || !objective.trim()) {
      setError("Nombre clave, titulo y objetivo son obligatorios.");
      return;
    }
    if (!leadAgent) {
      setError("Debes seleccionar un agente lider.");
      return;
    }

    try {
      await createMission({
        codename: normalizedCodename,
        title: title.trim(),
        objective: objective.trim(),
        priority,
        leadAgent,
        assignedAgents: [leadAgent, ...extraAgents.filter((id) => id !== leadAgent)],
        estimatedBudget: parseFloat(budget) || 0,
      });
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo crear la mision.");
    }
  }

  const inputClass =
    "w-full bg-[hsl(222_22%_10%)] border border-[hsl(222_22%_18%)] rounded px-3 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber/50 transition-colors";
  const labelClass = "block text-[9px] font-mono tracking-[0.12em] text-muted-foreground mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>NOMBRE CLAVE</label>
          <input
            className={inputClass}
            placeholder="GOLF-006"
            value={codename}
            onChange={(event) => {
              setCodename(event.target.value.toUpperCase());
              setError("");
            }}
          />
        </div>
        <div>
          <label className={labelClass}>PRIORIDAD</label>
          <select
            className={inputClass}
            value={priority}
            onChange={(event) => setPriority(event.target.value as MissionPriority)}
          >
            {priorities.map((value) => (
              <option key={value} value={value}>
                {priorityLabel(value)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>TITULO DE MISION</label>
        <input
          className={inputClass}
          placeholder="Descripcion breve de la operacion"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            setError("");
          }}
        />
      </div>

      <div>
        <label className={labelClass}>OBJETIVO OPERATIVO</label>
        <textarea
          className={cn(inputClass, "resize-none h-20 leading-relaxed")}
          placeholder="Describe el objetivo tactico con detalle..."
          value={objective}
          onChange={(event) => {
            setObjective(event.target.value);
            setError("");
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>AGENTE LIDER</label>
          <select
            className={inputClass}
            value={leadAgent}
            onChange={(event) => {
              setLeadAgent(event.target.value);
              setExtraAgents((previous) => previous.filter((id) => id !== event.target.value));
            }}
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.codename}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>PRESUPUESTO EST. (USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={inputClass}
            placeholder="0.00"
            value={budget}
            onChange={(event) => setBudget(event.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>AGENTES ADICIONALES</label>
        <div className="border border-[hsl(222_22%_18%)] rounded p-2 max-h-28 overflow-y-auto space-y-1 bg-[hsl(222_22%_10%)]">
          {agents
            .filter((agent) => agent.id !== leadAgent)
            .map((agent) => (
              <label key={agent.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="accent-amber"
                  checked={extraAgents.includes(agent.id)}
                  onChange={() => toggleExtra(agent.id)}
                />
                <span className="text-[10px] font-mono text-foreground/70 group-hover:text-foreground transition-colors">
                  {agent.codename}
                </span>
                <span className="text-[8px] font-mono text-muted-foreground/50">{agent.role}</span>
              </label>
            ))}
        </div>
      </div>

      {error && <p className="text-[10px] font-mono text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={agents.length === 0}
        className="w-full py-2 bg-[#8B1A1A] hover:bg-[#B22234] border border-[#B22234]/40 rounded text-[11px] font-mono font-semibold text-white tracking-[0.12em] transition-colors disabled:opacity-60"
      >
        CONFIRMAR MISION
      </button>
    </form>
  );
}
