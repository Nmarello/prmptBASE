-- Seedance 2.0 is live on FAL — remove sandbox flag
UPDATE models SET sandbox = false WHERE slug = 'seedance-2';
