-- Per-model lock: each selection row tracks its own lock expiry
ALTER TABLE user_model_selections
  ADD COLUMN IF NOT EXISTS locked_until timestamptz DEFAULT NULL;
