-- Permanently remove CogVideoX — low quality model, never to be released
DELETE FROM templates WHERE model_id = (SELECT id FROM models WHERE slug = 'cogvideox');
DELETE FROM user_model_selections WHERE model_id = (SELECT id FROM models WHERE slug = 'cogvideox');
DELETE FROM models WHERE slug = 'cogvideox';
