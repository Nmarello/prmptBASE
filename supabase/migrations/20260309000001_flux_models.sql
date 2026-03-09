-- ============================================================
-- Flux Dev
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'flux-dev',
  'Flux Dev',
  'fal.ai',
  'Higher quality open-weights Flux model from Black Forest Labs. Slower than Schnell but noticeably sharper results.',
  ARRAY['txt2img'],
  'newbie',
  3
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2img',
  'Flux Dev — Text to Image',
  'Generate high-quality images with Flux Dev. More steps = better detail.',
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
      "hint": "More steps = better quality, slower generation",
      "options": [
        {"value": "10", "label": "Draft (10 steps)"},
        {"value": "20", "label": "Balanced (20 steps)"},
        {"value": "30", "label": "Quality (30 steps)"},
        {"value": "50", "label": "Max (50 steps)"}
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
      "id": "guidance_scale",
      "label": "Guidance Scale",
      "type": "select",
      "hint": "How closely to follow your prompt",
      "options": [
        {"value": "2", "label": "2 — Very Creative"},
        {"value": "3.5", "label": "3.5 — Default"},
        {"value": "6", "label": "6 — Balanced"},
        {"value": "10", "label": "10 — Prompt-Adherent"},
        {"value": "15", "label": "15 — Very Literal"}
      ]
    },
    {
      "id": "output_format",
      "label": "Output Format",
      "type": "select",
      "options": [
        {"value": "jpeg", "label": "JPEG"},
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
WHERE m.slug = 'flux-dev'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;


-- ============================================================
-- Flux Pro
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'flux-pro',
  'Flux Pro',
  'fal.ai',
  'Premium closed-API Flux model. Best prompt adherence and detail of the Flux family.',
  ARRAY['txt2img'],
  'creator',
  4
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2img',
  'Flux Pro — Text to Image',
  'Top-tier image quality from Black Forest Labs. Excellent prompt fidelity.',
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
      "hint": "More steps = better quality, slower generation",
      "options": [
        {"value": "15", "label": "Draft (15 steps)"},
        {"value": "28", "label": "Balanced (28 steps)"},
        {"value": "40", "label": "Quality (40 steps)"},
        {"value": "50", "label": "Max (50 steps)"}
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
      "id": "guidance_scale",
      "label": "Guidance Scale",
      "type": "select",
      "hint": "How closely to follow your prompt (1–10)",
      "options": [
        {"value": "2", "label": "2 — Creative"},
        {"value": "3.5", "label": "3.5 — Default"},
        {"value": "5", "label": "5 — Balanced"},
        {"value": "7", "label": "7 — Literal"},
        {"value": "10", "label": "10 — Very Literal"}
      ]
    },
    {
      "id": "output_format",
      "label": "Output Format",
      "type": "select",
      "options": [
        {"value": "jpeg", "label": "JPEG"},
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
WHERE m.slug = 'flux-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;


-- ============================================================
-- Flux Pro 1.1 Ultra
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'flux-pro-ultra',
  'Flux Pro Ultra',
  'fal.ai',
  'Highest resolution Flux model. Up to 4MP output with ultra-wide aspect ratios. Best for hero images and wallpapers.',
  ARRAY['txt2img'],
  'studio',
  5
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'txt2img',
  'Flux Pro Ultra — Text to Image',
  'Maximum resolution Flux generations. Wide aspect ratios, cinematic scale.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "An aerial view of a volcanic island at sunrise, turquoise ocean, dramatic clouds..."
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "1:1",  "label": "Square (1:1)"},
        {"value": "16:9", "label": "Widescreen 16:9"},
        {"value": "21:9", "label": "Ultra-Wide 21:9"},
        {"value": "4:3",  "label": "Standard 4:3"},
        {"value": "3:4",  "label": "Portrait 3:4"},
        {"value": "9:16", "label": "Vertical 9:16"}
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
      "id": "raw",
      "label": "Raw Mode",
      "type": "select",
      "hint": "Raw mode reduces post-processing for a more natural, photographic look",
      "options": [
        {"value": "false", "label": "Off (default)"},
        {"value": "true", "label": "On — Natural / Photographic"}
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
WHERE m.slug = 'flux-pro-ultra'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
