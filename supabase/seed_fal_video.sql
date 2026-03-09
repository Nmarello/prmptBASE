-- ── Kling ────────────────────────────────────────────────────────────────────
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES
  ('kling-txt2vid', 'Kling', 'fal.ai', 'High-quality text-to-video by Kuaishou. Cinematic motion, strong prompt adherence.', ARRAY['txt2vid'], 'creator', 20),
  ('kling-img2vid', 'Kling — Img2Vid', 'fal.ai', 'Animate a still image into video with Kling. Great for product shots and portraits.', ARRAY['img2vid'], 'creator', 21)
ON CONFLICT (slug) DO NOTHING;

-- Kling txt2vid template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'txt2vid', 'Kling — Text to Video',
  'Generate cinematic video from a text prompt. Describe your scene, motion, and style.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A lone surfer riding a massive wave at golden hour, slow motion, cinematic..."},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, watermark, low quality..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds"},
      {"value":"10","label":"10 seconds"}
    ]},
    {"id":"cfg_scale","label":"CFG Scale","type":"select","hint":"How closely to follow the prompt","options":[
      {"value":"0.5","label":"0.5 — Default"},
      {"value":"0.3","label":"0.3 — Creative"},
      {"value":"0.7","label":"0.7 — Adherent"}
    ]}
  ]'::jsonb
FROM models m WHERE m.slug = 'kling-txt2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- Kling img2vid template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'img2vid', 'Kling — Image to Video',
  'Animate a still image into video. Upload your source and describe the motion.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image to animate"},
    {"id":"prompt","label":"Motion Prompt","type":"textarea","ai_assist":true,"placeholder":"Camera slowly zooms in, subject turns to face the camera..."},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, watermark..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds"},
      {"value":"10","label":"10 seconds"}
    ]}
  ]'::jsonb
FROM models m WHERE m.slug = 'kling-img2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Luma Dream Machine ────────────────────────────────────────────────────────
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES
  ('luma-txt2vid', 'Luma Dream Machine', 'fal.ai', 'Photorealistic video from text by Luma AI. Ray-2 model with smooth motion and strong scene understanding.', ARRAY['txt2vid'], 'creator', 22),
  ('luma-img2vid', 'Luma Dream Machine — Img2Vid', 'fal.ai', 'Animate any image into a photorealistic video with Luma Ray-2.', ARRAY['img2vid'], 'creator', 23)
ON CONFLICT (slug) DO NOTHING;

-- Luma txt2vid template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'txt2vid', 'Luma Dream Machine — Text to Video',
  'Generate photorealistic video from a text description. Luma excels at natural motion and lighting.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A tranquil forest stream in autumn, leaves drifting in the water, soft morning light..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait"},
      {"value":"4:3","label":"4:3"},
      {"value":"3:4","label":"3:4"},
      {"value":"21:9","label":"21:9 — Cinematic"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"loop","label":"Loop","type":"select","hint":"Generate a seamlessly looping video","options":[
      {"value":"false","label":"No"},
      {"value":"true","label":"Yes — loop"}
    ]}
  ]'::jsonb
FROM models m WHERE m.slug = 'luma-txt2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- Luma img2vid template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'img2vid', 'Luma Dream Machine — Image to Video',
  'Animate a still into a photorealistic video. Luma handles lighting and natural motion exceptionally well.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image to animate"},
    {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"The camera slowly pulls back, revealing the full landscape..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait"},
      {"value":"4:3","label":"4:3"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"loop","label":"Loop","type":"select","options":[
      {"value":"false","label":"No"},
      {"value":"true","label":"Yes — loop"}
    ]}
  ]'::jsonb
FROM models m WHERE m.slug = 'luma-img2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Minimax ───────────────────────────────────────────────────────────────────
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order)
VALUES
  ('minimax-txt2vid', 'Minimax Video', 'fal.ai', 'High-fidelity text-to-video with strong motion dynamics and detail. Great cost-to-quality ratio.', ARRAY['txt2vid'], 'creator', 24)
ON CONFLICT (slug) DO NOTHING;

-- Minimax txt2vid template
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'txt2vid', 'Minimax — Text to Video',
  'Generate detailed, dynamic video from text. Minimax handles complex motion and fine detail well.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A futuristic city at night, flying cars weaving between glowing skyscrapers, rain-slicked streets reflecting neon lights..."},
    {"id":"prompt_optimizer","label":"Prompt Optimizer","type":"select","hint":"Let Minimax enhance your prompt automatically","options":[
      {"value":"true","label":"On (recommended)"},
      {"value":"false","label":"Off"}
    ]}
  ]'::jsonb
FROM models m WHERE m.slug = 'minimax-txt2vid'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;
