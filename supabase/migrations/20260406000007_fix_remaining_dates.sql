-- Fix remaining models where stored date was site-add date, not provider release date

-- WAN 2.2 Animate (Alibaba, Sep 2025 — not our Apr 2026 add date)
UPDATE models SET released_at = '2025-09-19' WHERE slug = 'wan-2.2-animate';

-- FLUX.2 family (BFL — all had 2026-03-20/29 site-add dates)
UPDATE models SET released_at = '2025-11-25' WHERE slug = 'flux2-pro';
UPDATE models SET released_at = '2025-12-16' WHERE slug = 'flux2-max';
UPDATE models SET released_at = '2026-01-15' WHERE slug = 'flux2-klein';

-- Seedance 1 Pro (ByteDance, Jun 2025 — exact date 16th not 1st)
UPDATE models SET released_at = '2025-06-16' WHERE slug = 'seedance-1-pro-txt2vid';

-- Seedance 2.0 (ByteDance, Feb 2026 — 12th not 10th)
UPDATE models SET released_at = '2026-02-12' WHERE slug = 'seedance-2';
