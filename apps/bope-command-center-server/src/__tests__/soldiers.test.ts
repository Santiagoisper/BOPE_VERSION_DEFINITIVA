import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { autoRouteSoldier, selectModel } from "../engine/soldiers.js";

// ---------------------------------------------------------------------------
// Constantes extraídas de soldiers.ts para usar en los tests
// ---------------------------------------------------------------------------

const SONNET_FORCE_AGENTS = ["john-rambo", "forge", "blade", "sicario"] as const;
const HAIKU_FORCE_AGENTS = ["winston", "cerberus", "consiglieri"] as const;
const VALID_MODELS = ["claude-haiku-4-5-20251001", "claude-sonnet-4-6"] as const;

// ---------------------------------------------------------------------------
// selectModel — tests unitarios
// ---------------------------------------------------------------------------

describe("selectModel — SONNET_FORCE", () => {
  for (const agentId of SONNET_FORCE_AGENTS) {
    it(`agente "${agentId}" siempre retorna "claude-sonnet-4-6"`, () => {
      expect(selectModel("orden corta", agentId)).toBe("claude-sonnet-4-6");
      expect(selectModel("", agentId)).toBe("claude-sonnet-4-6");
    });
  }
});

describe("selectModel — HAIKU_FORCE", () => {
  for (const agentId of HAIKU_FORCE_AGENTS) {
    it(`agente "${agentId}" siempre retorna "claude-haiku-4-5-20251001"`, () => {
      expect(selectModel("orden corta", agentId)).toBe("claude-haiku-4-5-20251001");
      expect(selectModel("", agentId)).toBe("claude-haiku-4-5-20251001");
    });
  }
});

describe("selectModel — lógica de complejidad (agente neutro)", () => {
  // Agente que no está en SONNET_FORCE ni HAIKU_FORCE → lógica de complejidad
  const neutralAgent = "pixel";

  it("orden corta sin keywords complejas → haiku", () => {
    expect(selectModel("muéstrame el estado", neutralAgent)).toBe("claude-haiku-4-5-20251001");
  });

  it("orden larga (>50 palabras) sin keywords → sonnet", () => {
    const longOrder =
      "uno dos tres cuatro cinco seis siete ocho nueve diez " +
      "once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte " +
      "veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho veintinueve treinta " +
      "treinta y uno treinta y dos treinta y tres treinta y cuatro treinta y cinco treinta y seis treinta y siete treinta y ocho treinta y nueve cuarenta " +
      "cuarenta y uno cuarenta y dos cuarenta y tres cuarenta y cuatro cuarenta y cinco cuarenta y seis cuarenta y siete cuarenta y ocho cuarenta y nueve cincuenta y uno";
    const words = longOrder.trim().split(/\s+/);
    expect(words.length).toBeGreaterThan(50);
    expect(selectModel(longOrder, neutralAgent)).toBe("claude-sonnet-4-6");
  });

  it('orden corta con keyword compleja "implementá" → sonnet', () => {
    expect(selectModel("implementá el módulo", neutralAgent)).toBe("claude-sonnet-4-6");
  });

  it('orden corta con keyword compleja "implementa" → sonnet', () => {
    expect(selectModel("implementa la función", neutralAgent)).toBe("claude-sonnet-4-6");
  });

  it('orden corta con keyword compleja "crea" → sonnet', () => {
    expect(selectModel("crea un componente", neutralAgent)).toBe("claude-sonnet-4-6");
  });

  it('orden corta con keyword compleja "crear" → sonnet', () => {
    expect(selectModel("crear el endpoint", neutralAgent)).toBe("claude-sonnet-4-6");
  });

  it('orden corta con keyword compleja "código" → sonnet', () => {
    expect(selectModel("dame el código", neutralAgent)).toBe("claude-sonnet-4-6");
  });

  it('orden corta con keyword compleja "refactor" → sonnet', () => {
    expect(selectModel("refactor este módulo", neutralAgent)).toBe("claude-sonnet-4-6");
  });

  it('orden corta con keyword compleja "build" → sonnet', () => {
    expect(selectModel("build the project", neutralAgent)).toBe("claude-sonnet-4-6");
  });
});

