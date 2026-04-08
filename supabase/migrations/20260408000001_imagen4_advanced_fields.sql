-- Add advanced fields (person_generation, add_watermark) to all Imagen 4 templates
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
  SELECT id FROM models WHERE slug IN ('imagen-4', 'imagen-4-ultra', 'imagen-4-fast')
)
AND gen_type = 'txt2img';
