-- Nano Banana is its own product line (Imagen 3 Nano), not Imagen 4 family
-- Pull out as solo card — future Nano models can form their own family
UPDATE models SET family = NULL, family_order = 0 WHERE slug IN ('nano-banana', 'nano-banana-pro');
