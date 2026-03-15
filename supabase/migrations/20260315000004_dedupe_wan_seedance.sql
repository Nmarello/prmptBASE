-- Remove duplicate/stale model rows that are showing as coming-soon duplicates.
-- Keep wan-21-txt2vid (active). Remove any other wan rows that are coming_soon.
-- Keep seedance-1-pro-txt2vid. Remove seedance-1-pro and any other seedance duplicates.

-- Delete stale coming-soon wan rows (any slug containing 'wan' that is NOT the active one)
DELETE FROM templates WHERE model_id IN (
  SELECT id FROM models
  WHERE name ILIKE '%wan%'
    AND slug != 'wan-21-txt2vid'
);
DELETE FROM user_model_selections WHERE model_id IN (
  SELECT id FROM models
  WHERE name ILIKE '%wan%'
    AND slug != 'wan-21-txt2vid'
);
DELETE FROM models
  WHERE name ILIKE '%wan%'
    AND slug != 'wan-21-txt2vid';

-- Delete stale seedance rows — keep only seedance-1-pro-txt2vid
DELETE FROM templates WHERE model_id IN (
  SELECT id FROM models
  WHERE name ILIKE '%seedance%'
    AND slug != 'seedance-1-pro-txt2vid'
);
DELETE FROM user_model_selections WHERE model_id IN (
  SELECT id FROM models
  WHERE name ILIKE '%seedance%'
    AND slug != 'seedance-1-pro-txt2vid'
);
DELETE FROM models
  WHERE name ILIKE '%seedance%'
    AND slug != 'seedance-1-pro-txt2vid';
