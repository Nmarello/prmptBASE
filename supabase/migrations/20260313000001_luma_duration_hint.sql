-- Add hint to Luma duration field: 9s is not supported at 1080p (auto-capped to 5s in backend)
UPDATE templates SET fields = jsonb_set(
  fields,
  '{6}',
  (fields->6) || '{"hint":"9s is automatically reduced to 5s at 1080p resolution"}'::jsonb
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'luma')
  AND gen_type = 'txt2vid'
  AND fields->6->>'id' = 'duration';

UPDATE templates SET fields = jsonb_set(
  fields,
  '{6}',
  (fields->6) || '{"hint":"9s is automatically reduced to 5s at 1080p resolution"}'::jsonb
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'luma')
  AND gen_type = 'img2vid'
  AND fields->6->>'id' = 'duration';
