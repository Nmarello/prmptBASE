-- Add a "note" field to Luma txt2vid template explaining the 9s+1080p constraint
-- Inserted after the duration field (index 7, after the resolution at 6 and duration at 7)
-- We rebuild the fields array with the note inserted after duration

UPDATE templates SET fields = (
  SELECT jsonb_agg(f ORDER BY idx)
  FROM (
    SELECT ordinality - 1 AS idx, value AS f
    FROM jsonb_array_elements(fields) WITH ORDINALITY
    UNION ALL
    -- Insert note after duration field
    SELECT 7.5 AS idx, '{"id":"luma-constraints","type":"note","label":"Tip: 9-second videos are only available at 540p or 720p. Selecting 9s at 1080p will automatically generate a 5s clip instead."}'::jsonb AS f
  ) sub
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'luma')
  AND gen_type = 'txt2vid';

-- Same for img2vid
UPDATE templates SET fields = (
  SELECT jsonb_agg(f ORDER BY idx)
  FROM (
    SELECT ordinality - 1 AS idx, value AS f
    FROM jsonb_array_elements(fields) WITH ORDINALITY
    UNION ALL
    SELECT 7.5 AS idx, '{"id":"luma-constraints","type":"note","label":"Tip: 9-second videos are only available at 540p or 720p. Selecting 9s at 1080p will automatically generate a 5s clip instead."}'::jsonb AS f
  ) sub
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'luma')
  AND gen_type = 'img2vid';
