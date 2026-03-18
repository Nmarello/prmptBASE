-- Fix: deactivate using correct slugs (pika, ltx-video — not pika-txt2vid/ltx-txt2vid)
UPDATE models
SET is_active = false, coming_soon = false
WHERE slug IN ('pika', 'ltx-video');
