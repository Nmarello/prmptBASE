UPDATE models
SET is_active = true, coming_soon = false
WHERE slug IN ('kling-img2vid', 'luma-img2vid', 'sora2-img2vid');

UPDATE model_status
SET tested = true
WHERE model_slug IN ('kling-img2vid', 'luma-img2vid', 'sora2-img2vid');
