UPDATE models
SET is_active = true, coming_soon = false
WHERE slug = 'kling';

UPDATE model_status
SET tested = true
WHERE model_slug = 'kling';
