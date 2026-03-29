-- ══ New models: FLUX.2 Klein, Qwen Image 2 Pro, Hailuo 2.3, HunyuanVideo 1.5 ══

-- ── FLUX.2 Klein 4B ──────────────────────────────────────────────────────────
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order)
VALUES (
  'flux2-klein',
  'FLUX.2 Klein',
  'replicate',
  'Black Forest Labs'' compact 4B model. Sub-second generation with photorealistic quality up to 4MP. Fully open-source.',
  ARRAY['txt2img'],
  'newbie',
  14,
  'Flux',
  12
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  min_tier = EXCLUDED.min_tier,
  family = EXCLUDED.family,
  family_order = EXCLUDED.family_order,
  is_active = true;

-- ── Qwen Image 2 Pro ────────────────────────────────────────────────────────
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order)
VALUES (
  'qwen-image-2-pro',
  'Qwen Image 2 Pro',
  'replicate',
  'Alibaba''s unified 7B image model. Strong photorealism, accurate text rendering, and native image editing via natural language.',
  ARRAY['txt2img', 'img2img'],
  'creator',
  32,
  'Qwen Image',
  1
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  min_tier = EXCLUDED.min_tier,
  family = EXCLUDED.family,
  family_order = EXCLUDED.family_order,
  is_active = true;

-- ── MiniMax Hailuo 2.3 ──────────────────────────────────────────────────────
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order)
VALUES (
  'hailuo-2.3',
  'Hailuo 2.3',
  'replicate',
  'MiniMax''s latest video model. Realistic motion, strong visual consistency, and high-fidelity stylization at up to 1080p.',
  ARRAY['txt2vid', 'img2vid'],
  'creator',
  55,
  'MiniMax',
  1
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  min_tier = EXCLUDED.min_tier,
  family = EXCLUDED.family,
  family_order = EXCLUDED.family_order,
  is_active = true;

-- ── HunyuanVideo 1.5 ────────────────────────────────────────────────────────
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order)
VALUES (
  'hunyuan-video-1.5',
  'HunyuanVideo 1.5',
  'fal.ai',
  'Tencent''s lightweight 8.3B video model. Strong semantic understanding, prompt precision, and coherent motion at consumer-GPU scale.',
  ARRAY['txt2vid', 'img2vid'],
  'studio',
  58,
  'Hunyuan',
  1
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  min_tier = EXCLUDED.min_tier,
  family = EXCLUDED.family,
  family_order = EXCLUDED.family_order,
  is_active = true;

-- ══ Templates ════════════════════════════════════════════════════════════════

-- FLUX.2 Klein — txt2img
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'FLUX.2 Klein — Text to Image',
  'Black Forest Labs'' compact model. Sub-second photorealistic generation with text rendering and up to 4MP output.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A serene mountain lake at golden hour, mist rising from the water..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"9:16","label":"Vertical 9:16"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"3:2","label":"Landscape 3:2"},
      {"value":"2:3","label":"Portrait 2:3"},
      {"value":"21:9","label":"Ultra-Wide 21:9"}
    ]},
    {"id":"style","label":"Style","type":"style_picker","options":[
      {"value":"photorealistic","label":"Photo"},
      {"value":"cinematic","label":"Cinematic"},
      {"value":"digital_art","label":"Digital Art"},
      {"value":"oil_painting","label":"Oil Paint"},
      {"value":"watercolor","label":"Watercolor"},
      {"value":"pencil_sketch","label":"Sketch"},
      {"value":"3d_render","label":"3D Render"},
      {"value":"anime","label":"Anime"}
    ]},
    {"id":"num_images","label":"# of Images","type":"select","options":[
      {"value":"1","label":"1 image"},
      {"value":"2","label":"2 images"},
      {"value":"4","label":"4 images"}
    ]},
    {"id":"output_format","label":"Output Format","type":"select","options":[
      {"value":"webp","label":"WebP (default)"},
      {"value":"jpg","label":"JPEG"},
      {"value":"png","label":"PNG (lossless)"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
  ]'::jsonb
FROM models WHERE slug = 'flux2-klein'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- Qwen Image 2 Pro — txt2img
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'Qwen Image 2 Pro — Text to Image',
  'Alibaba''s unified image model. Photorealistic generation with accurate text rendering and 2K output.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A vintage travel poster for Mars, retro illustration style..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"9:16","label":"Vertical 9:16"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"3:2","label":"Landscape 3:2"},
      {"value":"2:3","label":"Portrait 2:3"},
      {"value":"2:1","label":"Panoramic 2:1"},
      {"value":"1:2","label":"Tall 1:2"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted..."},
    {"id":"num_images","label":"# of Images","type":"select","options":[
      {"value":"1","label":"1 image"},
      {"value":"2","label":"2 images"},
      {"value":"4","label":"4 images"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
  ]'::jsonb
FROM models WHERE slug = 'qwen-image-2-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- Qwen Image 2 Pro — img2img
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img2img', 'Qwen Image 2 Pro — Image Editing',
  'Edit images with natural language. Upload an image and describe the changes you want.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"Change the background to a sunset beach..."},
    {"id":"image","label":"Reference Image","type":"image","required":true},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted..."},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
  ]'::jsonb
FROM models WHERE slug = 'qwen-image-2-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- Hailuo 2.3 — txt2vid
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'Hailuo 2.3 — Text to Video',
  'MiniMax''s cinematic video model. Realistic motion, micro-expressions, and photorealistic lighting at up to 1080p.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A chef preparing sushi in a dimly lit Tokyo restaurant, steam rising from the rice..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"6","label":"6 seconds"},
      {"value":"10","label":"10 seconds"}
    ]},
    {"id":"resolution","label":"Resolution","type":"select","options":[
      {"value":"768p","label":"768p (up to 10s)"},
      {"value":"1080p","label":"1080p (up to 6s)"}
    ]}
  ]'::jsonb
FROM models WHERE slug = 'hailuo-2.3'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- Hailuo 2.3 — img2vid
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img2vid', 'Hailuo 2.3 — Image to Video',
  'Animate any image into cinematic video. Upload a source image and describe the motion.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"The camera slowly pulls back as wind blows through the scene..."},
    {"id":"image","label":"Source Image","type":"image","required":true},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"6","label":"6 seconds"},
      {"value":"10","label":"10 seconds"}
    ]}
  ]'::jsonb
FROM models WHERE slug = 'hailuo-2.3'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- HunyuanVideo 1.5 — txt2vid
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'HunyuanVideo 1.5 — Text to Video',
  'Tencent''s lightweight video model. Strong prompt precision and motion coherence with adjustable inference steps.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A timelapse of a flower blooming in a sunlit garden..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, distorted, low quality..."},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'hunyuan-video-1.5'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- HunyuanVideo 1.5 — img2vid
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img2vid', 'HunyuanVideo 1.5 — Image to Video',
  'Animate an image with Tencent''s lightweight video model. Upload a source and describe the motion.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"The scene comes to life as clouds drift across the sky..."},
    {"id":"image","label":"Source Image","type":"image","required":true},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, distorted, low quality..."},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'hunyuan-video-1.5'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;
