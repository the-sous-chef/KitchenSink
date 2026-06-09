ALTER TABLE webhook_events
  ADD COLUMN IF NOT EXISTS identity_id TEXT,
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill: set identity_id and event_type to placeholder for existing rows
UPDATE webhook_events SET identity_id = 'unknown', event_type = 'unknown' WHERE identity_id IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE webhook_events
  ALTER COLUMN identity_id SET NOT NULL,
  ALTER COLUMN event_type SET NOT NULL;

-- Add unique constraint
ALTER TABLE webhook_events
  ADD CONSTRAINT uq_webhook_events_identity_event UNIQUE (identity_id, event_type);
