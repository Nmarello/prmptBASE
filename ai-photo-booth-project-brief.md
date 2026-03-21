# AI Photo Booth — Project Brief for Ava Dashboard

> Feed this file to Claude Code terminal to create a new project in the Ava dashboard.

## Project Name
AI Photo Booth

## Client
New client — AI-powered photo booth for live events

## Project Description
A standalone web application for AI-powered photo booths at live events. Attendees take a photo at a kiosk or via their phone (QR code), the system removes their background, optionally puts a virtual jersey/shirt on them using client-supplied reference images, composites them onto a branded background, and delivers the final image via on-site printing, email, or social media sharing.

**Vendor references**: MISGIF (makemisgif.com), Noonah (noonah.com), Sharingbox (sharingbox.com)

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database/Auth/Storage**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **AI Inference**: Replicate API (background removal, virtual try-on)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Printing**: PrintNode API (cloud printing to on-site printer)
- **Email**: Resend (transactional photo delivery)
- **Image Processing**: Sharp (server-side compositing)
- **Deployment**: Vercel

## Core Features
1. **Photo Capture** — WebRTC camera on kiosk tablet or mobile phone via QR
2. **Background Replacement** — AI removes background (Replicate), composites subject onto client-supplied backgrounds (Sharp)
3. **Virtual Try-On** — AI puts jerseys/shirts on subject using client-supplied garment reference images
4. **On-Site Printing** — Cloud print via PrintNode to on-site photo printer
5. **Email Delivery** — Branded photo email via Resend
6. **Social Sharing** — Share pages with OG tags, Web Share API, QR codes, gallery microsite
7. **Admin Panel** — Event config, background/jersey upload, branding, print settings
8. **Kiosk Mode** — PWA fullscreen, wake lock, auto-reset, idle screen

## AI Pipeline
```
Capture → Remove BG (Replicate) → Virtual Try-On (optional) → Composite onto BG (Sharp) → Final Image
```

### Replicate Models
- **Background Removal**: `lucataco/remove-bg` (~2s, fast) or `bria/remove-background` (commercial-safe)
- **Virtual Try-On**: Provider interface — `cuuupid/idm-vton` for dev (NON-COMMERCIAL), FASHN API for production (commercial)
- **Optional Premium Composite**: `black-forest-labs/flux-kontext-pro` for lighting-matched backgrounds

### IMPORTANT: Virtual Try-On Licensing
`cuuupid/idm-vton` on Replicate has a NON-COMMERCIAL license (ECCV 2024 academic). For production/paid use:
- **FASHN API** (fashn.ai) — Commercial virtual try-on, pay-per-call (recommended)
- **Google Vertex AI Virtual Try-On** — Commercial, requires GCP
- Architecture uses a `TryOnProvider` interface so backends are swappable

### Timing
| Step | Duration |
|------|----------|
| Background removal | 2-3s |
| Virtual try-on (if selected) | 5-8s |
| Composite (Sharp) | 0.2s |
| **Total without try-on** | **3-5s** |
| **Total with try-on** | **8-13s** |

## Database Tables
- **organizations** — Multi-tenant client/operator accounts
- **events** — Event config (name, dates, branding, feature toggles, kiosk settings, print layout)
- **event_assets** — Backgrounds, jerseys, overlays uploaded by operator
- **sessions** — One per booth visitor (anonymous, no auth)
- **photos** — Pipeline stages (original → no_bg → tryon → final), status, share token
- **print_jobs** — PrintNode job tracking
- **activity_log** — Analytics

## Booth UX Flow
```
IDLE (attract screen + QR) → READY (camera) → COUNTDOWN (3-2-1) → CAPTURE → PREVIEW (retake/confirm) → CUSTOMIZE (pick BG + jersey) → PROCESSING (AI pipeline) → RESULT (print/email/share) → IDLE
```

## Sharing System
- QR code on kiosk screen → user scans with phone
- Web Share API (navigator.share) for native mobile sharing
- Email with branded HTML template
- SSR share pages with OpenGraph meta tags
- Public gallery microsite per event
- Direct download button

## Print Integration
- PrintNode cloud API → on-site printer via their client software
- Print layouts: Single (4x6), Strip (2x6), Grid (4x6 2x2)
- Sharp composes layout server-side, converts to PDF

## Implementation Phases

### Phase 1: Scaffold
- Next.js 15 project setup
- Supabase project + database migration
- Environment config
- PWA manifest

### Phase 2: Camera Capture
- WebRTC camera component (front-facing, 1920x1080)
- Countdown timer overlay
- Photo preview with retake/confirm
- Upload to Supabase storage

### Phase 3: Background Removal
- Replicate API integration
- `lucataco/remove-bg` or `bria/remove-background`
- Pipeline step 1: capture → remove BG → store result

### Phase 4: Composite Engine
- Sharp-based compositing (subject onto background)
- Watermark overlay support
- Multiple output sizes

### Phase 5: Admin Panel
- Supabase Auth for operators
- Event CRUD (create, edit, activate/pause/archive)
- Background upload/management (drag-drop, reorder)
- Jersey/garment upload with guidance (flat-lay, front view)
- Branding config (logo, colors, watermark position/opacity)
- Print settings (PrintNode printer ID, layout selection)

### Phase 6: Kiosk Mode
- PWA fullscreen + wake lock
- Auto-reset to idle screen after timeout
- Disable right-click, trap navigation
- Error recovery (tap to restart)
- QR code on idle screen for mobile overflow

### Phase 7: Email Delivery
- Resend integration
- Branded HTML email template
- Photo + share link + download link

### Phase 8: Sharing
- Share pages with OG meta tags (SSR)
- QR code generation (qrcode npm package)
- Web Share API with clipboard fallback
- Gallery microsite per event

### Phase 9: Print Integration
- PrintNode API wrapper
- Print layout composition (Sharp → PDF)
- Print job tracking

### Phase 10: Virtual Try-On
- TryOnProvider interface
- IDM-VTON implementation (dev/demo)
- FASHN API implementation (production)
- Jersey upload guidance in admin panel

### Phase 11: Mobile Flow
- QR-based entry point
- Same camera/flow components, mobile-optimized
- Share-only (no print button)

### Phase 12: Polish
- Error handling + loading states
- Analytics (activity_log)
- Performance optimization (model pre-warming)
- Testing on iPad Safari, Chrome Android, Chrome Desktop

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REPLICATE_API_TOKEN=
TRYON_PROVIDER=fashn
FASHN_API_KEY=
PRINTNODE_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=photos@yourdomain.com
NEXT_PUBLIC_BASE_URL=https://booth.yourdomain.com
```

## Key Architecture Decisions
1. **Next.js over Vite** — SSR for share pages, API routes for server-side AI calls, PWA support
2. **Sharp over AI for compositing** — Saves 3-5s per photo, costs nothing
3. **Supabase Realtime over polling** — Instant status updates during processing
4. **Provider interface for try-on** — Swap FASHN/IDM-VTON via config, not code changes
5. **No auth for booth users** — Anonymous sessions, friction-free UX. Only admins authenticate
6. **Virtual try-on last in implementation** — Core product works without it, licensing needs resolution first
