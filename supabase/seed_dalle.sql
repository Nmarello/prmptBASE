-- Seed DALL-E 3
insert into public.models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
values (
  'dalle',
  'DALL-E 3',
  'OpenAI',
  'OpenAI''s most capable image model. Always rewrites your prompt internally before generating — your input becomes a creative brief, not a literal instruction. Best for exploratory work where you want the AI to interpret and enhance your idea.',
  array['txt2img'],
  'newbie',
  1
) on conflict (slug) do nothing;

-- DALL-E txt2img template
insert into public.templates (model_id, gen_type, name, description, fields)
select
  id,
  'txt2img',
  'DALL-E 3 — Text to Image',
  'Generate a single high-quality image from a detailed text description.',
  '[
    {
      "id": "subject",
      "label": "Subject / Scene",
      "type": "textarea",
      "required": true,
      "ai_assist": true,
      "placeholder": "Describe the main subject, characters, or scene in detail...",
      "hint": "The more specific you are, the better the result."
    },
    {
      "id": "style",
      "label": "Art Style",
      "type": "style_picker",
      "required": true,
      "options": [
        { "value": "photorealistic", "label": "Photorealistic", "preview": null },
        { "value": "cinematic", "label": "Cinematic", "preview": null },
        { "value": "digital_art", "label": "Digital Art", "preview": null },
        { "value": "oil_painting", "label": "Oil Painting", "preview": null },
        { "value": "watercolor", "label": "Watercolor", "preview": null },
        { "value": "pencil_sketch", "label": "Pencil Sketch", "preview": null },
        { "value": "3d_render", "label": "3D Render", "preview": null },
        { "value": "anime", "label": "Anime", "preview": null }
      ]
    },
    {
      "id": "mood",
      "label": "Mood",
      "type": "multi_select",
      "required": false,
      "options": [
        { "value": "dramatic", "label": "Dramatic" },
        { "value": "serene", "label": "Serene" },
        { "value": "mysterious", "label": "Mysterious" },
        { "value": "energetic", "label": "Energetic" },
        { "value": "melancholic", "label": "Melancholic" },
        { "value": "whimsical", "label": "Whimsical" },
        { "value": "epic", "label": "Epic" },
        { "value": "intimate", "label": "Intimate" }
      ]
    },
    {
      "id": "lighting",
      "label": "Lighting",
      "type": "select",
      "required": false,
      "options": [
        { "value": "natural", "label": "Natural" },
        { "value": "golden_hour", "label": "Golden Hour" },
        { "value": "studio", "label": "Studio" },
        { "value": "neon", "label": "Neon / Cyberpunk" },
        { "value": "dramatic", "label": "Dramatic / High Contrast" },
        { "value": "soft_diffused", "label": "Soft & Diffused" },
        { "value": "backlit", "label": "Backlit / Silhouette" },
        { "value": "volumetric", "label": "Volumetric / God Rays" }
      ]
    },
    {
      "id": "composition",
      "label": "Composition",
      "type": "select",
      "required": false,
      "options": [
        { "value": "close_up", "label": "Close-up / Portrait" },
        { "value": "medium_shot", "label": "Medium Shot" },
        { "value": "wide_shot", "label": "Wide Shot" },
        { "value": "aerial", "label": "Aerial / Bird''s Eye" },
        { "value": "macro", "label": "Macro / Extreme Close-up" },
        { "value": "worms_eye", "label": "Worm''s Eye View" },
        { "value": "rule_of_thirds", "label": "Rule of Thirds" }
      ]
    },
    {
      "id": "color_palette",
      "label": "Color Palette",
      "type": "multi_select",
      "required": false,
      "options": [
        { "value": "warm", "label": "Warm Tones" },
        { "value": "cool", "label": "Cool Tones" },
        { "value": "monochrome", "label": "Monochrome" },
        { "value": "vibrant", "label": "Vibrant / Saturated" },
        { "value": "muted", "label": "Muted / Desaturated" },
        { "value": "pastel", "label": "Pastel" },
        { "value": "dark", "label": "Dark / Moody" },
        { "value": "neon", "label": "Neon" }
      ]
    },
    {
      "id": "additional_details",
      "label": "Additional Details",
      "type": "textarea",
      "required": false,
      "ai_assist": true,
      "placeholder": "Any extra details, references, or specific elements to include or avoid..."
    },
    {
      "id": "size",
      "label": "Output Size",
      "type": "select",
      "required": true,
      "options": [
        { "value": "1024x1024", "label": "Square (1024×1024)" },
        { "value": "1792x1024", "label": "Landscape (1792×1024)" },
        { "value": "1024x1792", "label": "Portrait (1024×1792)" }
      ]
    },
    {
      "id": "quality",
      "label": "Quality",
      "type": "select",
      "required": true,
      "options": [
        { "value": "hd", "label": "HD — Higher detail, slower" },
        { "value": "standard", "label": "Standard — Faster" }
      ]
    }
  ]'::jsonb
from public.models where slug = 'dalle'
on conflict (model_id, gen_type) do nothing;
