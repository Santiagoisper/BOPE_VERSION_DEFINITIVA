import { useState, useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { OrdersPanel } from "@/components/orders/OrdersPanel";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { formatCost } from "@/lib/budget";
import { cn } from "@/lib/utils";
import { getEngineStatusRequest, type EngineStatus } from "@/lib/api";

interface NavItem {
  path: string;
  label: string;
  icon: string;
  shortLabel: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/", label: "Centro de Mando", icon: "■", shortLabel: "Mando" },
  { path: "/missions", label: "Misiones", icon: "◆", shortLabel: "Misiones" },
  { path: "/agents", label: "Agentes", icon: "◉", shortLabel: "Agentes" },
  { path: "/arsenal", label: "Arsenal", icon: "⬢", shortLabel: "Arsenal" },
  { path: "/records", label: "Registros", icon: "◇", shortLabel: "Records" },
];

const MODE_DOT: Record<string, string> = {
  cli: "bg-green-500",
  api: "bg-amber-400",
  unavailable: "bg-red-500",
};

const MODE_LABEL: Record<string, string> = {
  cli: "CLI",
  api: "API",
  unavailable: "OFF",
};

const MODE_TEXT: Record<string, string> = {
  cli: "text-green-400",
  api: "text-amber",
  unavailable: "text-red-400",
};

function EngineIndicator({ label, mode }: { label: string; mode: "cli" | "api" | "unavailable" }) {
  return (
    <div className="flex items-center gap-1.5" title={mode === "cli" ? "Suscripción (gratis)" : mode === "api" ? "API paga (tokens)" : "No disponible"}>
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("w-1.5 h-1.5 rounded-full inline-block flex-shrink-0", MODE_DOT[mode])} />
      <span className={cn("font-semibold", MODE_TEXT[mode])}>{MODE_LABEL[mode]}</span>
    </div>
  );
}

function StatusBar() {
  const { globalBudget, systemStatus, budgetAlerts, session, logout } = useCommandCenter();
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);

  useEffect(() => {
    getEngineStatusRequest()
      .then(setEngineStatus)
      .catch(() => {});
  }, []);

  const now = new Date();
  const budgetUsedPct = globalBudget
    ? ((globalBudget.accumulatedSpend / globalBudget.annual) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="h-10 bg-[hsl(222_22%_6%)] border-b border-border flex items-center px-4 gap-6 flex-shrink-0 z-50">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-amber font-mono text-[10px] font-semibold tracking-[0.15em] terminal-glow">BOPE</span>
        <span className="text-muted-foreground font-mono text-[10px]">/</span>
        <span className="text-foreground/60 font-mono text-[10px] tracking-widest">COMMAND CENTER</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-5 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <span className={cn("status-dot", systemStatus?.operational ? "status-dot-active" : "bg-red-500")} />
          <span className="text-muted-foreground">SISTEMAS</span>
          <span className={cn("font-semibold", systemStatus?.operational ? "text-green-400" : "text-red-400")}>
            {systemStatus?.operational ? "OPERATIVOS" : "DEGRADADOS"}
          </span>
        </div>

        {engineStatus && (
          <>
            <div className="h-3 w-px bg-border" />
            <EngineIndicator label="CLAUDE" mode={engineStatus.claude.mode} />
            <div className="h-3 w-px bg-border" />
            <EngineIndicator label="CODEX" mode={engineStatus.codex.mode} />
          </>
        )}

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">PRESUPUESTO</span>
          <span className="text-amber font-semibold">{budgetUsedPct}%</span>
          <span className="text-muted-foreground">UTILIZADO</span>
        </div>

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">ALERTAS</span>
          <span className={cn("font-semibold", budgetAlerts.length > 0 ? "text-amber" : "text-green-400")}>
            {budgetAlerts.length}
          </span>
        </div>

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">
            {now.toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).toUpperCase()}
          </span>
        </div>

        {session && (
          <>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{session.username.toUpperCase()}</span>
              <button
                type="button"
                onClick={() => {
                  void logout();
                }}
                className="text-[10px] font-mono text-amber hover:text-amber/80 transition-colors"
              >
                SALIR
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Sidebar({ collapsed }: { collapsed: boolean }) {
  const [location] = useLocation();
  const { globalBudget } = useCommandCenter();
  const progress = globalBudget ? (globalBudget.accumulatedSpend / globalBudget.annual) * 100 : 0;

  return (
    <aside
      className={cn(
        "flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200",
        collapsed ? "w-12" : "w-52",
      )}
    >
      <div className={cn("flex-1 py-3 flex flex-col gap-0.5 overflow-hidden px-1.5")}>
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex items-center gap-3 px-2.5 py-2 rounded-md transition-all duration-150 group relative",
                isActive
                  ? "bg-accent text-amber-foreground"
                  : "hover:bg-sidebar-accent text-sidebar-foreground hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "text-sm font-mono flex-shrink-0 transition-colors",
                  isActive ? "text-amber" : "text-muted-foreground group-hover:text-amber",
                )}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span
                  className={cn(
                    "text-[11px] font-mono tracking-wide truncate transition-colors",
                    isActive ? "text-amber font-semibold" : "",
                  )}
                >
                  {item.label}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-amber rounded-r" />
              )}
            </Link>
          );
        })}
      </div>

      {!collapsed && (
        <div className="px-3 py-3 border-t border-sidebar-border">
          <div className="text-[9px] font-mono text-muted-foreground tracking-[0.15em] mb-2">BUDGET ANUAL</div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-amber rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] font-mono text-muted-foreground">
              {globalBudget ? formatCost(globalBudget.accumulatedSpend) : "$0.00"}
            </span>
            <span className="text-[9px] font-mono text-muted-foreground">
              {globalBudget ? formatCost(globalBudget.annual) : "$0.00"}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <StatusBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar collapsed={sidebarCollapsed} />
        <button
          onClick={() => setSidebarCollapsed((value) => !value)}
          className="absolute left-0 bottom-4 z-50 hidden"
          aria-label="Toggle sidebar"
        />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <OrdersPanel />
    </div>
  );
}
