-- Restore luma-modify — removed in error, model still needs evaluation
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'luma-modify',
  'Luma Ray 2 Modify',
  'fal.ai',
  'Modify and restyle an existing video using Luma Ray 2. Apply new styles, change lighting, alter the look of a scene while keeping the structure intact.',
  ARRAY['vid2vid'],
  'creator',
  37,
  true,
  false
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO model_status (model_slug, source, tested) VALUES ('luma-modify', 'fal', false)
ON CONFLICT (model_slug) DO NOTHING;
