-- Update Seedance 2.0 duration hints: Replicate caps at 12s (not 15)
UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'id' = 'duration' THEN
        elem || '{"hint":"4–12 seconds, or leave blank for auto"}'::jsonb
      ELSE elem
    END
  )
  FROM jsonb_array_elements(fields) AS elem
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'seedance-2');
