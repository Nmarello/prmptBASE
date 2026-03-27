-- Add templates for Seedance 1 Pro (txt2vid + img2vid)

-- ── Text to Video ────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'Seedance 1 Pro — Text to Video',
  'ByteDance''s pro-grade video model. Cinematic quality with strong instruction-following.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A dancer moves gracefully through a neon-lit city street at night, cinematic slow motion..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"},
      {"value":"4:3","label":"4:3 — Standard"},
      {"value":"3:4","label":"3:4 — Tall"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds"},
      {"value":"8","label":"8 seconds"},
      {"value":"10","label":"10 seconds"}
    ]},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'seedance-1-pro-txt2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- ── Image to Video ───────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img2vid', 'Seedance 1 Pro — Image to Video',
  'Animate a starting image with a text prompt. Provide an image and describe the motion.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"The subject slowly turns their head and smiles, soft wind blowing through their hair..."},
    {"id":"source_image","label":"Starting Image","type":"image","required":true},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"auto","label":"Auto (match image)"},
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds"},
      {"value":"8","label":"8 seconds"},
      {"value":"10","label":"10 seconds"}
    ]},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'seedance-1-pro-txt2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- Make sure the model has img2vid in supported_gen_types
UPDATE models
SET supported_gen_types = ARRAY['txt2vid', 'img2vid']
WHERE slug = 'seedance-1-pro-txt2vid';
