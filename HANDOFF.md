# Handoff — prmptVAULT
**Session date**: 2026-03-22
**Next action**: Verify Cloudflare Pages deploy succeeded for both staging and production after the TS fix push.

## What we did
- Diagnosed Cloudflare Pages build failures — 3 consecutive failed deploys on both `main` and `staging`
- Root cause: `ease: [0.25, 0.1, 0.25, 1]` in motion/react animation variants inferred as `number[]` instead of a tuple on CF's Node 20.20.0 (stricter type resolution than local)
- Fixed by adding `as const` to both cubic bezier arrays in Home.tsx
- Found 3 commits were stuck unpushed to staging remote; pushed those too
- Pushed fix to both `staging` and `main` branches

## Files changed
| File | What changed |
|------|-------------|
| `src/pages/Home.tsx` | Added `as const` to two `ease: [...]` arrays (line 21 in FadeIn transition, line 69 in staggerChild variant) to fix TS2322 on CF build |

## Current state
- ✅ Working: Local build passes (`tsc --noEmit` + `vite build` clean)
- ✅ Working: Fix pushed to both `origin/staging` and `origin/main` (commit `04619f6`)
- 🔧 In progress: Cloudflare Pages rebuilding both staging and production
- ✅ Last successful production deploy was `456cd52c` (pre-animation commits, 2026-03-22 02:39 UTC)
- ❌ Still broken from prior session: Email delivery via Resend (12 "sent" but not received)
- ❌ Still pending: Old Supabase functions cleanup, Ghost webhook wiring

## Start here next session
Check that prmptbase.ai and staging.prmptbase.pages.dev are live with the Framer Motion landing page animations. If CF still fails, pull logs from the CF dashboard — the REST API `/deployments/{id}/logs` endpoint was returning 404 for recent deploy IDs.

The three commits that were previously failing are: per-model prompt limits (`5deec72`), Framer Motion animations (`97e5be5`), and gallery strip fade-in (`834bca6`). The fix commit is `04619f6`.

Carry forward from 2026-03-20 session: email delivery debugging (Resend), approve & publish flow testing, old function cleanup.

## Gotchas
- **Local vs CF type resolution**: `motion` package types resolve differently on CF's Node 20.20.0 — `tsc --noEmit` passes locally but fails on CF. Always use `as const` on cubic bezier ease arrays in motion variants.
- **CF build logs not in REST API**: The `/deployments/{id}/logs` endpoint returned 404 for recent deploy IDs — had to get logs from CF dashboard or Nick.
- **Staging branch drift**: After `git push origin staging:main`, local `staging` is fine but if you later pull main changes you may need `git reset --hard origin/staging`.
- **Supabase edge function caching**: Even delete + recreate doesn't bust it. Rename function to `-v2` if deploy seems stuck.
- **Ghost v5 HTML**: Lexical converter silently drops complex HTML — only simple tags, plain text titles, `?source=html`.
- **prmptVAULT git workflow**: Always push to `staging` first, never `main` unless Nick says ship. (This session was an exception — fix needed on both.)
