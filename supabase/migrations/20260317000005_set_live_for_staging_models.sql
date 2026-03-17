-- Live = available in staging for testing
UPDATE model_status SET coming_live = true
WHERE model_slug IN (
  'sd35-medium', 'flux-schnell', 'flux-dev', 'flux-pro', 'flux-pro-ultra',
  'flux2-pro', 'recraft-v3', 'recraft-v4-pro', 'ideogram-v3',
  'hidream-fast', 'hidream-full', 'seedream-45'
);
