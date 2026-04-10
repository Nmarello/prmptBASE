-- Activate Seedance 2.0 (was deactivated with experimental models batch; now routing via Replicate)
UPDATE models SET is_active = true, sandbox = false WHERE slug = 'seedance-2';
