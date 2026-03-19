-- Re-order family cards by latest model maker version (newest first)
-- Cull candidates pushed to end (marked with high order numbers) for review

-- ── Flux ─────────────────────────────────────────────────────────────────────
-- Newest: Kontext series → Flux 2 → Flux 1 Pro tier → Flux 1 open
UPDATE models SET family_order = 1  WHERE slug = 'flux-kontext-pro';
UPDATE models SET family_order = 2  WHERE slug = 'flux-kontext-max';
UPDATE models SET family_order = 3  WHERE slug = 'flux-kontext-dev';
UPDATE models SET family_order = 4  WHERE slug = 'flux2-pro';
UPDATE models SET family_order = 5  WHERE slug = 'flux2-max';
UPDATE models SET family_order = 6  WHERE slug = 'flux-pro-ultra';
UPDATE models SET family_order = 7  WHERE slug = 'flux-fill-pro';
UPDATE models SET family_order = 8  WHERE slug = 'flux-pro';
UPDATE models SET family_order = 9  WHERE slug = 'flux-dev';
UPDATE models SET family_order = 10 WHERE slug = 'flux-schnell';
-- Cull candidate: superseded by flux-kontext-pro for img2img
UPDATE models SET family_order = 11 WHERE slug = 'flux-dev-img2img';

-- ── Imagen ────────────────────────────────────────────────────────────────────
-- Newest: Imagen 4 tier → Nano Banana (Imagen 3 era)
UPDATE models SET family_order = 1 WHERE slug = 'imagen-4-ultra';
UPDATE models SET family_order = 2 WHERE slug = 'imagen-4';
UPDATE models SET family_order = 3 WHERE slug = 'imagen-4-fast';
UPDATE models SET family_order = 4 WHERE slug = 'nano-banana-pro';
UPDATE models SET family_order = 5 WHERE slug = 'nano-banana';

-- ── Recraft ───────────────────────────────────────────────────────────────────
-- Newest: v4 → tools → v3 (cull candidate)
UPDATE models SET family_order = 1 WHERE slug = 'recraft-v4-pro';
UPDATE models SET family_order = 2 WHERE slug = 'recraft-v4';
UPDATE models SET family_order = 3 WHERE slug = 'recraft-crisp-upscale';
UPDATE models SET family_order = 4 WHERE slug = 'recraft-creative-upscale';
-- Cull candidate: superseded by v4
UPDATE models SET family_order = 5 WHERE slug = 'recraft-v3';

-- ── Ideogram ──────────────────────────────────────────────────────────────────
UPDATE models SET family_order = 1 WHERE slug = 'ideogram-v3';
UPDATE models SET family_order = 2 WHERE slug = 'ideogram-v2';

-- ── Kling ─────────────────────────────────────────────────────────────────────
-- Newest: v3 → v2.5 Turbo → O1 special variants → v1 (cull candidate)
UPDATE models SET family_order = 1 WHERE slug = 'kling-v3';
UPDATE models SET family_order = 2 WHERE slug = 'kling-v2.5-turbo';
UPDATE models SET family_order = 3 WHERE slug = 'kling-o1-edit';
UPDATE models SET family_order = 4 WHERE slug = 'kling-o1-reference';
-- Cull candidate: v1, superseded by v3
UPDATE models SET family_order = 5 WHERE slug = 'kling';

-- ── LTX ───────────────────────────────────────────────────────────────────────
-- Newest: 2.3 Pro → 2.3 Fast → 0.9 (cull candidate)
UPDATE models SET family_order = 1 WHERE slug = 'ltx-2.3-pro';
UPDATE models SET family_order = 2 WHERE slug = 'ltx-2.3-fast';
-- Cull candidate: v0.9, superseded by 2.3
UPDATE models SET family_order = 3 WHERE slug = 'ltx-video';

-- ── Luma ──────────────────────────────────────────────────────────────────────
UPDATE models SET family_order = 1 WHERE slug = 'luma';
UPDATE models SET family_order = 2 WHERE slug = 'luma-modify';

-- ── Sora ──────────────────────────────────────────────────────────────────────
UPDATE models SET family_order = 1 WHERE slug = 'sora2';
UPDATE models SET family_order = 2 WHERE slug = 'sora2-pro';

-- ── WAN ───────────────────────────────────────────────────────────────────────
-- Newest: WAN 2.5 → WAN 2.1 (cull candidate)
UPDATE models SET family_order = 1 WHERE slug = 'wan-2.5-t2v';
-- Cull candidate: WAN 2.1, superseded by 2.5
UPDATE models SET family_order = 2 WHERE slug = 'wan-21-txt2vid';

-- ── Hunyuan ───────────────────────────────────────────────────────────────────
UPDATE models SET family_order = 1 WHERE slug = 'hunyuan-video';

-- ── Seedance ──────────────────────────────────────────────────────────────────
-- Pro first, then lite
UPDATE models SET family_order = 1 WHERE slug = 'seedance-1-pro';
UPDATE models SET family_order = 2 WHERE slug = 'seedance-1-pro-txt2vid';
UPDATE models SET family_order = 3 WHERE slug = 'seedance-1-lite';

-- ── MiniMax ───────────────────────────────────────────────────────────────────
-- Newer MiniMax Video 01 first
UPDATE models SET family_order = 1 WHERE slug = 'minimax-video';
UPDATE models SET family_order = 2 WHERE slug = 'minimax-txt2vid';

-- ── Pika ──────────────────────────────────────────────────────────────────────
UPDATE models SET family_order = 1 WHERE slug = 'pika';
