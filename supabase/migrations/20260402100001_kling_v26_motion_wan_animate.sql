-- ══ New models: Kling 2.6 Motion Control + Wan 2.2 Animate ══

-- ── Kling 2.6 Motion Control ────────────────────────────────────────────────
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order, is_active, released_at)
VALUES (
  'kling-v2.6-motion',
  'Kling 2.6 Motion Control',
  'fal.ai',
  'Kuaishou''s motion transfer model. Upload a reference video and a character image — the character performs the exact actions from the video with lifelike lip sync, gestures, and expressions.',
  ARRAY['vid2vid'],
  'creator',
  59,
  'Kling',
  5,
  true,
  '2026-04-02'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  is_active = true,
  released_at = EXCLUDED.released_at;

-- ── Wan 2.2 Animate ─────────────────────────────────────────────────────────
INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, family, family_order, is_active, released_at)
VALUES (
  'wan-2.2-animate',
  'Wan 2.2 Animate',
  'replicate',
  'Alibaba''s open-source character animation model. Transfer motion from any video onto a character image with best-in-class lip sync, body movement, and expression replication.',
  ARRAY['vid2vid'],
  'creator',
  60,
  'Wan',
  3,
  true,
  '2026-04-02'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  supported_gen_types = EXCLUDED.supported_gen_types,
  is_active = true,
  released_at = EXCLUDED.released_at;

-- ══ Templates ════════════════════════════════════════════════════════════════

-- Kling 2.6 Motion Control — vid2vid
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'vid2vid', 'Kling 2.6 Motion Control',
  'Transfer motion from a reference video onto any character. Upload a character image and a motion video — the character performs the exact movements.',
  '[
    {"id":"prompt","label":"Prompt (optional)","type":"textarea","ai_assist":true,"placeholder":"A person performing an energetic dance, studio lighting..."},
    {"id":"source_image","label":"Character Image","type":"image_upload","required":true,"hint":"The character whose appearance will be used"},
    {"id":"reference_video","label":"Motion Video","type":"video_upload","required":true,"hint":"The reference video whose motion will be transferred (max 30s)"},
    {"id":"character_orientation","label":"Character Orientation","type":"select","options":[
      {"value":"image","label":"Match Image (better for camera moves, max 10s)"},
      {"value":"video","label":"Match Video (better for complex motion, max 30s)"}
    ]},
    {"id":"keep_original_sound","label":"Keep Original Audio","type":"select","options":[
      {"value":"true","label":"Yes"},
      {"value":"false","label":"No"}
    ]}
  ]'::jsonb
FROM models WHERE slug = 'kling-v2.6-motion'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;

-- Wan 2.2 Animate — vid2vid
INSERT INTO templates (model_id, gen_type, name, description, fields)
SELECT id, 'vid2vid', 'Wan 2.2 Animate — Motion Transfer',
  'Copy any motion onto a character. Upload a character image and a reference video — the model generates your character performing those exact movements with realistic expressions.',
  '[
    {"id":"prompt","label":"Prompt (optional)","type":"textarea","ai_assist":true,"placeholder":"A person dancing in a studio, professional lighting..."},
    {"id":"source_image","label":"Character Image","type":"image_upload","required":true,"hint":"The character to animate"},
    {"id":"reference_video","label":"Motion Video","type":"video_upload","required":true,"hint":"The video whose motion will be transferred"}
  ]'::jsonb
FROM models WHERE slug = 'wan-2.2-animate'
ON CONFLICT (model_id, gen_type) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, fields=EXCLUDED.fields;
