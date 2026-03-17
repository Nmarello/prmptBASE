-- Models with unconfirmed Replicate paths → coming soon, not live
UPDATE model_status SET
  coming_live = false,
  coming_soon = true
WHERE model_slug IN (
  'flux2-pro', 'recraft-v4-pro',
  'hidream-fast', 'hidream-full',
  'seedream-45', 'imagen-4'
);
