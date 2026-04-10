# prmptBASE (prmptVAULT)

## Stack
- React 19 + Vite + TypeScript + Tailwind CSS 4
- Supabase (PostgreSQL + 34 edge functions in Deno)
- Stripe for billing, PostHog for analytics, Ghost for blog
- Deployed to Cloudflare Pages (frontend) + Supabase (edge functions)

## Git Workflow
- Always commit to `staging` first — only push to `main` when Nick says ship
- If local staging is stale: `git reset --hard origin/staging`

## Key Directories
- `src/` — React app (components, pages, contexts, hooks, lib, types)
- `src/components/dashboard/HomeView.tsx` — Home screen: hero, inline advisor, 3 category cards (Images/Video/Tools), Featured + Last Used rows (full ModelCard)
- `src/components/dashboard/ModelsPageView.tsx` — Images/Video sub-pages: Featured + Last Used + per-family horizontal ModelCard rows
- `src/components/dashboard/MiniModelCard.tsx` — Compact card (still used in some views, NOT used in HomeView)
- `src/components/compare/` — Compare tool components (CompareColumn, CommonSettings, AdvancedSettings, GhostColumn)
- `src/components/dashboard/ModelAdvisor.tsx` — AI chat bubble (blue #0050ff, fixed top-right, models view only)
- `src/lib/generateRequest.ts` — shared generation routing utility (replicate/fal/google/openai)
- `supabase/functions/` — 35 Deno edge functions (added: model-advisor)
- `supabase/migrations/` — 92+ database migrations
- `ghost-theme/` — Custom Ghost blog theme

## Dashboard architecture
- `view` state: `'models' | 'builder' | 'assets' | 'projects' | 'tools'`
- `categoryView` state: `'images' | 'video' | null` — set by sidebar Images/Video buttons; null = Home
- Sidebar order: Home → Images → Video → Compare → Tools → Assets → Projects → Bell → Theme
- Images/Video pages use `ModelsPageView` (not the old tier-aware FamilyRow layout)
- `CategoryKey = 'images' | 'video'` — 'characters' and '3d' removed
- Model Advisor: renders when `view === 'models' && !drawerModel && (!!categoryView || advisorOpenedFromHome)`
- HomeView inline chat: self-contained, calls model-advisor edge fn directly, no onAdvisorQuery prop
- Compare page has matching left icon sidebar; non-Compare items navigate('/dashboard')

## Gotchas
- Edge function deploys are separate from CF Pages — run `supabase functions deploy`
- If renaming an edge function, rename the folder to bust Supabase's deploy cache
- RLS policies: never SELECT the same table a policy guards (infinite recursion)
- `.update()/.insert()` without `await` silently never execute (Supabase JS v2)
- Edge fn auth pattern: `Bearer <anon-key>` header + `user_token` in body
- Storage uploads: use the shared `src/lib/supabase.ts` client — new createClient() with anon key fails
- Video assets: always upload to Supabase storage — provider temp URLs expire
- CF Pages treats unused imports/vars as hard build failures — always clean up (`noUnusedLocals: true`)
- CF Pages wrangler deploy needs `--commit-message "..."` flag or it errors on special chars in git message
- Generation errors must tell users what to change (actionable messages)
- Compare tool: `columnsRef` polling pattern is intentional — do NOT add `columns` to the polling `useEffect` deps
- Compare tool: `getBrand()` in CompareColumn maps slug → display brand; update when adding new model families
- Compare tool: accepts `location.state = { models: string[], prompt: string }` from Model Advisor — pre-populates columns + sharedPrompt
- Model Advisor: only renders when `view === 'models' && !drawerModel` in Dashboard — intentional, not a bug
- Favorites: `favoriteModelSlugs` read from localStorage on mount; setter prefixed `_setFavoriteModelSlugs` — no toggle UI yet
- Imagen 4 base model slug is `imagen-4.0-generate-001` (not `imagen-4`) — matters for migrations
- TemplateForm renders ALL template fields with no filtering — add field to DB template, it appears in workspace + Compare
- Compare lightbox: clicking result image fetches asset by assetId from Supabase, opens standard Lightbox

## Build & Dev
- `npm run dev` — local dev server
- `npx supabase functions serve` — local edge functions
- `npx wrangler pages deploy dist --project-name prmptbase --branch staging` — deploy to CF Pages (Git builds are broken, use Wrangler)
