-- Update LTX-2.3 Pro and Fast templates with full parameter set
UPDATE templates SET fields = '[
  {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A cinematic shot of a mountain lake at sunrise, mist rising from the water, birds flying overhead..."},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"worst quality, blurry, morphing, distorted, static, flickering..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Widescreen (default)"},
    {"value":"9:16","label":"9:16 — Vertical"},
    {"value":"1:1","label":"1:1 — Square"}
  ]},
  {"id":"num_inference_steps","label":"Quality Steps","type":"select","hint":"Higher = better quality but slower. 30 is a good default.","options":[
    {"value":"20","label":"20 — Fast"},
    {"value":"30","label":"30 — Default"},
    {"value":"40","label":"40 — Better Quality"},
    {"value":"50","label":"50 — Max Quality"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"3–4 = natural motion, 5–7 = follows prompt strictly","options":[
    {"value":"2","label":"2 — Very Creative"},
    {"value":"3","label":"3 — Default"},
    {"value":"5","label":"5 — Balanced"},
    {"value":"7","label":"7 — Strict"}
  ]},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'ltx-2.3-pro')
  AND gen_type = 'txt2vid';

UPDATE templates SET fields = '[
  {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A cinematic shot of a mountain lake at sunrise, mist rising from the water, birds flying overhead..."},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"worst quality, blurry, morphing, distorted, static, flickering..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Widescreen (default)"},
    {"value":"9:16","label":"9:16 — Vertical"},
    {"value":"1:1","label":"1:1 — Square"}
  ]},
  {"id":"num_inference_steps","label":"Quality Steps","type":"select","hint":"Higher = better quality but slower. 30 is a good default.","options":[
    {"value":"20","label":"20 — Fast"},
    {"value":"30","label":"30 — Default"},
    {"value":"40","label":"40 — Better Quality"},
    {"value":"50","label":"50 — Max Quality"}
  ]},
  {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"3–4 = natural motion, 5–7 = follows prompt strictly","options":[
    {"value":"2","label":"2 — Very Creative"},
    {"value":"3","label":"3 — Default"},
    {"value":"5","label":"5 — Balanced"},
    {"value":"7","label":"7 — Strict"}
  ]},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'ltx-2.3-fast')
  AND gen_type = 'txt2vid';
