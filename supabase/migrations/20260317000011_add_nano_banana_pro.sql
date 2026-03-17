-- Add Nano Banana Pro (Google, via Replicate)
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, is_active, coming_soon)
VALUES (
  'nano-banana-pro',
  'Nano Banana Pro',
  'Google',
  'High-quality image generation via Google Nano Banana Pro',
  ARRAY['txt2img'],
  'newbie',
  72,
  false,
  false
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO model_status (model_slug, source, tested)
VALUES ('nano-banana-pro', 'replicate', false)
ON CONFLICT (model_slug) DO NOTHING;
