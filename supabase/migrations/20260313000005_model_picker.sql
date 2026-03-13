-- Model picker: per-user model selections with 30-day lock
-- Creator: pick up to 10 image models
-- Studio: all image models auto-included + pick up to 5 video models (sora2+kling excluded)
-- Pro: all models, no picker

-- Track selected models per user
CREATE TABLE IF NOT EXISTS user_model_selections (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES models(id) ON DELETE CASCADE,
  selected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, model_id)
);

ALTER TABLE user_model_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own model selections"
  ON user_model_selections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Lock timestamp: when set, user cannot change their selection until this date passes
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS model_picker_locked_until timestamptz DEFAULT NULL;
