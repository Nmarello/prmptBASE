# Handoff — prmptVAULT
**Session date**: 2026-03-18
**Next action**: Check staging (https://staging.prmptbase.pages.dev/dashboard) — family cards should show maker + tagline in info section. If anything looks off, start there.

## What we did
1. **Family card sizing fixed** — anchor cards now match ModelCard exactly (minHeight: 301px)
2. **Section headings fixed** — Images/Video row labels now match "Recently Used" / "Featured" h2 style
3. **Solo cards fixed** — unfamilied models now use full `<ModelCard>` instead of custom SoloCard
4. **Stack peek slivers** — replaced diagonal shadows with right-side card edge stack; gradient top 148px only, surface below; overhang scales with count (≤4 models = 30px, 5+ = 50px)
5. **Family latest render** — anchor card shows most recent render from any model in the family; expanded variant cards show individual latest renders
6. **Variant cards inherit accent border** — when family is open, each ModelCard gets the family accent color as border (added `borderColor` prop to ModelCard)
7. **Scroll fix** — `overflow-anchor: none` on scroll container; expansion now pushes right only
8. **Family order migration** — re-ordered all families newest version first (Flux Kontext → Flux 2 → Flux 1, etc.)
9. **Badge removed** — model count moved from gradient header to info section
10. **Family restructure** — major DB cleanup:
    - Added: HiDream, Veo, Seedream, Stable Diffusion, Bria, GPT Image families
    - Fixed: Imagen 4 (`imagen-4.0-generate-001`) added to Imagen family
    - Removed: Seedance family (1 model), Hunyuan family (1 model), Nano Banana from Imagen
    - Nano Banana is now solo — ready to anchor its own family when more Nano models arrive
11. **Maker + tagline** — each family card now shows maker name (accent color) + 1-line strength blurb

## Files changed
| File | What changed |
|------|-------------|
| `src/components/dashboard/FamilyCard.tsx` | Complete rewrite: stack slivers, latest render on anchor, borderColor on variants, maker+tagline in info, badge removed from header |
| `src/components/dashboard/FamilyRow.tsx` | Added `latestRenderBySlug` prop, `overflow-anchor: none`, updated FAMILY_ORDER for all new families, replaced SoloCard with ModelCard |
| `src/components/dashboard/ModelCard.tsx` | Added optional `borderColor` prop — inline style override for family accent border |
| `src/pages/Dashboard.tsx` | Pass `latestRenderBySlug` to both FamilyRow instances |
| `supabase/migrations/20260318000005_family_order_by_version.sql` | Re-order family_order by latest model maker version |
| `supabase/migrations/20260318000006_family_restructure.sql` | Add HiDream/Veo/Seedream/SD/Bria/GPT Image families; fix Imagen 4 slug; remove Seedance |
| `supabase/migrations/20260318000007_remove_single_model_families.sql` | Remove Hunyuan from family (1 model) |
| `supabase/migrations/20260318000008_nano_banana_solo.sql` | Remove Nano Banana from Imagen family |

## Current state
- ✅ Working: Family card stack with peek slivers, latest renders, maker+tagline
- ✅ Working: All families correctly structured in DB (migrations applied)
- ✅ Working: Scroll expansion goes right only
- ✅ Working: Variant cards show individual latest renders + family accent border
- ✅ Working: Solo cards (HiDream, Hunyuan, Nano Banana, PixVerse, etc.) use full ModelCard
- 🔧 Pending review: Cull candidates still in families (pushed to end): `flux-dev-img2img`, `recraft-v3`, `kling` v1, `ltx-video`, `wan-21-txt2vid` — Nick tabled this, assets stay safe if culled (just set family=NULL)
- ❌ Not started: Remotion for PV Instagram Reels (mentioned sessions ago, never built)
- ❌ Not started: Family card info section — Nick said "we'll work on what info goes in the family card later" (now done with maker+tagline, but may want more)

## Start here next session
Everything is on the `staging` branch — do NOT push to `main` until Nick says to ship. All 8 migrations from this session are applied to the live Supabase DB. The family card UI is in good shape. Next likely tasks: further polish on the family cards, culling old model versions, or the Remotion Instagram Reels work. Check staging first to confirm the maker+tagline build deployed cleanly.

## Gotchas
- **`imagen-4.0-generate-001`** is the actual Imagen 4 slug in the DB — not `imagen-4`. Previous migrations referenced `imagen-4` which didn't exist.
- **`overflow-anchor: none`** is what fixed the scroll pushing both ways — browser scroll anchoring was adjusting scrollLeft automatically when content expanded. Required `as React.CSSProperties` cast for TypeScript.
- **ModelCard `borderColor` prop** — uses inline style which overrides Tailwind's `border-[var(--pv-border)]` class. Works because inline styles have higher specificity.
- **Stack overhang** — `stackOverhang(n)` function: ≤4 models = 30px, 5+ = 50px. Total card footprint = 230 + overhang. Peek sliver positions: `rightEdge = 230 + (i+1) * peekWidth`, `leftEdge = rightEdge - 230`.
- **Family card minHeight: 301** — derived from ModelCard's natural height (148px header + ~153px info). Without this, FamilyCard was ~90px shorter than ModelCard.
- **`supabase db push` — no `--project-ref` flag** — not supported in this CLI version.
- **Apple JWT expires 2026-09-18** — set a reminder to regenerate.
