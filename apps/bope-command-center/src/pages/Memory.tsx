import { useEffect, useMemo, useState } from "react";
import type { ComponentType, FormEvent, ReactNode } from "react";
import { AlertTriangle, Brain, CheckCircle2, Database, FileSearch, GitBranch, RefreshCw, ShieldCheck, UploadCloud } from "lucide-react";
import {
  getMemoryConflictsRequest,
  getMemoryStatusRequest,
  searchMemoryRequest,
  syncMemoryRequest,
  syncObsidianRequest,
  type MemoryConflict,
  type MemorySearchResult,
  type MemoryStatusResponse,
  type MemorySyncResponse,
  type ObsidianSyncResponse,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const MOUNT_ICON: Record<string, ComponentType<{ className?: string }>> = {
  workspace: GitBranch,
  obsidianVault: Brain,
  cerebro: Database,
};

const CONFLICT_COLOR: Record<MemoryConflict["severity"], string> = {
  info: "text-cyan-300 border-cyan-500/25 bg-cyan-500/5",
  warning: "text-amber border-amber/25 bg-amber/5",
  critical: "text-red-400 border-red-500/25 bg-red-500/5",
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "sin índice";
  return new Date(value).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MountCard({ mount }: { mount: MemoryStatusResponse["mounts"][number] }) {
  const Icon = MOUNT_ICON[mount.id] ?? Database;
  const healthy = mount.configured && mount.exists && mount.isDirectory;

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className={cn("h-8 w-8 rounded-md border flex items-center justify-center", healthy ? "border-green-500/25 bg-green-500/10 text-green-400" : "border-red-500/25 bg-red-500/10 text-red-400")}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-mono font-semibold text-foreground">{mount.label}</h3>
            <span className={cn("text-[9px] font-mono", healthy ? "text-green-400" : "text-red-400")}>
              {healthy ? "ONLINE" : "NO DISPONIBLE"}
            </span>
          </div>
          <p className="mt-1 text-[10px] font-mono text-muted-foreground truncate" title={mount.path ?? "sin ruta"}>
            {mount.path ?? "sin ruta configurada"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-muted/50 rounded p-2">
          <div className="text-[9px] font-mono text-muted-foreground">Config</div>
          <div className={cn("text-[11px] font-mono font-semibold", mount.configured ? "text-green-400" : "text-red-400")}>{mount.configured ? "SI" : "NO"}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-[9px] font-mono text-muted-foreground">Existe</div>
          <div className={cn("text-[11px] font-mono font-semibold", mount.exists ? "text-green-400" : "text-red-400")}>{mount.exists ? "SI" : "NO"}</div>
        </div>
        <div className="bg-muted/50 rounded p-2">
          <div className="text-[9px] font-mono text-muted-foreground">MD</div>
          <div className="text-[11px] font-mono font-semibold text-amber">{mount.markdownFiles}</div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  children,
  tone = "default",
}: {
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 text-[10px] font-mono font-semibold transition-colors disabled:opacity-45 disabled:cursor-not-allowed",
        tone === "danger"
          ? "border-amber/35 bg-amber text-background hover:bg-amber/90"
          : "border-border bg-muted text-foreground hover:border-amber/50 hover:text-amber",
      )}
    >
      {children}
    </button>
  );
}