// ---------------------------------------------------------------------------
// autoRouteSoldier — tests unitarios
// ---------------------------------------------------------------------------

describe("autoRouteSoldier — routing por keywords", () => {
  // Regla 1: pixel
  const pixelKeywords = ["ui", "componente", "frontend", "react", "css", "tailwind", "diseño", "interfaz", "html", "jsx", "tsx", "estilos", "layout", "responsive"];
  for (const kw of pixelKeywords) {
    it(`keyword "${kw}" → "pixel"`, () => {
      expect(autoRouteSoldier(`necesito ${kw} para el proyecto`)).toBe("pixel");
    });
  }

  // Regla 2: forge
  const forgeKeywords = ["api", "backend", "endpoint", "db", "database", "postgres", "sql", "servidor", "neon", "schema", "tabla", "query", "migration"];
  for (const kw of forgeKeywords) {
    it(`keyword "${kw}" → "forge"`, () => {
      expect(autoRouteSoldier(`revisar el ${kw} del sistema`)).toBe("forge");
    });
  }

  // Regla 3: house
  const houseKeywords = ["bug", "test", "qa", "error", "debug", "falla", "crash", "issue", "problema", "diagnos", "fallo", "roto", "no funciona"];
  for (const kw of houseKeywords) {
    it(`keyword "${kw}" → "house"`, () => {
      expect(autoRouteSoldier(`hay un ${kw} en producción`)).toBe("house");
    });
  }

  // Regla 4: nexus
  const nexusKeywords = ["deploy", "git", "vercel", "infra", "ci", "cd", "pipeline", "webhook", "integra", "github", "railway"];
  for (const kw of nexusKeywords) {
    it(`keyword "${kw}" → "nexus"`, () => {
      expect(autoRouteSoldier(`configurar ${kw} para el proyecto`)).toBe("nexus");
    });
  }

  // Regla 5: cerberus
  const cerberusKeywords = ["seguridad", "secret", "token", "auth", "vuln", "owasp", "brecha", "permiso", "credencial", "password", "contraseña", "xss", "injection"];
  for (const kw of cerberusKeywords) {
    it(`keyword "${kw}" → "cerberus"`, () => {
      expect(autoRouteSoldier(`revisar ${kw} del sistema`)).toBe("cerberus");
    });
  }

  // Regla 6: sicario
  const sicarioKeywords = ["refactor", "legacy", "migrar", "deuda", "limpia", "elimina", "cleanup", "reorganiza", "reestructura"];
  for (const kw of sicarioKeywords) {
    it(`keyword "${kw}" → "sicario"`, () => {
      expect(autoRouteSoldier(`necesito ${kw} el código`)).toBe("sicario");
    });
  }
});

describe("autoRouteSoldier — fallback", () => {
  it("orden sin keywords conocidas → retorna \"john-rambo\"", () => {
    expect(autoRouteSoldier("hola mundo")).toBe("john-rambo");
  });

  it("orden vacía → retorna \"john-rambo\"", () => {
    expect(autoRouteSoldier("")).toBe("john-rambo");
  });

  it("orden con palabras genéricas → retorna \"john-rambo\"", () => {
    expect(autoRouteSoldier("dame un resumen del proyecto")).toBe("john-rambo");
  });
});

// ---------------------------------------------------------------------------
// Property 1: autoRouteSoldier siempre retorna un agentId válido
// Validates: Requirements 6.3
// ---------------------------------------------------------------------------

describe("autoRouteSoldier — Property 1: siempre retorna agentId válido", () => {
  it("para cualquier string retorna un string no vacío", () => {
    fc.assert(
      fc.property(fc.string(), (order) => {
        const result = autoRouteSoldier(order);
        expect(typeof result).toBe("string");
        expect(result.length).toBeGreaterThan(0);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// Property 2: selectModel siempre retorna exactamente uno de los dos modelos válidos
// Validates: Requirements 6.4
// ---------------------------------------------------------------------------

describe("selectModel — Property 2: siempre retorna un modelo válido", () => {
  it("para cualquier (order, agentId) retorna exactamente uno de los dos modelos válidos", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (order, agentId) => {
        const result = selectModel(order, agentId);
        expect(VALID_MODELS).toContain(result);
      })
    );
  });
});
