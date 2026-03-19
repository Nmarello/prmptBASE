# Handoff — prmptVAULT
**Session date**: 2026-03-18
**Next action**: Check staging (https://staging.prmptbase.pages.dev/dashboard) — family anchor cards should now be 230px/148px matching ModelCard. If still wrong, the issue is a flex/CSS constraint in FamilyRow or FamilyCard, not the component code.

## What we did
1. **Apple Sign In fix** — raw EC private key was in Supabase instead of ES256 JWT; generated correct JWT with `jsonwebtoken`, saved to Supabase Apple provider config
2. **`/auth/callback` route** — created `AuthCallback.tsx` to explicitly call `exchangeCodeForSession()` and avoid PKCE race conditions
3. **Kling v3 + PixVerse v5 activated** — FAL endpoints added, DB migration to set active, templates created
4. **Model families DB migration** — added `family` + `family_order` columns, seeded all models into their families (Flux, Imagen, Recraft, Ideogram, Kling, LTX, Luma, Sora, WAN, Hunyuan, Seedance, MiniMax, Pika)
5. **FamilyCard + FamilyRow components built** — horizontal accordion: click family → variants slide right; 3 rows (Images, Video, Characters); coming soon inside families; solo unfamilied models at end
6. **Family anchor card sizing** — ongoing battle; latest commit (889b7ab) sets `width: 230px` / `height: 148px` matching ModelCard exactly. Variant cards use actual `<ModelCard>` component.

## Files changed
| File | What changed |
|------|-------------|
| `src/pages/AuthCallback.tsx` | NEW — exchanges OAuth code, redirects to /dashboard |
| `src/App.tsx` | Added `/auth/callback` route |
| `src/contexts/AuthContext.tsx` | redirectTo points to `/auth/callback` for all OAuth providers |
| `src/components/dashboard/FamilyCard.tsx` | NEW — family anchor card (230px/148px, ModelCard style) + ModelCard variant cards |
| `src/components/dashboard/FamilyRow.tsx` | NEW — horizontal scroll row per category, groups models by family |
| `src/pages/Dashboard.tsx` | Replaced flat image/video model sections with `<FamilyRow>` |
| `src/types/index.ts` | Added `family: string \| null` and `family_order: number` to Model interface |
| `supabase/functions/generate-fal/index.ts` | Added kling-v3 and pixverse-v5 to FAL_VIDEO_ENDPOINTS |
| `supabase/migrations/20260318000003_activate_kling_v3_pixverse.sql` | Activates kling-v3 + pixverse-v5, creates templates |
| `supabase/migrations/20260318000004_model_families.sql` | Adds family columns, seeds all model families |

## Current state
- ✅ Working: Apple Sign In (JWT secret saved, /auth/callback route live)
- ✅ Working: Kling v3 + PixVerse v5 active in staging
- ✅ Working: FamilyRow renders 3 rows (Images/Video/Characters) with correct family groupings
- ✅ Working: Accordion expand-right animation, one open at a time, smooth scroll
- ✅ Working: Variant cards use actual ModelCard component (correct design)
- 🔧 In progress: Family anchor card size — code is correct (230px/148px, commit 889b7ab) but CF Pages build may not have deployed yet when user last checked. Verify on staging first.
- ❌ Not started: Remotion for PV Instagram Reels (mentioned at session start, never built)
- ❌ Not started: Characters row (infrastructure ready, no active character models yet)

## Start here next session
Check staging dashboard at https://staging.prmptbase.pages.dev/dashboard. The family anchor cards (Flux, Kling, etc.) should be 230px wide with a 148px gradient header — same visual as the ModelCard in "Recently Used". If they're still rendering small, check `FamilyCard.tsx` line ~45 (`style={{ width: 230 }}`) and whether the wrapping `<div>` in `FamilyRow.tsx` is constraining width. The variant cards (shown after expanding a family) correctly use `<ModelCard>` already.

All work is on `staging` branch. Do NOT push to `main` until Nick explicitly says to ship.

Apple JWT expires ~2026-09-18 — set a reminder.

## Gotchas
- **ModelCard uses inline `style={{ width: '230px' }}`** — not a Tailwind class. Using `w-48` or `w-36` Tailwind classes gives wrong size (192px / 144px). Always use inline style to match exactly.
- **Apple JWT**: Supabase needs an ES256 JWT (not the raw `-----BEGIN PRIVATE KEY-----` EC key). Generate with `jsonwebtoken`. Terminal line-wrapping will corrupt the private key — pipe to a file or use `| tr -d '\n'`.
- **Supabase JS v2 lazy queries**: `.update()/.insert()` without `await` or `.then()` silently never execute.
- **Video assets**: Always upload to Supabase storage before saving URL — Replicate/FAL temp URLs expire.
- **RLS gotcha**: Never write a policy that SELECTs the same table it guards → infinite recursion.
- **`supabase db push`**: Don't use `--project-ref` flag — not supported in this CLI version.
- **FamilyCard stacked shadows**: The `-z-10`/`-z-20` peek shadows behind the anchor card require the parent wrapper to be `relative` and have `overflow: visible` (not `overflow-hidden`). The button inside is `overflow-hidden` for the rounded corners.
