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

-- Seed txt2img template for Flux Schnell
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2img',
  'Flux Schnell — Text to Image',
  'Generate images fast with Flux Schnell. Describe your scene and choose a style.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A majestic mountain range at golden hour, ancient pine forest in the foreground..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "required": false,
      "options": [
        {"value": "square_hd", "label": "Square HD (1024×1024)"},
        {"value": "square", "label": "Square (512×512)"},
        {"value": "landscape_16_9", "label": "Landscape 16:9"},
        {"value": "landscape_4_3", "label": "Landscape 4:3"},
        {"value": "portrait_16_9", "label": "Portrait 16:9"},
        {"value": "portrait_4_3", "label": "Portrait 4:3"}
      ]
    },
    {
      "id": "style",
      "label": "Style",
      "type": "style_picker",
      "required": false,
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
      "id": "negative_prompt",
      "label": "Negative Prompt",
      "type": "textarea",
      "required": false,
      "placeholder": "blurry, low quality, distorted, ugly..."
    },
    {
      "id": "seed",
      "label": "Seed (optional)",
      "type": "textarea",
      "required": false,
      "placeholder": "Leave blank for random",
      "hint": "Set a seed to reproduce the same image"
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'flux-schnell'
ON CONFLICT (model_id, gen_type) DO NOTHING;
