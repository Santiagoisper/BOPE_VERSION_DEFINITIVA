import { useState } from "react";
import { AGENTS } from "@/data/agents";
import { cn, priorityLabel } from "@/lib/utils";
import { useOrdersDispatch } from "@/context/OrdersContext";
import type { DirectOrder, MissionPriority } from "@/types";

interface Props {
  onSuccess: () => void;
}

export function DirectOrderForm({ onSuccess }: Props) {
  const dispatch = useOrdersDispatch();
  const [agentId, setAgentId] = useState(AGENTS[0].id);
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("La instrucción no puede estar vacía.");
      return;
    }
    const order: DirectOrder = {
      id: `do-${Date.now()}`,
      agentId,
      message: message.trim(),
      priority,
      issuedAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_DIRECT_ORDER", order });
    onSuccess();
  }

  const inputClass =
    "w-full bg-[hsl(222_22%_10%)] border border-[hsl(222_22%_18%)] rounded px-3 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber/50 transition-colors";
  const labelClass = "block text-[9px] font-mono tracking-[0.12em] text-muted-foreground mb-1";

  const selectedAgent = AGENTS.find((a) => a.id === agentId);

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className={labelClass}>AGENTE DESTINO</label>
        <select
          className={inputClass}
          value={agentId}
          onChange={(e) => { setAgentId(e.target.value); setError(""); }}
        >
          {AGENTS.map((a) => (
            <option key={a.id} value={a.id}>{a.codename} — {a.role}</option>
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
        <label className={labelClass}>INSTRUCCIÓN</label>
        <textarea
          className={cn(inputClass, "resize-none h-28 leading-relaxed")}
          placeholder="Escribí la orden táctica con precisión. El agente ejecutará según lo especificado..."
          value={message}
          onChange={(e) => { setMessage(e.target.value); setError(""); }}
        />
      </div>

      <div>
        <label className={labelClass}>NIVEL DE URGENCIA</label>
        <div className="grid grid-cols-4 gap-1.5">
          {priorities.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={cn(
                "py-1.5 rounded border text-[9px] font-mono font-semibold tracking-wider transition-all",
                priority === p
                  ? "border-current bg-current/10 " + priorityColor[p]
                  : "border-[hsl(222_22%_18%)] text-muted-foreground hover:border-[hsl(222_22%_28%)] hover:text-foreground"
              )}
            >
              {priorityLabel(p).toUpperCase()}
            </button>
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
        TRANSMITIR ORDEN
      </button>
    </form>
  );
}
