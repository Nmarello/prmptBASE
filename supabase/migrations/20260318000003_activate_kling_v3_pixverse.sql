-- Activate kling-v3 and pixverse-v5 for testing

UPDATE models SET is_active = true, coming_soon = false
WHERE slug IN ('kling-v3', 'pixverse-v5');

UPDATE model_status SET tested = false
WHERE model_slug IN ('kling-v3', 'pixverse-v5');

-- ── Kling v3 txt2vid ─────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'Kling v3 — Text to Video', 'Generate cinematic video with Kling v3 — Kling''s most advanced model with superior motion quality and realism.', '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A lone astronaut walks across a crimson Martian landscape, dust swirling around their boots..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Landscape"},
    {"value":"9:16","label":"9:16 — Portrait / Vertical"},
    {"value":"1:1","label":"1:1 — Square"},
    {"value":"4:3","label":"4:3 — Standard"}
  ]},
  {"id":"duration","label":"Duration","type":"select","options":[
    {"value":"5","label":"5 seconds"},
    {"value":"10","label":"10 seconds"}
  ]},
  {"id":"camera_movement","label":"Camera Movement","type":"select","hint":"Cinematic camera control","options":[
    {"value":"none","label":"None — Let Kling decide"},
    {"value":"zoom_in","label":"Zoom In"},
    {"value":"zoom_out","label":"Zoom Out"},
    {"value":"pan_left","label":"Pan Left"},
    {"value":"pan_right","label":"Pan Right"},
    {"value":"tilt_up","label":"Tilt Up"},
    {"value":"tilt_down","label":"Tilt Down"},
    {"value":"move_left","label":"Move Left"},
    {"value":"move_right","label":"Move Right"}
  ]},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, distorted, watermark..."}
]'::jsonb
FROM models WHERE slug = 'kling-v3'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- ── Kling v3 img2vid ─────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img2vid', 'Kling v3 — Image to Video', 'Animate any image with Kling v3 — realistic physics, natural motion, cinematic quality.', '[
  {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Kling v3 excels at animating characters and scenes with realistic physics."},
  {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"The subject slowly turns to face the camera, wind gently moves through their hair..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"16:9","label":"16:9 — Landscape"},
    {"value":"9:16","label":"9:16 — Portrait / Vertical"},
    {"value":"1:1","label":"1:1 — Square"}
  ]},
  {"id":"duration","label":"Duration","type":"select","options":[
    {"value":"5","label":"5 seconds"},
    {"value":"10","label":"10 seconds"}
  ]},
  {"id":"camera_movement","label":"Camera Movement","type":"select","options":[
    {"value":"none","label":"None"},
    {"value":"zoom_in","label":"Zoom In"},
    {"value":"zoom_out","label":"Zoom Out"},
    {"value":"pan_left","label":"Pan Left"},
    {"value":"pan_right","label":"Pan Right"}
  ]},
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, distorted, watermark..."}
]'::jsonb
FROM models WHERE slug = 'kling-v3'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- ── PixVerse v5 txt2vid ───────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'PixVerse v5 — Text to Video', 'Fast, stylized video generation with expressive motion and built-in audio support.', '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A neon-lit Tokyo street at night, rain reflecting city lights, a figure walks past under an umbrella..."},
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
