-- Migration: Create conversations table for dashboard chat
-- Created: 2025-11-02
-- Purpose: Store all chat messages between user and assistant

-- Conversation storage for dashboard chat
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id TEXT NOT NULL,      -- Links to magic link token (e.g., "2025-11-02-a3f8...")
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),  -- Message sender
  content TEXT NOT NULL,               -- Message text
  metadata JSONB DEFAULT '{}'::JSONB,  -- Structured data (activity IDs, actions, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_conv_id ON conversations(conversation_id);
CREATE INDEX idx_conversations_created ON conversations(created_at DESC);

COMMENT ON TABLE conversations IS 'Stores all chat messages between user and assistant';
COMMENT ON COLUMN conversations.conversation_id IS 'Links to magic link token, groups messages in one conversation';
COMMENT ON COLUMN conversations.metadata IS 'JSONB for storing structured actions like {"type": "update_rating", "activity_id": 123}';

-- Verify table created
SELECT table_name,
       (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = 'conversations') as column_count
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'conversations';
