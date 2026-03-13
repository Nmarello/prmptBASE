-- Remove user_model_selections rows for Runway now that it's coming_soon/inactive
-- These ghost rows were silently counting against users' slot limits
DELETE FROM user_model_selections
WHERE model_id IN (SELECT id FROM models WHERE slug = 'runway');
