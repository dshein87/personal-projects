-- Create test token for local dashboard testing
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ohdmrfyyavlkoflbbjsd/sql/new

INSERT INTO conversation_tokens (conv_id, expires_at)
VALUES ('test-2025-11-02', NOW() + INTERVAL '7 days')
RETURNING *;

-- Expected output: 1 row with conv_id='test-2025-11-02'

-- To test the dashboard locally, use this URL:
-- http://localhost:8501?conv_id=test-2025-11-02
