-- Imagen 4 base model uses slug 'imagen-4.0-generate-001' — missed in previous migration
UPDATE templates
SET fields = fields || '[
  {"id":"person_generation","label":"People","type":"pill_select","advanced":true,"options":[
    {"value":"allow_adult","label":"Adults only (default)"},
    {"value":"allow_all","label":"Allow all ages"},
    {"value":"dont_allow","label":"No people"}
  ],"hint":"Controls whether people can appear in generated images."},
  {"id":"add_watermark","label":"Watermark","type":"pill_select","advanced":true,"options":[
    {"value":"true","label":"Add watermark"},
    {"value":"false","label":"No watermark"}
  ],"hint":"Adds a Google SynthID watermark to generated images."}
]'::jsonb
WHERE model_id IN (
  SELECT id FROM models WHERE slug IN ('imagen-4.0-generate-001', 'imagen-4')
)
AND gen_type = 'txt2img'
AND NOT (fields @> '[{"id":"person_generation"}]'::jsonb);
