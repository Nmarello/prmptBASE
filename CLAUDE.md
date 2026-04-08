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
- `src/components/compare/` — Compare tool components (CompareColumn, CommonSettings, AdvancedSettings, GhostColumn)
- `src/components/dashboard/ModelAdvisor.tsx` — AI chat bubble (violet, fixed top-right, models view only)
- `src/lib/generateRequest.ts` — shared generation routing utility (replicate/fal/google/openai)
- `supabase/functions/` — 35 Deno edge functions (added: model-advisor)
- `supabase/migrations/` — 92+ database migrations
- `ghost-theme/` — Custom Ghost blog theme

## Gotchas
- Edge function deploys are separate from CF Pages — run `supabase functions deploy`
- If renaming an edge function, rename the folder to bust Supabase's deploy cache
- RLS policies: never SELECT the same table a policy guards (infinite recursion)
- `.update()/.insert()` without `await` silently never execute (Supabase JS v2)
- Edge fn auth pattern: `Bearer <anon-key>` header + `user_token` in body
- Storage uploads: use the shared `src/lib/supabase.ts` client — new createClient() with anon key fails
- Video assets: always upload to Supabase storage — provider temp URLs expire
- CF Pages treats unused imports/vars as hard build failures — always clean up
- Generation errors must tell users what to change (actionable messages)
- Compare tool: `columnsRef` polling pattern is intentional — do NOT add `columns` to the polling `useEffect` deps
- Compare tool: `getBrand()` in CompareColumn maps slug → display brand; update when adding new model families
- Compare tool: accepts `location.state = { models: string[], prompt: string }` from Model Advisor — pre-populates columns + sharedPrompt
- Model Advisor: only renders when `view === 'models' && !drawerModel` in Dashboard — intentional, not a bug

## Build & Dev
- `npm run dev` — local dev server
- `npx supabase functions serve` — local edge functions
- `npx wrangler pages deploy dist --project-name prmptbase --branch staging` — deploy to CF Pages (Git builds are broken, use Wrangler)
