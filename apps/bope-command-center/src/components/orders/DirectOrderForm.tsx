import { useState } from "react";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { cn, priorityLabel } from "@/lib/utils";
import type { MissionPriority } from "@/types";

interface Props {
  onSuccess: () => void;
}

export function DirectOrderForm({ onSuccess }: Props) {
  const { agents, createDirectOrder } = useCommandCenter();
  const [agentId, setAgentId] = useState(agents[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<MissionPriority>("medium");
  const [error, setError] = useState("");

  const priorities: MissionPriority[] = ["low", "medium", "high", "critical"];

  const priorityColor: Record<MissionPriority, string> = {
    low: "text-muted-foreground",
    medium: "text-blue-400",
    high: "text-amber",
    critical: "text-red-400",
  };

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!message.trim()) {
      setError("La instruccion no puede estar vacia.");
      return;
    }
    if (!agentId) {
      setError("Debes seleccionar un agente destino.");
      return;
    }

    try {
      await createDirectOrder({
        agentId,
        message: message.trim(),
        priority,
      });
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo emitir la orden.");
    }
  }

  const inputClass =
    "w-full bg-[hsl(222_22%_10%)] border border-[hsl(222_22%_18%)] rounded px-3 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber/50 transition-colors";
  const labelClass = "block text-[9px] font-mono tracking-[0.12em] text-muted-foreground mb-1";
  const selectedAgent = agents.find((agent) => agent.id === agentId);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={labelClass}>AGENTE DESTINO</label>
        <select
          className={inputClass}
          value={agentId}
          onChange={(event) => {
            setAgentId(event.target.value);
            setError("");
          }}
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.codename} - {agent.role}
            </option>
          ))}
        </select>
        {selectedAgent && (
          <div className="mt-1.5 flex items-center gap-2 px-2 py-1 bg-[hsl(222_22%_10%)] rounded border border-[hsl(222_22%_16%)]">
            <span className="text-[10px] font-mono font-semibold text-amber">{selectedAgent.codename}</span>
            <span className="text-[9px] font-mono text-muted-foreground">{selectedAgent.specialization}</span>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>INSTRUCCION</label>
        <textarea
          className={cn(inputClass, "resize-none h-28 leading-relaxed")}
          placeholder="Escribe la orden tactica con precision..."
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            setError("");
          }}
        />
      </div>

      <div>
        <label className={labelClass}>NIVEL DE URGENCIA</label>
        <div className="grid grid-cols-4 gap-1.5">
          {priorities.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setPriority(value)}
              className={cn(
                "py-1.5 rounded border text-[9px] font-mono font-semibold tracking-wider transition-all",
                priority === value
                  ? `border-current bg-current/10 ${priorityColor[value]}`
                  : "border-[hsl(222_22%_18%)] text-muted-foreground hover:border-[hsl(222_22%_28%)] hover:text-foreground",
              )}
            >
              {priorityLabel(value).toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-[10px] font-mono text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={agents.length === 0}
        className="w-full py-2 bg-[#8B1A1A] hover:bg-[#B22234] border border-[#B22234]/40 rounded text-[11px] font-mono font-semibold text-white tracking-[0.12em] transition-colors disabled:opacity-60"
      >
        TRANSMITIR ORDEN
      </button>
    </form>
  );
}
