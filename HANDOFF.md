# Handoff — prmptVAULT (prmptBASE)
**Session date**: 2026-04-04
**Next action**: Test full upgrade flow with new account (Nick was mid-test when session ended) — verify Creator → Studio → Pro with new email works end-to-end.

## What we did
- Fixed "Invalid JWT" on checkout: root cause was user JWT sent directly in Authorization header; switched to anon key + `user_token` in body pattern
- Fixed `stripe-webhook` returning 401: was deployed without `--no-verify-jwt` — Supabase gateway was rejecting Stripe's requests before code ran
- Fixed upgrade creating duplicate subscriptions: webhook now calls `cancel_at_period_end` on old sub when new checkout completes
- Fixed upgrade → Newbie regression: `customer.subscription.deleted` handler now guards profile downgrade (only downgrades if deleted sub is still user's current sub)
- Fixed Studio video model quota bug: `selectedVideoIds` (video-only) now used for quota check instead of `selectedIds` (all models including image)
- Reduced checkout latency: removed `auth.getUser()` network call, decode JWT locally; removed pre-emptive Stripe customer creation

## Files changed
| File | What changed |
|------|-------------|
| `src/lib/stripe.ts` | Switched to anon key in Authorization + `user_token` in body; back to `getSession()` |
| `src/pages/Dashboard.tsx` | Added `selectedVideoIds` derived set; fixed `getModelStatus` to use it for Studio quota |
| `supabase/functions/create-checkout-session/index.ts` | Full rewrite: JWT decoded locally, user_token from body, skip pre-creating Stripe customer |
| `supabase/functions/stripe-webhook/index.ts` | Added old-sub cancellation (cancel_at_period_end); fixed deleted handler to guard profile downgrade |

## Current state
- ✅ Checkout flow: working (anon key pattern, ~3-5s vs 15s before)
- ✅ Webhook: receiving and processing (deployed with --no-verify-jwt)
- ✅ Upgrade path: cancels old sub safely, updates tier correctly
- ✅ Studio video quota: now counts video-only selections
- ⚠️ Nick's test account: cancelled all 3 test subscriptions manually — profile may be on Newbie; reset via /admin if needed
- ❌ Changes not committed to git (all local + deployed via Wrangler/Supabase CLI)

## Start here next session
Nick was testing the full upgrade flow with a new account. The billing/webhook system is now working. Verify the new-account flow end-to-end: signup → upgrade to Creator → upgrade to Studio → verify only 5 video model slots available → upgrade to Pro → verify all models open. Then commit all the changed files to git on staging.

## Gotchas
- `stripe-webhook` MUST be deployed with `--no-verify-jwt` — if redeployed without it, webhook silently fails again
- Immediate `stripe.subscriptions.cancel()` triggers `customer.subscription.deleted` which resets tier to newbie — always use `cancel_at_period_end: true`
- User JWT in Authorization header → Supabase gateway 401. Always use anon key in header + user_token in body for user-facing edge fns
- Studio video model quota: `selectedIds` includes image models (from Creator tier); must use video-only subset for the 5-slot limit
- All session changes deployed but NOT committed to git — do a `git status` at start of next session to see everything pending
