-- Full authoritative correction of all model_status flags
-- Rule: any model with routing (FAL, Replicate, or Direct) = live
-- coming_soon = only models with zero routing anywhere yet

-- Reset everything first
UPDATE model_status SET coming_live = false, coming_soon = false;

-- All Replicate-routed models (in REPLICATE_SLUGS in Dashboard.tsx) = live
UPDATE model_status SET coming_live = true
WHERE model_slug IN (
  'sd35-large', 'sd35-large-turbo',
  'flux-schnell', 'flux-dev', 'flux-pro', 'flux-pro-ultra', 'flux2-pro',
  'recraft-v3', 'recraft-v4-pro',
  'ideogram-v3',
  'hidream-fast', 'hidream-full',
  'seedream-45'
);

-- sd35-medium is coming soon
UPDATE model_status SET coming_soon = true WHERE model_slug = 'sd35-medium';

-- All FAL-routed models = live
UPDATE model_status SET coming_live = true
WHERE model_slug IN (
  'flux-kontext-pro', 'flux-dev-img2img', 'flux-kontext-dev',
  'nano-banana',
  'kling', 'kling-o1-edit', 'kling-o1-reference',
  'ltx-video', 'minimax-txt2vid', 'wan-21-txt2vid',
  'luma', 'hunyuan-video', 'pika', 'runway',
  'seedance-1-pro-txt2vid'
);

-- Direct API models = live
UPDATE model_status SET coming_live = true
WHERE model_slug IN ('dalle', 'gpt-image-1', 'sora2', 'imagen-4');

-- Upscaler = live
UPDATE model_status SET coming_live = true WHERE model_slug = 'upscale';
