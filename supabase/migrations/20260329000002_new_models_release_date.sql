-- Set released_at for new models so they appear in Featured
UPDATE models SET released_at = '2026-03-29' WHERE slug IN (
  'flux2-klein',
  'qwen-image-2-pro',
  'hailuo-2.3',
  'hunyuan-video-1.5'
);
