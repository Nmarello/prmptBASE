-- DB migration: add api_keys to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS api_keys jsonb DEFAULT '{}'::jsonb;

-- Seed Flux Schnell model
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'flux-schnell',
  'Flux Schnell',
  'fal.ai',
  'Fast, affordable image generation by Black Forest Labs. Great for rapid iteration.',
  ARRAY['txt2img'],
  'newbie',
  2
)
ON CONFLICT (slug) DO NOTHING;

-- Seed / update txt2img template for Flux Schnell
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2img',
  'Flux Schnell — Text to Image',
  'Generate images fast with Flux Schnell. Describe your scene, tune the style, lighting, and mood — all fed directly into the prompt.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A lone wolf standing on a mountain ridge at sunset, ancient pine forest below..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "square_hd", "label": "Square HD (1024×1024)"},
        {"value": "landscape_16_9", "label": "Landscape 16:9 (1024×576)"},
        {"value": "landscape_4_3", "label": "Landscape 4:3 (1024×768)"},
        {"value": "portrait_16_9", "label": "Portrait 16:9 (576×1024)"},
        {"value": "portrait_4_3", "label": "Portrait 4:3 (768×1024)"},
        {"value": "square", "label": "Square (512×512)"}
      ]
    },
    {
      "id": "style",
      "label": "Style",
      "type": "style_picker",
      "options": [
        {"value": "photorealistic", "label": "Photo"},
        {"value": "cinematic", "label": "Cinematic"},
        {"value": "digital_art", "label": "Digital Art"},
        {"value": "oil_painting", "label": "Oil Paint"},
        {"value": "watercolor", "label": "Watercolor"},
        {"value": "pencil_sketch", "label": "Sketch"},
        {"value": "3d_render", "label": "3D Render"},
        {"value": "anime", "label": "Anime"}
      ]
    },
    {
      "id": "lighting",
      "label": "Lighting",
      "type": "select",
      "options": [
        {"value": "golden_hour", "label": "Golden Hour"},
        {"value": "blue_hour", "label": "Blue Hour"},
        {"value": "studio", "label": "Studio"},
        {"value": "neon", "label": "Neon / Cyberpunk"},
        {"value": "dramatic", "label": "Dramatic"},
        {"value": "soft", "label": "Soft / Diffused"},
        {"value": "backlit", "label": "Backlit"},
        {"value": "volumetric", "label": "Volumetric / God Rays"},
        {"value": "overcast", "label": "Overcast"},
        {"value": "night", "label": "Night"}
      ]
    },
    {
      "id": "mood",
      "label": "Mood",
      "type": "multi_select",
      "options": [
        {"value": "epic", "label": "Epic"},
        {"value": "serene", "label": "Serene"},
        {"value": "mysterious", "label": "Mysterious"},
        {"value": "melancholic", "label": "Melancholic"},
        {"value": "tense", "label": "Tense"},
        {"value": "whimsical", "label": "Whimsical"},
        {"value": "dark", "label": "Dark"},
        {"value": "vibrant", "label": "Vibrant"}
      ]
    },
    {
      "id": "quality",
      "label": "Quality Tags",
      "type": "multi_select",
      "options": [
        {"value": "highly_detailed", "label": "Highly Detailed"},
        {"value": "8k", "label": "8K"},
        {"value": "sharp_focus", "label": "Sharp Focus"},
        {"value": "professional", "label": "Professional"},
        {"value": "award_winning", "label": "Award Winning"},
        {"value": "intricate", "label": "Intricate"}
      ]
    },
    {
      "id": "steps",
      "label": "Steps",
      "type": "select",
      "hint": "More steps = slightly better quality, slower generation",
      "options": [
        {"value": "4", "label": "Fast (4 steps)"},
        {"value": "8", "label": "Balanced (8 steps)"},
        {"value": "12", "label": "Quality (12 steps)"}
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
      "id": "seed",
      "label": "Seed",
      "type": "textarea",
      "placeholder": "Leave blank for random",
      "hint": "Set a seed to reproduce results exactly"
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'flux-schnell'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
