import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { assertProviderAllowed, ProviderBlockedError } from "../engine/providerGuard.js";
import type { ProviderConfigRecord, ProviderGovernanceRecord } from "../domain.js";

function baseConfig(overrides: Partial<ProviderConfigRecord> = {}): ProviderConfigRecord {
  return {
    providerId: "claude",
    mode: "armed",
    enabled: true,
    killSwitchActive: false,
    monthlyHardLimit: 100,
    annualHardLimit: 1000,
    maxTokensPerRequest: 1000,
    maxRequestsPerMinute: 10,
    maxRequestsPerMission: 5,
    maxMissionBudget: 50,
    traceLevel: "standard",
    notes: "",
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function baseGov(overrides: Partial<ProviderGovernanceRecord> = {}): ProviderGovernanceRecord {
  return {
    globalKillSwitchActive: false,
    defaultMissionBudgetLimit: 100,
    defaultRequestsPerMission: 5,
    periodLabel: "minute",
    notes: "",
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("assertProviderAllowed", () => {
  it("retorna shadow cuando el modo es shadow y no hay bloqueos", () => {
    const mode = assertProviderAllowed({
      config: baseConfig({ mode: "shadow" }),
      governance: baseGov(),
    });
    expect(mode).toBe("shadow");
  });

  it("retorna armed cuando el modo es armed", () => {
    const mode = assertProviderAllowed({
      config: baseConfig({ mode: "armed" }),
      governance: baseGov(),
    });
    expect(mode).toBe("armed");
  });

  it("lanza si kill switch global", () => {
    expect(() =>
      assertProviderAllowed({
        config: baseConfig(),
        governance: baseGov({ globalKillSwitchActive: true }),
      })
    ).toThrow(ProviderBlockedError);
  });

  it("lanza si kill switch del provider", () => {
    expect(() =>
      assertProviderAllowed({
        config: baseConfig({ killSwitchActive: true }),
        governance: baseGov(),
      })
    ).toThrow(ProviderBlockedError);
  });

  it("lanza si provider deshabilitado", () => {
    expect(() =>
      assertProviderAllowed({
        config: baseConfig({ enabled: false, killSwitchActive: false }),
        governance: baseGov(),
      })
    ).toThrow(ProviderBlockedError);
  });
});

describe("assertProviderAllowed — Property 5: kill switch", () => {
  it("bloquea cuando globalKillSwitchActive es true (cualquier config habilitada)", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (enabled, ks) => {
        expect(() =>
          assertProviderAllowed({
            config: baseConfig({ enabled, killSwitchActive: ks, mode: enabled && !ks ? "armed" : "shadow" }),
            governance: baseGov({ globalKillSwitchActive: true }),
          })
        ).toThrow(ProviderBlockedError);
      })
    );
  });
});

describe("assertProviderAllowed — Property 6: disabled", () => {
  it("bloquea cuando enabled es false y killSwitch es false", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<"shadow" | "armed">("shadow", "armed"),
        (mode) => {
          expect(() =>
            assertProviderAllowed({
              config: baseConfig({ enabled: false, killSwitchActive: false, mode }),
              governance: baseGov({ globalKillSwitchActive: false }),
            })
          ).toThrow(ProviderBlockedError);
        }
      )
    );
  });
});
