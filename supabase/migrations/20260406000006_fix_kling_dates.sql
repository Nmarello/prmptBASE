-- Fix Kling family release dates (all were site-add dates, not provider dates)
UPDATE models SET released_at = '2025-09-23' WHERE slug = 'kling-v2.5-turbo';
UPDATE models SET released_at = '2025-12-03' WHERE slug = 'kling-v2.6-motion';
UPDATE models SET released_at = '2026-02-05' WHERE slug = 'kling-v3';
