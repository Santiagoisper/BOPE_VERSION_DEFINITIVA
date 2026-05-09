import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { cn, agentStatusDotClass } from "@/lib/utils";
import { getEngineStatusRequest, type EngineStatus, type ExecutionRecordDto } from "@/lib/api";

const inputClass =
  "w-full bg-[hsl(222_22%_10%)] border border-[hsl(222_22%_18%)] rounded px-3 py-1.5 text-[11px] font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-amber/50 transition-colors";
const labelClass = "block text-[9px] font-mono tracking-[0.12em] text-muted-foreground mb-1";

export default function Execute() {
  const {
    agents,
    executeOrder,
    isExecuting,
    activeChunks,
    executionLog,
    providerControls,
    executionHistory,
    refreshExecutionHistory,
  } = useCommandCenter();

  const [order, setOrder] = useState("");
  const [provider, setProvider] = useState<"auto" | "claude" | "codex">("auto");
  const [agentId, setAgentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [selected, setSelected] = useState<ExecutionRecordDto | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void refreshExecutionHistory();
  }, [refreshExecutionHistory]);

  useEffect(() => {
    getEngineStatusRequest().then(setEngineStatus).catch(() => {});
  }, []);

  const effectiveProvider = useMemo(() => {
    if (provider !== "auto") return provider;
    const codeKeywords = ["implementá", "escribí", "construí", "crear", "build", "code", "función", "clase", "component", "api", "endpoint", "refactor"];
    const lower = order.toLowerCase();
    const isCode = codeKeywords.some((kw) => lower.includes(kw));
    return isCode ? "codex" : "claude";
  }, [order, provider]);

  const providerWarning = useMemo(() => {
    const cfg = providerControls.find((c) => c.providerId === effectiveProvider);
    if (!cfg) return null;
    if (cfg.killSwitchActive) return `Kill switch activo en ${effectiveProvider.toUpperCase()}.`;
    if (!cfg.enabled) return `Provider ${effectiveProvider.toUpperCase()} deshabilitado.`;
    return null;
  }, [providerControls, effectiveProvider]);

  const streamPreview = Object.values(activeChunks).join("\n\n");

  const recentLog = useMemo(
    () =>
      [...executionLog].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).slice(-80),
    [executionLog],
  );

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [recentLog, streamPreview, isExecuting]);

  const handleExecute = useCallback(async () => {
    if (!order.trim() || isExecuting) return;
    setError(null);
    try {
      await executeOrder({
        order: order.trim(),
        provider,
        agentId: agentId || undefined,
      });
      setOrder("");
      await refreshExecutionHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al ejecutar.");
    }
  }, [order, provider, agentId, isExecuting, executeOrder, refreshExecutionHistory]);

  return (
    <div className="h-full flex flex-col p-4 gap-4 overflow-hidden min-h-0">
      <div className="flex items-baseline gap-3 flex-shrink-0">
        <h1 className="text-base font-mono font-semibold text-foreground tracking-wide">Panel de ejecución</h1>
        <span className="text-[10px] font-mono text-muted-foreground tracking-wider">/execute · SSE + historial Neon</span>
      </div>

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Formulario */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3 overflow-y-auto">
          {providerWarning && (
            <div className="text-[10px] font-mono text-amber border border-amber/40 bg-amber/10 rounded px-2 py-1.5">
              {providerWarning}
            </div>
          )}

          <div>
            <label className={labelClass}>PROVIDER</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as "auto" | "claude" | "codex")}
              disabled={isExecuting}
              className={inputClass}
            >
              <option value="auto">AUTO</option>
              <option value="claude">CLAUDE</option>
              <option value="codex">CODEX</option>
            </select>
            <p className="text-[9px] font-mono text-muted-foreground mt-1">
              Efectivo para gobernanza: <span className="text-amber">{effectiveProvider}</span>
            </p>
          </div>

          <div>
            <label className={labelClass}>AGENTE (opcional)</label>
            <select
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              disabled={isExecuting}
              className={inputClass}
            >
              <option value="">AUTO (routing por keywords)</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.codename}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <label className={labelClass}>ORDEN</label>
            <textarea
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              disabled={isExecuting}
              placeholder="Orden para el batallón..."
              className={cn(inputClass, "flex-1 min-h-[120px] resize-none leading-relaxed")}
            />
          </div>

          {error && <div className="text-[10px] font-mono text-red-400">{error}</div>}

          <button
            type="button"
            onClick={() => void handleExecute()}
            disabled={isExecuting || !order.trim()}
            className="px-3 py-2 bg-amber text-background text-[10px] font-mono font-bold rounded hover:bg-amber/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isExecuting ? "EJECUTANDO…" : "EJECUTAR"}
          </button>

          {engineStatus && (
            <div className="text-[9px] font-mono border border-border rounded p-2 space-y-1 text-muted-foreground">
              <div className="text-amber font-semibold tracking-wider">ENGINE</div>
              <div className="flex items-center gap-1">
                <span className={cn("status-dot", agentStatusDotClass("active"))} />
                Claude: {engineStatus.claude.mode} · Codex: {engineStatus.codex.mode}
              </div>
            </div>
          )}
        </div>

        {/* Consola */}
        <div className="flex-1 flex flex-col min-w-0 bg-[hsl(222_22%_7%)] border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-shrink-0">
            <span className="text-[10px] font-mono text-muted-foreground tracking-[0.15em]">CONSOLA</span>
            {isExecuting && (
              <span className="text-[9px] font-mono text-amber animate-pulse">EN VIVO</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] space-y-1">
            {recentLog.map((e) => (
              <div
                key={e.id}
                className={cn(
                  "whitespace-pre-wrap break-all",
                  e.type === "error" && "text-red-400",
                  e.type === "completed" && "text-green-400",
                )}
              >
                <span className="text-muted-foreground/70">[{e.type}]</span> {e.message}
              </div>
            ))}
            {streamPreview && (
              <div className="text-amber/90 whitespace-pre-wrap break-all border-t border-border/50 pt-2 mt-2">
                <span className="text-muted-foreground/70">[streaming]</span> {streamPreview}
              </div>
            )}
            <div ref={logEndRef} />
          </div>
        </div>

        {/* Historial */}
        <div className="w-80 flex-shrink-0 flex flex-col min-h-0 border border-border rounded-lg overflow-hidden bg-card">
          <div className="px-3 py-2 border-b border-border text-[10px] font-mono text-muted-foreground tracking-wider">
            HISTORIAL (Neon)
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {executionHistory.map((row) => (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelected(row)}
                className={cn(
                  "w-full text-left px-3 py-2 hover:bg-muted/40 transition-colors",
                  selected?.id === row.id && "bg-muted/30",
                )}
              >
                <div className="text-[10px] font-mono text-amber truncate">{row.agentId}</div>
                <div className="text-[9px] font-mono text-muted-foreground">
                  {row.provider} · ${row.costUSD.toFixed(4)} · {row.status}
                </div>
                <div className="text-[9px] font-mono text-foreground/70 truncate mt-0.5">{row.order}</div>
              </button>
            ))}
            {executionHistory.length === 0 && (
              <div className="p-3 text-[10px] font-mono text-muted-foreground">Sin ejecuciones persistidas aún.</div>
            )}
          </div>
          {selected && (
            <div className="border-t border-border p-3 max-h-[45%] overflow-y-auto flex-shrink-0 bg-[hsl(222_22%_6%)]">
              <div className="text-[9px] font-mono text-muted-foreground mb-1">DETALLE</div>
              <div className="text-[10px] font-mono space-y-1 text-foreground/80">
                <div>
                  <span className="text-muted-foreground">modelo:</span> {selected.model}
                </div>
                <div>
                  <span className="text-muted-foreground">duración:</span> {selected.durationMs}ms
                </div>
                <div>
                  <span className="text-muted-foreground">ts:</span> {selected.timestamp}
                </div>
              </div>
              <pre className="mt-2 text-[10px] font-mono whitespace-pre-wrap break-all text-foreground/90 leading-relaxed">
                {selected.output}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
