import { useState } from "react";
import { cn } from "@/lib/utils";
import { NewMissionForm } from "./NewMissionForm";
import { DirectOrderForm } from "./DirectOrderForm";
import { ExecuteForm } from "./ExecuteForm";

type Tab = "execute" | "mission" | "order";

export function OrdersPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("execute");
  const [success, setSuccess] = useState<string | null>(null);

  function handleSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => {
      setSuccess(null);
      setOpen(false);
    }, 1800);
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSuccess(null); }}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5",
          "bg-[#8B1A1A] hover:bg-[#B22234] border border-[#B22234]/60",
          "rounded-md shadow-[0_0_20px_rgba(178,34,52,0.35)] hover:shadow-[0_0_28px_rgba(178,34,52,0.55)]",
          "text-white font-mono text-[11px] font-semibold tracking-[0.15em]",
          "transition-all duration-200 select-none"
        )}
        aria-label="Abrir panel de órdenes"
      >
        <span className="text-[13px] leading-none">✦</span>
        EMITIR ORDEN
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => setOpen(false)} />

          <div className="relative z-10 w-full max-w-md bg-[hsl(222_22%_7%)] border border-[hsl(222_22%_18%)] rounded-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(222_22%_14%)]">
              <div className="flex items-center gap-2">
                <span className="text-[#B22234] text-sm leading-none">✦</span>
                <span className="text-[11px] font-mono font-semibold text-foreground tracking-[0.15em]">
                  CENTRO DE ÓRDENES
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground text-[16px] font-mono leading-none transition-colors"
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>

            <div className="flex border-b border-[hsl(222_22%_14%)]">
              <button
                onClick={() => setTab("execute")}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-mono font-semibold tracking-[0.12em] transition-colors border-b-2 -mb-px",
                  tab === "execute"
                    ? "text-amber border-amber"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                EJECUTAR
              </button>
              <button
                onClick={() => setTab("mission")}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-mono font-semibold tracking-[0.12em] transition-colors border-b-2 -mb-px",
                  tab === "mission"
                    ? "text-amber border-amber"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                MISIÓN
              </button>
              <button
                onClick={() => setTab("order")}
                className={cn(
                  "flex-1 py-2.5 text-[10px] font-mono font-semibold tracking-[0.12em] transition-colors border-b-2 -mb-px",
                  tab === "order"
                    ? "text-amber border-amber"
                    : "text-muted-foreground border-transparent hover:text-foreground"
                )}
              >
                ORDEN
              </button>
            </div>

            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {success ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <span className="text-green-400 text-2xl">✓</span>
                  <p className="text-[11px] font-mono text-green-400 text-center">{success}</p>
                </div>
              ) : tab === "execute" ? (
                <ExecuteForm onSuccess={() => handleSuccess("Orden ejecutada.")} />
              ) : tab === "mission" ? (
                <NewMissionForm onSuccess={() => handleSuccess("Misión registrada. Operación en planificación.")} />
              ) : (
                <DirectOrderForm onSuccess={() => handleSuccess("Orden transmitida al operativo.")} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
