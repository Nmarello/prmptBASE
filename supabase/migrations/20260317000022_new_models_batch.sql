-- New models batch -- all coming_soon=true, is_active=false, untested
-- Platform: Replicate first (all models below have Replicate availability)

-- ── Text → Image ─────────────────────────────────────────────────────────────

INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active) VALUES
('flux2-max',           'FLUX.2 Max',            'Black Forest Labs',  'The highest-quality FLUX generation -- maximum fidelity, detail, and prompt adherence.',                                     ARRAY['txt2img'], 'creator', 40, true, false),
('flux-kontext-max',    'FLUX Kontext Max',       'Black Forest Labs',  'Premium text-based image editing with maximum quality. Precisely alter scenes, swap objects, and relight images.',            ARRAY['img2img'], 'creator', 41, true, false),
('recraft-v4',          'Recraft V4',             'Recraft AI',         'Next-generation image generation from Recraft -- photorealistic quality with strong text rendering.',                         ARRAY['txt2img'], 'creator', 42, true, false),
('ideogram-v2',         'Ideogram v2',            'Ideogram AI',        'High-quality image generation with exceptional text rendering accuracy.',                                                     ARRAY['txt2img'], 'creator', 43, true, false),
('nano-banana-pro',     'Nano Banana Pro',        'Google',             'Google Gemini 3 Pro image model -- sharpest results in the Nano Banana family.',                                               ARRAY['txt2img'], 'creator', 44, true, false),
('imagen-4-ultra',      'Imagen 4 Ultra',         'Google',             'Google''s most powerful image generation model -- photorealistic quality with fine detail and accurate text rendering.',        ARRAY['txt2img'], 'studio',  45, true, false),
('imagen-4-fast',       'Imagen 4 Fast',          'Google',             'Fast variant of Google Imagen 4 -- high-quality results at reduced generation time.',                                         ARRAY['txt2img'], 'creator', 46, true, false),
('gpt-image-1.5',       'GPT Image 1.5',          'OpenAI',             'OpenAI''s improved image generation model with enhanced instruction following and composition.',                               ARRAY['txt2img'], 'creator', 47, true, false),
('seedream-4',          'Seedream 4',             'ByteDance',          'ByteDance image model with strong aesthetic quality and composition.',                                                         ARRAY['txt2img'], 'creator', 48, true, false),
('seedream-5-lite',     'Seedream 5 Lite',        'ByteDance',          'Lightweight, fast variant of ByteDance''s Seedream 5 image generation model.',                                                ARRAY['txt2img'], 'creator', 49, true, false)
ON CONFLICT (slug) DO NOTHING;

-- ── Text → Video ─────────────────────────────────────────────────────────────

INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active) VALUES
('sora2-pro',           'Sora 2 Pro',             'OpenAI',             'OpenAI''s advanced video generation model -- cinematic quality with strong temporal consistency.',                              ARRAY['txt2vid'], 'studio',  60, true, false),
('veo-3',               'Veo 3',                  'Google',             'Google''s flagship video generation model -- high-fidelity motion, photorealistic rendering, and long-form coherence.',         ARRAY['txt2vid'], 'studio',  61, true, false),
('veo-3-fast',          'Veo 3 Fast',             'Google',             'Faster variant of Google Veo 3 -- strong video quality at reduced generation time.',                                          ARRAY['txt2vid'], 'creator', 62, true, false),
('veo-3.1',             'Veo 3.1',                'Google',             'Updated Veo 3 with improved motion fidelity and scene coherence.',                                                           ARRAY['txt2vid'], 'studio',  63, true, false),
('kling-v2.5-turbo',    'Kling v2.5 Turbo Pro',   'Kuaishou / Kling',   'Fast, high-quality Kling video generation -- smooth motion with cinematic aesthetic.',                                        ARRAY['txt2vid'], 'creator', 64, true, false),
('kling-v3',            'Kling v3',               'Kuaishou / Kling',   'Kling''s most advanced generation model -- superior motion quality, realism, and prompt following.',                           ARRAY['txt2vid'], 'studio',  65, true, false),
('ltx-2.3-pro',         'LTX-2.3 Pro',            'Lightricks',         'Pro-quality video generation from Lightricks -- detailed motion, strong composition, real-time-capable architecture.',        ARRAY['txt2vid'], 'creator', 66, true, false),
('ltx-2.3-fast',        'LTX-2.3 Fast',           'Lightricks',         'Fast LTX video generation -- real-time capable, clean motion, great for quick iterations.',                                   ARRAY['txt2vid'], 'creator', 67, true, false),
('wan-2.5-t2v',         'WAN 2.5 T2V',            'Alibaba / WAN',      'Alibaba''s WAN 2.5 text-to-video -- fluid motion with high visual fidelity.',                                                 ARRAY['txt2vid'], 'creator', 68, true, false),
('minimax-video',       'MiniMax Video 01',        'MiniMax',            'MiniMax''s cinematic video model -- rich motion dynamics and strong scene understanding.',                                     ARRAY['txt2vid'], 'creator', 69, true, false),
('gen-4.5',             'Gen-4.5 (Runway)',        'Runway',             'Runway''s latest generation model -- high-fidelity video synthesis with strong temporal coherence.',                           ARRAY['txt2vid'], 'creator', 70, true, false),
('pixverse-v5',         'PixVerse v5',             'PixVerse',           'PixVerse v5 -- fast, stylized video generation with expressive motion.',                                                      ARRAY['txt2vid'], 'creator', 71, true, false)
ON CONFLICT (slug) DO NOTHING;

