-- Migration 0010: Password reset flow
-- Stores short-lived, single-use password reset tokens.

CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_password_reset_tokens_token_hash
  ON password_reset_tokens(token_hash);

CREATE INDEX idx_password_reset_tokens_user_id
  ON password_reset_tokens(user_id);
