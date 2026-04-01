-- ══════════════════════════════════════════════════════════════════════════════
-- 3D Generation Models: Hyper3D Rodin, Trellis, TripoSR, Hunyuan World
-- ══════════════════════════════════════════════════════════════════════════════

-- Hyper3D Rodin — text or image to 3D GLB mesh with PBR textures
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order, is_active)
VALUES (
  'hyper3d-rodin',
  'Hyper3D Rodin',
  'fal.ai',
  'Generate production-quality 3D models with PBR textures from text descriptions or reference images. Outputs GLB meshes ready for games, AR, and 3D printing.',
  ARRAY['txt23d', 'img23d'],
  'creator',
  200,
  'Hyper3D',
  1,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types, min_tier = EXCLUDED.min_tier,
  family = EXCLUDED.family, family_order = EXCLUDED.family_order, is_active = true;

-- Trellis — image to 3D mesh via structured latent representations
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order, is_active)
VALUES (
  'trellis',
  'Trellis',
  'fal.ai',
  'Convert any image into a detailed 3D model using structured latent representations. Fast, high-quality mesh generation with clean topology.',
  ARRAY['img23d'],
  'creator',
  201,
  'Trellis',
  1,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types, min_tier = EXCLUDED.min_tier,
  family = EXCLUDED.family, family_order = EXCLUDED.family_order, is_active = true;

-- TripoSR — fast single-image 3D reconstruction
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order, is_active)
VALUES (
  'triposr',
  'TripoSR',
  'fal.ai',
  'Fast 3D reconstruction from a single image. Generates clean meshes in seconds — ideal for quick prototyping and 3D asset creation.',
  ARRAY['img23d'],
  'newbie',
  202,
  'TripoSR',
  1,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types, min_tier = EXCLUDED.min_tier,
  family = EXCLUDED.family, family_order = EXCLUDED.family_order, is_active = true;

-- Hunyuan World — image to navigable 3D panoramic world
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order, is_active)
VALUES (
  'hunyuan-world',
  'Hunyuan World',
  'fal.ai',
  'Transform any image into an interactive 3D panoramic world. Navigate through AI-generated environments perfect for virtual tours and game prototyping.',
  ARRAY['img23d'],
  'creator',
  203,
  'Hunyuan World',
  1,
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types, min_tier = EXCLUDED.min_tier,
  family = EXCLUDED.family, family_order = EXCLUDED.family_order, is_active = true;

-- ══════════════════════════════════════════════════════════════════════════════
-- Templates
-- ══════════════════════════════════════════════════════════════════════════════

-- Hyper3D Rodin — Text to 3D
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt23d', 'Hyper3D Rodin — Text to 3D',
  'Describe an object or character to generate a 3D model with PBR textures.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A detailed medieval sword with ornate handle and gemstones...",
      "tooltip": "Describe the 3D object you want to create. Be specific about shape, materials, and details."
    },
    {
      "id": "material",
      "label": "Material",
      "type": "select",
      "options": [
        {"value": "PBR", "label": "PBR (Realistic)"},
        {"value": "Shaded", "label": "Shaded (Stylized)"}
      ]
    },
    {
      "id": "quality",
      "label": "Quality",
      "type": "select",
      "options": [
        {"value": "high", "label": "High"},
        {"value": "medium", "label": "Medium"},
        {"value": "low", "label": "Low (Fast)"}
      ]
    },
    {
      "id": "geometry",
      "label": "Geometry",
      "type": "select",
      "options": [
        {"value": "mesh", "label": "Triangle Mesh"},
        {"value": "quad", "label": "Quad Mesh"}
      ]
    }
  ]'::jsonb
FROM models WHERE slug = 'hyper3d-rodin'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;

-- Hyper3D Rodin — Image to 3D
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img23d', 'Hyper3D Rodin — Image to 3D',
  'Upload a reference image to generate a 3D model.',
  '[
    {
      "id": "source_image",
      "label": "Reference Image",
      "type": "image_upload",
      "required": true,
      "tooltip": "Upload an image of the object you want to convert to 3D."
    },
    {
      "id": "prompt",
      "label": "Prompt (optional)",
      "type": "textarea",
      "ai_assist": true,
      "placeholder": "Additional details about the object..."
    },
    {
      "id": "material",
      "label": "Material",
      "type": "select",
      "options": [
        {"value": "PBR", "label": "PBR (Realistic)"},
        {"value": "Shaded", "label": "Shaded (Stylized)"}
      ]
    },
    {
      "id": "quality",
      "label": "Quality",
      "type": "select",
      "options": [
        {"value": "high", "label": "High"},
        {"value": "medium", "label": "Medium"},
        {"value": "low", "label": "Low (Fast)"}
      ]
    }
  ]'::jsonb
