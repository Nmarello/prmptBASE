-- Drop old model_status and rebuild clean
-- Source of truth for live/coming_soon = models table
-- model_status only tracks: source (fal/replicate/direct) + tested flag

DROP TABLE IF EXISTS model_status;

CREATE TABLE model_status (
  model_slug  text PRIMARY KEY,
  source      text NOT NULL CHECK (source IN ('fal', 'replicate', 'direct')),
  tested      boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE model_status ENABLE ROW LEVEL SECURITY;
-- Public read (models list is public anyway)
CREATE POLICY "public_read"  ON model_status FOR SELECT USING (true);
-- Admin write
CREATE POLICY "admin_write"  ON model_status FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Seed sources — derived from Dashboard.tsx routing
INSERT INTO model_status (model_slug, source) VALUES
-- Direct API (not FAL or Replicate)
('dalle',                    'direct'),
('gpt-image-1',              'direct'),
('imagen-4.0-generate-001',  'direct'),
-- Replicate
('sd35-large',               'replicate'),
('sd35-large-turbo',         'replicate'),
('sd35-medium',              'replicate'),
('flux-schnell',             'replicate'),
('flux-dev',                 'replicate'),
('flux-pro',                 'replicate'),
('flux-pro-ultra',           'replicate'),
('flux2-pro',                'replicate'),
('recraft-v3',               'replicate'),
('recraft-v4-pro',           'replicate'),
('ideogram-v3',              'replicate'),
('hidream-fast',             'replicate'),
('hidream-full',             'replicate'),
('seedream-45',              'replicate'),
-- FAL (everything else)
('flux-dev-img2img',         'fal'),
('flux-kontext-dev',         'fal'),
('flux-kontext-pro',         'fal'),
('hunyuan-video',            'fal'),
('kling',                    'fal'),
('kling-o1-edit',            'fal'),
('kling-o1-reference',       'fal'),
('ltx-video',                'fal'),
('luma',                     'fal'),
('luma-modify',              'fal'),
('minimax-txt2vid',          'fal'),
('nano-banana',              'fal'),
('pika',                     'fal'),
('runway',                   'fal'),
('seedance-1-pro-txt2vid',   'fal'),
('sora2',                    'fal'),
('wan-21-txt2vid',           'fal');
