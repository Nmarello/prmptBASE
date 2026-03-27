-- Hide vid2vid models from public dashboard — no generate pipeline exists yet
-- Setting coming_soon=false + is_active=false removes them from the query entirely
UPDATE models
SET coming_soon = false, is_active = false
WHERE slug IN ('kling-o1-edit', 'kling-o1-reference', 'luma-modify');
