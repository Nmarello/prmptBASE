-- Add released_at timestamp to models table
-- This is the trigger for the content pipeline webhook.
-- When this flips from NULL to a timestamp, Supabase fires the webhook
-- which kicks off blog post + email draft generation.
ALTER TABLE models ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ DEFAULT NULL;

-- Index for any queries filtering by release date
CREATE INDEX IF NOT EXISTS models_released_at_idx ON models (released_at) WHERE released_at IS NOT NULL;
