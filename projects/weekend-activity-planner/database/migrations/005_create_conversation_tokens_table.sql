-- Migration: Create conversation_tokens table for magic link security
-- Created: 2025-11-02
-- Purpose: Store magic link tokens for secure dashboard access (7-day expiration)

-- Magic link tokens for secure dashboard access
CREATE TABLE conversation_tokens (
  conv_id TEXT PRIMARY KEY,            -- Unique token (e.g., "2025-11-02-a3f8e9c1...")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,     -- 7 days from creation
  used BOOLEAN DEFAULT false,          -- Track if link has been accessed

  CONSTRAINT expires_in_future CHECK (expires_at > created_at)
);

CREATE INDEX idx_tokens_expires ON conversation_tokens(expires_at DESC);
CREATE INDEX idx_tokens_used ON conversation_tokens(used) WHERE used = false;

COMMENT ON TABLE conversation_tokens IS 'Magic link tokens for secure dashboard access';
COMMENT ON COLUMN conversation_tokens.conv_id IS 'Cryptographically random token used in magic link URL';

-- Verify table created
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = 'conversation_tokens') as column_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'conversation_tokens';
