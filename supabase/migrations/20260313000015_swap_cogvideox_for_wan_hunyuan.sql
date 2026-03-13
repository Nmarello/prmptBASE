-- Deactivate CogVideoX 5B (low quality)
UPDATE models SET is_active = false, coming_soon = true WHERE slug = 'cogvideox';

-- Activate Wan 2.1 (already in DB, just flip the flags)
UPDATE models SET is_active = true, coming_soon = false WHERE slug = 'wan-21-txt2vid';

-- Add HunyuanVideo (Tencent — best open-source video model)
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active)
VALUES (
  'hunyuan-video',
  'HunyuanVideo',
  'Tencent',
  'Tencent''s flagship open-source video model. Best-in-class motion quality, photorealistic output, and strong prompt adherence. Supports aspect ratio control and long-form generation.',
  ARRAY['txt2vid', 'img2vid'],
  'studio',
  34,
  false,
  true
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  provider = EXCLUDED.provider,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  is_active = EXCLUDED.is_active,
  coming_soon = EXCLUDED.coming_soon;

-- ── Wan 2.1 templates ─────────────────────────────────────────────────────────

DELETE FROM templates WHERE model_id = (SELECT id FROM models WHERE slug = 'wan-21-txt2vid');

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'txt2vid', 'Wan 2.1 Text to Video', '[
  {"name":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"A red panda playing in a bamboo forest, soft morning light"},
  {"name":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark"},
  {"name":"aspect_ratio","label":"Aspect Ratio","type":"select","default":"16:9","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"},
    {"value":"1:1","label":"1:1 Square"},
    {"value":"4:3","label":"4:3 Standard"},
    {"value":"3:4","label":"3:4 Tall"}
  ]},
  {"name":"num_inference_steps","label":"Inference Steps","type":"select","default":"30","hint":"More steps = better quality, slower generation","options":[
    {"value":"20","label":"20 — Fast"},
    {"value":"30","label":"30 — Balanced (default)"},
    {"value":"40","label":"40 — Quality"},
    {"value":"50","label":"50 — Max quality"}
  ]},
  {"name":"guidance_scale","label":"Guidance Scale","type":"slider","min":1,"max":10,"step":0.5,"default":5,"hint":"How closely the video follows the prompt. 4–7 is a good range."},
  {"name":"seed","label":"Seed","type":"number","placeholder":"Random","hint":"Set a seed for reproducible results"}
]'::jsonb
FROM models m WHERE m.slug = 'wan-21-txt2vid';

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'img2vid', 'Wan 2.1 Image to Video', '[
  {"name":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"The character walks forward, cinematic lighting"},
  {"name":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted"},
  {"name":"aspect_ratio","label":"Aspect Ratio","type":"select","default":"16:9","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"},
    {"value":"1:1","label":"1:1 Square"},
    {"value":"4:3","label":"4:3 Standard"}
  ]},
  {"name":"num_inference_steps","label":"Inference Steps","type":"select","default":"30","options":[
    {"value":"20","label":"20 — Fast"},
    {"value":"30","label":"30 — Balanced"},
    {"value":"40","label":"40 — Quality"},
    {"value":"50","label":"50 — Max"}
  ]},
  {"name":"guidance_scale","label":"Guidance Scale","type":"slider","min":1,"max":10,"step":0.5,"default":5},
  {"name":"seed","label":"Seed","type":"number","placeholder":"Random"}
]'::jsonb
FROM models m WHERE m.slug = 'wan-21-txt2vid';

-- ── HunyuanVideo templates ────────────────────────────────────────────────────

DELETE FROM templates WHERE model_id = (SELECT id FROM models WHERE slug = 'hunyuan-video');

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'txt2vid', 'HunyuanVideo Text to Video', '[
  {"name":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"A lone astronaut walks across a red desert landscape at dusk, cinematic wide shot"},
  {"name":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark, bad anatomy"},
  {"name":"aspect_ratio","label":"Aspect Ratio","type":"select","default":"16:9","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"},
    {"value":"1:1","label":"1:1 Square"},
    {"value":"4:3","label":"4:3 Standard"},
    {"value":"3:4","label":"3:4 Tall"}
  ]},
  {"name":"num_frames","label":"Duration","type":"select","default":"45","hint":"45 frames ≈ 3s · 97 frames ≈ 6s · longer = significantly slower","options":[
    {"value":"45","label":"~3s (45 frames)"},
    {"value":"97","label":"~6s (97 frames)"}
  ]},
  {"name":"num_inference_steps","label":"Inference Steps","type":"select","default":"50","hint":"50 is standard; reduce for faster drafts","options":[
    {"value":"30","label":"30 — Fast draft"},
    {"value":"40","label":"40 — Balanced"},
    {"value":"50","label":"50 — Standard (default)"}
  ]},
  {"name":"guidance_scale","label":"Guidance Scale","type":"slider","min":1,"max":10,"step":0.5,"default":6,"hint":"6 is recommended. Lower for more creative output."},
  {"name":"seed","label":"Seed","type":"number","placeholder":"Random","hint":"Set a seed for reproducible results"}
]'::jsonb
FROM models m WHERE m.slug = 'hunyuan-video';

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'img2vid', 'HunyuanVideo Image to Video', '[
  {"name":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"Camera slowly pushes in, soft bokeh, cinematic"},
  {"name":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted"},
  {"name":"aspect_ratio","label":"Aspect Ratio","type":"select","default":"16:9","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"},
    {"value":"1:1","label":"1:1 Square"},
    {"value":"4:3","label":"4:3 Standard"},
    {"value":"3:4","label":"3:4 Tall"}
  ]},
  {"name":"num_frames","label":"Duration","type":"select","default":"45","options":[
    {"value":"45","label":"~3s (45 frames)"},
    {"value":"97","label":"~6s (97 frames)"}
  ]},
  {"name":"num_inference_steps","label":"Inference Steps","type":"select","default":"50","options":[
    {"value":"30","label":"30 — Fast"},
    {"value":"40","label":"40 — Balanced"},
    {"value":"50","label":"50 — Standard"}
  ]},
  {"name":"guidance_scale","label":"Guidance Scale","type":"slider","min":1,"max":10,"step":0.5,"default":6},
  {"name":"seed","label":"Seed","type":"number","placeholder":"Random"}
]'::jsonb
FROM models m WHERE m.slug = 'hunyuan-video';

-- Clean up CogVideoX user_model_selections (ghost slots)
DELETE FROM user_model_selections
WHERE model_id IN (SELECT id FROM models WHERE slug = 'cogvideox');
