-- Backfill provider release dates for all models
-- Dates sourced from official provider announcements, NOT site-add dates.
-- Corrects existing wrong dates (2026-03-27/29 placeholder dates) and fills nulls.

UPDATE models SET released_at = date_trunc('day', released_at) WHERE released_at IS NOT NULL; -- normalize to date

-- ============================================================
-- FILL NULLS
-- ============================================================

-- DALL-E 3 (OpenAI, Oct 2023)
UPDATE models SET released_at = '2023-10-19' WHERE slug = 'dalle' AND released_at IS NULL;

-- TripoSR (Stability AI / Tripo, Mar 2024)
UPDATE models SET released_at = '2024-03-04' WHERE slug = 'triposr' AND released_at IS NULL;

-- FLUX.1 family (Black Forest Labs, Aug 2024)
UPDATE models SET released_at = '2024-08-01' WHERE slug IN ('flux-dev', 'flux-dev-img2img', 'flux-pro', 'flux-schnell') AND released_at IS NULL;

-- Kling v1 (Kuaishou, Jun 2024)
UPDATE models SET released_at = '2024-06-06' WHERE slug = 'kling' AND released_at IS NULL;

-- Luma Dream Machine (Luma AI, Jun 2024)
UPDATE models SET released_at = '2024-06-12' WHERE slug = 'luma' AND released_at IS NULL;

-- Hyper3D Rodin (Deemos/Hyper3D, May 2025 — using launch event date)
UPDATE models SET released_at = '2025-05-08' WHERE slug = 'hyper3d-rodin' AND released_at IS NULL;

-- MiniMax original video (MiniMax, Aug 2024)
UPDATE models SET released_at = '2024-08-31' WHERE slug = 'minimax-txt2vid' AND released_at IS NULL;

-- Recraft V3 (Recraft, Oct 2024)
UPDATE models SET released_at = '2024-10-30' WHERE slug = 'recraft-v3' AND released_at IS NULL;

-- Recraft Upscalers (Recraft, Nov 2024 alongside V3 rollout)
UPDATE models SET released_at = '2024-11-01' WHERE slug IN ('recraft-creative-upscale', 'recraft-crisp-upscale') AND released_at IS NULL;

-- FLUX 1.1 Pro Ultra (BFL, Nov 2024)
UPDATE models SET released_at = '2024-11-06' WHERE slug = 'flux-pro-ultra' AND released_at IS NULL;

-- FLUX Fill Pro (BFL, Nov 2024)
UPDATE models SET released_at = '2024-11-21' WHERE slug = 'flux-fill-pro' AND released_at IS NULL;

-- HunyuanVideo original (Tencent, Dec 2024)
UPDATE models SET released_at = '2024-12-03' WHERE slug = 'hunyuan-video' AND released_at IS NULL;

-- Trellis (Microsoft, Dec 2024)
UPDATE models SET released_at = '2024-12-02' WHERE slug = 'trellis' AND released_at IS NULL;

-- Bria tools (Bria.ai, 2024 — approximate mid-year)
UPDATE models SET released_at = '2024-06-01' WHERE slug IN ('bria-eraser', 'bria-expand', 'bria-genfill') AND released_at IS NULL;

-- Wan 2.1 (Alibaba, Feb 2025)
UPDATE models SET released_at = '2025-02-25' WHERE slug = 'wan-21-txt2vid' AND released_at IS NULL;

-- HiDream I1 (HiDream, Apr 2025)
UPDATE models SET released_at = '2025-04-07' WHERE slug IN ('hidream-fast', 'hidream-full') AND released_at IS NULL;

-- GPT Image 1 (OpenAI, Apr 2025)
UPDATE models SET released_at = '2025-04-23' WHERE slug = 'gpt-image-1' AND released_at IS NULL;

-- FLUX Kontext Pro (BFL, May 2025)
UPDATE models SET released_at = '2025-05-29' WHERE slug = 'flux-kontext-pro' AND released_at IS NULL;

-- Imagen 4 base (Google, May 2025 — Google I/O)
UPDATE models SET released_at = '2025-05-20' WHERE slug = 'imagen-4.0-generate-001' AND released_at IS NULL;

-- Ideogram V3 (Ideogram, Mar 2025)
UPDATE models SET released_at = '2025-03-26' WHERE slug = 'ideogram-v3' AND released_at IS NULL;

-- PixVerse V5 (PixVerse, Aug 2025)
UPDATE models SET released_at = '2025-08-28' WHERE slug = 'pixverse-v5' AND released_at IS NULL;

-- Hunyuan World (Tencent, Jul 2025)
UPDATE models SET released_at = '2025-07-26' WHERE slug = 'hunyuan-world' AND released_at IS NULL;

