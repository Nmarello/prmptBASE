-- Fix image field type: "image" → "image_upload" for Seedance 2.0 img2vid and ref2vid templates

UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE
      WHEN elem->>'type' = 'image' THEN jsonb_set(elem, '{type}', '"image_upload"')
      ELSE elem
    END
  )
  FROM jsonb_array_elements(fields) AS elem
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'seedance-2')
  AND gen_type IN ('img2vid', 'ref2vid');
