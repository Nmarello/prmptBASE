-- Enable img2vid for pixverse-v5 and sora2-pro

UPDATE models SET supported_gen_types = ARRAY['txt2vid', 'img2vid']
WHERE slug = 'pixverse-v5';

UPDATE models SET supported_gen_types = ARRAY['txt2vid', 'img2vid']
WHERE slug = 'sora2-pro';

-- ── PixVerse v5 img2vid template ────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img2vid', 'PixVerse v5 — Image to Video', 'Animate any image with PixVerse v5 — expressive motion with fast turnaround.', '[
  {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image you want to animate."},
  {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"The character turns toward the camera, hair flowing in the wind, soft cinematic lighting..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Landscape"},
    {"value":"9:16","label":"9:16 — Portrait / Vertical"},
    {"value":"1:1","label":"1:1 — Square"},
    {"value":"4:3","label":"4:3 — Standard"}
  ]},
  {"id":"duration","label":"Duration","type":"select","options":[
    {"value":"5","label":"5 seconds"},
    {"value":"8","label":"8 seconds"}
  ]},
  {"id":"quality","label":"Quality","type":"select","options":[
    {"value":"standard","label":"Standard"},
    {"value":"high","label":"High Quality"}
  ]},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, watermark, text..."},
  {"id":"seed","label":"Seed (optional)","type":"number","placeholder":"Leave blank for random"}
]'::jsonb
FROM models WHERE slug = 'pixverse-v5'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- ── Sora 2 Pro img2vid template ─────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img2vid', 'Sora 2 Pro — Image to Video', 'Animate a still image into a cinematic video with OpenAI Sora 2 Pro — highest quality output up to 1080p.', '[
  {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image you want to animate."},
  {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"Camera slowly pushes in, light shifts from warm sunset to cool dusk, clouds drift across the sky..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Widescreen"},
    {"value":"9:16","label":"9:16 — Vertical"}
  ]},
  {"id":"resolution","label":"Resolution","type":"select","options":[
    {"value":"720p","label":"720p (default)"},
    {"value":"1080p","label":"1080p"}
  ]},
  {"id":"duration","label":"Duration","type":"select","options":[
    {"value":"5","label":"5 seconds"},
    {"value":"10","label":"10 seconds"},
    {"value":"20","label":"20 seconds"}
  ]}
]'::jsonb
FROM models WHERE slug = 'sora2-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;
