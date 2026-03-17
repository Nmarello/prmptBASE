-- Swap sort_order so Recraft V3 appears before Recraft V4 Pro
DO $$
DECLARE
  v3_order int;
  v4_order int;
BEGIN
  SELECT sort_order INTO v3_order FROM models WHERE slug = 'recraft-v3';
  SELECT sort_order INTO v4_order FROM models WHERE slug = 'recraft-v4-pro';
  UPDATE models SET sort_order = v4_order WHERE slug = 'recraft-v3';
  UPDATE models SET sort_order = v3_order WHERE slug = 'recraft-v4-pro';
END $$;

-- Move assets from recraft-v4-pro to recraft-v3
UPDATE assets
SET model_id = (SELECT id FROM models WHERE slug = 'recraft-v3')
WHERE model_id = (SELECT id FROM models WHERE slug = 'recraft-v4-pro');
