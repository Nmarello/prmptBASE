-- imagen-4 is live via Google Direct API
UPDATE model_status SET
  coming_soon = false,
  coming_live = true,
  notes = 'Google Direct API (generate-google edge fn)'
WHERE model_slug = 'imagen-4';

-- Mark other direct-API models with notes for clarity
UPDATE model_status SET notes = 'OpenAI Direct API' WHERE model_slug IN ('dalle', 'gpt-image-1', 'sora2');
UPDATE model_status SET notes = 'Internal edge fn (upscale-image)' WHERE model_slug = 'upscale';
