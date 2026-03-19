-- Hunyuan only has 1 model — remove from family, show as solo card
UPDATE models SET family = NULL, family_order = 0 WHERE slug = 'hunyuan-video';
