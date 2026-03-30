-- Fix GPT Image 1.5 template: only supports 1:1, 3:2, 2:3
UPDATE templates SET fields = '[
  {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A watercolor painting of a cozy bookshop interior..."},
  {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
    {"value":"1:1","label":"Square (1:1)"},
    {"value":"3:2","label":"Landscape (3:2)"},
    {"value":"2:3","label":"Portrait (2:3)"}
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
  {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted..."},
  {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'gpt-image-1.5') AND gen_type = 'txt2img';
