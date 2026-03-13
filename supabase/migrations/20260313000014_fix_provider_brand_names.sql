-- Fix all provider fields to real brand names instead of 'fal.ai'
-- fal.ai is an infrastructure detail, not a brand users should see

UPDATE models SET provider = 'Black Forest Labs' WHERE slug IN (
  'flux-schnell', 'flux-dev', 'flux-pro', 'flux-pro-ultra',
  'flux-dev-img2img', 'flux-kontext-pro', 'flux-kontext-dev', 'flux2-pro'
);

UPDATE models SET provider = 'Google'       WHERE slug IN ('nano-banana', 'nano-banana-edit');
UPDATE models SET provider = 'Recraft'      WHERE slug IN ('recraft-v4-pro', 'recraft-v3');
UPDATE models SET provider = 'Ideogram'     WHERE slug IN ('ideogram-v3');
UPDATE models SET provider = 'HiDream'      WHERE slug IN ('hidream-fast', 'hidream-full', 'hidream-full-i2i');
UPDATE models SET provider = 'OpenAI'       WHERE slug IN ('sora2', 'sora2-txt2vid', 'sora2-img2vid');
UPDATE models SET provider = 'Kuaishou'     WHERE slug IN ('kling', 'kling-txt2vid', 'kling-img2vid', 'kling-o1-edit', 'kling-o1-reference');
UPDATE models SET provider = 'Luma AI'      WHERE slug IN ('luma', 'luma-txt2vid', 'luma-img2vid', 'luma-modify');
UPDATE models SET provider = 'Minimax'      WHERE slug IN ('minimax-txt2vid', 'minimax');
UPDATE models SET provider = 'Pika Labs'    WHERE slug IN ('pika');
UPDATE models SET provider = 'Runway'       WHERE slug IN ('runway');
UPDATE models SET provider = 'Lightricks'   WHERE slug IN ('ltx-video');
UPDATE models SET provider = 'Zhipu AI'     WHERE slug IN ('cogvideox');
UPDATE models SET provider = 'Stability AI' WHERE slug IN ('sd35-medium');
UPDATE models SET provider = 'ByteDance'    WHERE slug IN ('seedream-45', 'seedance-1-pro', 'seedance-1-pro-txt2vid');
-- wan-21-txt2vid and veo/imagen/dalle/gpt-image-1 already have correct providers
