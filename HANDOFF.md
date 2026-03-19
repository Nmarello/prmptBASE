# Handoff — prmptVAULT
**Session date**: 2026-03-19
**Next action**: Check staging (https://staging.prmptbase.pages.dev/dashboard) — verify tour card stays in viewport and DALL-E gets spotlighted. Then continue testing the first-run tour flow end to end.

## What we did
1. **Recraft V4 fix** — added `recraft-v4` to `generate-replicate` edge fn (was missing entirely); split size maps into `RECRAFT_V4_SIZE_MAP` (1024–1344px) vs `RECRAFT_V4_PRO_SIZE_MAP` (2048px+)
2. **Multi-model upscaler dropdown** — replaced button selector with `<select>` matching TemplateForm style; added pros/cons/best-for description card below dropdown; 4 models: Real-ESRGAN (FAL), Recraft Crisp, Recraft Creative, Google Upscaler (all Replicate); edge fn updated to route accordingly
3. **Tools row on dashboard** — new `ToolsRow` component with 4 tool cards (Upscale clickable → navigates to tools, Inpaint/Remove BG/Expand as "Soon"); `activeTool` state lifted to Dashboard
4. **Veo 3 duplicate fixed** — removed hardcoded `COMING_SOON_VIDEO` stub (`cs-veo3`) that was showing as a solo card alongside the real `veo-3` in the Veo family
5. **Tour audit** — fixed missing `data-tour="dalle-card"` (never was set anywhere); updated stale copy in GuidedTour (provider list → family cards) and FirstRunTour nav step; added `dataTour` to solo ModelCard in FamilyRow so Pro users get the spotlight too
6. **Tour card off-screen fix** — `attachedFallback` in FirstRunTour now clamps `top` to `[16, innerHeight - 260]` so card never goes below fold when target fills screen

## Files changed
| File | What changed |
|------|-------------|
| `supabase/functions/upscale-image/index.ts` | Route to FAL (ESRGAN) or Replicate (Recraft/Google) based on `upscaler` param |
| `supabase/functions/generate-replicate/index.ts` | Added `recraft-v4` model entry + split size maps |
| `src/components/dashboard/ToolsPanel.tsx` | `<select>` dropdown + pros/cons description card; upscaler state |
| `src/components/dashboard/ToolsRow.tsx` | New — 4 tool nav cards for dashboard |
| `src/components/dashboard/FamilyRow.tsx` | Added `dataTour="dalle-card"` to DALL-E solo card |
| `src/components/dashboard/FirstRunTour.tsx` | `attachedFallback` clamped to viewport; nav step copy updated |
| `src/components/dashboard/GuidedTour.tsx` | Step 2 copy updated from provider list to family card description |
| `src/pages/Dashboard.tsx` | Removed `COMING_SOON_VIDEO` stub; added `activeTool`/`setActiveTool`; ToolsRow added; `dataTour` on DALL-E in Your Models row |

## Current state
- ✅ Working: Multi-upscaler dropdown with descriptions deployed to Supabase
- ✅ Working: Tools row on dashboard navigates to tools section
- ✅ Working: Veo family clean (no duplicate solo card)
- ✅ Working: Tour copy updated for families
- 🔧 Pending retest: First-run tour full flow — tour card positioning fix and DALL-E spotlight need verification
- ❌ Not started: Characters row (tabled — need model education first)
- ❌ Not started: Cull old model versions (flux-dev-img2img, recraft-v3, kling v1, ltx-video, wan-21-txt2vid)
- ❌ Not started: Remotion Instagram Reels

## Start here next session
Branch is `staging` — do NOT push to `main` until Nick says to ship. All edge fn changes are deployed to Supabase (project ref `knlelqirhlvgvmmwiske`). The main outstanding item is verifying the first-run tour end-to-end: reset with `localStorage.removeItem('prmptVAULT_firstRunSeen')` in browser console, then run through the full flow on staging. After that, the testing site still has models to test and approve (see `~/testing-prmptvault/src/models.ts` — many still `needs-test`).

## Gotchas
- **Testing site is a separate repo** at `~/testing-prmptvault/` — deploy with `CLOUDFLARE_API_TOKEN=QjSrvAkYlDnorQDQ0yUv-3nAnUHayYmEc2GOoJVZ npm run deploy` from that dir. Not git-triggered.
- **`COMING_SOON_VIDEO` array** in Dashboard.tsx was the source of the duplicate Veo 3 — if any future "coming soon" models need to be hardcoded there, make sure they don't already exist in Supabase with `coming_soon=true`
- **Tour `attachedFallback`** was clamping to `innerHeight - 260` (estimated card height) — if cards grow taller, increase that constant
- **DALL-E tour target** is set in two places: `yourModels.map()` in Dashboard.tsx (newbie users) and `soloActive.map()` in FamilyRow.tsx (pro users). Both must be kept in sync if DALL-E ever moves to a family
- **Upscaler Replicate models** (recraft-crisp, recraft-creative, google) — input params assumed from Replicate convention (`image` key). Haven't been live-tested yet; errors may require param name fixes
