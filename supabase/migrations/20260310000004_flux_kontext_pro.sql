-- ============================================================
-- Flux Kontext Pro — Image to Image (Black Forest Labs)
-- ============================================================
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES (
  'flux-kontext-pro',
  'Flux Kontext Pro',
  'fal.ai',
  'Context-aware image editing by Black Forest Labs. Edit any image with a text prompt — change outfits, backgrounds, styles, or objects while preserving everything else.',
  ARRAY['img2img'],
  'creator',
  7
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
  'img2img',
  'Flux Kontext Pro — Image Edit',
  'Edit an image with a natural language prompt. Flux Kontext preserves identity and context while applying your changes.',
  '[
    {
      "id": "source_image",
      "label": "Source Image",
      "type": "image_upload",
      "required": true,
      "hint": "Upload the image you want to edit"
    },
    {
      "id": "prompt",
      "label": "Edit Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "Change the background to a snowy mountain landscape, keep the subject exactly the same..."
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
      "hint": "How closely to follow the prompt. Higher = more literal.",
      "options": [
        {"value": "2.5", "label": "2.5 — Creative"},
        {"value": "3.5", "label": "3.5 — Balanced (default)"},
        {"value": "5",   "label": "5 — Precise"},
        {"value": "7",   "label": "7 — Strict"}
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
WHERE m.slug = 'flux-kontext-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  fields = EXCLUDED.fields;
