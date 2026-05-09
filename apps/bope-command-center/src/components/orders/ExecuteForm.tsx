import { useState, useEffect, useRef } from "react";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { cn } from "@/lib/utils";
import type { ExecuteOrderResult } from "@/lib/api";

interface Props {
  onSuccess: () => void;
}

const AGENT_OPTIONS = [
  { id: "", label: "AUTO (detectar por keywords)" },
  { id: "john-rambo", label: "JOHN RAMBO — General" },
  { id: "pixel", label: "PIXEL — Frontend" },
  { id: "forge", label: "FORGE — Backend" },
  { id: "house", label: "HOUSE — QA / Debug" },
  { id: "cerberus", label: "CERBERUS — Seguridad" },
  { id: "nexus", label: "NEXUS — Integraciones" },
  { id: "sicario", label: "SICARIO — Refactor" },
  { id: "winston", label: "WINSTON — Docs" },
  { id: "blade", label: "BLADE — Performance" },
];

const PROVIDER_OPTIONS = [
  { id: "auto", label: "AUTO (routing por keywords)" },
  { id: "claude", label: "Claude (Anthropic)" },
  { id: "codex", label: "Codex (OpenAI)" },
];

const inputClass =
  "w-full bg-[hsl(222_22%_10%)] border border-[hsl(222_22%_18%)] rounded px-3 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber/50 transition-colors";
const labelClass = "block text-[9px] font-mono tracking-[0.12em] text-muted-foreground mb-1";

export function ExecuteForm({ onSuccess }: Props) {
  const { executeOrder, activeChunks } = useCommandCenter();
  const [order, setOrder] = useState("");
  const [agentId, setAgentId] = useState("");
  const [provider, setProvider] = useState<"auto" | "claude" | "codex">("auto");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ExecuteOrderResult | null>(null);
  const [error, setError] = useState("");
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll streaming log
  useEffect(() => {
    if (running) logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChunks, running]);

  const streamPreview = Object.values(activeChunks).join("\n\n");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!order.trim()) {
      setError("La orden no puede estar vacía.");
      return;
    }
    setError("");
    setResult(null);
    setRunning(true);

    try {
      const res = await executeOrder({
        order: order.trim(),
        provider,
        agentId: agentId || undefined,
      });
      setResult(res);
      // Close modal after showing result
      setTimeout(() => onSuccess(), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error ejecutando la orden.");
    } finally {
      setRunning(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 px-3 py-2 bg-[hsl(222_22%_10%)] rounded border border-[hsl(222_22%_18%)]">
          <span className="text-green-400 text-sm">✓</span>
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[9px] font-mono text-amber font-semibold">{result.agentId?.toUpperCase() ?? "—"}</span>
              <span className="text-[9px] font-mono text-muted-foreground">{result.model}</span>
              <span className={cn("text-[9px] font-mono", result.viaCliTool ? "text-green-400" : "text-amber")}>
                {result.viaCliTool ? "CLI ($0)" : `API $${result.costUSD.toFixed(4)}`}
              </span>
              <span className="text-[9px] font-mono text-muted-foreground">{(result.durationMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>

        <div className="bg-[hsl(222_22%_8%)] border border-[hsl(222_22%_16%)] rounded p-3 max-h-60 overflow-y-auto">
          <pre className="text-[11px] font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {result.output}
          </pre>
        </div>

        <button
          type="button"
          onClick={() => { setResult(null); setOrder(""); }}
          className="w-full py-2 bg-[hsl(222_22%_8%)] border border-[hsl(222_22%_22%)] rounded text-[10px] font-mono text-muted-foreground hover:bg-[hsl(222_22%_12%)] hover:text-foreground hover:border-[hsl(222_22%_32%)] transition-all duration-150"
        >
          NUEVA ORDEN
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelClass}>AGENTE</label>
          <select
            className={inputClass}
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            disabled={running}
          >
            {AGENT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>PROVIDER</label>
          <select
            className={inputClass}
            value={provider}
            onChange={(e) => setProvider(e.target.value as "auto" | "claude" | "codex")}
            disabled={running}
          >
            {PROVIDER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>ORDEN</label>
        <textarea
          className={cn(inputClass, "resize-none h-28 leading-relaxed")}
          placeholder="Escribí la orden. Sin agente = auto-routing por keywords."
          value={order}
          onChange={(e) => { setOrder(e.target.value); setError(""); }}
          disabled={running}
        />
      </div>

      {/* Streaming log — visible while executing */}
      {running && (
        <div className="bg-[hsl(222_22%_6%)] border border-[hsl(222_22%_14%)] rounded p-2 max-h-40 overflow-y-auto">
          {!streamPreview ? (
            <p className="text-[10px] font-mono text-muted-foreground animate-pulse">Conectando con el agente...</p>
          ) : (
            <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">{streamPreview}</pre>
          )}
          <div ref={logEndRef} />
        </div>
      )}

      {error && <p className="text-[10px] font-mono text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={running || !order.trim()}
        className={cn(
          "w-full py-2 border rounded text-[11px] font-mono font-semibold tracking-[0.12em] transition-all duration-200",
          running || !order.trim()
            ? "bg-amber/10 border-amber/30 text-amber cursor-not-allowed"
            : "bg-[#8B1A1A] hover:bg-[#B22234] border border-[#B22234]/60 text-white shadow-[0_0_12px_rgba(178,34,52,0.2)] hover:shadow-[0_0_18px_rgba(178,34,52,0.4)]"
        )}
      >
        {running ? "EJECUTANDO..." : "EJECUTAR"}
      </button>
    </form>
  );
}
