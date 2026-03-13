-- Consolidate split txt2vid/img2vid models into single multi-gentype entries
-- (like DALL-E / Flux Dev — one card, multiple gen types)

-- ============================================================
-- Pika → single model with both gen types
-- ============================================================
-- Remove the split entries
DELETE FROM templates WHERE model_id IN (SELECT id FROM models WHERE slug IN ('pika-txt2vid','pika-img2vid'));
DELETE FROM models WHERE slug IN ('pika-txt2vid','pika-img2vid');

INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'pika',
  'Pika',
  'Pika',
  'Fast, expressive video generation built for social-first creators. Vibrant motion with strong prompt adherence.',
  ARRAY['txt2vid','img2vid'],
  'studio',
  28,
  false,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  min_tier = EXCLUDED.min_tier,
  sort_order = EXCLUDED.sort_order,
  coming_soon = EXCLUDED.coming_soon,
  is_active = EXCLUDED.is_active;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'txt2vid', 'Pika — Text to Video', 'Generate expressive, social-ready video from a text prompt with Pika.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A dancer performs under neon lights, slow motion, vibrant colors, cinematic close-up..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[{"value":"16:9","label":"Widescreen 16:9 (default)"},{"value":"9:16","label":"Vertical 9:16"},{"value":"1:1","label":"Square 1:1"},{"value":"4:3","label":"4:3"},{"value":"3:4","label":"3:4 Portrait"}]},
    {"id":"duration","label":"Duration","type":"select","options":[{"value":"3","label":"3 seconds"},{"value":"5","label":"5 seconds (default)"},{"value":"10","label":"10 seconds"}]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, watermark, text overlay, low quality..."}
  ]'::jsonb
FROM models m WHERE m.slug = 'pika'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'img2vid', 'Pika — Image to Video', 'Animate any image into expressive video with Pika.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image you want to animate"},
    {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"Gentle camera drift, soft light shimmer, hair flowing in the wind..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[{"value":"16:9","label":"Widescreen 16:9 (default)"},{"value":"9:16","label":"Vertical 9:16"},{"value":"1:1","label":"Square 1:1"}]},
    {"id":"duration","label":"Duration","type":"select","options":[{"value":"3","label":"3 seconds"},{"value":"5","label":"5 seconds (default)"}]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, distorted, morphing faces..."}
  ]'::jsonb
FROM models m WHERE m.slug = 'pika'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;

-- ============================================================
-- Runway → single model with both gen types
-- ============================================================
DELETE FROM templates WHERE model_id IN (SELECT id FROM models WHERE slug IN ('runway-txt2vid','runway-img2vid'));
DELETE FROM models WHERE slug IN ('runway-txt2vid','runway-img2vid');

INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'runway',
  'Runway Gen-3',
  'Runway',
  'Industry-standard cinematic video generation with exceptional motion quality and prompt adherence.',
  ARRAY['txt2vid','img2vid'],
  'studio',
  30,
  false,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  min_tier = EXCLUDED.min_tier,
  sort_order = EXCLUDED.sort_order,
  coming_soon = EXCLUDED.coming_soon,
  is_active = EXCLUDED.is_active;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'txt2vid', 'Runway Gen-3 — Text to Video', 'Generate high-quality cinematic video from a text prompt with Runway Gen-3 Alpha.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A lone astronaut walks across a red desert landscape, dust rising with each step, twin moons visible in the purple sky..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[{"value":"16:9","label":"Widescreen 16:9 (default)"},{"value":"9:16","label":"Vertical 9:16"},{"value":"1:1","label":"Square 1:1"}]},
    {"id":"duration","label":"Duration","type":"select","options":[{"value":"5","label":"5 seconds (default)"},{"value":"10","label":"10 seconds"}]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"low quality, blurry, watermark..."}
  ]'::jsonb
FROM models m WHERE m.slug = 'runway'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'img2vid', 'Runway Gen-3 — Image to Video', 'Animate a still image into cinematic video with Runway Gen-3 Alpha.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image you want to animate"},
    {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"Slow push forward, fog rolling in from the left, leaves gently swaying..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[{"value":"16:9","label":"Widescreen 16:9 (default)"},{"value":"9:16","label":"Vertical 9:16"},{"value":"1:1","label":"Square 1:1"}]},
    {"id":"duration","label":"Duration","type":"select","options":[{"value":"5","label":"5 seconds (default)"},{"value":"10","label":"10 seconds"}]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"morphing faces, glitching, distorted..."}
  ]'::jsonb
FROM models m WHERE m.slug = 'runway'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;

-- ============================================================
-- LTX Video → single model with both gen types
-- ============================================================
DELETE FROM templates WHERE model_id IN (SELECT id FROM models WHERE slug IN ('ltx-txt2vid','ltx-img2vid'));
DELETE FROM models WHERE slug IN ('ltx-txt2vid','ltx-img2vid');

INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'ltx-video',
  'LTX Video',
  'Lightricks',
  'Lightricks'' open-weight video model. Fast generation with strong prompt adherence and smooth, natural motion.',
  ARRAY['txt2vid','img2vid'],
  'studio',
  32,
  false,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  min_tier = EXCLUDED.min_tier,
  sort_order = EXCLUDED.sort_order,
  coming_soon = EXCLUDED.coming_soon,
  is_active = EXCLUDED.is_active;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'txt2vid', 'LTX Video — Text to Video', 'Fast, high-quality video generation from a text prompt using Lightricks'' LTX Video.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A golden retriever runs across an open meadow at sunrise, tall grass catching the light, slow motion..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[{"value":"16:9","label":"Widescreen 16:9 (default)"},{"value":"9:16","label":"Vertical 9:16"},{"value":"1:1","label":"Square 1:1"}]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"worst quality, inconsistent motion, blurry, jittery..."}
  ]'::jsonb
FROM models m WHERE m.slug = 'ltx-video'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'img2vid', 'LTX Video — Image to Video', 'Animate a still image using Lightricks'' LTX Video model.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image you want to animate"},
    {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"Gentle breeze, soft camera drift to the right, sunlight shifts..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[{"value":"16:9","label":"Widescreen 16:9 (default)"},{"value":"9:16","label":"Vertical 9:16"},{"value":"1:1","label":"Square 1:1"}]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"worst quality, blurry, morphing..."}
  ]'::jsonb
FROM models m WHERE m.slug = 'ltx-video'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;
