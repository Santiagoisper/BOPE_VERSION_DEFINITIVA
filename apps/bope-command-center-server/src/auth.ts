import crypto from "node:crypto";
import type { AuthConfigRecord, RefreshTokenRecord, SessionRecord, StoredSessionRecord } from "./domain.js";

const PASSWORD_ITERATIONS = 210_000;
const SESSION_TTL_HOURS = 12;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 15 * 60 * 1000;

// ─── JWT ─────────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;       // 15 minutos
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 3600; // 7 días

export interface JwtPayload {
  sub: string;   // username
  iat: number;   // issued at (unix)
  exp: number;   // expiry (unix)
  jti: string;   // JWT ID (para futura lista negra si se requiere)
}

function getJwtSecret(): string {
  const secret = process.env.BOPE_JWT_SECRET ?? "";
  if (secret.length < 32) {
    throw new Error("BOPE_JWT_SECRET debe estar configurado con al menos 32 caracteres.");
  }
  return secret;
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function b64urlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

export function signJwt(username: string, nowMs: number): string {
  const header  = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      sub: username,
      iat: Math.floor(nowMs / 1000),
      exp: Math.floor(nowMs / 1000) + ACCESS_TOKEN_TTL_SECONDS,
      jti: crypto.randomUUID(),
    } satisfies JwtPayload),
  );
  const sigInput = `${header}.${payload}`;
  const sig = crypto.createHmac("sha256", getJwtSecret()).update(sigInput).digest("base64url");
  return `${sigInput}.${sig}`;
}

export function verifyJwt(token: string, now = Date.now()): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts as [string, string, string];
    const sigInput  = `${header}.${payload}`;
    const expected  = crypto.createHmac("sha256", getJwtSecret()).update(sigInput).digest("base64url");
    const sigBuf     = Buffer.from(sig, "base64url");
    const expBuf     = Buffer.from(expected, "base64url");
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const claims = JSON.parse(b64urlDecode(payload)) as JwtPayload;
    if (claims.exp * 1000 <= now) return null;
    return claims;
  } catch {
    return null;
  }
}

export interface TokenPair {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshRecord: RefreshTokenRecord;
}

export function createTokenPair(username: string, nowIso: string): TokenPair {
  const nowMs = new Date(nowIso).getTime();
  const accessToken = signJwt(username, nowMs);
  const accessTokenExpiresAt = new Date(nowMs + ACCESS_TOKEN_TTL_SECONDS * 1000).toISOString();
  const refreshRaw = bytesToHex(crypto.randomBytes(32));
  const refreshExpiresAt = new Date(nowMs + REFRESH_TOKEN_TTL_SECONDS * 1000).toISOString();

  return {
    accessToken,
    accessTokenExpiresAt,
    refreshToken: refreshRaw,
    refreshRecord: {
      id: `rt-${crypto.randomUUID()}`,
      username,
      tokenHash: hashToken(refreshRaw),
      createdAt: nowIso,
      expiresAt: refreshExpiresAt,
    },
  };
}

export function resolveRefreshToken(
  refreshTokens: RefreshTokenRecord[],
  rawToken: string | undefined,
  now = Date.now(),
): RefreshTokenRecord | null {
  if (!rawToken) return null;
  const h = hashToken(rawToken);
  const rec = refreshTokens.find((r) => r.tokenHash === h && !r.revokedAt);
  if (!rec) return null;
  if (new Date(rec.expiresAt).getTime() <= now) return null;
  return rec;
}

export function getAccessTokenTtlSeconds(): number {
  return ACCESS_TOKEN_TTL_SECONDS;
}

export function getRefreshTokenTtlSeconds(): number {
  return REFRESH_TOKEN_TTL_SECONDS;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function deriveHash(password: string, saltHex: string, iterations: number): string {
  return crypto.pbkdf2Sync(password, Buffer.from(saltHex, "hex"), iterations, 32, "sha256").toString("hex");
}

export function createAuthConfig(username: string, password: string, nowIso: string): AuthConfigRecord {
  const salt = crypto.randomBytes(16).toString("hex");
  return {
    username,
    passwordHash: deriveHash(password, salt, PASSWORD_ITERATIONS),
    salt,
    iterations: PASSWORD_ITERATIONS,
    createdAt: nowIso,
    lastPasswordChangeAt: nowIso,
    failedAttempts: 0,
  };
}

export function verifyPassword(password: string, authConfig: AuthConfigRecord): boolean {
  return deriveHash(password, authConfig.salt, authConfig.iterations) === authConfig.passwordHash;
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

export function registerFailedAttempt(authConfig: AuthConfigRecord, now = Date.now()): AuthConfigRecord {
  const failedAttempts = authConfig.failedAttempts + 1;
  return {
    ...authConfig,
    failedAttempts,
    lockUntil:
      failedAttempts >= MAX_FAILED_ATTEMPTS ? new Date(now + LOCK_WINDOW_MS).toISOString() : undefined,
  };
}

export function clearFailedAttempts(authConfig: AuthConfigRecord): AuthConfigRecord {
  return {
    ...authConfig,
    failedAttempts: 0,
    lockUntil: undefined,
  };
}

export function isLocked(authConfig: AuthConfigRecord, now = Date.now()): boolean {
  return Boolean(authConfig.lockUntil && new Date(authConfig.lockUntil).getTime() > now);
}

export function createSession(username: string, nowIso: string): { token: string; session: StoredSessionRecord } {
  const loginAt = nowIso;
  const expiresAt = new Date(new Date(nowIso).getTime() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();
  const token = bytesToHex(crypto.randomBytes(32));

  return {
    token,
    session: {
      id: `session-${crypto.randomUUID()}`,
      username,
      loginAt,
      expiresAt,
      tokenHash: hashToken(token),
    },
  };
}

export function resolveSession(sessions: StoredSessionRecord[], token: string | undefined): SessionRecord | null {
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const session = sessions.find((item) => item.tokenHash === tokenHash);
  if (!session) {
    return null;
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return {
    username: session.username,
    loginAt: session.loginAt,
    expiresAt: session.expiresAt,
  };
}

export function filterActiveSessions(sessions: StoredSessionRecord[]): StoredSessionRecord[] {
  return sessions.filter((session) => new Date(session.expiresAt).getTime() > Date.now());
}
