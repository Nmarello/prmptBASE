-- Enable AI assist on the prompt field for Wan 2.1 and HunyuanVideo templates

-- ── Wan 2.1 txt2vid ───────────────────────────────────────────────────────────
UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE WHEN f->>'id' = 'prompt' THEN f || '{"ai_assist":true}'::jsonb ELSE f END
  )
  FROM jsonb_array_elements(fields) AS f
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'wan-21-txt2vid')
  AND gen_type = 'txt2vid';

-- ── Wan 2.1 img2vid ───────────────────────────────────────────────────────────
UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE WHEN f->>'id' = 'prompt' THEN f || '{"ai_assist":true}'::jsonb ELSE f END
  )
  FROM jsonb_array_elements(fields) AS f
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'wan-21-txt2vid')
  AND gen_type = 'img2vid';

-- ── HunyuanVideo txt2vid ──────────────────────────────────────────────────────
UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE WHEN f->>'id' = 'prompt' THEN f || '{"ai_assist":true}'::jsonb ELSE f END
  )
  FROM jsonb_array_elements(fields) AS f
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'hunyuan-video')
  AND gen_type = 'txt2vid';

-- ── HunyuanVideo img2vid ──────────────────────────────────────────────────────
UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE WHEN f->>'id' = 'prompt' THEN f || '{"ai_assist":true}'::jsonb ELSE f END
  )
  FROM jsonb_array_elements(fields) AS f
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'hunyuan-video')
  AND gen_type = 'img2vid';
