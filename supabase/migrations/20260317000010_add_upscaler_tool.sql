-- Add upscaler as a tool in the models table
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, is_active, coming_soon)
VALUES (
  'upscaler',
  'AI Upscaler',
  'Real-ESRGAN',
  'Upscale images 2× or 4× using Real-ESRGAN',
  ARRAY['upscale'],
  'newbie',
  10,
  true,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- Seed model_status source
INSERT INTO model_status (model_slug, source, tested)
VALUES ('upscaler', 'direct', true)
ON CONFLICT (model_slug) DO NOTHING;
