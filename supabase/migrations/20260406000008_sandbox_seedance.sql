-- Hide all Seedance models from production (FAL early access only)
-- Testing site shows all; prod filters sandbox=false
UPDATE models
SET sandbox = true
WHERE slug IN ('seedance-1-pro', 'seedance-1-pro-txt2vid', 'seedance-2');
