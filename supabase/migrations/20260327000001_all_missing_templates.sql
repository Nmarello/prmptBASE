-- ============================================================================
-- Backfill ALL missing templates so every model has a working UI when activated
-- 2026-03-27
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- TEXT-TO-IMAGE MODELS
-- ════════════════════════════════════════════════════════════════════════════

-- ── SD 3.5 Medium ──────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'SD 3.5 Medium — Text to Image',
  'Stability AI''s efficient model. Strong quality at lower cost — great for fast iteration.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A cozy cabin in the woods, warm light spilling from the windows, snow falling gently..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"9:16","label":"Vertical 9:16"},
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
    {"id":"lighting","label":"Lighting","type":"select","options":[
      {"value":"golden_hour","label":"Golden Hour"},
      {"value":"blue_hour","label":"Blue Hour"},
      {"value":"studio","label":"Studio"},
      {"value":"neon","label":"Neon / Cyberpunk"},
      {"value":"dramatic","label":"Dramatic"},
      {"value":"soft","label":"Soft / Diffused"},
      {"value":"backlit","label":"Backlit"},
      {"value":"volumetric","label":"Volumetric / God Rays"},
      {"value":"overcast","label":"Overcast"},
      {"value":"night","label":"Night"}
    ]},
    {"id":"mood","label":"Mood","type":"multi_select","options":[
      {"value":"epic","label":"Epic"},
      {"value":"serene","label":"Serene"},
      {"value":"mysterious","label":"Mysterious"},
      {"value":"melancholic","label":"Melancholic"},
      {"value":"tense","label":"Tense"},
      {"value":"whimsical","label":"Whimsical"},
      {"value":"dark","label":"Dark"},
      {"value":"vibrant","label":"Vibrant"}
    ]},
    {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
      {"value":"highly_detailed","label":"Highly Detailed"},
      {"value":"8k","label":"8K"},
      {"value":"sharp_focus","label":"Sharp Focus"},
      {"value":"professional","label":"Professional"},
      {"value":"award_winning","label":"Award Winning"},
      {"value":"intricate","label":"Intricate"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
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
FROM models WHERE slug = 'sd35-medium'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── FLUX.2 Pro ─────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'FLUX.2 Pro — Text to Image',
  'Next-gen FLUX from Black Forest Labs. Improved photorealism and prompt adherence over FLUX 1.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A futuristic city skyline at dusk, glass towers reflecting the sunset, flying vehicles in the distance..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"9:16","label":"Vertical 9:16"},
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
    {"id":"lighting","label":"Lighting","type":"select","options":[
      {"value":"golden_hour","label":"Golden Hour"},
      {"value":"blue_hour","label":"Blue Hour"},
      {"value":"studio","label":"Studio"},
      {"value":"neon","label":"Neon / Cyberpunk"},
      {"value":"dramatic","label":"Dramatic"},
      {"value":"soft","label":"Soft / Diffused"},
      {"value":"backlit","label":"Backlit"},
      {"value":"volumetric","label":"Volumetric / God Rays"},
      {"value":"overcast","label":"Overcast"},
      {"value":"night","label":"Night"}
    ]},
    {"id":"mood","label":"Mood","type":"multi_select","options":[
      {"value":"epic","label":"Epic"},
      {"value":"serene","label":"Serene"},
      {"value":"mysterious","label":"Mysterious"},
      {"value":"melancholic","label":"Melancholic"},
      {"value":"tense","label":"Tense"},
      {"value":"whimsical","label":"Whimsical"},
      {"value":"dark","label":"Dark"},
      {"value":"vibrant","label":"Vibrant"}
    ]},
    {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
      {"value":"highly_detailed","label":"Highly Detailed"},
      {"value":"8k","label":"8K"},
      {"value":"sharp_focus","label":"Sharp Focus"},
      {"value":"professional","label":"Professional"},
      {"value":"award_winning","label":"Award Winning"},
      {"value":"intricate","label":"Intricate"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
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
FROM models WHERE slug = 'flux2-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── FLUX.2 Max ─────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'FLUX.2 Max — Text to Image',
  'The highest-quality FLUX generation. Maximum fidelity, detail, and prompt adherence.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"An intricate mechanical pocket watch exploding into butterflies, each gear becoming a wing, golden light..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"9:16","label":"Vertical 9:16"},
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
    {"id":"lighting","label":"Lighting","type":"select","options":[
      {"value":"golden_hour","label":"Golden Hour"},
      {"value":"blue_hour","label":"Blue Hour"},
      {"value":"studio","label":"Studio"},
      {"value":"neon","label":"Neon / Cyberpunk"},
      {"value":"dramatic","label":"Dramatic"},
      {"value":"soft","label":"Soft / Diffused"},
      {"value":"backlit","label":"Backlit"},
      {"value":"volumetric","label":"Volumetric / God Rays"},
      {"value":"overcast","label":"Overcast"},
      {"value":"night","label":"Night"}
    ]},
    {"id":"mood","label":"Mood","type":"multi_select","options":[
      {"value":"epic","label":"Epic"},
      {"value":"serene","label":"Serene"},
      {"value":"mysterious","label":"Mysterious"},
      {"value":"melancholic","label":"Melancholic"},
      {"value":"tense","label":"Tense"},
      {"value":"whimsical","label":"Whimsical"},
      {"value":"dark","label":"Dark"},
      {"value":"vibrant","label":"Vibrant"}
    ]},
    {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
      {"value":"highly_detailed","label":"Highly Detailed"},
      {"value":"8k","label":"8K"},
      {"value":"sharp_focus","label":"Sharp Focus"},
      {"value":"professional","label":"Professional"},
      {"value":"award_winning","label":"Award Winning"},
      {"value":"intricate","label":"Intricate"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
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
FROM models WHERE slug = 'flux2-max'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Recraft V4 ─────────────────────────────────────────────────────────────
-- Same style system as Recraft V4 Pro but different size map in backend
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'Recraft V4 — Text to Image',
  'Next-generation image generation from Recraft with strong text rendering and photorealistic quality.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A neon sign reading OPEN glowing in a rain-streaked window, reflections on wet pavement..."},
    {"id":"style","label":"Style","type":"select","options":[
      {"value":"realistic_image","label":"Realistic Photo"},
      {"value":"digital_illustration","label":"Digital Illustration"},
      {"value":"vector_illustration","label":"Vector Illustration"},
      {"value":"icon","label":"Icon"},
      {"value":"realistic_image/b_and_w","label":"Black & White Photo"},
      {"value":"digital_illustration/pixel_art","label":"Pixel Art"}
    ]},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square 1:1"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"9:16","label":"Portrait 9:16"},
      {"value":"4:3","label":"Landscape 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"3:2","label":"Landscape 3:2"},
      {"value":"2:3","label":"Portrait 2:3"}
    ]},
    {"id":"num_images","label":"# of Images","type":"select","options":[
      {"value":"1","label":"1 image"},
      {"value":"2","label":"2 images"},
      {"value":"4","label":"4 images"}
    ]},
    {"id":"output_format","label":"Format","type":"select","options":[
      {"value":"jpeg","label":"JPEG"},
      {"value":"png","label":"PNG (best for logos/vectors)"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce the same result"}
  ]'::jsonb
FROM models WHERE slug = 'recraft-v4'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── HiDream Fast ───────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'HiDream Fast — Text to Image',
  'Fast, high-quality image generation from HiDream. Great balance of speed and detail.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A street photographer captured mid-stride on a rainy Tokyo evening, neon reflections on wet asphalt..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"9:16","label":"Vertical 9:16"},
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
    {"id":"lighting","label":"Lighting","type":"select","options":[
      {"value":"golden_hour","label":"Golden Hour"},
      {"value":"blue_hour","label":"Blue Hour"},
      {"value":"studio","label":"Studio"},
      {"value":"neon","label":"Neon / Cyberpunk"},
      {"value":"dramatic","label":"Dramatic"},
      {"value":"soft","label":"Soft / Diffused"},
      {"value":"backlit","label":"Backlit"},
      {"value":"volumetric","label":"Volumetric / God Rays"},
      {"value":"overcast","label":"Overcast"},
      {"value":"night","label":"Night"}
    ]},
    {"id":"mood","label":"Mood","type":"multi_select","options":[
      {"value":"epic","label":"Epic"},
      {"value":"serene","label":"Serene"},
      {"value":"mysterious","label":"Mysterious"},
      {"value":"melancholic","label":"Melancholic"},
      {"value":"tense","label":"Tense"},
      {"value":"whimsical","label":"Whimsical"},
      {"value":"dark","label":"Dark"},
      {"value":"vibrant","label":"Vibrant"}
    ]},
    {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
      {"value":"highly_detailed","label":"Highly Detailed"},
      {"value":"8k","label":"8K"},
      {"value":"sharp_focus","label":"Sharp Focus"},
      {"value":"professional","label":"Professional"},
      {"value":"award_winning","label":"Award Winning"},
      {"value":"intricate","label":"Intricate"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
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
FROM models WHERE slug = 'hidream-fast'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── HiDream Full ───────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'HiDream Full — Text to Image',
  'HiDream''s highest-quality model. Maximum detail and prompt adherence at longer generation time.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"An underwater palace made of coral and glass, bioluminescent fish swirling around marble columns..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"9:16","label":"Vertical 9:16"},
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
    {"id":"lighting","label":"Lighting","type":"select","options":[
      {"value":"golden_hour","label":"Golden Hour"},
      {"value":"blue_hour","label":"Blue Hour"},
      {"value":"studio","label":"Studio"},
      {"value":"neon","label":"Neon / Cyberpunk"},
      {"value":"dramatic","label":"Dramatic"},
      {"value":"soft","label":"Soft / Diffused"},
      {"value":"backlit","label":"Backlit"},
      {"value":"volumetric","label":"Volumetric / God Rays"},
      {"value":"overcast","label":"Overcast"},
      {"value":"night","label":"Night"}
    ]},
    {"id":"mood","label":"Mood","type":"multi_select","options":[
      {"value":"epic","label":"Epic"},
      {"value":"serene","label":"Serene"},
      {"value":"mysterious","label":"Mysterious"},
      {"value":"melancholic","label":"Melancholic"},
      {"value":"tense","label":"Tense"},
      {"value":"whimsical","label":"Whimsical"},
      {"value":"dark","label":"Dark"},
      {"value":"vibrant","label":"Vibrant"}
    ]},
    {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
      {"value":"highly_detailed","label":"Highly Detailed"},
      {"value":"8k","label":"8K"},
      {"value":"sharp_focus","label":"Sharp Focus"},
      {"value":"professional","label":"Professional"},
      {"value":"award_winning","label":"Award Winning"},
      {"value":"intricate","label":"Intricate"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
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
FROM models WHERE slug = 'hidream-full'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Nano Banana Pro ────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'Nano Banana Pro — Text to Image',
  'Google Gemini 3 Pro image model. Sharpest results in the Nano Banana family with excellent text rendering.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A vintage film camera sitting on a mossy log in an ancient forest, morning fog, soft dappled light..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"9:16","label":"Vertical 9:16"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"3:2","label":"Landscape 3:2"},
      {"value":"2:3","label":"Portrait 2:3"}
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
    {"id":"lighting","label":"Lighting","type":"select","options":[
      {"value":"golden_hour","label":"Golden Hour"},
      {"value":"blue_hour","label":"Blue Hour"},
      {"value":"studio","label":"Studio"},
      {"value":"neon","label":"Neon / Cyberpunk"},
      {"value":"dramatic","label":"Dramatic"},
      {"value":"soft","label":"Soft / Diffused"},
      {"value":"backlit","label":"Backlit"},
      {"value":"volumetric","label":"Volumetric / God Rays"},
      {"value":"overcast","label":"Overcast"},
      {"value":"night","label":"Night"}
    ]},
    {"id":"mood","label":"Mood","type":"multi_select","options":[
      {"value":"epic","label":"Epic"},
      {"value":"serene","label":"Serene"},
      {"value":"mysterious","label":"Mysterious"},
      {"value":"melancholic","label":"Melancholic"},
      {"value":"tense","label":"Tense"},
      {"value":"whimsical","label":"Whimsical"},
      {"value":"dark","label":"Dark"},
      {"value":"vibrant","label":"Vibrant"}
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
FROM models WHERE slug = 'nano-banana-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Seedream 4.5 ───────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'Seedream 4.5 — Text to Image',
  'ByteDance''s flagship image model. Strong aesthetic quality with excellent prompt understanding.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A Japanese garden in autumn, red maple leaves floating on a still koi pond, stone lantern in background..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"9:16","label":"Vertical 9:16"},
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
    {"id":"lighting","label":"Lighting","type":"select","options":[
      {"value":"golden_hour","label":"Golden Hour"},
      {"value":"blue_hour","label":"Blue Hour"},
      {"value":"studio","label":"Studio"},
      {"value":"neon","label":"Neon / Cyberpunk"},
      {"value":"dramatic","label":"Dramatic"},
      {"value":"soft","label":"Soft / Diffused"},
      {"value":"backlit","label":"Backlit"},
      {"value":"volumetric","label":"Volumetric / God Rays"},
      {"value":"overcast","label":"Overcast"},
      {"value":"night","label":"Night"}
    ]},
    {"id":"mood","label":"Mood","type":"multi_select","options":[
      {"value":"epic","label":"Epic"},
      {"value":"serene","label":"Serene"},
      {"value":"mysterious","label":"Mysterious"},
      {"value":"melancholic","label":"Melancholic"},
      {"value":"tense","label":"Tense"},
      {"value":"whimsical","label":"Whimsical"},
      {"value":"dark","label":"Dark"},
      {"value":"vibrant","label":"Vibrant"}
    ]},
    {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
      {"value":"highly_detailed","label":"Highly Detailed"},
      {"value":"8k","label":"8K"},
      {"value":"sharp_focus","label":"Sharp Focus"},
      {"value":"professional","label":"Professional"},
      {"value":"award_winning","label":"Award Winning"},
      {"value":"intricate","label":"Intricate"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
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
FROM models WHERE slug = 'seedream-45'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Seedream 4 ─────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'Seedream 4 — Text to Image',
  'ByteDance image model with strong aesthetic quality and composition.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A steampunk airship floating above Victorian London, copper and brass details, clouds below..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"9:16","label":"Vertical 9:16"},
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
    {"id":"lighting","label":"Lighting","type":"select","options":[
      {"value":"golden_hour","label":"Golden Hour"},
      {"value":"blue_hour","label":"Blue Hour"},
      {"value":"studio","label":"Studio"},
      {"value":"neon","label":"Neon / Cyberpunk"},
      {"value":"dramatic","label":"Dramatic"},
      {"value":"soft","label":"Soft / Diffused"},
      {"value":"backlit","label":"Backlit"},
      {"value":"volumetric","label":"Volumetric / God Rays"},
      {"value":"overcast","label":"Overcast"},
      {"value":"night","label":"Night"}
    ]},
    {"id":"mood","label":"Mood","type":"multi_select","options":[
      {"value":"epic","label":"Epic"},
      {"value":"serene","label":"Serene"},
      {"value":"mysterious","label":"Mysterious"},
      {"value":"melancholic","label":"Melancholic"},
      {"value":"tense","label":"Tense"},
      {"value":"whimsical","label":"Whimsical"},
      {"value":"dark","label":"Dark"},
      {"value":"vibrant","label":"Vibrant"}
    ]},
    {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
      {"value":"highly_detailed","label":"Highly Detailed"},
      {"value":"8k","label":"8K"},
      {"value":"sharp_focus","label":"Sharp Focus"},
      {"value":"professional","label":"Professional"},
      {"value":"award_winning","label":"Award Winning"},
      {"value":"intricate","label":"Intricate"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
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
FROM models WHERE slug = 'seedream-4'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Seedream 5 Lite ────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'Seedream 5 Lite — Text to Image',
  'Lightweight, fast variant of ByteDance''s Seedream 5. Quick iterations with solid quality.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A minimalist desk setup with a single plant, soft morning light through sheer curtains..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"9:16","label":"Vertical 9:16"},
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
    {"id":"lighting","label":"Lighting","type":"select","options":[
      {"value":"golden_hour","label":"Golden Hour"},
      {"value":"blue_hour","label":"Blue Hour"},
      {"value":"studio","label":"Studio"},
      {"value":"neon","label":"Neon / Cyberpunk"},
      {"value":"dramatic","label":"Dramatic"},
      {"value":"soft","label":"Soft / Diffused"},
      {"value":"backlit","label":"Backlit"},
      {"value":"volumetric","label":"Volumetric / God Rays"},
      {"value":"overcast","label":"Overcast"},
      {"value":"night","label":"Night"}
    ]},
    {"id":"mood","label":"Mood","type":"multi_select","options":[
      {"value":"epic","label":"Epic"},
      {"value":"serene","label":"Serene"},
      {"value":"mysterious","label":"Mysterious"},
      {"value":"melancholic","label":"Melancholic"},
      {"value":"tense","label":"Tense"},
      {"value":"whimsical","label":"Whimsical"},
      {"value":"dark","label":"Dark"},
      {"value":"vibrant","label":"Vibrant"}
    ]},
    {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
      {"value":"highly_detailed","label":"Highly Detailed"},
      {"value":"8k","label":"8K"},
      {"value":"sharp_focus","label":"Sharp Focus"},
      {"value":"professional","label":"Professional"},
      {"value":"award_winning","label":"Award Winning"},
      {"value":"intricate","label":"Intricate"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
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
FROM models WHERE slug = 'seedream-5-lite'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Ideogram v3 (verify — may already exist) ──────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'Ideogram v3 — Text to Image',
  'High-quality image generation with exceptional text rendering accuracy from Ideogram.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A vintage travel poster for Mars reading VISIT THE RED PLANET, retro 1960s illustration style..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"},
      {"value":"9:16","label":"Vertical 9:16"},
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
    {"id":"lighting","label":"Lighting","type":"select","options":[
      {"value":"golden_hour","label":"Golden Hour"},
      {"value":"blue_hour","label":"Blue Hour"},
      {"value":"studio","label":"Studio"},
      {"value":"neon","label":"Neon / Cyberpunk"},
      {"value":"dramatic","label":"Dramatic"},
      {"value":"soft","label":"Soft / Diffused"},
      {"value":"backlit","label":"Backlit"},
      {"value":"volumetric","label":"Volumetric / God Rays"},
      {"value":"overcast","label":"Overcast"},
      {"value":"night","label":"Night"}
    ]},
    {"id":"mood","label":"Mood","type":"multi_select","options":[
      {"value":"epic","label":"Epic"},
      {"value":"serene","label":"Serene"},
      {"value":"mysterious","label":"Mysterious"},
      {"value":"melancholic","label":"Melancholic"},
      {"value":"tense","label":"Tense"},
      {"value":"whimsical","label":"Whimsical"},
      {"value":"dark","label":"Dark"},
      {"value":"vibrant","label":"Vibrant"}
    ]},
    {"id":"quality","label":"Quality Tags","type":"multi_select","options":[
      {"value":"highly_detailed","label":"Highly Detailed"},
      {"value":"8k","label":"8K"},
      {"value":"sharp_focus","label":"Sharp Focus"},
      {"value":"professional","label":"Professional"},
      {"value":"award_winning","label":"Award Winning"},
      {"value":"intricate","label":"Intricate"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
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
FROM models WHERE slug = 'ideogram-v3'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── GPT Image 1 ────────────────────────────────────────────────────────────
-- Uses generate-image edge fn (OpenAI direct API), not Replicate
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'GPT Image 1 — Text to Image',
  'OpenAI''s image generation model. Strong instruction following and composition.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A photorealistic portrait of a barista making latte art, warm cafe lighting, steam rising from the cup..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"9:16","label":"Vertical 9:16"}
    ]},
    {"id":"quality","label":"Quality","type":"select","options":[
      {"value":"auto","label":"Auto (default)"},
      {"value":"high","label":"High"},
      {"value":"low","label":"Low (faster)"}
    ]},
    {"id":"num_images","label":"# of Images","type":"select","options":[
      {"value":"1","label":"1 image"},
      {"value":"2","label":"2 images"},
      {"value":"4","label":"4 images"}
    ]}
  ]'::jsonb
FROM models WHERE slug = 'gpt-image-1'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── GPT Image 1.5 ──────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'GPT Image 1.5 — Text to Image',
  'OpenAI''s improved image generation with enhanced instruction following and composition.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"An editorial fashion photo of a model in a desert, golden hour, wind-blown fabric..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"9:16","label":"Vertical 9:16"}
    ]},
    {"id":"quality","label":"Quality","type":"select","options":[
      {"value":"auto","label":"Auto (default)"},
      {"value":"high","label":"High"},
      {"value":"low","label":"Low (faster)"}
    ]},
    {"id":"num_images","label":"# of Images","type":"select","options":[
      {"value":"1","label":"1 image"},
      {"value":"2","label":"2 images"},
      {"value":"4","label":"4 images"}
    ]}
  ]'::jsonb
FROM models WHERE slug = 'gpt-image-1.5'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── DALL-E ──────────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'DALL-E — Text to Image',
  'OpenAI''s DALL-E model. Reliable image generation with good creative interpretation.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"An oil painting of a cat wearing a top hat at a Victorian tea party..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"9:16","label":"Vertical 9:16"}
    ]},
    {"id":"quality","label":"Quality","type":"select","options":[
      {"value":"auto","label":"Auto (default)"},
      {"value":"hd","label":"HD"}
    ]},
    {"id":"num_images","label":"# of Images","type":"select","options":[
      {"value":"1","label":"1 image"},
      {"value":"2","label":"2 images"}
    ]}
  ]'::jsonb
FROM models WHERE slug = 'dalle'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Imagen 4 Ultra ─────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'Imagen 4 Ultra — Text to Image',
  'Google''s most powerful image model. Photorealistic quality with fine detail and accurate text rendering.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A macro photo of morning dew on a spider web, each droplet reflecting the sunrise, shallow depth of field..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"9:16","label":"Vertical 9:16"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"}
    ]},
    {"id":"num_images","label":"# of Images","type":"select","options":[
      {"value":"1","label":"1 image"},
      {"value":"2","label":"2 images"},
      {"value":"4","label":"4 images"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
  ]'::jsonb
FROM models WHERE slug = 'imagen-4-ultra'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Imagen 4 Fast ──────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'Imagen 4 Fast — Text to Image',
  'Fast variant of Google Imagen 4. High-quality results at reduced generation time.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A colorful street market in Marrakech, spices piled high, warm afternoon light..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"1:1","label":"Square (1:1)"},
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"9:16","label":"Vertical 9:16"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"3:4","label":"Portrait 3:4"}
    ]},
    {"id":"num_images","label":"# of Images","type":"select","options":[
      {"value":"1","label":"1 image"},
      {"value":"2","label":"2 images"},
      {"value":"4","label":"4 images"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
  ]'::jsonb
FROM models WHERE slug = 'imagen-4-fast'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ════════════════════════════════════════════════════════════════════════════
-- IMAGE-TO-IMAGE / EDIT MODELS
-- ════════════════════════════════════════════════════════════════════════════

-- ── Flux Kontext Dev ───────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img2img', 'FLUX Kontext Dev — Image Edit',
  'Context-aware image editing by Black Forest Labs. Edit images with natural language while preserving identity.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image you want to edit"},
    {"id":"prompt","label":"Edit Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"Change the background to a snowy mountain landscape, keep the subject exactly the same..."},
    {"id":"num_images","label":"# of Images","type":"select","options":[
      {"value":"1","label":"1 image"},
      {"value":"2","label":"2 images"},
      {"value":"4","label":"4 images"}
    ]},
    {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"How closely to follow the prompt. Higher = more literal.","options":[
      {"value":"2.5","label":"2.5 — Creative"},
      {"value":"3.5","label":"3.5 — Balanced (default)"},
      {"value":"5","label":"5 — Precise"},
      {"value":"7","label":"7 — Strict"}
    ]},
    {"id":"output_format","label":"Format","type":"select","options":[
      {"value":"jpeg","label":"JPEG"},
      {"value":"png","label":"PNG"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce the same result"}
  ]'::jsonb
FROM models WHERE slug = 'flux-kontext-dev'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Flux Kontext Max ───────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'img2img', 'FLUX Kontext Max — Image Edit',
  'Premium text-based image editing with maximum quality. Precisely alter scenes, swap objects, and relight images.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image you want to edit"},
    {"id":"prompt","label":"Edit Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"Replace the car with a vintage red convertible, keep the same street and lighting..."},
    {"id":"num_images","label":"# of Images","type":"select","options":[
      {"value":"1","label":"1 image"},
      {"value":"2","label":"2 images"},
      {"value":"4","label":"4 images"}
    ]},
    {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"How closely to follow the prompt.","options":[
      {"value":"2.5","label":"2.5 — Creative"},
      {"value":"3.5","label":"3.5 — Balanced (default)"},
      {"value":"5","label":"5 — Precise"},
      {"value":"7","label":"7 — Strict"}
    ]},
    {"id":"output_format","label":"Format","type":"select","options":[
      {"value":"jpeg","label":"JPEG"},
      {"value":"png","label":"PNG"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce the same result"}
  ]'::jsonb
FROM models WHERE slug = 'flux-kontext-max'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ════════════════════════════════════════════════════════════════════════════
-- VIDEO MODELS
-- ════════════════════════════════════════════════════════════════════════════

-- ── Kling v2.5 Turbo ───────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'Kling v2.5 Turbo — Text to Video',
  'Fast, high-quality Kling video generation with smooth motion and cinematic aesthetic.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A surfer carves through a crystal-clear barrel wave, slow motion, golden light streaming through the water..."},
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
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, distorted, watermark..."}
  ]'::jsonb
FROM models WHERE slug = 'kling-v2.5-turbo'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Veo 3 ──────────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'Veo 3 — Text to Video',
  'Google''s flagship video model. High-fidelity motion, photorealistic rendering, and long-form coherence.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A drone shot sweeps over a bioluminescent bay at night, glowing plankton swirling with each wave..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds"},
      {"value":"8","label":"8 seconds"},
      {"value":"10","label":"10 seconds"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'veo-3'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Veo 3 Fast ─────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'Veo 3 Fast — Text to Video',
  'Faster variant of Google Veo 3. Strong video quality at reduced generation time.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A timelapse of a flower blooming in a sun-drenched garden, butterflies arriving..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds"},
      {"value":"8","label":"8 seconds"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'veo-3-fast'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Veo 3.1 ────────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'Veo 3.1 — Text to Video',
  'Updated Veo 3 with improved motion fidelity and scene coherence.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A glass of red wine being poured in extreme slow motion, light refracting through the liquid..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds"},
      {"value":"8","label":"8 seconds"},
      {"value":"10","label":"10 seconds"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'veo-3.1'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Gen-4.5 (Runway) ──────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'Gen-4.5 — Text to Video',
  'Runway''s latest generation model. High-fidelity video synthesis with strong temporal coherence.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A chef tosses vegetables in a wok, flames erupting, slow motion, steam and sparks flying..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"Widescreen 16:9 (default)"},
      {"value":"9:16","label":"Vertical 9:16"},
      {"value":"1:1","label":"Square 1:1"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds (default)"},
      {"value":"10","label":"10 seconds"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"low quality, blurry, watermark..."}
  ]'::jsonb
FROM models WHERE slug = 'gen-4.5'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Sora 2 Pro ─────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'Sora 2 Pro — Text to Video',
  'OpenAI''s advanced video generation model. Cinematic quality with strong temporal consistency.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A whale breaches the ocean surface in golden hour light, water cascading in slow motion, drone perspective..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"}
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
FROM models WHERE slug = 'sora2-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── MiniMax Video 01 ───────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'MiniMax Video 01 — Text to Video',
  'MiniMax''s cinematic video model. Rich motion dynamics and strong scene understanding.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A paper airplane soars through a miniature city made of books, tilt-shift effect, warm library lighting..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."}
  ]'::jsonb
FROM models WHERE slug = 'minimax-video'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── WAN 2.5 T2V ────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'WAN 2.5 — Text to Video',
  'Alibaba''s WAN 2.5 text-to-video. Fluid motion with high visual fidelity.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A red panda playing in fresh snow, fluffy tail swishing, soft winter light..."},
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
    {"id":"num_inference_steps","label":"Inference Steps","type":"select","default":"30","hint":"More steps = better quality, slower.","options":[
      {"value":"20","label":"20 — Fast"},
      {"value":"30","label":"30 — Balanced (default)"},
      {"value":"40","label":"40 — Max quality"}
    ]},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Random","hint":"Set a seed for reproducible results"}
  ]'::jsonb
FROM models WHERE slug = 'wan-2.5-t2v'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── LTX-2.3 Pro ────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'LTX-2.3 Pro — Text to Video',
  'Pro-quality video generation from Lightricks. Detailed motion, strong composition.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A hummingbird hovers in front of a tropical flower, iridescent feathers catching the light..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, worst quality, jittery..."},
    {"id":"num_inference_steps","label":"Quality Steps","type":"select","hint":"More steps = better quality, longer generation.","options":[
      {"value":"20","label":"20 — Fast"},
      {"value":"30","label":"30 — Balanced"},
      {"value":"50","label":"50 — Quality (default)"}
    ]},
    {"id":"guidance_scale","label":"Guidance Scale","type":"select","hint":"Prompt adherence. Higher = more literal.","options":[
      {"value":"3","label":"3 — Creative"},
      {"value":"5","label":"5 — Balanced"},
      {"value":"7","label":"7 — Adherent (default)"},
      {"value":"10","label":"10 — Strict"}
    ]},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'ltx-2.3-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── LTX-2.3 Fast ───────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2vid', 'LTX-2.3 Fast — Text to Video',
  'Fast LTX video generation. Real-time capable, clean motion, great for quick iterations.',
  '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A candle flame flickering in a dark room, wax slowly dripping, warm glow..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, worst quality, jittery..."},
    {"id":"num_inference_steps","label":"Quality Steps","type":"select","hint":"More steps = better quality.","options":[
      {"value":"10","label":"10 — Fast"},
      {"value":"20","label":"20 — Balanced"},
      {"value":"30","label":"30 — Quality"}
    ]},
    {"id":"guidance_scale","label":"Guidance Scale","type":"select","options":[
      {"value":"3","label":"3 — Creative"},
      {"value":"5","label":"5 — Balanced"},
      {"value":"7","label":"7 — Adherent (default)"}
    ]},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'ltx-2.3-fast'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ════════════════════════════════════════════════════════════════════════════
-- TOOLS — Editing & Upscaling
-- ════════════════════════════════════════════════════════════════════════════

-- ── FLUX Fill Pro (Inpainting) ─────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'edit', 'FLUX Fill Pro — Inpaint / Outpaint',
  'Professional inpainting and outpainting using FLUX. Seamlessly fill, extend, or replace regions.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image to edit"},
    {"id":"mask_image","label":"Mask","type":"image_upload","required":true,"hint":"White = areas to regenerate, black = areas to keep"},
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A beautiful garden visible through the window, warm sunlight streaming in..."},
    {"id":"output_format","label":"Format","type":"select","options":[
      {"value":"webp","label":"WebP (default)"},
      {"value":"jpg","label":"JPEG"},
      {"value":"png","label":"PNG"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random"}
  ]'::jsonb
FROM models WHERE slug = 'flux-fill-pro'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Bria Eraser ────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'edit', 'Bria Eraser — Object Removal',
  'Cleanly remove any object from an image with AI-powered background reconstruction.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image to edit"},
    {"id":"mask_image","label":"Mask","type":"image_upload","required":true,"hint":"Paint white over the object you want to remove"}
  ]'::jsonb
FROM models WHERE slug = 'bria-eraser'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Bria GenFill ───────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'edit', 'Bria GenFill — Generative Fill',
  'Add or replace objects in an image using a text prompt with photorealistic blending.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image to edit"},
    {"id":"mask_image","label":"Mask","type":"image_upload","required":true,"hint":"Paint white over the area where you want to add/replace content"},
    {"id":"prompt","label":"What to Generate","type":"textarea","required":true,"ai_assist":true,"placeholder":"A golden retriever sitting on the grass, looking at the camera..."}
  ]'::jsonb
FROM models WHERE slug = 'bria-genfill'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Bria Expand ────────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'edit', 'Bria Expand — Outpainting',
  'Extend your canvas in any direction with AI-generated, contextually consistent content.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image to expand"},
    {"id":"prompt","label":"Prompt","type":"textarea","ai_assist":true,"placeholder":"Continue the landscape with more rolling hills and a distant lake..."},
    {"id":"aspect_ratio","label":"Target Aspect Ratio","type":"select","hint":"The final aspect ratio after expansion","options":[
      {"value":"16:9","label":"Widescreen 16:9"},
      {"value":"9:16","label":"Vertical 9:16"},
      {"value":"1:1","label":"Square 1:1"},
      {"value":"4:3","label":"Standard 4:3"},
      {"value":"21:9","label":"Ultra-Wide 21:9"}
    ]}
  ]'::jsonb
FROM models WHERE slug = 'bria-expand'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Recraft Crisp Upscale ──────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'upscale', 'Recraft Crisp Upscale',
  'Sharp, clean upscaling. Preserves fine detail and edges without AI hallucination.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image to upscale"},
    {"id":"scale_factor","label":"Scale Factor","type":"select","options":[
      {"value":"2","label":"2x"},
      {"value":"4","label":"4x"}
    ]}
  ]'::jsonb
FROM models WHERE slug = 'recraft-crisp-upscale'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Recraft Creative Upscale ───────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'upscale', 'Recraft Creative Upscale',
  'Creative upscaling with AI enhancement. Adds plausible detail and texture for a polished high-res result.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image to upscale"},
    {"id":"scale_factor","label":"Scale Factor","type":"select","options":[
      {"value":"2","label":"2x"},
      {"value":"4","label":"4x"}
    ]}
  ]'::jsonb
FROM models WHERE slug = 'recraft-creative-upscale'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;


-- ── Google Upscaler ────────────────────────────────────────────────────────
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'upscale', 'Google Upscaler',
  'Google''s image upscaler. Clean 2x or 4x upscaling with strong detail preservation.',
  '[
    {"id":"source_image","label":"Source Image","type":"image_upload","required":true,"hint":"Upload the image to upscale"},
    {"id":"scale_factor","label":"Scale Factor","type":"select","options":[
      {"value":"2","label":"2x (default)"},
      {"value":"4","label":"4x"}
    ]}
  ]'::jsonb
FROM models WHERE slug = 'google-upscaler'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;
