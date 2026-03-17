-- Seed model_status rows for any models not already present
-- Derive source from provider: OpenAI/Google = direct, else check if already in model_status or default to fal
INSERT INTO model_status (model_slug, source, tested)
SELECT
  m.slug,
  CASE
    WHEN m.provider IN ('OpenAI', 'Google') THEN 'direct'
    WHEN m.slug IN (
      'sd35-large','sd35-large-turbo','sd35-medium',
      'flux-schnell','flux-dev','flux-pro','flux-pro-ultra','flux2-pro',
      'recraft-v3','recraft-v4-pro',
      'ideogram-v3',
      'hidream-fast','hidream-full',
      'seedream-45',
      'nano-banana-pro'
    ) THEN 'replicate'
    ELSE 'fal'
  END,
  false
FROM models m
WHERE m.slug NOT IN (SELECT model_slug FROM model_status)
ON CONFLICT (model_slug) DO NOTHING;
