-- Approve LTX-2.3 Pro and LTX-2.3 Fast → coming soon
UPDATE models
SET coming_soon = true, is_active = false
WHERE slug IN ('ltx-2.3-pro', 'ltx-2.3-fast');

INSERT INTO model_status (model_slug, source, tested)
VALUES
  ('ltx-2.3-pro',  'replicate', true),
  ('ltx-2.3-fast', 'replicate', true)
ON CONFLICT (model_slug) DO UPDATE
  SET tested = true, source = EXCLUDED.source;
