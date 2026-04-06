-- Add sandbox flag for experimental models
-- sandbox=true models only appear on testing.prmptvault.ai
ALTER TABLE models ADD COLUMN IF NOT EXISTS sandbox boolean NOT NULL DEFAULT false;

-- Activate experimental models as sandbox-only
UPDATE models SET is_active = true, sandbox = true
WHERE slug IN ('kling-v2.6-motion', 'wan-2.2-animate', 'seedance-2');
