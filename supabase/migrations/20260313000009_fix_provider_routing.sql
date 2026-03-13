-- Fix provider field for fal.ai-routed models so Dashboard routes them correctly.
-- SLUG_BRAND_MAP in Dashboard.tsx handles the display name separately.
UPDATE models SET provider = 'fal.ai' WHERE slug IN ('pika', 'runway', 'ltx-video');
