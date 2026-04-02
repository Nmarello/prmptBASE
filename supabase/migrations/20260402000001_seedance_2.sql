-- Add Seedance 2.0 model + templates (txt2vid, img2vid, ref2vid)

INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order, is_active, released_at)
VALUES (
  'seedance-2',
  'Seedance 2.0',
  'fal.ai',
  'ByteDance''s latest video model. Cinematic-grade audiovisual quality with integrated audio synthesis, character consistency, and precise control over style and camera motion.',
  ARRAY['txt2vid', 'img2vid', 'ref2vid'],
  'creator',
  57,
  'Seedance',
  3,
  true,
  '2026-04-02'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  is_active = true,
  released_at = EXCLUDED.released_at;

-- ── Text to Video ────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'Seedance 2.0 — Text to Video',
  'Generate dynamic video from a text prompt with integrated audio. Up to 15 seconds at 720p.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A dancer moves gracefully through a neon-lit city street at night, cinematic slow motion, rain reflections on pavement..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"},
      {"value":"4:3","label":"4:3 — Standard"},
      {"value":"3:4","label":"3:4 — Tall"},
      {"value":"21:9","label":"21:9 — Ultrawide"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"auto","label":"Auto"},
      {"value":"5","label":"5 seconds"},
      {"value":"8","label":"8 seconds"},
      {"value":"10","label":"10 seconds"},
      {"value":"15","label":"15 seconds"}
    ]},
    {"id":"resolution","label":"Resolution","type":"select","options":[
      {"value":"720p","label":"720p"},
      {"value":"480p","label":"480p (faster)"}
    ]},
    {"id":"generate_audio","label":"Generate Audio","type":"select","options":[
      {"value":"true","label":"Yes"},
      {"value":"false","label":"No"}
    ]},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'seedance-2'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- ── Image to Video ───────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img2vid', 'Seedance 2.0 — Image to Video',
  'Animate a starting image with a text prompt. Optionally provide an ending frame for transitions.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"The subject slowly turns their head and smiles, soft wind blowing through their hair..."},
    {"id":"source_image","label":"Starting Image","type":"image","required":true},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"auto","label":"Auto (match image)"},
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"},
      {"value":"4:3","label":"4:3 — Standard"},
      {"value":"3:4","label":"3:4 — Tall"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"auto","label":"Auto"},
      {"value":"5","label":"5 seconds"},
      {"value":"8","label":"8 seconds"},
      {"value":"10","label":"10 seconds"},
      {"value":"15","label":"15 seconds"}
    ]},
    {"id":"resolution","label":"Resolution","type":"select","options":[
      {"value":"720p","label":"720p"},
      {"value":"480p","label":"480p (faster)"}
    ]},
    {"id":"generate_audio","label":"Generate Audio","type":"select","options":[
      {"value":"true","label":"Yes"},
      {"value":"false","label":"No"}
    ]},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'seedance-2'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- ── Reference to Video ───────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'ref2vid', 'Seedance 2.0 — Reference to Video',
  'Generate video using a reference image for character and style consistency. The reference guides the visual identity while the prompt drives the action.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"The character walks confidently down a futuristic corridor, dramatic lighting, camera follows from behind..."},
    {"id":"source_image","label":"Reference Image","type":"image","required":true},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"auto","label":"Auto"},
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"},
      {"value":"4:3","label":"4:3 — Standard"},
      {"value":"3:4","label":"3:4 — Tall"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"auto","label":"Auto"},
      {"value":"5","label":"5 seconds"},
      {"value":"8","label":"8 seconds"},
      {"value":"10","label":"10 seconds"},
      {"value":"15","label":"15 seconds"}
    ]},
    {"id":"resolution","label":"Resolution","type":"select","options":[
      {"value":"720p","label":"720p"},
      {"value":"480p","label":"480p (faster)"}
    ]},
    {"id":"generate_audio","label":"Generate Audio","type":"select","options":[
      {"value":"true","label":"Yes"},
      {"value":"false","label":"No"}
    ]},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'seedance-2'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;
