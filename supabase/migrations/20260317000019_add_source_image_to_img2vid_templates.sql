-- Add source_image field to HunyuanVideo img2vid template
UPDATE templates SET fields = (
  '[{"id":"source_image","label":"Source Image","type":"image_upload","required":true}]'::jsonb
  || fields
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'hunyuan-video')
  AND gen_type = 'img2vid';

-- Add source_image field to Wan 2.1 img2vid template
UPDATE templates SET fields = (
  '[{"id":"source_image","label":"Source Image","type":"image_upload","required":true}]'::jsonb
  || fields
)
WHERE model_id = (SELECT id FROM models WHERE slug = 'wan-21-txt2vid')
  AND gen_type = 'img2vid';