-- ── Editing / Upscaling ───────────────────────────────────────────────────────

INSERT INTO models (slug, name, provider, description, supported_gen_types, min_tier, sort_order, coming_soon, is_active) VALUES
('flux-fill-pro',           'FLUX Fill Pro',              'Black Forest Labs', 'Professional inpainting and outpainting using FLUX -- seamlessly fill, extend, or replace regions of any image.',     ARRAY['edit'],    'creator', 80, true, false),
('bria-eraser',             'Bria Eraser',                'Bria',              'Cleanly remove any object from an image -- AI-powered background reconstruction with no visible artifacts.',            ARRAY['edit'],    'creator', 81, true, false),
('bria-genfill',            'Bria GenFill',               'Bria',              'Add or replace objects in an image using a text prompt -- generative fill with photorealistic blending.',              ARRAY['edit'],    'creator', 82, true, false),
('bria-expand',             'Bria Expand',                'Bria',              'Outpaint any image -- extend the canvas in any direction with AI-generated, contextually consistent content.',          ARRAY['edit'],    'creator', 83, true, false),
('recraft-crisp-upscale',   'Recraft Crisp Upscale',      'Recraft AI',        'Sharp, clean upscaling from Recraft -- preserves fine detail and edges without AI hallucination.',                     ARRAY['upscale'], 'creator', 84, true, false),
('recraft-creative-upscale','Recraft Creative Upscale',   'Recraft AI',        'Creative upscaling with AI enhancement -- adds plausible detail and texture for a high-res, polished result.',        ARRAY['upscale'], 'creator', 85, true, false),
('google-upscaler',         'Google Upscaler 2x/4x',      'Google',            'Google''s image upscaler -- clean 2x or 4x upscaling with strong detail preservation.',                               ARRAY['upscale'], 'creator', 86, true, false)
ON CONFLICT (slug) DO NOTHING;

-- ── model_status -- all Replicate (Replicate-first policy) ────────────────────

INSERT INTO model_status (model_slug, source, tested) VALUES
('flux2-max',             'replicate', false),
('flux-kontext-max',      'replicate', false),
('recraft-v4',            'replicate', false),
('ideogram-v2',           'replicate', false),
('nano-banana-pro',       'replicate', false),
('imagen-4-ultra',        'replicate', false),
('imagen-4-fast',         'replicate', false),
('gpt-image-1.5',         'replicate', false),
('seedream-4',            'replicate', false),
('seedream-5-lite',       'replicate', false),
('sora2-pro',             'replicate', false),
('veo-3',                 'replicate', false),
('veo-3-fast',            'replicate', false),
('veo-3.1',               'replicate', false),
('kling-v2.5-turbo',      'replicate', false),
('kling-v3',              'replicate', false),
('ltx-2.3-pro',           'replicate', false),
('ltx-2.3-fast',          'replicate', false),
('wan-2.5-t2v',           'replicate', false),
('minimax-video',         'replicate', false),
('gen-4.5',               'replicate', false),
('pixverse-v5',           'replicate', false),
('flux-fill-pro',         'replicate', false),
('bria-eraser',           'replicate', false),
('bria-genfill',          'replicate', false),
('bria-expand',           'replicate', false),
('recraft-crisp-upscale', 'replicate', false),
('recraft-creative-upscale','replicate',false),
('google-upscaler',       'replicate', false)
ON CONFLICT (model_slug) DO NOTHING;
