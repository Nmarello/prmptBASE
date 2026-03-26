# Handoff — prmptVAULT
**Session date**: 2026-03-24
**Next action**: Review PostHog dashboard at https://us.posthog.com/project/345171/dashboard/1395768 and decide what additional insights/events to add.

## What we did
- Scrubbed all prmptBASE references from codebase (package.json, schema.sql, deploy command, deleted `_poc/`)
- Fixed Apple OAuth — return URL in Apple Developer was missing `/auth/v1/` prefix for custom auth domain
- Fixed onboarding modal reappearing on new devices — moved `tos_accepted` from localStorage to profiles table
- Fixed HeroCard spacing on newbie dashboard (removed maxWidth cap)
- Removed `negative_prompt` from Imagen 4 (template + generate-google edge fn)
- Built template health check system (`validate-templates` edge fn + `template_health` table + daily cron)
- Cleaned all 16 template drift issues across 24 models — health check now reports 0 drift
- Set up PostHog personal API key and built full analytics dashboard (17 insights)

## Files changed
| File | What changed |
|------|-------------|
| `package.json` / `package-lock.json` | `prmptbase-new` → `prmptvault` |
| `supabase/schema.sql` | Comment `prmptBASE` → `prmptVAULT` |
| `.claude/commands/deploy.md` | Staging URL updated to prmptvault.pages.dev |
| `_poc/sora-poc.html` | Deleted entirely |
| `src/pages/Dashboard.tsx` | Onboarding check reads `tos_accepted` from profiles table instead of localStorage |
| `src/components/dashboard/OnboardingModal.tsx` | Writes `tos_accepted: true` to profiles, removed localStorage set |
| `src/components/dashboard/HeroCard.tsx` | Removed `maxWidth: 400` and `minWidth: 280` — cards fill grid evenly |
| `supabase/functions/generate-google/index.ts` | Removed `negative_prompt` param from Imagen 4 payload |
| `supabase/functions/validate-templates/index.ts` | **New** — daily template health check edge fn |

## Current state
- ✅ Working: All 24 model templates clean (0 drift), health check runs daily at 8am via LaunchAgent `ai.prmptvault.template-health`
- ✅ Working: Apple OAuth login, Google OAuth login, email login
- ✅ Working: PostHog dashboard with 17 insights (traffic, generation, engagement, funnel)
- ✅ Working: Onboarding persists across devices via DB
- 🔧 Pending: CF Pages project rename from `prmptbase` → `prmptvault` (Nick will do manually, then update CORS allowlists)
- 🔧 Pending: `tos_accepted` column needs to be added to profiles table (`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tos_accepted boolean NOT NULL DEFAULT false; UPDATE public.profiles SET tos_accepted = true WHERE display_name IS NOT NULL;`) — may already be done if Nick ran it during session
- ❌ Carry forward: Resend email delivery (12 "sent" but not received from 2026-03-20)
- ❌ Carry forward: Welcome email trigger may not fire on real signups (`tgenabled=O`)

## Start here next session
PostHog dashboard is at https://us.posthog.com/project/345171/dashboard/1395768 with 17 insights. Review it and decide: (1) are there events missing that should be tracked (e.g., `upgrade_clicked`, `checkout_started` are wired in code but no dashboard insight yet), (2) should we add retention/cohort analysis, (3) should we add a PostHog widget to the admin page in prmptVAULT. The template health check is live — if Telegram alerts come in about drift, use the Supabase Management API to remove stale fields (pattern: `UPDATE templates SET fields = (SELECT jsonb_agg(f) FROM jsonb_array_elements(fields) f WHERE f->>'id' != '<field>') WHERE model_id = (SELECT id FROM models WHERE slug = '<slug>')`).

## Gotchas
- **FAL has no schema API**: `/schema` endpoint doesn't exist. Health check uses Replicate OpenAPI schemas (authoritative) + manual allowlists for FAL/Google/OpenAI models.
- **Replicate env var name**: It's `REPLICATE_API_KEY` not `REPLICATE_API_TOKEN` in Supabase secrets.
- **Apple OAuth return URL**: Must be `https://auth.prmptbase.ai/auth/v1/callback` (with `/auth/v1/`), not just `/callback`. Supabase custom auth domain adds the prefix.
- **PostHog API**: Project ID is `345171`, personal API key has Read on most scopes + Write on Dashboard/Insight. Client key `phc_WEJb...` is in `src/main.tsx`.
- **prmptVAULT git workflow**: This session pushed to both main + staging. Normally push staging first, main only when Nick says ship.
- **CORS allowlists**: Still contain `prmptbase.ai` and `prmptbase.pages.dev` — intentional until CF Pages rename is done.
