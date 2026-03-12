-- Track actual API cost per generated asset
ALTER TABLE assets ADD COLUMN IF NOT EXISTS cost_usd DECIMAL(10,6);