function SyncStats({ sync }: { sync: MemorySyncResponse | null }) {
  if (!sync) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-[11px] font-mono text-muted-foreground">
        Todavía no se ejecutó sincronización en esta sesión.
      </div>
    );
  }

  const items = [
    ["Escaneados", sync.stats.scannedFiles],
    ["Indexados", sync.stats.indexedFiles],
    ["Cambiados", sync.stats.changedFiles],
    ["Removidos", sync.stats.removedFiles],
    ["Saltados", sync.stats.skippedFiles],
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground tracking-wider">ÚLTIMO SYNC</span>
        <span className="text-[10px] font-mono text-amber">{formatDate(sync.generatedAt)}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {items.map(([label, value]) => (
          <div key={label} className="bg-muted/50 rounded p-2">
            <div className="text-[9px] font-mono text-muted-foreground">{label}</div>
            <div className="text-sm font-mono font-bold text-foreground">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConflictList({ conflicts }: { conflicts: MemoryConflict[] }) {
  if (conflicts.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
        <CheckCircle2 className="h-4 w-4 text-green-400" />
        <span className="text-[11px] font-mono text-green-400">Sin conflictos detectados en el índice actual.</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {conflicts.map((conflict) => (
        <div key={conflict.id} className={cn("border rounded-lg p-3 space-y-2", CONFLICT_COLOR[conflict.severity])}>
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-mono font-semibold text-foreground">{conflict.title}</div>
              <div className="mt-1 text-[10px] text-muted-foreground leading-relaxed">{conflict.description}</div>
            </div>
          </div>
          {conflict.files.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {conflict.files.map((file) => (
                <span key={file} className="rounded bg-background/40 border border-current/20 px-1.5 py-0.5 text-[9px] font-mono">
                  {file}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SearchResultList({ results }: { results: MemorySearchResult[] }) {
  if (results.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-[11px] font-mono text-muted-foreground">
        Sin resultados para la búsqueda actual.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((result) => (
        <div key={result.id} className="bg-card border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-mono font-semibold text-foreground truncate">{result.title}</div>
              <div className="mt-1 text-[10px] font-mono text-muted-foreground truncate">{result.sourceLabel} / {result.relativePath}</div>
            </div>
            <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-mono text-amber">{result.extension}</span>
          </div>
          {result.summary && <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{result.summary}</p>}
          {result.links.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {result.links.slice(0, 6).map((link) => (
                <span key={link} className="rounded bg-muted/70 px-1.5 py-0.5 text-[9px] font-mono text-muted-foreground">
                  {link}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ObsidianSyncPanel({ result }: { result: ObsidianSyncResponse | null }) {
  if (!result) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 text-[11px] font-mono text-muted-foreground">
        Obsidian todavía no fue sincronizado desde esta sesión.
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground tracking-wider">OBSIDIAN SYNC</span>
        <span className="text-[10px] font-mono text-amber">{formatDate(result.syncedAt)}</span>
      </div>
      <div className="text-[10px] font-mono text-muted-foreground truncate">{result.vaultPath}</div>
      <div className="space-y-1.5">
        {result.files.map((file) => (
          <div key={file.path} className="flex items-center justify-between gap-3 rounded bg-muted/50 px-2 py-1.5">
            <span className="text-[10px] font-mono text-foreground truncate">{file.path}</span>
            <span className="text-[9px] font-mono text-amber">{file.status.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Memory() {
  const [status, setStatus] = useState<MemoryStatusResponse | null>(null);
  const [conflicts, setConflicts] = useState<MemoryConflict[]>([]);
  const [syncResult, setSyncResult] = useState<MemorySyncResponse | null>(null);
  const [obsidianResult, setObsidianResult] = useState<ObsidianSyncResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("BOPE");
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const readyMounts = useMemo(() => status?.mounts.filter((mount) => mount.exists && mount.isDirectory).length ?? 0, [status]);

  async function refreshAll() {
    setLoading(true);
    setStatusText(null);
    try {
      const [nextStatus, conflictPayload] = await Promise.all([
        getMemoryStatusRequest(),
        getMemoryConflictsRequest().catch(() => ({ conflicts: [] })),
      ]);
      setStatus(nextStatus);
      setConflicts(conflictPayload.conflicts);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "No se pudo cargar el cerebro.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSync() {
    setLoading(true);
    setStatusText("Sincronizando índice...");
    try {
      const result = await syncMemoryRequest();
      setSyncResult(result);
      setStatusText("Índice actualizado.");
      await refreshAll();
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "No se pudo sincronizar el índice.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(event?: FormEvent) {
    event?.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const payload = await searchMemoryRequest(searchQuery.trim(), 30);
      setSearchResults(payload.results);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "No se pudo buscar en el índice.");
    } finally {
      setLoading(false);
    }
  }

  async function handleObsidianSync() {
    setLoading(true);
    setStatusText("Actualizando bloques BOPE en Obsidian...");
    try {
      const result = await syncObsidianRequest();
      setObsidianResult(result);
      setStatusText("Obsidian sincronizado con bloques BOPE.");
      await refreshAll();
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "No se pudo sincronizar Obsidian.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  return (
    <div className="p-4 space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-base font-mono font-semibold text-foreground tracking-wide">Cerebro BOPE</h1>
          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Obsidian, doctrina y memoria indexada bajo control operativo</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => void refreshAll()} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            ACTUALIZAR
          </ActionButton>
          <ActionButton onClick={() => void handleSync()} disabled={loading}>
            <FileSearch className="h-3.5 w-3.5" />
            INDEXAR
          </ActionButton>
          <ActionButton onClick={() => void handleObsidianSync()} disabled={loading || !status?.ready} tone="danger">
            <UploadCloud className="h-3.5 w-3.5" />
            SYNC OBSIDIAN
          </ActionButton>
        </div>
      </div>

      {statusText && (
        <div className="rounded-lg border border-border bg-card px-3 py-2 text-[11px] font-mono text-amber">
          {statusText}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-[9px] font-mono text-muted-foreground tracking-wider">READY</div>
          <div className={cn("mt-1 text-2xl font-mono font-bold", status?.ready ? "text-green-400" : "text-red-400")}>{status?.ready ? "SI" : "NO"}</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-[9px] font-mono text-muted-foreground tracking-wider">MONTAJES ONLINE</div>
          <div className="mt-1 text-2xl font-mono font-bold text-amber">{readyMounts}/3</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-[9px] font-mono text-muted-foreground tracking-wider">ARCHIVOS INDEXADOS</div>
          <div className="mt-1 text-2xl font-mono font-bold text-foreground">{status?.indexedFiles ?? 0}</div>
          <div className="mt-1 text-[9px] font-mono text-muted-foreground">{formatDate(status?.generatedAt)}</div>
        </div>
      </div>

      {status && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
          {status.mounts.map((mount) => (
            <MountCard key={mount.id} mount={mount} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
        <div className="space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber" />
              <h2 className="text-[11px] font-mono font-semibold tracking-wider text-muted-foreground">SINCRONIZACIÓN</h2>
            </div>
            <SyncStats sync={syncResult} />
            <ObsidianSyncPanel result={obsidianResult} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber" />
              <h2 className="text-[11px] font-mono font-semibold tracking-wider text-muted-foreground">CONFLICTOS</h2>
            </div>
            <ConflictList conflicts={conflicts} />
          </section>
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4 text-amber" />
            <h2 className="text-[11px] font-mono font-semibold tracking-wider text-muted-foreground">BÚSQUEDA</h2>
          </div>
          <form onSubmit={(event) => void handleSearch(event)} className="bg-card border border-border rounded-lg p-3 flex gap-2">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="flex-1 rounded border border-border bg-muted px-3 py-2 text-[11px] font-mono text-foreground outline-none focus:border-amber"
              placeholder="Buscar doctrina, repo, agente, decisión..."
            />
            <ActionButton onClick={() => void handleSearch()} disabled={loading || !searchQuery.trim()}>
              BUSCAR
            </ActionButton>
          </form>
          <SearchResultList results={searchResults} />
        </section>
      </div>
    </div>
  );
}
