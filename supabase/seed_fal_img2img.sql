-- Seed Flux Dev Image-to-Image model
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'flux-dev-img2img',
  'Flux Dev — Img2Img',
  'fal.ai',
  'Transform existing images with Flux Dev. Upload a source image and guide the transformation with a prompt.',
  ARRAY['img2img'],
  'creator',
  5
)
ON CONFLICT (slug) DO NOTHING;

-- Seed img2img template for Flux Dev
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  m.id,
  'img2img',
  'Flux Dev — Image to Image',
  'Upload a source image and describe how to transform it. Strength controls how much the output changes from the original.',
  '[
    {
      "id": "source_image",
      "label": "Source Image",
      "type": "image_upload",
      "required": true,
      "hint": "Upload the image you want to transform"
    },
    {
      "id": "prompt",
      "label": "Transformation Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "Describe how you want to transform the image..."
    },
    {
      "id": "strength",
      "label": "Strength",
      "type": "select",
      "hint": "How much to change the image. Lower = closer to original, higher = more creative freedom",
      "options": [
        {"value": "0.5", "label": "0.5 — Subtle"},
        {"value": "0.7", "label": "0.7 — Moderate"},
        {"value": "0.85", "label": "0.85 — Default"},
        {"value": "0.95", "label": "0.95 — Strong"},
        {"value": "1.0", "label": "1.0 — Maximum"}
      ]
    },
    {
      "id": "steps",
      "label": "Steps",
      "type": "select",
      "hint": "More steps = higher quality, slower generation",
      "options": [
        {"value": "20", "label": "Fast (20 steps)"},
        {"value": "28", "label": "Balanced (28 steps)"},
        {"value": "40", "label": "Quality (40 steps)"}
      ]
    },
    {
      "id": "guidance_scale",
      "label": "Guidance Scale",
      "type": "select",
      "hint": "How closely to follow the prompt",
      "options": [
        {"value": "2", "label": "2 — Creative"},
        {"value": "3.5", "label": "3.5 — Default"},
        {"value": "6", "label": "6 — Balanced"},
        {"value": "10", "label": "10 — Prompt-Adherent"}
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
        {"value": "jpeg", "label": "JPEG (smaller file)"},
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
WHERE m.slug = 'flux-dev-img2img'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
