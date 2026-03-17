-- Recraft V3 was previously live — restore it
UPDATE models SET is_active = true, coming_soon = false WHERE slug = 'recraft-v3';

-- Recraft V4 Pro is new/untested — set to coming soon
UPDATE models SET is_active = false, coming_soon = true WHERE slug = 'recraft-v4-pro';
