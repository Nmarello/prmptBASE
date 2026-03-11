-- ============================================================
-- Recraft V4 Pro — Text to Image
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'recraft-v4-pro',
  'Recraft V4 Pro',
  'fal.ai',
  'Premium image generation from Recraft. Exceptional typography, vector-ready output, and design-grade precision. Ideal for logos, icons, and polished creative work.',
  ARRAY['txt2img'],
  'creator',
  8
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
  'txt2img',
  'Recraft V4 Pro — Text to Image',
  'Generate design-grade images with Recraft V4 Pro. Best for typography, icons, and polished visuals.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A minimalist mountain logo with clean lines and geometric shapes, bold sans-serif wordmark below, dark teal on white background..."
    },
    {
      "id": "style",
      "label": "Style",
      "type": "select",
      "options": [
        {"value": "realistic_image",       "label": "Realistic Photo"},
        {"value": "digital_illustration",  "label": "Digital Illustration"},
        {"value": "vector_illustration",   "label": "Vector Illustration"},
        {"value": "icon",                  "label": "Icon"},
        {"value": "realistic_image/b_and_w", "label": "Black & White Photo"},
        {"value": "digital_illustration/pixel_art", "label": "Pixel Art"}
      ]
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "square_hd",      "label": "Square — 1024×1024"},
        {"value": "landscape_16_9", "label": "Widescreen 16:9 — 1024×576"},
        {"value": "portrait_16_9",  "label": "Vertical 9:16 — 576×1024"},
        {"value": "landscape_4_3",  "label": "Standard 4:3 — 1024×768"},
        {"value": "portrait_4_3",   "label": "Portrait 3:4 — 768×1024"}
      ]
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
      "id": "output_format",
      "label": "Format",
      "type": "select",
      "options": [
        {"value": "jpeg", "label": "JPEG"},
        {"value": "png",  "label": "PNG"}
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
WHERE m.slug = 'recraft-v4-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