FROM models WHERE slug = 'hyper3d-rodin'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;

-- Trellis — Image to 3D
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img23d', 'Trellis — Image to 3D',
  'Upload an image to generate a detailed 3D mesh.',
  '[
    {
      "id": "source_image",
      "label": "Reference Image",
      "type": "image_upload",
      "required": true,
      "tooltip": "Upload an image of the object you want to convert to 3D. Clean backgrounds work best."
    },
    {
      "id": "ss_sampling_steps",
      "label": "Structure Sampling Steps",
      "type": "range",
      "hint": "More steps = better quality, slower. Default: 12",
      "options": [
        {"value": "8", "label": "8"},
        {"value": "12", "label": "12"},
        {"value": "20", "label": "20"},
        {"value": "30", "label": "30"}
      ]
    },
    {
      "id": "slat_sampling_steps",
      "label": "Texture Sampling Steps",
      "type": "range",
      "hint": "More steps = better textures, slower. Default: 12",
      "options": [
        {"value": "8", "label": "8"},
        {"value": "12", "label": "12"},
        {"value": "20", "label": "20"},
        {"value": "30", "label": "30"}
      ]
    }
  ]'::jsonb
FROM models WHERE slug = 'trellis'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;

-- TripoSR — Image to 3D
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img23d', 'TripoSR — Image to 3D',
  'Upload an image to quickly generate a 3D mesh.',
  '[
    {
      "id": "source_image",
      "label": "Reference Image",
      "type": "image_upload",
      "required": true,
      "tooltip": "Upload an image of the object. Objects with clean backgrounds and good lighting work best."
    },
    {
      "id": "foreground_ratio",
      "label": "Foreground Ratio",
      "type": "select",
      "hint": "How much of the image is the object. Default: 0.85",
      "options": [
        {"value": "0.65", "label": "Small object"},
        {"value": "0.85", "label": "Normal (default)"},
        {"value": "0.95", "label": "Object fills frame"}
      ]
    },
    {
      "id": "mc_resolution",
      "label": "Mesh Resolution",
      "type": "select",
      "hint": "Higher = more detail, larger file",
      "options": [
        {"value": "128", "label": "Low (fast)"},
        {"value": "256", "label": "Medium (default)"},
        {"value": "512", "label": "High (detailed)"}
      ]
    }
  ]'::jsonb
FROM models WHERE slug = 'triposr'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;

-- Hunyuan World — Image to 3D World
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img23d', 'Hunyuan World — Image to World',
  'Upload an image to transform it into a navigable 3D panoramic world.',
  '[
    {
      "id": "source_image",
      "label": "Source Image",
      "type": "image_upload",
      "required": true,
      "tooltip": "Upload a landscape, room, or scene photo to expand into a 3D world."
    },
    {
      "id": "prompt",
      "label": "Scene Description (optional)",
      "type": "textarea",
      "placeholder": "A cozy mountain cabin interior with warm lighting..."
    },
    {
      "id": "foreground_labels",
      "label": "Foreground Objects (optional)",
      "type": "text",
      "placeholder": "chair, table, lamp",
      "hint": "Comma-separated list of foreground objects in the scene"
    },
    {
      "id": "scene_labels",
      "label": "Scene Type (optional)",
      "type": "text",
      "placeholder": "living room, indoor",
      "hint": "Comma-separated scene descriptors"
    }
  ]'::jsonb
FROM models WHERE slug = 'hunyuan-world'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name, description = EXCLUDED.description, fields = EXCLUDED.fields;

-- Add to model_status tracking
INSERT INTO model_status (model_slug, source, tested) VALUES
  ('hyper3d-rodin', 'fal', false),
  ('trellis', 'fal', false),
  ('triposr', 'fal', false),
  ('hunyuan-world', 'fal', false)
ON CONFLICT (model_slug) DO UPDATE SET source = EXCLUDED.source;
