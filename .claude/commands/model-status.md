Show prmptVAULT model status: $ARGUMENTS

1. Read the most recent migrations in `supabase/migrations/` to get the current model list
2. Read `src/pages/Dashboard.tsx` to check `REPLICATE_SLUGS`, `DIRECT_API_SLUGS`, `MODEL_ART_MAP`, and `SLUG_BRAND_MAP`
3. Produce a summary table grouped by category:

   **Active** — in a routing set, is_active=true
   **Coming Soon** — in DB with coming_soon=true
   **Missing Colors** — in DB but not in MODEL_ART_MAP
   **Missing Brand** — in DB but not in SLUG_BRAND_MAP

If $ARGUMENTS specifies a slug or provider name, filter to that.
