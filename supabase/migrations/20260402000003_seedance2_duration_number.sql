-- Change Seedance 2.0 duration field from select to number input (4-15 seconds)

UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'id' = 'duration' THEN
        '{"id":"duration","label":"Duration (seconds)","type":"number","placeholder":"auto","hint":"4–15 seconds, or leave blank for auto"}'::jsonb
      ELSE elem
    END
  )
  FROM jsonb_array_elements(fields) AS elem
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'seedance-2');
