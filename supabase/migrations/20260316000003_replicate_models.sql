-- ============================================================
-- SD 3.5 Large (Replicate)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'sd35-large',
  'SD 3.5 Large',
  'replicate',
  'Stability AI''s flagship model. Exceptional photorealism, strong text rendering, and creative flexibility.',
  ARRAY['txt2img'],
  'creator',
  30
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2img',
  'SD 3.5 Large — Text to Image',
  'High-fidelity image generation from Stability AI. Excellent prompt adherence and photorealism.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A majestic mountain range at dawn, mist rolling through the valleys, dramatic lighting..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "1:1",  "label": "Square (1:1)"},
        {"value": "16:9", "label": "Widescreen 16:9"},
        {"value": "4:3",  "label": "Standard 4:3"},
        {"value": "3:4",  "label": "Portrait 3:4"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "3:2",  "label": "Landscape 3:2"},
        {"value": "2:3",  "label": "Portrait 2:3"},
        {"value": "21:9", "label": "Ultra-Wide 21:9"}
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
      "id": "negative_prompt",
      "label": "Negative Prompt",
      "type": "textarea",
      "placeholder": "blurry, low quality, distorted, watermark..."
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
        {"value": "webp", "label": "WebP (default)"},
        {"value": "jpg", "label": "JPEG"},
        {"value": "png", "label": "PNG (lossless)"}
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
WHERE m.slug = 'sd35-large'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;


-- ============================================================
-- SD 3.5 Large Turbo (Replicate)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'sd35-large-turbo',
  'SD 3.5 Turbo',
  'replicate',
  'Fast distilled version of SD 3.5 Large. 4-step generation — great quality at high speed.',
  ARRAY['txt2img'],
  'newbie',
  31
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2img',
  'SD 3.5 Turbo — Text to Image',
  'Ultra-fast image generation using SD 3.5 Large Turbo. Few-step distilled model from Stability AI.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A majestic mountain range at dawn, mist rolling through the valleys, dramatic lighting..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "1:1",  "label": "Square (1:1)"},
        {"value": "16:9", "label": "Widescreen 16:9"},
        {"value": "4:3",  "label": "Standard 4:3"},
        {"value": "3:4",  "label": "Portrait 3:4"},
        {"value": "9:16", "label": "Vertical 9:16"},
        {"value": "3:2",  "label": "Landscape 3:2"},
        {"value": "2:3",  "label": "Portrait 2:3"},
        {"value": "21:9", "label": "Ultra-Wide 21:9"}
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
        {"value": "webp", "label": "WebP (default)"},
        {"value": "jpg", "label": "JPEG"},
        {"value": "png", "label": "PNG (lossless)"}
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
WHERE m.slug = 'sd35-large-turbo'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
