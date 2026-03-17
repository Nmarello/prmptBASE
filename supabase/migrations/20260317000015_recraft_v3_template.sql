INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT
  (SELECT id FROM models WHERE slug = 'recraft-v3'),
  'txt2img',
  'Recraft V3',
  'Generate high-quality images with Recraft V3. Exceptional style control with realistic photo, illustration, and vector substyles.',
  '[
    {
      "id": "prompt",
      "label": "Prompt",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "A minimalist mountain logo with clean lines, bold sans-serif wordmark, dark teal on white background..."
    },
    {
      "id": "style",
      "label": "Style",
      "type": "select",
      "hint": "Select a style category.",
      "options": [
        {"value": "",                     "label": "— None (prompt-driven) —"},
        {"value": "realistic_image",      "label": "📷 Realistic Photo"},
        {"value": "digital_illustration", "label": "🎨 Digital Illustration"},
        {"value": "vector_illustration",  "label": "✏️ Vector Illustration"},
        {"value": "icon",                 "label": "🔷 Icon"},
        {"value": "any",                  "label": "✦ Any (model decides)"}
      ]
    },
    {
      "id": "aspect_ratio",
      "label": "Aspect Ratio",
      "type": "select",
      "options": [
        {"value": "1:1",  "label": "Square 1:1"},
        {"value": "16:9", "label": "Widescreen 16:9"},
        {"value": "9:16", "label": "Portrait 9:16"},
        {"value": "4:3",  "label": "Landscape 4:3"},
        {"value": "3:4",  "label": "Portrait 3:4"},
        {"value": "3:2",  "label": "Landscape 3:2"},
        {"value": "2:3",  "label": "Portrait 2:3"}
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
        {"value": "png",  "label": "PNG (best for logos/vectors)"}
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
ON CONFLICT (model_id, gen_type) DO NOTHING;
