import type { AuthConfigRecord, SessionRecord } from "@/domain/models";

const SESSION_STORAGE_KEY = "bope-command-center-session";
const SESSION_TTL_HOURS = 12;
const PASSWORD_ITERATIONS = 210_000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

async function deriveHash(password: string, saltHex: string, iterations: number): Promise<string> {
  const salt = hexToBytes(saltHex);
  const passwordBuffer = new TextEncoder().encode(password);
  const baseKey = await crypto.subtle.importKey("raw", passwordBuffer, "PBKDF2", false, [
    "deriveBits",
  ]);
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt: salt as unknown as BufferSource,
    },
    baseKey,
    256,
  );
  return bytesToHex(new Uint8Array(derivedBits));
}

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 12 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export async function createAuthConfig(
  username: string,
  password: string,
  nowIso: string,
): Promise<AuthConfigRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(salt);
  const passwordHash = await deriveHash(password, saltHex, PASSWORD_ITERATIONS);

  return {
    username,
    passwordHash,
    salt: saltHex,
    iterations: PASSWORD_ITERATIONS,
    createdAt: nowIso,
    lastPasswordChangeAt: nowIso,
    failedAttempts: 0,
  };
}

export async function verifyPassword(
  password: string,
  authConfig: AuthConfigRecord,
): Promise<boolean> {
  const computedHash = await deriveHash(password, authConfig.salt, authConfig.iterations);
  return computedHash === authConfig.passwordHash;
}

export function createSession(username: string, nowIso: string): SessionRecord {
  const now = new Date(nowIso);
  const expiresAt = new Date(now.getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000);

  return {
    username,
    loginAt: nowIso,
    expiresAt: expiresAt.toISOString(),
  };
}

export function loadSession(): SessionRecord | null {
  const raw = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const session = JSON.parse(raw) as SessionRecord;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function persistSession(session: SessionRecord | null): void {
  if (!session) {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}
