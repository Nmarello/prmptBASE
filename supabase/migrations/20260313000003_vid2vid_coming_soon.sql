-- Add vid2vid to the supported_gen_types enum (if it's an enum type)
-- supported_gen_types is text[], so no enum change needed

-- Kling O1 Edit — video-to-video restyle via text prompt
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'kling-o1-edit',
  'Kling O1 Edit',
  'fal.ai',
  'Restyle and transform any video with a text prompt. Swap characters, change environments, alter visual style — motion and camera angles are preserved automatically.',
  ARRAY['vid2vid'],
  'creator',
  35,
  true,
  false
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  coming_soon = EXCLUDED.coming_soon;

-- Kling O1 Reference — preserve motion from reference video, generate new shots
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'kling-o1-reference',
  'Kling O1 Reference',
  'fal.ai',
  'Transfer motion dynamics and camera language from a reference video into new generated footage. Ideal for filmmakers extending scenes with visual consistency.',
  ARRAY['vid2vid'],
  'creator',
  36,
  true,
  false
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  coming_soon = EXCLUDED.coming_soon;

-- Luma Ray 2 Modify — restyle/modify an existing Luma video
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
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  coming_soon = EXCLUDED.coming_soon;
