-- Deactivate experimental models — not ready for production
UPDATE models SET is_active = false WHERE slug IN ('kling-v2.6-motion', 'wan-2.2-animate', 'seedance-2');
