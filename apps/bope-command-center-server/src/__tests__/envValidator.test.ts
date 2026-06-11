import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("validateEnv", () => {
  const saved = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...saved };
    vi.restoreAllMocks();
  });

  it("termina con código 1 si faltan variables críticas", async () => {
    delete process.env.BOPE_COMMAND_CENTER_DATABASE_URL;
    delete process.env.JWT_SECRET;
    const exitMock = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { validateEnv } = await import("../envValidator.js");
    validateEnv();
    expect(exitMock).toHaveBeenCalledWith(1);
    expect(err).toHaveBeenCalled();
  });

  it("no termina el proceso si las variables requeridas están presentes", async () => {
    process.env.BOPE_COMMAND_CENTER_DATABASE_URL = "postgresql://localhost/test";
    process.env.JWT_SECRET = "x".repeat(32);
    const exitMock = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const { validateEnv } = await import("../envValidator.js");
    validateEnv();
    expect(exitMock).not.toHaveBeenCalled();
  });

  it("acepta DATABASE_URL como alias de despliegue", async () => {
    delete process.env.BOPE_COMMAND_CENTER_DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://localhost/test";
    process.env.JWT_SECRET = "x".repeat(32);
    const exitMock = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const { validateEnv } = await import("../envValidator.js");
    validateEnv();
    expect(exitMock).not.toHaveBeenCalled();
  });

  it("rechaza el JWT_SECRET de ejemplo", async () => {
    process.env.BOPE_COMMAND_CENTER_DATABASE_URL = "postgresql://localhost/test";
    process.env.JWT_SECRET = "change-me-use-a-long-random-secret-at-least-32-chars";
    const exitMock = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { validateEnv } = await import("../envValidator.js");
    validateEnv();
    expect(exitMock).toHaveBeenCalledWith(1);
    expect(err).toHaveBeenCalled();
  });
});
