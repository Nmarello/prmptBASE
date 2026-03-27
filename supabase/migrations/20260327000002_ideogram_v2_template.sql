-- Ideogram v2 template (missed in initial batch)
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'txt2img', 'Ideogram v2 — Text to Image',
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
FROM models WHERE slug = 'ideogram-v2'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;
