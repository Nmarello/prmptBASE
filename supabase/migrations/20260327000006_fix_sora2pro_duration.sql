-- Fix Sora 2 Pro template: correct duration values (API accepts 4, 8, 12 only)
-- and remove negative_prompt + seed (not supported by this model)
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A whale breaches the ocean surface in golden hour light, water cascading in slow motion, drone perspective..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"4","label":"4 seconds"},
      {"value":"8","label":"8 seconds"},
      {"value":"12","label":"12 seconds"}
    ]}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'sora2-pro')
  AND gen_type = 'txt2vid';
