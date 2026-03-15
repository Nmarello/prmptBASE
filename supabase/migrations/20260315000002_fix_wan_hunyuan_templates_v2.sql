-- Full rebuild of Wan 2.1 and HunyuanVideo templates based on actual fal.ai API docs.
-- Wan txt2vid: aspect_ratio 16:9/9:16 only, steps max 40, no guidance_scale
-- Wan img2vid: aspect_ratio auto/16:9/9:16/1:1, steps max 40, guide_scale (not guidance_scale)
-- HunyuanVideo txt2vid: aspect_ratio 16:9/9:16, num_frames 85/129, pro_mode toggle — no steps/guidance
-- HunyuanVideo img2vid: aspect_ratio 16:9/9:16, num_frames fixed 129, i2v_stability toggle — no steps/guidance

-- ── Wan 2.1 ──────────────────────────────────────────────────────────────────
DELETE FROM templates WHERE model_id = (SELECT id FROM models WHERE slug = 'wan-21-txt2vid');

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'txt2vid', 'Wan 2.1 Text to Video', '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"A red panda playing in a bamboo forest, soft morning light"},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark"},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","default":"16:9","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"}
  ]},
  {"id":"resolution","label":"Resolution","type":"select","default":"720p","hint":"Higher resolution increases generation time and cost","options":[
    {"value":"480p","label":"480p — Fast"},
    {"value":"580p","label":"580p — Balanced"},
    {"value":"720p","label":"720p — Quality (default)"}
  ]},
  {"id":"num_inference_steps","label":"Inference Steps","type":"select","default":"30","hint":"More steps = better quality, slower generation. Max is 40.","options":[
    {"value":"20","label":"20 — Fast"},
    {"value":"30","label":"30 — Balanced (default)"},
    {"value":"40","label":"40 — Max quality"}
  ]},
  {"id":"seed","label":"Seed","type":"number","placeholder":"Random","hint":"Set a seed for reproducible results"}
]'::jsonb
FROM models m WHERE m.slug = 'wan-21-txt2vid';

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'img2vid', 'Wan 2.1 Image to Video', '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"The character walks forward, cinematic lighting"},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted"},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","default":"auto","options":[
    {"value":"auto","label":"Auto (match source image)"},
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"},
    {"value":"1:1","label":"1:1 Square"}
  ]},
  {"id":"resolution","label":"Resolution","type":"select","default":"720p","options":[
    {"value":"480p","label":"480p — Fast"},
    {"value":"720p","label":"720p — Quality (default)"}
  ]},
  {"id":"num_inference_steps","label":"Inference Steps","type":"select","default":"30","options":[
    {"value":"20","label":"20 — Fast"},
    {"value":"30","label":"30 — Balanced (default)"},
    {"value":"40","label":"40 — Max quality"}
  ]},
  {"id":"guide_scale","label":"Guidance Scale","type":"range","hint":"How closely the video follows the prompt. 5 is the default.","options":[
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
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","default":"16:9","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"}
  ]},
  {"id":"num_frames","label":"Duration","type":"select","default":"85","hint":"85 frames ≈ 5s · 129 frames ≈ 8s — longer is significantly slower","options":[
    {"value":"85","label":"~5s (85 frames)"},
    {"value":"129","label":"~8s (129 frames)"}
  ]},
  {"id":"pro_mode","label":"Pro Mode","type":"select","default":"false","hint":"Pro mode uses 55 inference steps vs 35 default for higher quality. Costs 2× credits.","options":[
    {"value":"false","label":"Off — Standard (35 steps)"},
    {"value":"true","label":"On — High quality (55 steps, 2× cost)"}
  ]},
  {"id":"seed","label":"Seed","type":"number","placeholder":"Random","hint":"Set a seed for reproducible results"}
]'::jsonb
FROM models m WHERE m.slug = 'hunyuan-video';

INSERT INTO templates (model_id, gen_type, name, fields)
SELECT m.id, 'img2vid', 'HunyuanVideo Image to Video', '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"placeholder":"Camera slowly pushes in, soft bokeh, cinematic"},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","default":"16:9","options":[
    {"value":"16:9","label":"16:9 Landscape"},
    {"value":"9:16","label":"9:16 Portrait"}
  ]},
  {"id":"i2v_stability","label":"Stability Mode","type":"select","default":"false","hint":"Reduces hallucination and keeps the subject more faithful to the source image. Slightly reduces motion range.","options":[
    {"value":"false","label":"Off — More motion (default)"},
    {"value":"true","label":"On — More faithful to source"}
  ]},
  {"id":"seed","label":"Seed","type":"number","placeholder":"Random"}
]'::jsonb
FROM models m WHERE m.slug = 'hunyuan-video';
