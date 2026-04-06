-- Enable img2vid gen type for Kling v3

UPDATE models
SET supported_gen_types = ARRAY['txt2vid', 'img2vid']
WHERE slug = 'kling-v3';
