-- Add optional end frame (tail_image_url) to Kling v3 img2vid template

UPDATE templates
SET fields = '[
  {"id":"source_image","label":"Start Frame","type":"image_upload","required":true,"hint":"The first frame — Kling v3 animates from this image."},
  {"id":"tail_image_url","label":"End Frame (optional)","type":"image_upload","required":false,"hint":"Set an end frame to guide where the animation lands."},
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
WHERE gen_type = 'img2vid'
  AND model_id = (SELECT id FROM models WHERE slug = 'kling-v3');
