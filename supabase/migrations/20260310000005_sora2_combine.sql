-- Combine Sora 2 into a single model with both txt2vid + img2vid
-- Move to top of video (sort_order 19, before Kling at 20)

UPDATE models
SET
  slug = 'sora2',
  name = 'Sora 2',
  supported_gen_types = ARRAY['txt2vid', 'img2vid'],
  sort_order = 19
WHERE slug = 'sora2-txt2vid';

-- Deactivate the now-redundant img2vid-only model
UPDATE models SET is_active = false WHERE slug = 'sora2-img2vid';

-- Add img2vid template to the combined model
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
WHERE m.slug = 'sora2'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
