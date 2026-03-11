-- ============================================================
-- Sora 2 — Text to Video (OpenAI via fal.ai)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'sora2-txt2vid',
  'Sora 2',
  'fal.ai',
  'OpenAI''s flagship video model. Generate cinematic, physics-accurate video from a text description. Up to 1080p.',
  ARRAY['txt2vid'],
  'studio',
  25
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  min_tier = EXCLUDED.min_tier,
  sort_order = EXCLUDED.sort_order;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2vid',
  'Sora 2 — Text to Video',
  'Generate cinematic video from a text prompt with OpenAI Sora 2.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A slow aerial shot over a dense rainforest at golden hour, rivers of mist drifting between ancient trees, sunbeams cutting through the canopy..."
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
      "id": "resolution",
      "label": "Resolution",
      "type": "select",
      "options": [
        {"value": "720p",  "label": "720p (default)"},
        {"value": "1080p", "label": "1080p"},
        {"value": "480p",  "label": "480p (faster)"}
      ]
    },
    {
      "id": "duration",
      "label": "Duration",
      "type": "select",
      "options": [
        {"value": "5",  "label": "5 seconds (default)"},
        {"value": "10", "label": "10 seconds"},
        {"value": "15", "label": "15 seconds"},
        {"value": "20", "label": "20 seconds"}
      ]
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'sora2-txt2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;

-- ============================================================
-- Sora 2 — Image to Video
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'sora2-img2vid',
  'Sora 2 — Img2Vid',
  'fal.ai',
  'Animate a still image into a cinematic video with OpenAI Sora 2. Up to 1080p output.',
  ARRAY['img2vid'],
  'studio',
  26
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  min_tier = EXCLUDED.min_tier,
  sort_order = EXCLUDED.sort_order;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'img2vid',
  'Sora 2 — Image to Video',
  'Animate a still image into a cinematic video with OpenAI Sora 2.',
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
      "placeholder": "Camera slowly pushes in, light shifts from warm sunset to cool dusk, clouds drift across the sky..."
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
      "id": "resolution",
      "label": "Resolution",
      "type": "select",
      "options": [
        {"value": "720p",  "label": "720p (default)"},
        {"value": "1080p", "label": "1080p"},
        {"value": "480p",  "label": "480p (faster)"}
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
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'sora2-img2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
