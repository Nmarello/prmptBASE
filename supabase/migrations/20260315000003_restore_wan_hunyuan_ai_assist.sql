-- Restore ai_assist:true on prompt fields after template rebuild in migration 0002

UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE WHEN f->>'id' = 'prompt' THEN f || '{"ai_assist":true}'::jsonb ELSE f END
  )
  FROM jsonb_array_elements(fields) AS f
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'wan-21-txt2vid');

UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE WHEN f->>'id' = 'prompt' THEN f || '{"ai_assist":true}'::jsonb ELSE f END
  )
  FROM jsonb_array_elements(fields) AS f
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'hunyuan-video');
