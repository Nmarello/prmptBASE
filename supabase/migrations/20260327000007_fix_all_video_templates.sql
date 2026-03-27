-- Fix ALL video model templates to match actual Replicate API parameters
-- ═══════════════════════════════════════════════════════════════════════

-- ── Veo 3: aspect_ratio 16:9/9:16 only, duration 4/6/8 ──────────────
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A timelapse of a flower blooming in a sunlit garden, macro lens, shallow depth of field..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"4","label":"4 seconds"},
      {"value":"6","label":"6 seconds"},
      {"value":"8","label":"8 seconds"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'veo-3')
  AND gen_type = 'txt2vid';

-- ── Veo 3 Fast: same as Veo 3 ───────────────────────────────────────
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A timelapse of a flower blooming in a sunlit garden, macro lens, shallow depth of field..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"4","label":"4 seconds"},
      {"value":"6","label":"6 seconds"},
      {"value":"8","label":"8 seconds"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'veo-3-fast')
  AND gen_type = 'txt2vid';

-- ── Veo 3.1: same as Veo 3 ──────────────────────────────────────────
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A timelapse of a flower blooming in a sunlit garden, macro lens, shallow depth of field..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"4","label":"4 seconds"},
      {"value":"6","label":"6 seconds"},
      {"value":"8","label":"8 seconds"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'veo-3.1')
  AND gen_type = 'txt2vid';

-- ── Kling v2.5 Turbo: 16:9/9:16/1:1, duration 5/10 ─────────────────
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A dancer moves gracefully through a neon-lit city street at night, cinematic slow motion..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"},
      {"value":"1:1","label":"1:1 — Square"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds"},
      {"value":"10","label":"10 seconds"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'kling-v2.5-turbo')
  AND gen_type = 'txt2vid';

-- ── WAN 2.5 T2V: 16:9/9:16 only (mapped to size internally) ────────
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A serene mountain lake at dawn, mist rolling over the water, time-lapse clouds..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"negative_prompt","label":"Negative Prompt","type":"textarea","placeholder":"blurry, low quality, distorted, watermark..."},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'wan-2.5-t2v')
  AND gen_type = 'txt2vid';

-- ── MiniMax Video: prompt only (no aspect_ratio, no duration) ────────
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"An astronaut floating through a cosmic nebula, ethereal lighting, cinematic quality..."}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'minimax-video')
  AND gen_type = 'txt2vid';

-- ── Gen 4.5 (Runway): 16:9/9:16, duration 2-10, seed ────────────────
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A sweeping drone shot over a futuristic cityscape at sunset, volumetric lighting..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"5","label":"5 seconds"},
      {"value":"10","label":"10 seconds"}
    ]},
    {"id":"seed","label":"Seed","type":"number","placeholder":"Leave blank for random"}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'gen-4.5')
  AND gen_type = 'txt2vid';

-- ── LTX 2.3 Pro: 16:9/9:16, duration 6/8/10 ────────────────────────
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A cinematic shot of waves crashing against rocky cliffs, golden hour, slow motion..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"6","label":"6 seconds"},
      {"value":"8","label":"8 seconds"},
      {"value":"10","label":"10 seconds"}
    ]}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'ltx-2.3-pro')
  AND gen_type = 'txt2vid';

-- ── LTX 2.3 Fast: 16:9/9:16, duration 6-20 ─────────────────────────
UPDATE templates
SET fields = '[
    {"id":"prompt","label":"Prompt","type":"textarea","required":true,"ai_assist":true,"placeholder":"A cinematic shot of waves crashing against rocky cliffs, golden hour, slow motion..."},
    {"id":"aspect_ratio","label":"Aspect Ratio","type":"select","options":[
      {"value":"16:9","label":"16:9 — Landscape"},
      {"value":"9:16","label":"9:16 — Portrait / Vertical"}
    ]},
    {"id":"duration","label":"Duration","type":"select","options":[
      {"value":"6","label":"6 seconds"},
      {"value":"8","label":"8 seconds"},
      {"value":"10","label":"10 seconds"}
    ]}
  ]'::jsonb
WHERE model_id = (SELECT id FROM models WHERE slug = 'ltx-2.3-fast')
  AND gen_type = 'txt2vid';
