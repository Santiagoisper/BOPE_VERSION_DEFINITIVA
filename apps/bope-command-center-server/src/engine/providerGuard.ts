import type { ProviderConfigRecord, ProviderGovernanceRecord } from "../domain.js";

export class ProviderBlockedError extends Error {
  constructor(
    public readonly reason: "kill_switch" | "disabled" | "global_kill_switch" | "budget_exceeded",
    message: string
  ) {
    super(message);
    this.name = "ProviderBlockedError";
  }
}

export interface ProviderPolicy {
  config: ProviderConfigRecord;
  governance: ProviderGovernanceRecord;
}

/**
 * Verifica que el provider puede ejecutar.
 * Lanza ProviderBlockedError si alguna condición lo bloquea.
 * Retorna el modo efectivo ("shadow" | "armed").
 */
export function assertProviderAllowed(policy: ProviderPolicy): "shadow" | "armed" {
  if (policy.governance.globalKillSwitchActive === true) {
    throw new ProviderBlockedError(
      "global_kill_switch",
      "Ejecución bloqueada: kill switch global activo. Todos los providers están deshabilitados."
    );
  }

  if (policy.config.killSwitchActive === true) {
    throw new ProviderBlockedError(
      "kill_switch",
      `Ejecución bloqueada: kill switch activo para el provider ${policy.config.providerId}.`
    );
  }

  if (policy.config.enabled === false) {
    throw new ProviderBlockedError(
      "disabled",
      `Ejecución bloqueada: el provider ${policy.config.providerId} está deshabilitado.`
    );
  }

  const mode = policy.config.mode;

  if (mode !== "shadow" && mode !== "armed") {
    throw new ProviderBlockedError(
      "disabled",
      `Ejecución bloqueada: el provider ${policy.config.providerId} está en modo "${mode}" (no ejecutable).`
    );
  }

  return mode;
}
