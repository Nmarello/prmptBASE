-- Restore Seedance 1 Pro to production — only Seedance 2 stays in testing
UPDATE models
SET sandbox = false
WHERE slug IN ('seedance-1-pro', 'seedance-1-pro-txt2vid');
