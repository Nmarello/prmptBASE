-- Fix category errors and add upscaler tool

-- sora2 was wrongly put in image → move to video
UPDATE model_status SET category = 'video' WHERE model_slug = 'sora2';

-- kling-o1-edit and kling-o1-reference are video editing variants → move to video
UPDATE model_status SET category = 'video' WHERE model_slug IN ('kling-o1-edit', 'kling-o1-reference');

-- flux-kontext-dev and flux-dev-img2img are img2img → move to image
UPDATE model_status SET category = 'image' WHERE model_slug IN ('flux-kontext-dev', 'flux-dev-img2img');

-- Add the actual upscaler tool (standalone, calls upscale-image edge fn)
INSERT INTO model_status (model_slug, model_name, category, provider, fal_path, replicate_path, installed_fal, installed_replicate, coming_soon, sort_order, notes)
VALUES ('upscale', 'AI Upscaler (2×/4×)', 'tools', 'Internal', null, null, false, false, false, 10, 'Calls upscale-image edge fn — not a model')
ON CONFLICT (model_slug) DO NOTHING;
