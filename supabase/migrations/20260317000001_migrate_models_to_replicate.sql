-- Migrate image models from FAL.ai → Replicate
-- Models that stay on FAL: flux-dev-img2img, hidream-full-i2i, flux-kontext-dev,
--   luma, pika, hunyuan-video, nano-banana, kling-*, runway, sora2 (video)

UPDATE models SET provider = 'replicate' WHERE slug IN (
  -- FLUX
  'flux-schnell',
  'flux-dev',
  'flux-pro',
  'flux-pro-ultra',
  'flux2-pro',
  -- Recraft
  'recraft-v3',
  'recraft-v4-pro',
  -- Ideogram
  'ideogram-v3',
  -- HiDream
  'hidream-fast',
  'hidream-full',
  -- ByteDance
  'seedream-45',
  -- Stability AI (was listed as "Stability AI" FAL provider, now replicate)
  'sd35-medium'
);
