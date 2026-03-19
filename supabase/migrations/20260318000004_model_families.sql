-- Add family columns to models
ALTER TABLE models
  ADD COLUMN IF NOT EXISTS family TEXT,
  ADD COLUMN IF NOT EXISTS family_order INTEGER DEFAULT 0;

-- ── Flux family ───────────────────────────────────────────────────────────────
UPDATE models SET family = 'Flux', family_order = 1 WHERE slug = 'flux-pro-ultra';
UPDATE models SET family = 'Flux', family_order = 2 WHERE slug = 'flux2-pro';
UPDATE models SET family = 'Flux', family_order = 3 WHERE slug = 'flux-pro';
UPDATE models SET family = 'Flux', family_order = 4 WHERE slug = 'flux-dev';
UPDATE models SET family = 'Flux', family_order = 5 WHERE slug = 'flux-schnell';
UPDATE models SET family = 'Flux', family_order = 6 WHERE slug = 'flux2-max';
UPDATE models SET family = 'Flux', family_order = 7 WHERE slug = 'flux-kontext-pro';
UPDATE models SET family = 'Flux', family_order = 8 WHERE slug = 'flux-kontext-dev';
UPDATE models SET family = 'Flux', family_order = 9 WHERE slug = 'flux-kontext-max';
UPDATE models SET family = 'Flux', family_order = 10 WHERE slug = 'flux-fill-pro';
UPDATE models SET family = 'Flux', family_order = 11 WHERE slug = 'flux-dev-img2img';

-- ── Imagen family ─────────────────────────────────────────────────────────────
UPDATE models SET family = 'Imagen', family_order = 1 WHERE slug = 'nano-banana';
UPDATE models SET family = 'Imagen', family_order = 2 WHERE slug = 'nano-banana-pro';
UPDATE models SET family = 'Imagen', family_order = 3 WHERE slug = 'imagen-4';
UPDATE models SET family = 'Imagen', family_order = 4 WHERE slug = 'imagen-4-fast';
UPDATE models SET family = 'Imagen', family_order = 5 WHERE slug = 'imagen-4-ultra';

-- ── Recraft family ────────────────────────────────────────────────────────────
UPDATE models SET family = 'Recraft', family_order = 1 WHERE slug = 'recraft-v3';
UPDATE models SET family = 'Recraft', family_order = 2 WHERE slug = 'recraft-v4-pro';
UPDATE models SET family = 'Recraft', family_order = 3 WHERE slug = 'recraft-v4';
UPDATE models SET family = 'Recraft', family_order = 4 WHERE slug = 'recraft-crisp-upscale';
UPDATE models SET family = 'Recraft', family_order = 5 WHERE slug = 'recraft-creative-upscale';

-- ── Ideogram family ───────────────────────────────────────────────────────────
UPDATE models SET family = 'Ideogram', family_order = 1 WHERE slug = 'ideogram-v3';
UPDATE models SET family = 'Ideogram', family_order = 2 WHERE slug = 'ideogram-v2';

-- ── Kling family ──────────────────────────────────────────────────────────────
UPDATE models SET family = 'Kling', family_order = 1 WHERE slug = 'kling-v3';
UPDATE models SET family = 'Kling', family_order = 2 WHERE slug = 'kling-v2.5-turbo';
UPDATE models SET family = 'Kling', family_order = 3 WHERE slug = 'kling';
UPDATE models SET family = 'Kling', family_order = 4 WHERE slug = 'kling-o1-edit';
UPDATE models SET family = 'Kling', family_order = 5 WHERE slug = 'kling-o1-reference';

-- ── LTX family ────────────────────────────────────────────────────────────────
UPDATE models SET family = 'LTX', family_order = 1 WHERE slug = 'ltx-2.3-pro';
UPDATE models SET family = 'LTX', family_order = 2 WHERE slug = 'ltx-2.3-fast';
UPDATE models SET family = 'LTX', family_order = 3 WHERE slug = 'ltx-video';

-- ── Luma family ───────────────────────────────────────────────────────────────
UPDATE models SET family = 'Luma', family_order = 1 WHERE slug = 'luma';
UPDATE models SET family = 'Luma', family_order = 2 WHERE slug = 'luma-modify';

-- ── Sora family ───────────────────────────────────────────────────────────────
UPDATE models SET family = 'Sora', family_order = 1 WHERE slug = 'sora2';
UPDATE models SET family = 'Sora', family_order = 2 WHERE slug = 'sora2-pro';

-- ── WAN family ────────────────────────────────────────────────────────────────
UPDATE models SET family = 'WAN', family_order = 1 WHERE slug = 'wan-2.5-t2v';
UPDATE models SET family = 'WAN', family_order = 2 WHERE slug = 'wan-21-txt2vid';

-- ── Hunyuan family ────────────────────────────────────────────────────────────
UPDATE models SET family = 'Hunyuan', family_order = 1 WHERE slug = 'hunyuan-video';

-- ── Seedance family ───────────────────────────────────────────────────────────
UPDATE models SET family = 'Seedance', family_order = 1 WHERE slug = 'seedance-1-pro-txt2vid';
UPDATE models SET family = 'Seedance', family_order = 2 WHERE slug = 'seedance-1-lite';
UPDATE models SET family = 'Seedance', family_order = 3 WHERE slug = 'seedance-1-pro';

-- ── MiniMax family ────────────────────────────────────────────────────────────
UPDATE models SET family = 'MiniMax', family_order = 1 WHERE slug = 'minimax-txt2vid';
UPDATE models SET family = 'MiniMax', family_order = 2 WHERE slug = 'minimax-video';

-- ── Pika family ───────────────────────────────────────────────────────────────
UPDATE models SET family = 'Pika', family_order = 1 WHERE slug = 'pika';
