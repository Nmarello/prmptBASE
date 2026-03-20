# Handoff — prmptVAULT
**Session date**: 2026-03-20
**Next action**: Fix the Ghost Admin API JWT auth in `generate-blog-post` edge function — the function deploys aren't taking effect despite delete/recreate.

## What we did
- Built `/gallery` page with auto-scrolling columns, hover effects, lightbox with prompt/model/params
- Updated landing page: "One studio." text to blue (#3d7fff), mockup logo always dark theme, filmstrip clicks → /gallery
- Updated landing page: "creative vault?" CTA text to blue (#3d7fff)
- Created 2 Supabase migrations: showcase_assets delete trigger + metadata/model_name expansion
- Attempted to fix Ghost blog auto-generation on model "Make Live" — Ghost JWT auth is failing

## Files changed
| File | What changed |
|------|-------------|
| `src/App.tsx` | Added Gallery route + import |
| `src/pages/Gallery.tsx` | **NEW** — Full gallery page: CSS keyframe auto-scroll columns, fixed-width responsive columns (min 2), hover float overlay via fixed positioning, lightbox with prompt/model/params/seed/source image, Supabase image transforms for thumbnails, theme-aware |
| `src/pages/Home.tsx` | "One studio." → blue, "creative vault?" → blue, mockup Logo always dark theme, Gallery nav link → /gallery, filmstrip items click → /gallery |
| `supabase/migrations/20260320000001_showcase_delete_sync.sql` | **NEW** — Delete trigger for showcase_assets + stale entry cleanup |
| `supabase/migrations/20260320000002_showcase_expand_metadata.sql` | **NEW** — Added metadata, model_name, width, height columns + updated sync trigger + backfill |
| `supabase/functions/generate-blog-post/index.ts` | Rewrote JWT to use byte-level base64url, added debug fields (fn_version, debug_key_id, debug_key_len), better Ghost error capture |
| `supabase/functions/admin-update-model/index.ts` | Added blog_status, v:2 debug fields, cache-busting timestamp on internal function call, better error capture |

## Current state
- ✅ Working: Gallery page (scrolling, hover float, lightbox, thumbnails, theme, responsive columns)
- ✅ Working: Landing page updates (blue text, dark mockup logo, filmstrip → gallery link)
- ✅ Working: Supabase migrations deployed (delete trigger, metadata sync, backfill)
- ✅ Working: Staging deployed to CF Pages (commit `7401f39`, deploy at `3dc5a133.prmptbase.pages.dev`)
- ❌ Broken: `generate-blog-post` edge function — Ghost returns 401 "Invalid Token or Protected Header formatting"
- ❌ Broken: Function deploys appear cached — despite delete/recreate, the response still shows old format (no `fn_version: 3` or `debug_key_id`). The `admin-update-model` function DOES update (shows `v: 2`), but `generate-blog-post` does not.
- 🔧 Not started: Blog batching + Telegram approval flow (push multiple models live → single blog → Telegram preview → approve → publish + email)

## Start here next session
The Ghost blog auto-generation is broken. The `generate-blog-post` Supabase edge function is stuck serving a cached version despite being deleted and recreated. The `admin-update-model` function (which calls it) IS updating — it shows `"v": 2` in responses. But `generate-blog-post` keeps returning the old format without debug fields.

The Ghost Admin API key was re-set by Nick via `supabase secrets set`. The key format is correct (24-char hex ID : 64-char hex secret). The JWT generation code looks correct per Ghost docs. The error "Invalid Token or Protected Header formatting" could mean: (1) the key is actually wrong/expired in Ghost, (2) the JWT encoding has a subtle bug, or (3) the old function code with the broken key is still cached.

**First steps:**
1. Check Supabase dashboard → Functions → generate-blog-post → Logs to see if invocations show up and which version is running
2. If still cached: try deploying with a renamed function (e.g., `generate-blog-post-v2`) and update the URL in `admin-update-model`
3. If code IS running new version: verify Ghost key in Ghost Admin → Settings → Integrations
4. Once Ghost auth works: build the batching + Telegram approval flow Nick wants

**Key files:**
- `supabase/functions/generate-blog-post/index.ts` — Ghost JWT + blog generation
- `supabase/functions/admin-update-model/index.ts` — calls generate-blog-post on "Make Live"
- `supabase/functions/notify-blog-subscribers/index.ts` — Ghost webhook → email users (untouched)

## Gotchas
- Supabase edge function deploys cache aggressively — even delete + recreate didn't bust it for `generate-blog-post`. The `admin-update-model` function updates fine. May need to rename the function.
- CF Pages staging deploys stopped auto-triggering from git push — had to manually trigger via CF API (`POST /pages/projects/prmptbase/deployments` with `-F "branch=staging"`). GitHub webhook may be stale.
- The `protect-secrets` and `block-dangerous-commands` hooks block reading .env files and curl-posting secrets. Nick must run secret-related commands himself in terminal.
- prmptVAULT git workflow: always push to `staging` first, never `main` unless Nick says ship.
- Nick set FLUX.2 Pro and FLUX.2 Max back to Coming Soon — don't push those live.
- FLUX Kontext Max was pushed live during testing — Nick may want to revert.
- Ghost v5 uses Lexical format — `html` field is read-only for existing posts. See previous handoff gotchas.
