-- Ensure parent models support img2vid
UPDATE models SET supported_gen_types = array(
  SELECT DISTINCT unnest(array_append(supported_gen_types, 'img2vid'))
) WHERE slug IN ('kling', 'luma', 'sora2');

-- Remove redundant -img2vid model cards
DELETE FROM templates WHERE model_id IN (
  SELECT id FROM models WHERE slug IN ('kling-img2vid', 'luma-img2vid', 'sora2-img2vid')
);
DELETE FROM model_status WHERE model_slug IN ('kling-img2vid', 'luma-img2vid', 'sora2-img2vid');
DELETE FROM models WHERE slug IN ('kling-img2vid', 'luma-img2vid', 'sora2-img2vid');
