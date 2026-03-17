-- Correct all status flags based on actual deployment state
-- installed_fal    = routes through fal.ai
-- installed_replicate = routes through replicate.com
-- coming_live (UI: "Live") = available to users in production
-- coming_soon = planned but not yet deployed anywhere

-- ── Models migrated FAL → Replicate (live in staging, not yet prod) ──────────
UPDATE model_status SET
  installed_fal = false,
  installed_replicate = true,
  coming_live = false   -- staging only, not in prod yet
WHERE model_slug IN (
  'sd35-medium', 'flux-schnell', 'flux-dev', 'flux-pro', 'flux-pro-ultra',
  'flux2-pro', 'recraft-v3', 'recraft-v4-pro', 'ideogram-v3',
  'hidream-fast', 'hidream-full', 'seedream-45'
);

-- ── Already live on Replicate in production ──────────────────────────────────
UPDATE model_status SET
  installed_fal = false,
  installed_replicate = true,
  coming_live = true
WHERE model_slug IN ('sd35-large', 'sd35-large-turbo');

-- ── Staying on FAL, currently live in production ─────────────────────────────
UPDATE model_status SET
  installed_fal = true,
  installed_replicate = false,
  coming_live = true
WHERE model_slug IN (
  'flux-kontext-pro', 'flux-dev-img2img', 'flux-kontext-dev',
  'nano-banana',
  'dalle', 'gpt-image-1',
  'kling', 'kling-o1-edit', 'kling-o1-reference',
  'ltx-video', 'minimax-txt2vid', 'wan-21-txt2vid',
  'luma', 'hunyuan-video', 'pika', 'runway',
  'seedance-1-pro-txt2vid',
  'sora2'
);

-- ── OpenAI direct (not FAL, not Replicate) ───────────────────────────────────
-- dalle, gpt-image-1, sora2 already handled above but sora2 was OpenAI direct
UPDATE model_status SET
  installed_fal = false,
  installed_replicate = false,
  coming_live = true
WHERE model_slug IN ('dalle', 'gpt-image-1', 'sora2');

-- ── Coming soon — not deployed anywhere yet ───────────────────────────────────
UPDATE model_status SET
  installed_fal = false,
  installed_replicate = false,
  coming_live = false,
  coming_soon = true
WHERE model_slug = 'imagen-4';

-- ── Upscaler — live internal tool ─────────────────────────────────────────────
UPDATE model_status SET
  installed_fal = false,
  installed_replicate = false,
  coming_live = true
WHERE model_slug = 'upscale';
