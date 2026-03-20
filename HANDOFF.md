# Handoff — prmptVAULT
**Session date**: 2026-03-20
**Next action**: Debug why Resend emails aren't being received — 12 were "sent" but Nick didn't get one. Then wire up the Approve & Publish flow end-to-end.

## What we did
- Fixed Ghost blog auto-generation (edge function caching was serving stale code)
- Renamed cached functions to bust Supabase edge function cache (generate-blog-post-v2, admin-update-model-v2)
- Rebuilt the entire blog pipeline as a new architecture: single `publish-blog` function with draft → Telegram alert → approve → publish + email flow
- Created `model-admin` function (stripped of blog logic, just handles set_live/mark_tested/set_coming_soon)
- Added Blog Publisher view to admin panel with batch model support
- Created `blog_drafts` Supabase table for tracking pending drafts
- Fixed FLUX.2 Pro and FLUX.2 Max — missing templates, missing Replicate config, missing REPLICATE_SLUGS routing
- Fixed Ghost theme: reduced body top padding, video support in non-featured cards, image sizing (max-width + height auto)
- Updated "The Vault is Open" blog post first line from `<p>` to `<h2>` with blue accent
- Set feature image on "Introducing Flux.2 PRO and MAX" post
- Triggered email blast via `notify-blog-subscribers` — reported 12 sent but Nick didn't receive

## Files changed
| File | What changed |
|------|-------------|
| `supabase/functions/publish-blog/index.ts` | **NEW** — Full blog pipeline: draft (OpenAI + Ghost draft + Telegram alert) and approve (publish Ghost + Resend emails). Ghost key hardcoded. Plain text titles, simple HTML only, first image auto-set as feature_image |
| `supabase/functions/model-admin/index.ts` | **REWRITTEN** — Stripped all blog/Ghost logic. Now just handles model status changes (set_live, mark_tested, set_coming_soon) |
| `supabase/functions/generate-blog-post-v2/index.ts` | **NEW** — Renamed copy to bust cache (fn_version 4). Superseded by publish-blog |
| `supabase/functions/admin-update-model-v2/index.ts` | **NEW** — Renamed copy to bust cache (v: 3). Superseded by model-admin |
| `supabase/functions/generate-replicate/index.ts` | Added `flux2-max` model config (`black-forest-labs/flux-2-max`, $0.08) |
| `src/pages/Admin.tsx` | Added Blog Publisher view (form + pending drafts + approve), nav icon, calls `model-admin` and `publish-blog` functions |
| `src/pages/Dashboard.tsx` | Added `flux2-max` to `REPLICATE_SLUGS` routing set |
| `supabase/migrations/20260320100001_blog_drafts.sql` | **NEW** — `blog_drafts` table (id, title, excerpt, preview_url, model_names, created_at) |
| `ghost-theme/assets/css/screen.css` | Reduced post-content-wrap padding (40→16px), inner padding (40→32px), first h2 zero top margin, image max-width+height:auto+object-fit:contain, video support in post-card |
| `ghost-theme/index.hbs` | Added video/mp4 detection for non-featured post cards (matching featured card logic) |

## Current state
- ✅ Working: Blog Publisher form in admin panel (generates Ghost drafts with OpenAI)
- ✅ Working: Ghost API auth (claude-automation key hardcoded in publish-blog)
- ✅ Working: Ghost theme — reduced padding, video cards, image sizing
- ✅ Working: FLUX.2 Pro templates (txt2img + img2img) and generation routing
- ✅ Working: FLUX.2 Max template (txt2img) and Replicate routing
- ✅ Working: model-admin function (set_live/mark_tested/set_coming_soon without blog trigger)
- ✅ Working: Feature image auto-set from first model image in draft
- ✅ Working: Telegram alert on draft creation (sends preview + Ghost editor links)
- 🔧 In progress: Approve & Publish flow (function exists, not tested end-to-end yet)
- ❌ Broken: Email delivery — `notify-blog-subscribers` reported 12 sent but Nick didn't receive. Could be Resend domain verification, spam filtering, or the `noreply@prmptvault.ai` sender not being verified
- ❌ Not wired: Ghost webhook to auto-trigger emails on publish (no webhooks configured in Ghost)
- ❌ Cleanup needed: Old functions still deployed on Supabase (generate-blog-post, generate-blog-post-v2, admin-update-model, admin-update-model-v2) — can be deleted

## Start here next session
The email system needs debugging. `notify-blog-subscribers` returned `{"ok": true, "sent": 12}` but Nick didn't receive an email. Check Resend dashboard (api key is in Supabase secrets as `RESEND_API_KEY`) for delivery status and bounce info. The sender is `noreply@prmptvault.ai` — verify domain/sender is configured in Resend. Also check spam folders.

After email is fixed, test the full Approve & Publish flow end-to-end: Blog Publisher form → Generate Draft → review in Ghost → Approve & Publish button → confirm Ghost post publishes + emails send. Then wire up a Ghost webhook so publishing directly in Ghost also triggers emails (or decide if the admin panel flow is the only path).

Old functions to clean up: `generate-blog-post`, `generate-blog-post-v2`, `admin-update-model`, `admin-update-model-v2` can all be deleted from Supabase dashboard. The active functions are `model-admin` and `publish-blog`.

Nick also mentioned connecting the full flow "next week" — the Telegram approve link in the draft alert currently passes a URL with the user token as a query param, which is not ideal for security. Consider replacing with a short-lived approval token stored in `blog_drafts`.

## Gotchas
- Supabase edge function deploys cache aggressively — even delete + recreate didn't bust it. Renaming the function is the only reliable fix. If a deploy seems stuck, rename to `-v2`.
- Supabase `SUPABASE_SERVICE_ROLE_KEY` env var inside edge functions may now contain the new `sb_secret_*` format key which doesn't work for function-to-function auth. The legacy JWT format (starts with `eyJ...`) is required. We bypassed this entirely by inlining everything into one function.
- Ghost v5 HTML-to-Lexical conversion silently drops content when HTML contains `<div>`, `<figure>`, `<figcaption>`, or tags with class attributes. Only use: `<p>`, `<h2>`, `<h3>`, `<strong>`, `<em>`, `<ul>`, `<li>`, `<img>`, `<a>`. Use `?source=html` query param on the Ghost API.
- Ghost does NOT render HTML in post titles — titles must be plain text only.
- The `ghost-theme` directory must be the cwd when zipping, otherwise paths are wrong. Deploy theme: `cd ghost-theme && zip -r /tmp/prmptVAULT-theme.zip . -x '*.DS_Store'` then upload + activate via Ghost Admin API.
- CF Pages staging deploys auto-trigger from git push to staging branch.
- prmptVAULT git workflow: always push to `staging` first, never `main` unless Nick says ship.
- FLUX.2 Pro and Max were missing templates in the DB — any new model needs templates inserted or the UI shows an infinite spinner.
