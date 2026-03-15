-- Fix HunyuanVideo templates:
-- 1. num_frames: API only accepts 85 or 129 (not 45 or 97)
-- 2. num_inference_steps: API max is 30 (not 50)

-- ── HunyuanVideo txt2vid ──────────────────────────────────────────────────────
UPDATE templates
SET fields = jsonb_set(
  jsonb_set(
    fields,
    '{5,options}',
    '[
      {"value":"30","label":"30 — Fast draft"},
      {"value":"20","label":"20 — Faster"}
    ]'::jsonb
  ),
  '{5,hint}',
  '"30 is the API maximum. Lower = faster generation."'::jsonb
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'hunyuan-video')
  AND gen_type = 'txt2vid'
  AND fields @> '[{"id":"num_inference_steps"}]';

UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE
      WHEN field->>'id' = 'num_frames' THEN
        jsonb_set(
          jsonb_set(field, '{options}', '[
            {"value":"85","label":"~5s (85 frames)"},
            {"value":"129","label":"~8s (129 frames)"}
          ]'::jsonb),
          '{hint}',
          '"85 frames ≈ 5s · 129 frames ≈ 8s — longer is significantly slower"'::jsonb
        )
      WHEN field->>'id' = 'num_inference_steps' THEN
        jsonb_set(
          jsonb_set(field, '{options}', '[
            {"value":"20","label":"20 — Fast draft"},
            {"value":"25","label":"25 — Balanced"},
            {"value":"30","label":"30 — Standard (default)"}
          ]'::jsonb),
          '{hint}',
          '"30 is the API maximum. Lower = faster generation."'::jsonb
        )
      ELSE field
    END
  )
  FROM jsonb_array_elements(fields) AS field
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'hunyuan-video')
  AND gen_type = 'txt2vid';

-- ── HunyuanVideo img2vid ──────────────────────────────────────────────────────
UPDATE templates
SET fields = (
  SELECT jsonb_agg(
    CASE
      WHEN field->>'id' = 'num_frames' THEN
        jsonb_set(field, '{options}', '[
          {"value":"85","label":"~5s (85 frames)"},
          {"value":"129","label":"~8s (129 frames)"}
        ]'::jsonb)
      WHEN field->>'id' = 'num_inference_steps' THEN
        jsonb_set(field, '{options}', '[
          {"value":"20","label":"20 — Fast"},
          {"value":"25","label":"25 — Balanced"},
          {"value":"30","label":"30 — Standard"}
        ]'::jsonb)
      ELSE field
    END
  )
  FROM jsonb_array_elements(fields) AS field
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'hunyuan-video')
  AND gen_type = 'img2vid';
