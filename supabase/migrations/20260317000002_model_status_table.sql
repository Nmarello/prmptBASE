-- Model status tracking table for admin panel
CREATE TABLE IF NOT EXISTS model_status (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_slug      text NOT NULL UNIQUE,
  model_name      text NOT NULL,
  category        text NOT NULL CHECK (category IN ('image', 'video', 'tools')),
  provider        text NOT NULL,
  fal_path        text,
  replicate_path  text,
  installed_fal       boolean NOT NULL DEFAULT false,
  installed_replicate boolean NOT NULL DEFAULT false,
  coming_live         boolean NOT NULL DEFAULT false,
  coming_soon         boolean NOT NULL DEFAULT false,
  tested              boolean NOT NULL DEFAULT false,
  notes           text,
  sort_order      int NOT NULL DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Only admins can read/write
ALTER TABLE model_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_all" ON model_status FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Seed all known models
INSERT INTO model_status (model_slug, model_name, category, provider, fal_path, replicate_path, installed_fal, installed_replicate, coming_soon, sort_order) VALUES

-- ── Image models ──────────────────────────────────────────────────────────────
('flux-schnell',       'FLUX.1 Schnell',          'image', 'Black Forest Labs', 'fal-ai/flux/schnell',              'black-forest-labs/flux-schnell',        false, true,  false, 10),
('flux-dev',           'FLUX.1 Dev',              'image', 'Black Forest Labs', 'fal-ai/flux/dev',                  'black-forest-labs/flux-dev',            false, true,  false, 11),
('flux-pro',           'FLUX Pro',                'image', 'Black Forest Labs', 'fal-ai/flux-pro',                  'black-forest-labs/flux-pro',            false, true,  false, 12),
('flux-pro-ultra',     'FLUX 1.1 Pro Ultra',      'image', 'Black Forest Labs', 'fal-ai/flux-pro/v1.1-ultra',       'black-forest-labs/flux-1.1-pro-ultra',  false, true,  false, 13),
('flux2-pro',          'FLUX.2 Pro',              'image', 'Black Forest Labs', null,                               'black-forest-labs/flux-2-pro',          false, true,  false, 14),
('flux-kontext-pro',   'FLUX Kontext Pro',        'image', 'Black Forest Labs', 'fal-ai/flux-pro/kontext',          'black-forest-labs/flux-kontext-pro',    true,  false, false, 15),
('recraft-v3',         'Recraft V3',              'image', 'Recraft AI',        'fal-ai/recraft-v3',                'recraft-ai/recraft-v3',                 false, true,  false, 20),
('recraft-v4-pro',     'Recraft V4 Pro',          'image', 'Recraft AI',        'fal-ai/recraft-v4/pro',            'recraft-ai/recraft-v4-pro',             false, true,  false, 21),
('ideogram-v3',        'Ideogram V3',             'image', 'Ideogram AI',       'fal-ai/ideogram/v3',               'ideogram-ai/ideogram-v3-balanced',      false, true,  false, 30),
('hidream-fast',       'HiDream L1 Fast',         'image', 'HiDream',           'fal-ai/hidream-i1-fast',           'prunaai/hidream-l1-fast',               false, true,  false, 40),
('hidream-full',       'HiDream L1 Full',         'image', 'HiDream',           'fal-ai/hidream-i1-full',           'prunaai/hidream-l1-full',               false, true,  false, 41),
('seedream-45',        'Seedream 4.5',            'image', 'ByteDance',         'fal-ai/seedream/v3',               'bytedance/seedream-4.5',                false, true,  false, 50),
('sd35-large',         'SD 3.5 Large',            'image', 'Stability AI',      null,                               'stability-ai/stable-diffusion-3.5-large',       false, true,  false, 60),
('sd35-large-turbo',   'SD 3.5 Large Turbo',      'image', 'Stability AI',      null,                               'stability-ai/stable-diffusion-3.5-large-turbo', false, true,  false, 61),
('sd35-medium',        'SD 3.5 Medium',           'image', 'Stability AI',      'fal-ai/stable-diffusion-v35-medium', 'stability-ai/stable-diffusion-3.5-medium', false, true, false, 62),
('nano-banana',        'Imagen Nano (nano-banana)','image','Google',            'fal-ai/nano-banana',               null,                                    true,  false, false, 70),
('imagen-4',           'Imagen 4',                'image', 'Google',            null,                               'google/imagen-4',                       false, false, true,  71),
('dalle',              'DALL·E 3',                'image', 'OpenAI',            null,                               null,                                    true,  false, false, 80),
('gpt-image-1',        'GPT Image 1',             'image', 'OpenAI',            null,                               null,                                    true,  false, false, 81),
('sora2',              'Sora 2',                  'image', 'OpenAI',            null,                               'openai/sora-2',                         true,  false, false, 82),

-- ── Video models ──────────────────────────────────────────────────────────────
('kling',              'Kling',                   'video', 'Kuaishou',          'fal-ai/kling-video/v1.6/pro/text-to-video', 'kwaivgi/kling-v2.5-turbo-pro', true, false, false, 10),
('ltx-video',          'LTX Video',               'video', 'Lightricks',        'fal-ai/ltx-video',                 'lightricks/ltx-2.3-pro',                true,  false, false, 20),
('minimax-txt2vid',    'MiniMax Video',           'video', 'MiniMax',           'fal-ai/minimax/video-01',          'minimax/video-01',                      true,  false, false, 30),
('wan-21-txt2vid',     'WAN 2.1',                 'video', 'Alibaba',           'fal-ai/wan-i2v',                   'wan-video/wan-2.5-t2v-fast',            true,  false, false, 40),
('luma',               'Luma Dream Machine',      'video', 'Luma AI',           'fal-ai/luma-dream-machine',        null,                                    true,  false, false, 50),
('hunyuan-video',      'HunyuanVideo',            'video', 'Tencent',           'fal-ai/hunyuan-video',             null,                                    true,  false, false, 60),
('pika',               'Pika',                    'video', 'Pika Labs',         'fal-ai/pika-v2.2-text-to-video',   null,                                    true,  false, false, 70),
('runway',             'Runway Gen-4',            'video', 'Runway',            'fal-ai/runway-gen4/text-to-video', 'runwayml/gen-4.5',                      true,  false, false, 80),
('seedance-1-pro-txt2vid', 'Seedance 1 Pro',      'video', 'ByteDance',         'fal-ai/seedance-v1-pro-t2v',       null,                                    true,  false, false, 90),

-- ── Tools ─────────────────────────────────────────────────────────────────────
('flux-dev-img2img',   'FLUX Dev img2img',        'tools', 'Black Forest Labs', 'fal-ai/flux/dev/image-to-image',   null,                                    true,  false, false, 10),
('flux-kontext-dev',   'FLUX Kontext Dev',        'tools', 'Black Forest Labs', 'fal-ai/flux-dev/kontext',          'black-forest-labs/flux-kontext-dev',    true,  false, false, 11),
('kling-o1-edit',      'Kling Edit',              'tools', 'Kuaishou',          'fal-ai/kling-video/v1.6/pro/image-to-video', null,                          true,  false, false, 20)

ON CONFLICT (model_slug) DO NOTHING;
