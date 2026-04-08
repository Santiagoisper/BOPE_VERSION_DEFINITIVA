import { useState, type ReactNode } from "react";
import { isStrongPassword } from "@/lib/auth";
import { useCommandCenter } from "@/context/CommandCenterContext";

interface AuthGateProps {
  children: ReactNode;
}

function PanelShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl shadow-black/30">
        <div className="border-b border-border px-6 py-5">
          <div className="text-[10px] font-mono tracking-[0.18em] text-amber">BOPE COMMAND CENTER</div>
          <h1 className="mt-2 text-lg font-mono font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function AuthGate({ children }: AuthGateProps) {
  const { isReady, initError, needsBootstrap, isAuthenticated, bootstrapAuth, login, state } = useCommandCenter();
  const [username, setUsername] = useState("operator");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isReady) {
    return (
      <PanelShell title="Inicializando" subtitle="Cargando persistencia operativa y auditoria local.">
        <div className="text-xs font-mono text-muted-foreground">Sincronizando Command Center...</div>
        {initError && (
          <p className="mt-2 text-xs font-mono text-red-400">Error: {initError}</p>
        )}
      </PanelShell>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const inputClass =
    "w-full rounded-md border border-border bg-[hsl(222_22%_10%)] px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-amber/50";

  async function handleBootstrapSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!isStrongPassword(password)) {
      setError("La contraseña debe tener 12+ caracteres, mayúscula, minúscula, número y caracter especial.");
      return;
    }

    setIsSubmitting(true);
    const result = await bootstrapAuth(username, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "No se pudo inicializar la autenticación.");
      return;
    }

    setPassword("");
    setConfirmPassword("");
  }

  async function handleLoginSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const result = await login(username, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Acceso rechazado.");
      return;
    }

    setPassword("");
  }

  const lockedUntil = state?.authConfig?.lockUntil;
  const lockActive = Boolean(lockedUntil && new Date(lockedUntil).getTime() > Date.now());

  if (needsBootstrap) {
    return (
      <PanelShell
        title="Credenciales iniciales"
        subtitle="Definí el primer acceso seguro para operar el panel sin exponer doctrina ni registros canónicos."
      >
        <form onSubmit={handleBootstrapSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[10px] font-mono tracking-[0.14em] text-muted-foreground">USUARIO</label>
            <input className={inputClass} value={username} onChange={(event) => setUsername(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-mono tracking-[0.14em] text-muted-foreground">CONTRASEÑA</label>
            <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-mono tracking-[0.14em] text-muted-foreground">CONFIRMAR</label>
            <input className={inputClass} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
          </div>
          {error && <p className="text-xs font-mono text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md border border-[#B22234]/50 bg-[#8B1A1A] py-2 text-[11px] font-mono font-semibold tracking-[0.16em] text-white transition-colors hover:bg-[#B22234] disabled:opacity-60"
          >
            {isSubmitting ? "CONFIGURANDO..." : "CONFIGURAR ACCESO"}
          </button>
        </form>
      </PanelShell>
    );
  }

  return (
    <PanelShell
      title="Acceso restringido"
      subtitle="Autenticación local obligatoria para operar el Command Center con trazabilidad."
    >
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-[10px] font-mono tracking-[0.14em] text-muted-foreground">USUARIO</label>
          <input className={inputClass} value={username} onChange={(event) => setUsername(event.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-mono tracking-[0.14em] text-muted-foreground">CONTRASEÑA</label>
          <input className={inputClass} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </div>
        {lockActive && (
          <p className="text-xs font-mono text-amber">
            Acceso bloqueado hasta {new Date(lockedUntil!).toLocaleString("es-AR")}.
          </p>
        )}
        {error && <p className="text-xs font-mono text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting || lockActive}
          className="w-full rounded-md border border-[#B22234]/50 bg-[#8B1A1A] py-2 text-[11px] font-mono font-semibold tracking-[0.16em] text-white transition-colors hover:bg-[#B22234] disabled:opacity-60"
        >
          {isSubmitting ? "VALIDANDO..." : "INGRESAR"}
        </button>
      </form>
    </PanelShell>
  );
}
