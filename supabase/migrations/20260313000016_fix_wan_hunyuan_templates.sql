-- Fix Wan 2.1 and HunyuanVideo templates:
-- 1. Field key was "name" instead of "id" (TemplateField interface uses "id")
-- 2. "type":"slider" is not valid — must be "type":"range"

-- ── Wan 2.1 ──────────────────────────────────────────────────────────────────
DELETE FROM templates WHERE model_id = (SELECT id FROM models WHERE slug = 'wan-21-txt2vid');

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'txt2vid', 'Wan 2.1 Text to Video', '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"A red panda playing in a bamboo forest, soft morning light"},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark"},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","default":"16:9","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"},
    {"value":"1:1","label":"1:1 Square"},
    {"value":"4:3","label":"4:3 Standard"},
    {"value":"3:4","label":"3:4 Tall"}
  ]},
  {"id":"num_inference_steps","label":"Inference Steps","type":"select","hint":"More steps = better quality, slower generation","options":[
    {"value":"20","label":"20 — Fast"},
    {"value":"30","label":"30 — Balanced (default)"},
    {"value":"40","label":"40 — Quality"},
    {"value":"50","label":"50 — Max quality"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"range","hint":"How closely the video follows the prompt. 4–7 is a good range.","options":[
    {"value":"min","label":"1"},
    {"value":"max","label":"10"},
    {"value":"step","label":"0.5"},
    {"value":"default","label":"5"}
  ]},
  {"id":"seed","label":"Seed","type":"number","placeholder":"Random","hint":"Set a seed for reproducible results"}
]'::jsonb
FROM models m WHERE m.slug = 'wan-21-txt2vid';

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'img2vid', 'Wan 2.1 Image to Video', '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"The character walks forward, cinematic lighting"},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted"},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"},
    {"value":"1:1","label":"1:1 Square"},
    {"value":"4:3","label":"4:3 Standard"}
  ]},
  {"id":"num_inference_steps","label":"Inference Steps","type":"select","options":[
    {"value":"20","label":"20 — Fast"},
    {"value":"30","label":"30 — Balanced"},
    {"value":"40","label":"40 — Quality"},
    {"value":"50","label":"50 — Max"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"range","options":[
    {"value":"min","label":"1"},
    {"value":"max","label":"10"},
    {"value":"step","label":"0.5"},
    {"value":"default","label":"5"}
  ]},
  {"id":"seed","label":"Seed","type":"number","placeholder":"Random"}
]'::jsonb
FROM models m WHERE m.slug = 'wan-21-txt2vid';

-- ── HunyuanVideo ─────────────────────────────────────────────────────────────
DELETE FROM templates WHERE model_id = (SELECT id FROM models WHERE slug = 'hunyuan-video');

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'txt2vid', 'HunyuanVideo Text to Video', '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"A lone astronaut walks across a red desert landscape at dusk, cinematic wide shot"},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark, bad anatomy"},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"},
    {"value":"1:1","label":"1:1 Square"},
    {"value":"4:3","label":"4:3 Standard"},
    {"value":"3:4","label":"3:4 Tall"}
  ]},
  {"id":"num_frames","label":"Duration","type":"select","hint":"45 frames ≈ 3s · 97 frames ≈ 6s — longer is significantly slower","options":[
    {"value":"45","label":"~3s (45 frames)"},
    {"value":"97","label":"~6s (97 frames)"}
  ]},
  {"id":"num_inference_steps","label":"Inference Steps","type":"select","hint":"50 is standard; reduce for faster drafts","options":[
    {"value":"30","label":"30 — Fast draft"},
    {"value":"40","label":"40 — Balanced"},
    {"value":"50","label":"50 — Standard (default)"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"range","hint":"6 is recommended. Lower for more creative output.","options":[
    {"value":"min","label":"1"},
    {"value":"max","label":"10"},
    {"value":"step","label":"0.5"},
    {"value":"default","label":"6"}
  ]},
  {"id":"seed","label":"Seed","type":"number","placeholder":"Random","hint":"Set a seed for reproducible results"}
]'::jsonb
FROM models m WHERE m.slug = 'hunyuan-video';

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'img2vid', 'HunyuanVideo Image to Video', '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"Camera slowly pushes in, soft bokeh, cinematic"},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted"},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"},
    {"value":"1:1","label":"1:1 Square"},
    {"value":"4:3","label":"4:3 Standard"},
    {"value":"3:4","label":"3:4 Tall"}
  ]},
  {"id":"num_frames","label":"Duration","type":"select","options":[
    {"value":"45","label":"~3s (45 frames)"},
    {"value":"97","label":"~6s (97 frames)"}
  ]},
  {"id":"num_inference_steps","label":"Inference Steps","type":"select","options":[
    {"value":"30","label":"30 — Fast"},
    {"value":"40","label":"40 — Balanced"},
    {"value":"50","label":"50 — Standard"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"range","options":[
    {"value":"min","label":"1"},
    {"value":"max","label":"10"},
    {"value":"step","label":"0.5"},
    {"value":"default","label":"6"}
  ]},
  {"id":"seed","label":"Seed","type":"number","placeholder":"Random"}
]'::jsonb
FROM models m WHERE m.slug = 'hunyuan-video';
