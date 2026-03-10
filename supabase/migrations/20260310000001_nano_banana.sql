-- ============================================================
-- Nano Banana 2 (Google Gemini Image via fal.ai)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'nano-banana',
  'Nano Banana 2',
  'fal.ai',
  'Google Gemini 3.1 Flash Image via fal.ai. 4K output, strong text rendering, character consistency, and natural language image editing.',
  ARRAY['txt2img', 'img2img'],
  'newbie',
  6
)
ON CONFLICT (slug) DO NOTHING;

-- txt2img template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2img',
  'Nano Banana 2 — Text to Image',
  'Generate images with Google''s Gemini image model. Excellent prompt adherence, text rendering, and 4K quality.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A hyperrealistic macro photo of a dewdrop on a spider web at sunrise, golden bokeh..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "1:1",  "label": "Square (1:1)"},
        {"value": "16:9", "label": "Widescreen 16:9"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "4:3",  "label": "Standard 4:3"},
        {"value": "3:4",  "label": "Portrait 3:4"},
        {"value": "3:2",  "label": "Landscape 3:2"},
        {"value": "2:3",  "label": "Portrait 2:3"}
      ]
    },
    {
      "id": "resolution",
      "label": "Resolution",
      "type": "select",
      "hint": "Higher = sharper but slower",
      "options": [
        {"value": "1K",  "label": "1K (default)"},
        {"value": "2K",  "label": "2K"},
        {"value": "4K",  "label": "4K (max quality)"},
        {"value": "0.5K","label": "0.5K (fast draft)"}
      ]
    },
    {
      "id": "thinking_level",
      "label": "Thinking Level",
      "type": "select",
      "hint": "Higher thinking = better prompt understanding, slower",
      "options": [
        {"value": "",       "label": "Default"},
        {"value": "minimal","label": "Minimal — Fast"},
        {"value": "high",   "label": "High — Best Quality"}
      ]
    },
    {
      "id": "style",
      "label": "Style",
      "type": "style_picker",
      "options": [
        {"value": "photorealistic", "label": "Photo"},
        {"value": "cinematic",      "label": "Cinematic"},
        {"value": "digital_art",    "label": "Digital Art"},
        {"value": "oil_painting",   "label": "Oil Paint"},
        {"value": "watercolor",     "label": "Watercolor"},
        {"value": "pencil_sketch",  "label": "Sketch"},
        {"value": "3d_render",      "label": "3D Render"},
        {"value": "anime",          "label": "Anime"}
      ]
    },
    {
      "id": "lighting",
      "label": "Lighting",
      "type": "select",
      "options": [
        {"value": "golden_hour", "label": "Golden Hour"},
        {"value": "blue_hour",   "label": "Blue Hour"},
        {"value": "studio",      "label": "Studio"},
        {"value": "neon",        "label": "Neon / Cyberpunk"},
        {"value": "dramatic",    "label": "Dramatic"},
        {"value": "soft",        "label": "Soft / Diffused"},
        {"value": "backlit",     "label": "Backlit"},
        {"value": "volumetric",  "label": "Volumetric / God Rays"},
        {"value": "overcast",    "label": "Overcast"},
        {"value": "night",       "label": "Night"}
      ]
    },
    {
      "id": "mood",
      "label": "Mood",
      "type": "multi_select",
      "options": [
        {"value": "epic",       "label": "Epic"},
        {"value": "serene",     "label": "Serene"},
        {"value": "mysterious", "label": "Mysterious"},
        {"value": "melancholic","label": "Melancholic"},
        {"value": "tense",      "label": "Tense"},
        {"value": "whimsical",  "label": "Whimsical"},
        {"value": "dark",       "label": "Dark"},
        {"value": "vibrant",    "label": "Vibrant"}
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
      "label": "Output Format",
      "type": "select",
      "options": [
        {"value": "jpeg", "label": "JPEG"},
        {"value": "png",  "label": "PNG (lossless)"},
        {"value": "webp", "label": "WebP"}
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
WHERE m.slug = 'nano-banana'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;

-- img2img template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'img2img',
  'Nano Banana 2 — Image Edit',
  'Edit and transform images with natural language using Google''s Gemini image model.',
  '[
    {
      "id": "source_image",
      "label": "Source Image",
      "type": "image_upload",
      "required": true
    },
    {
      "id": "prompt",
      "label": "Edit Instruction",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "Change the sky to a dramatic sunset, keep everything else the same..."
    },
    {
      "id": "aspect_ratio",
      "label": "Output Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "1:1",  "label": "Square (1:1)"},
        {"value": "16:9", "label": "Widescreen 16:9"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "4:3",  "label": "Standard 4:3"},
        {"value": "3:4",  "label": "Portrait 3:4"}
      ]
    },
    {
      "id": "resolution",
      "label": "Resolution",
      "type": "select",
      "options": [
        {"value": "1K", "label": "1K (default)"},
        {"value": "2K", "label": "2K"},
        {"value": "4K", "label": "4K"}
      ]
    },
    {
      "id": "num_images",
      "label": "# of Variations",
      "type": "select",
      "options": [
        {"value": "1", "label": "1 image"},
        {"value": "2", "label": "2 images"},
        {"value": "4", "label": "4 images"}
      ]
    },
    {
      "id": "output_format",
      "label": "Output Format",
      "type": "select",
      "options": [
        {"value": "jpeg", "label": "JPEG"},
        {"value": "png",  "label": "PNG (lossless)"}
      ]
    }
  ]'::jsonb
FROM models m
WHERE m.slug = 'nano-banana'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
