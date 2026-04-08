CREATE TABLE IF NOT EXISTS bope_refresh_tokens (
  id          text        PRIMARY KEY,
  username    text        NOT NULL,
  token_hash  text        NOT NULL UNIQUE,
  created_at  timestamptz NOT NULL,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz
);

CREATE INDEX IF NOT EXISTS bope_refresh_tokens_hash_idx
  ON bope_refresh_tokens (token_hash);

CREATE INDEX IF NOT EXISTS bope_refresh_tokens_expires_idx
  ON bope_refresh_tokens (expires_at)
  WHERE revoked_at IS NULL;
