import { useState } from "react";
import { AGENTS } from "@/data/agents";
import { cn, priorityLabel } from "@/lib/utils";
import { useOrdersDispatch } from "@/context/OrdersContext";
import type { Mission, MissionPriority } from "@/types";

interface Props {
  onSuccess: () => void;
}

export function NewMissionForm({ onSuccess }: Props) {
  const dispatch = useOrdersDispatch();
  const [codename, setCodename] = useState("");
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [priority, setPriority] = useState<MissionPriority>("medium");
  const [leadAgent, setLeadAgent] = useState(AGENTS[0].id);
  const [extraAgents, setExtraAgents] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [error, setError] = useState("");

  const priorities: MissionPriority[] = ["low", "medium", "high", "critical"];

  function toggleExtra(id: string) {
    setExtraAgents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cod = codename.trim().toUpperCase();
    if (!cod || !title.trim() || !objective.trim()) {
      setError("Nombre clave, título y objetivo son obligatorios.");
      return;
    }
    const estimatedBudget = parseFloat(budget) || 0;
    const assigned = [leadAgent, ...extraAgents.filter((id) => id !== leadAgent)];
    const now = new Date().toISOString();

    const mission: Mission = {
      id: `user-${Date.now()}`,
      codename: cod,
      title: title.trim(),
      objective: objective.trim(),
      status: "planning",
      priority,
      leadAgent,
      assignedAgents: assigned,
      estimatedDuration: 0,
      cost: { estimated: estimatedBudget, actual: 0, byProvider: {} },
      events: [
        {
          id: `ue-${Date.now()}`,
          timestamp: now,
          type: "mission_start",
          agentId: leadAgent,
          message: `Orden emitida por Comandante. Misión ${cod} registrada en planificación.`,
          cost: 0,
        },
      ],
      medals: [],
      sanctions: [],
      tags: [],
    };

    dispatch({ type: "ADD_MISSION", mission });
    onSuccess();
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
            onChange={(e) => { setCodename(e.target.value.toUpperCase()); setError(""); }}
          />
        </div>
        <div>
          <label className={labelClass}>PRIORIDAD</label>
          <select
            className={inputClass}
            value={priority}
            onChange={(e) => setPriority(e.target.value as MissionPriority)}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>{priorityLabel(p)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>TÍTULO DE MISIÓN</label>
        <input
          className={inputClass}
          placeholder="Descripción breve de la operación"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(""); }}
        />
      </div>

      <div>
        <label className={labelClass}>OBJETIVO OPERATIVO</label>
        <textarea
          className={cn(inputClass, "resize-none h-20 leading-relaxed")}
          placeholder="Describí el objetivo táctico con detalle..."
          value={objective}
          onChange={(e) => { setObjective(e.target.value); setError(""); }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>AGENTE LÍDER</label>
          <select
            className={inputClass}
            value={leadAgent}
            onChange={(e) => { setLeadAgent(e.target.value); setExtraAgents((prev) => prev.filter((id) => id !== e.target.value)); }}
          >
            {AGENTS.map((a) => (
              <option key={a.id} value={a.id}>{a.codename}</option>
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
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>AGENTES ADICIONALES</label>
        <div className="border border-[hsl(222_22%_18%)] rounded p-2 max-h-28 overflow-y-auto space-y-1 bg-[hsl(222_22%_10%)]">
          {AGENTS.filter((a) => a.id !== leadAgent).map((a) => (
            <label key={a.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="accent-amber"
                checked={extraAgents.includes(a.id)}
                onChange={() => toggleExtra(a.id)}
              />
              <span className="text-[10px] font-mono text-foreground/70 group-hover:text-foreground transition-colors">
                {a.codename}
              </span>
              <span className="text-[8px] font-mono text-muted-foreground/50">{a.role}</span>
            </label>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-[10px] font-mono text-red-400">{error}</p>
      )}

      <button
        type="submit"
        className="w-full py-2 bg-[#8B1A1A] hover:bg-[#B22234] border border-[#B22234]/40 rounded text-[11px] font-mono font-semibold text-white tracking-[0.12em] transition-colors"
      >
        CONFIRMAR MISIÓN
      </button>
    </form>
  );
}
