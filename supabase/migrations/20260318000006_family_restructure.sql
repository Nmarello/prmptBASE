-- ── Fix Imagen family — add actual Imagen 4 slug, reorder ────────────────────
UPDATE models SET family = 'Imagen', family_order = 1 WHERE slug = 'imagen-4.0-generate-001';
UPDATE models SET family_order = 2 WHERE slug = 'imagen-4-ultra';
UPDATE models SET family_order = 3 WHERE slug = 'imagen-4-fast';
UPDATE models SET family_order = 4 WHERE slug = 'nano-banana-pro';
UPDATE models SET family_order = 5 WHERE slug = 'nano-banana';

-- ── Seedance: only 1 model exists — remove from family ────────────────────────
UPDATE models SET family = NULL, family_order = 0 WHERE slug = 'seedance-1-pro-txt2vid';

-- ── HiDream family (2 active) ─────────────────────────────────────────────────
UPDATE models SET family = 'HiDream', family_order = 1 WHERE slug = 'hidream-full';
UPDATE models SET family = 'HiDream', family_order = 2 WHERE slug = 'hidream-fast';

-- ── Veo family (3 coming soon) ────────────────────────────────────────────────
UPDATE models SET family = 'Veo', family_order = 1 WHERE slug = 'veo-3.1';
UPDATE models SET family = 'Veo', family_order = 2 WHERE slug = 'veo-3';
UPDATE models SET family = 'Veo', family_order = 3 WHERE slug = 'veo-3-fast';

-- ── Seedream family (3 coming soon) ───────────────────────────────────────────
UPDATE models SET family = 'Seedream', family_order = 1 WHERE slug = 'seedream-5-lite';
UPDATE models SET family = 'Seedream', family_order = 2 WHERE slug = 'seedream-4';
UPDATE models SET family = 'Seedream', family_order = 3 WHERE slug = 'seedream-45';

-- ── Stable Diffusion family (3 coming soon) ───────────────────────────────────
UPDATE models SET family = 'Stable Diffusion', family_order = 1 WHERE slug = 'sd35-large';
UPDATE models SET family = 'Stable Diffusion', family_order = 2 WHERE slug = 'sd35-large-turbo';
UPDATE models SET family = 'Stable Diffusion', family_order = 3 WHERE slug = 'sd35-medium';

-- ── Bria family (3 coming soon) ───────────────────────────────────────────────
UPDATE models SET family = 'Bria', family_order = 1 WHERE slug = 'bria-genfill';
UPDATE models SET family = 'Bria', family_order = 2 WHERE slug = 'bria-eraser';
UPDATE models SET family = 'Bria', family_order = 3 WHERE slug = 'bria-expand';

-- ── GPT Image family (1 active + 1 coming soon) ───────────────────────────────
UPDATE models SET family = 'GPT Image', family_order = 1 WHERE slug = 'gpt-image-1.5';
UPDATE models SET family = 'GPT Image', family_order = 2 WHERE slug = 'gpt-image-1';
