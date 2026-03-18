-- LTX-2.3 only accepts 16:9 and 9:16 — remove 1:1 option from both templates
UPDATE templates SET fields = jsonb_set(
  fields,
  '{2,options}',
  '[
    {"value":"16:9","label":"16:9 — Widescreen (default)"},
    {"value":"9:16","label":"9:16 — Vertical"}
  ]'::jsonb
)
WHERE model_id IN (SELECT id FROM models WHERE slug IN ('ltx-2.3-pro', 'ltx-2.3-fast'))
  AND gen_type = 'txt2vid';
