# Handoff — prmptVAULT
**Session date**: 2026-03-30
**Next action**: Address deferred security items (rate limiting, unsubscribe tokens) or move on to feature work.

## What we did
- Deployed all 34 edge functions to Supabase (security audit from 2026-03-29 session)
- Tested staging: image generation (CORS), Veo video check (ownership gate), support chat, feedback — all passing
- Moved Ghost Admin API key from hardcoded in `publish-blog` to `GHOST_ADMIN_KEY` Supabase secret
- Rotated Ghost key in `claude-automation` integration, deleted unused `automated blog` integration
- Committed and pushed to staging (`73484c2`)

## Files changed
| File | What changed |
|------|-------------|
| `supabase/functions/publish-blog/index.ts` | Hardcoded Ghost key → `Deno.env.get('GHOST_ADMIN_KEY')` |

## Current state
- ✅ Working: All 34 edge functions deployed with CORS fixes, ownership gates, stack trace removal
- ✅ Working: Ghost key rotated and reading from env var across all 3 blog functions
- ✅ Working: Staging tested — generation, Veo, support, feedback all confirmed
- 🔧 Deferred: Rate limiting on `support-chat`, `submit-feedback`, `ai-assist`, `generate-blog-post`
- 🔧 Deferred: Weak unsubscribe links in `publish-blog` (plain email → should use signed tokens)
- 🔧 Deferred: Auth token embedded in Telegram approval URLs (`publish-blog`)
- 🔧 Deferred: Service role JWT in migration `20260313000019` (in git history, repo private, rotation = nuclear)
- ❌ Not done: `is_admin` column on profiles still unverified (may be manual dashboard addition)

## Start here next session
All security audit work from 2026-03-29 is deployed and verified on staging. The remaining audit items are lower priority — rate limiting on 4 edge functions that make external API calls, signed unsubscribe tokens, and the auth token in Telegram URLs. The service role JWT in git history is a known risk but rotation would invalidate all tokens (not recommended unless leaked publicly). Main branch is 2 commits ahead of origin/main — staging is current. If Nick says ship, push main to origin.

## Gotchas
- `GHOST_ADMIN_KEY` Supabase secret is shared by 3 functions: `publish-blog`, `generate-blog-post`, `generate-blog-post-v2`
- The old Ghost `automated blog` integration was deleted — only `claude-automation` remains
- Edge function deploys are separate from CF Pages — `supabase functions deploy` is a manual step after code changes
- Main is ahead of origin/main by 2 commits (`703fae3` security audit + `73484c2` Ghost key env var)
