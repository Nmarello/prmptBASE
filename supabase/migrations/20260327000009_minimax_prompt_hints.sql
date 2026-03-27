-- MiniMax Video 01: add aspect_ratio and duration as prompt_hint fields
-- These get injected into the prompt text (not sent as API params)
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"An astronaut floating through a cosmic nebula, ethereal lighting, cinematic quality..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","prompt_hint":true,"options":[
      {"value":"16:9","label":"landscape 16:9 aspect ratio"},
      {"value":"9:16","label":"portrait 9:16 aspect ratio"},
      {"value":"1:1","label":"square 1:1 aspect ratio"}
    ]},
    {"id":"duration","label":"Duration","type":"select","prompt_hint":true,"options":[
      {"value":"5s","label":"5 second video"},
      {"value":"10s","label":"10 second video"}
    ]}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'minimax-video')
  AND gen_type = 'txt2vid';
