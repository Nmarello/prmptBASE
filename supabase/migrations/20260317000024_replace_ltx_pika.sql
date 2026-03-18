-- Deactivate old LTX Video and Pika
UPDATE models
SET is_active = false, coming_soon = false
WHERE slug IN ('ltx-txt2vid', 'ltx-img2vid', 'pika-txt2vid', 'pika-img2vid');

-- Activate LTX-2.3 Pro and Fast
UPDATE models
SET is_active = true, coming_soon = false
WHERE slug IN ('ltx-2.3-pro', 'ltx-2.3-fast');

-- Add txt2vid templates for LTX-2.3 Pro and Fast
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'txt2vid', 'LTX-2.3 Pro — Text to Video',
  'Generate high-quality video from a text prompt using LTX-2.3 Pro. Real-time capable architecture with strong composition and motion.',
  '[
    {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A cinematic shot of a mountain lake at sunrise, mist rising from the water, birds flying overhead..."},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"worst quality, blurry, morphing, distorted, static..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Widescreen (default)"},
      {"value":"9:16","label":"9:16 — Vertical"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
  ]'::jsonb
FROM models m
WHERE m.slug = 'ltx-2.3-pro'
  AND NOT EXISTS (SELECT 1 FROM templates t WHERE t.model_id = m.id AND t.gen_type = 'txt2vid');

INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT m.id, 'txt2vid', 'LTX-2.3 Fast — Text to Video',
  'Fast LTX video generation — real-time capable, clean motion, great for quick iterations.',
  '[
    {"id":"prompt","label":"Motion Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A cinematic shot of a mountain lake at sunrise, mist rising from the water, birds flying overhead..."},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"worst quality, blurry, morphing, distorted, static..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Widescreen (default)"},
      {"value":"9:16","label":"9:16 — Vertical"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"seed","label":"Seed","type":"textarea","placeholder":"Leave blank for random","hint":"Set a seed to reproduce results exactly"}
  ]'::jsonb
FROM models m
WHERE m.slug = 'ltx-2.3-fast'
  AND NOT EXISTS (SELECT 1 FROM templates t WHERE t.model_id = m.id AND t.gen_type = 'txt2vid');