-- Kling v3 (Kuaishou, Feb 2026)
UPDATE models SET released_at = '2026-02-04' WHERE slug = 'kling-v3' AND released_at IS NULL;

-- LTX 2.3 (Lightricks, Mar 2026)
UPDATE models SET released_at = '2026-03-05' WHERE slug IN ('ltx-2.3-fast', 'ltx-2.3-pro') AND released_at IS NULL;

-- Nano Banana 2 (Google, Feb 2026)
UPDATE models SET released_at = '2026-02-26' WHERE slug = 'nano-banana' AND released_at IS NULL;

-- Google Upscaler (approximate — tied to Imagen 4 era, May 2025)
UPDATE models SET released_at = '2025-05-20' WHERE slug = 'google-upscaler' AND released_at IS NULL;

-- ============================================================
-- CORRECT WRONG DATES (placeholder 2026-03-27 / 2026-03-29 site-add dates)
-- ============================================================

-- Ideogram V2 (Ideogram, Aug 2024)
UPDATE models SET released_at = '2024-08-21' WHERE slug = 'ideogram-v2';

-- SD 3.5 family (Stability AI, Oct 2024)
UPDATE models SET released_at = '2024-10-22' WHERE slug IN ('sd35-large', 'sd35-large-turbo', 'sd35-medium');

-- FLUX Kontext Dev + Max (BFL, May 2025 — same launch as Kontext Pro)
UPDATE models SET released_at = '2025-05-29' WHERE slug IN ('flux-kontext-dev', 'flux-kontext-max');

-- Imagen 4 Fast + Ultra (Google, May 2025 — Google I/O)
UPDATE models SET released_at = '2025-05-20' WHERE slug IN ('imagen-4-fast', 'imagen-4-ultra');

-- Veo 3 + Fast (Google, May 2025 — Google I/O)
UPDATE models SET released_at = '2025-05-20' WHERE slug IN ('veo-3', 'veo-3-fast');

-- Veo 3.1 (Google, Jan 2026)
UPDATE models SET released_at = '2026-01-13' WHERE slug = 'veo-3.1';

-- Sora 2 / Sora 2 Pro (OpenAI, Sep 2025)
UPDATE models SET released_at = '2025-09-30' WHERE slug IN ('sora2', 'sora2-pro');

-- GPT Image 1.5 (OpenAI, Dec 2025)
UPDATE models SET released_at = '2025-12-16' WHERE slug = 'gpt-image-1.5';

-- MiniMax Video 01 (MiniMax, Aug 2024)
UPDATE models SET released_at = '2024-08-31' WHERE slug = 'minimax-video';

-- Hailuo 2.3 (MiniMax, Oct 2025)
UPDATE models SET released_at = '2025-10-28' WHERE slug = 'hailuo-2.3';

-- HunyuanVideo 1.5 (Tencent, Nov 2025)
UPDATE models SET released_at = '2025-11-21' WHERE slug = 'hunyuan-video-1.5';

-- Nano Banana Pro (Google, Nov 2025)
UPDATE models SET released_at = '2025-11-20' WHERE slug = 'nano-banana-pro';

-- Seedream 4 (ByteDance, Sep 2025)
UPDATE models SET released_at = '2025-09-08' WHERE slug = 'seedream-4';

-- Seedream 4.5 (ByteDance, Dec 2025)
UPDATE models SET released_at = '2025-12-03' WHERE slug = 'seedream-45';

-- Seedream 5 Lite (ByteDance, Feb 2026)
UPDATE models SET released_at = '2026-02-13' WHERE slug = 'seedream-5-lite';

-- Qwen Image 2 Pro (Alibaba, Feb 2026)
UPDATE models SET released_at = '2026-02-10' WHERE slug = 'qwen-image-2-pro';

-- Recraft V4 + V4 Pro (Recraft, Feb 2026)
UPDATE models SET released_at = '2026-02-17' WHERE slug IN ('recraft-v4', 'recraft-v4-pro');

-- WAN 2.5 T2V (Alibaba, Sep 2025)
UPDATE models SET released_at = '2025-09-23' WHERE slug = 'wan-2.5-t2v';

-- Gen-4.5 / Runway Gen-4.5 (Runway, Dec 2025)
UPDATE models SET released_at = '2025-12-01' WHERE slug = 'gen-4.5';

-- Seedance 1 Pro (ByteDance, Jun 2025)
UPDATE models SET released_at = '2025-06-01' WHERE slug = 'seedance-1-pro-txt2vid';

-- Seedance 2.0 (ByteDance, Feb 2026)
UPDATE models SET released_at = '2026-02-10' WHERE slug = 'seedance-2';
