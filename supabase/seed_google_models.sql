-- ============================================================
-- Imagen 3
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'imagen-3.0-generate-002',
  'Imagen 3',
  'Google',
  'Google''s best text-to-image model. Photorealistic quality, strong prompt following, and vivid detail across styles.',
  ARRAY['txt2img'],
  'newbie',
  10
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2img',
  'Imagen 3 — Text to Image',
  'Generate stunning images with Google''s flagship Imagen 3 model.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A misty mountain lake at dawn, towering pine trees reflected in still water, golden light breaking through clouds..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "1:1",  "label": "Square (1:1) — 1024×1024"},
        {"value": "16:9", "label": "Widescreen 16:9 — 1408×768"},
        {"value": "9:16", "label": "Vertical 9:16 — 768×1408"},
        {"value": "4:3",  "label": "Standard 4:3 — 1280×960"},
        {"value": "3:4",  "label": "Portrait 3:4 — 960×1280"}
      ]
    },
    {
      "id": "negative_prompt",
      "label": "Negative Prompt",
      "type": "textarea",
      "placeholder": "blurry, low quality, distorted, watermark...",
      "hint": "Describe what you do NOT want in the image"
    },
    {
      "id": "num_images",
      "label": "# of Images",
      "type": "select",
      "options": [
        {"value": "1", "label": "1 image"},
        {"value": "2", "label": "2 images"},
        {"value": "4", "label": "4 images"}
      ]
    },
    {
      "id": "seed",
      "label": "Seed",
      "type": "textarea",
      "placeholder": "Leave blank for random",
      "hint": "Set a seed to reproduce the same result"
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'imagen-3.0-generate-002'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;


-- ============================================================
-- Veo 2 — Text to Video
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'veo-2.0-generate-001',
  'Veo 2',
  'Google',
  'Google''s state-of-the-art video generation model. Creates cinematic, high-fidelity video clips from text or image prompts. Renders in ~2–4 minutes.',
  ARRAY['txt2vid', 'img2vid'],
  'creator',
  11
)
ON CONFLICT (slug) DO NOTHING;

-- Veo 2: txt2vid template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2vid',
  'Veo 2 — Text to Video',
  'Generate cinematic video clips from a text description. Takes 2–4 minutes to render.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A slow cinematic drone shot over a misty pine forest at dawn, golden light filtering through trees, dew drops on leaves..."
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
        {"value": "5",  "label": "5 seconds"},
        {"value": "8",  "label": "8 seconds (default)"},
        {"value": "10", "label": "10 seconds"}
      ]
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'veo-2.0-generate-001'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;

-- Veo 2: img2vid template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'img2vid',
  'Veo 2 — Image to Video',
  'Animate a still image into a cinematic video clip. Takes 2–4 minutes to render.',
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
      "placeholder": "Camera slowly pans right, clouds drift across the sky, trees sway gently in the breeze..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "16:9", "label": "Widescreen 16:9"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "1:1",  "label": "Square 1:1"}
      ]
    },
    {
      "id": "duration",
      "label": "Duration",
      "type": "select",
      "options": [
        {"value": "5",  "label": "5 seconds"},
        {"value": "8",  "label": "8 seconds (default)"},
        {"value": "10", "label": "10 seconds"}
      ]
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'veo-2.0-generate-001'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
