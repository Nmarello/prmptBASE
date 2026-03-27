-- Fix Sora 2 Pro template: remove 1:1 aspect ratio (not supported by Replicate endpoint)
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A whale breaches the ocean surface in golden hour light, water cascading in slow motion, drone perspective..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds"},
      {"value":"10","label":"10 seconds"},
      {"value":"15","label":"15 seconds"},
      {"value":"20","label":"20 seconds"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'sora2-pro')
  AND gen_type = 'txt2vid';
