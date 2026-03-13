-- ============================================================
-- Pika — Text to Video (active)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'pika-txt2vid',
  'Pika',
  'Pika',
  'Fast, expressive video generation built for social-first creators. Vibrant motion with strong prompt adherence.',
  ARRAY['txt2vid'],
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
SELECT
  m.id,
  'txt2vid',
  'Pika — Text to Video',
  'Generate expressive, social-ready video from a text prompt with Pika.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A dancer performs under neon lights, slow motion, vibrant colors, cinematic close-up..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "16:9", "label": "Widescreen 16:9 (default)"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "1:1",  "label": "Square 1:1"},
        {"value": "4:3",  "label": "4:3"},
        {"value": "3:4",  "label": "3:4 Portrait"}
      ]
    },
    {
      "id": "duration",
      "label": "Duration",
      "type": "select",
      "options": [
        {"value": "3",  "label": "3 seconds"},
        {"value": "5",  "label": "5 seconds (default)"},
        {"value": "10", "label": "10 seconds"}
      ]
    },
    {
      "id": "negative_prompt",
      "label": "Negative Prompt",
      "type": "textarea",
      "placeholder": "blurry, watermark, text overlay, low quality..."
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'pika-txt2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;

-- ============================================================
-- Pika — Image to Video (active)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'pika-img2vid',
  'Pika — Img2Vid',
  'Pika',
  'Animate any image into expressive video with Pika. Great for portraits, product shots, and social content.',
  ARRAY['img2vid'],
  'studio',
  29,
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
SELECT
  m.id,
  'img2vid',
  'Pika — Image to Video',
  'Animate a still image into expressive video with Pika.',
  '[
    {
      "id": "source_image",
      "label": "Source Image",
      "type": "image_upload",
      "required": true,
      "hint": "Upload the image you want to animate"
    },
    {
      "id": "prompt",
      "label": "Motion Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "Gentle camera drift, soft light shimmer, hair flowing in the wind..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "16:9", "label": "Widescreen 16:9 (default)"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "1:1",  "label": "Square 1:1"}
      ]
    },
    {
      "id": "duration",
      "label": "Duration",
      "type": "select",
      "options": [
        {"value": "3",  "label": "3 seconds"},
        {"value": "5",  "label": "5 seconds (default)"}
      ]
    },
    {
      "id": "negative_prompt",
      "label": "Negative Prompt",
      "type": "textarea",
      "placeholder": "blurry, distorted, morphing faces..."
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'pika-img2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;

-- ============================================================
-- Runway Gen-3 Alpha — Text to Video (active)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'runway-txt2vid',
  'Runway Gen-3',
  'Runway',
  'Runway''s Gen-3 Alpha model. Industry-standard cinematic video generation with exceptional motion quality and prompt adherence.',
  ARRAY['txt2vid'],
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
SELECT
  m.id,
  'txt2vid',
  'Runway Gen-3 — Text to Video',
  'Generate high-quality cinematic video from a text prompt with Runway Gen-3 Alpha.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A lone astronaut walks across a red desert landscape, dust rising with each step, twin moons visible in the purple sky..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "16:9", "label": "Widescreen 16:9 (default)"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "1:1",  "label": "Square 1:1"}
      ]
    },
    {
      "id": "duration",
      "label": "Duration",
      "type": "select",
      "options": [
        {"value": "5",  "label": "5 seconds (default)"},
        {"value": "10", "label": "10 seconds"}
      ]
    },
    {
      "id": "negative_prompt",
      "label": "Negative Prompt",
      "type": "textarea",
      "placeholder": "low quality, blurry, watermark..."
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'runway-txt2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;

-- ============================================================
-- Runway Gen-3 Alpha — Image to Video (active)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'runway-img2vid',
  'Runway Gen-3 — Img2Vid',
  'Runway',
  'Animate any image into cinematic video with Runway Gen-3 Alpha. Exceptional at preserving subject identity and adding natural motion.',
  ARRAY['img2vid'],
  'studio',
  31,
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
SELECT
  m.id,
  'img2vid',
  'Runway Gen-3 — Image to Video',
  'Animate a still image into cinematic video with Runway Gen-3 Alpha.',
  '[
    {
      "id": "source_image",
      "label": "Source Image",
      "type": "image_upload",
      "required": true,
      "hint": "Upload the image you want to animate"
    },
    {
      "id": "prompt",
      "label": "Motion Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "Slow push forward, fog rolling in from the left, leaves gently swaying..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "16:9", "label": "Widescreen 16:9 (default)"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "1:1",  "label": "Square 1:1"}
      ]
    },
    {
      "id": "duration",
      "label": "Duration",
      "type": "select",
      "options": [
        {"value": "5",  "label": "5 seconds (default)"},
        {"value": "10", "label": "10 seconds"}
      ]
    },
    {
      "id": "negative_prompt",
      "label": "Negative Prompt",
      "type": "textarea",
      "placeholder": "morphing faces, glitching, distorted..."
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'runway-img2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;

-- ============================================================
-- LTX Video — Text to Video (active)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'ltx-txt2vid',
  'LTX Video',
  'Lightricks',
  'Lightricks'' open-weight video model. Fast generation with strong prompt adherence and smooth, natural motion. Great value for high-volume creators.',
  ARRAY['txt2vid'],
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
SELECT
  m.id,
  'txt2vid',
  'LTX Video — Text to Video',
  'Fast, high-quality video generation from a text prompt using Lightricks'' LTX Video model.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A golden retriever runs across an open meadow at sunrise, tall grass catching the light, slow motion..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "16:9", "label": "Widescreen 16:9 (default)"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "1:1",  "label": "Square 1:1"}
      ]
    },
    {
      "id": "negative_prompt",
      "label": "Negative Prompt",
      "type": "textarea",
      "placeholder": "worst quality, inconsistent motion, blurry, jittery..."
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'ltx-txt2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;

-- ============================================================
-- LTX Video — Image to Video (active)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'ltx-img2vid',
  'LTX Video — Img2Vid',
  'Lightricks',
  'Animate any image with Lightricks'' LTX Video model. Fast, natural motion at a great price point.',
  ARRAY['img2vid'],
  'studio',
  33,
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
SELECT
  m.id,
  'img2vid',
  'LTX Video — Image to Video',
  'Animate a still image using Lightricks'' LTX Video model.',
  '[
    {
      "id": "source_image",
      "label": "Source Image",
      "type": "image_upload",
      "required": true,
      "hint": "Upload the image you want to animate"
    },
    {
      "id": "prompt",
      "label": "Motion Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "Gentle breeze, soft camera drift to the right, sunlight shifts..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "16:9", "label": "Widescreen 16:9 (default)"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "1:1",  "label": "Square 1:1"}
      ]
    },
    {
      "id": "negative_prompt",
      "label": "Negative Prompt",
      "type": "textarea",
      "placeholder": "worst quality, blurry, morphing..."
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'ltx-img2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;

-- ============================================================
-- Wan 2.1 — Coming Soon
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'wan-21-txt2vid',
  'Wan 2.1',
  'Alibaba',
  'Alibaba''s state-of-the-art open video model. Exceptional at complex scene composition, realistic motion, and multilingual prompts.',
  ARRAY['txt2vid', 'img2vid'],
  'studio',
  38,
  true,
  false
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  coming_soon = EXCLUDED.coming_soon;

-- ============================================================
-- Seedance 1 Pro — Coming Soon
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'seedance-1-pro-txt2vid',
  'Seedance 1 Pro',
  'ByteDance',
  'ByteDance''s pro-grade video model. Cinematic quality with strong instruction-following and consistent characters across frames.',
  ARRAY['txt2vid', 'img2vid'],
  'studio',
  39,
  true,
  false
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  coming_soon = EXCLUDED.coming_soon;
