# Hall of Giants Voting App — Tech Plan

## Context

A new, standalone mobile-first voting web app for a "Future Entrepreneur of America" museum concept. Visitors scan a **QR code** and land on the app, where they vote for **cities** and **people** to be featured in the museum. Video content may accompany candidates. No user accounts or logins — voters enter their **email** to cast a vote (one vote per email per category). An **opt-in checkbox** lets voters join a mailing list. Expected scale: **1K–50K voters**.

This is a **greenfield project** — no existing codebase.

---

## Recommended Tech Stack

### Frontend

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | React-based, server-side rendering for fast QR landings, API routes built-in (no separate backend), great mobile perf |
| **Language** | TypeScript | Type safety, better DX, industry standard |
| **Styling** | Tailwind CSS + shadcn/ui | Rapid mobile-first UI with polished, accessible components |
| **Video** | react-player | Handles YouTube, Vimeo, direct MP4 with minimal config |
| **QR Generation** | qrcode.react | Admin generates QR codes pointing to voting URLs |
| **Animations** | Framer Motion | Smooth vote confirmations and card transitions |
| **Charts (admin)** | Recharts | Lightweight charts for vote tally dashboard |
| **Forms** | React Hook Form + Zod | Lean form handling with schema validation for email input |

### Backend & Infrastructure

| Layer | Technology | Why |
|---|---|---|
| **Database + Realtime** | Supabase (PostgreSQL) | Managed Postgres with realtime subscriptions, storage, and edge functions — all-in-one; generous free tier covers medium scale |
| **API** | Next.js Route Handlers | Server-side vote logic lives in the same codebase — no separate API server |
| **Rate Limiting** | Upstash Redis | Serverless Redis for IP-based rate limiting on vote submissions |
| **File / Video Storage** | Supabase Storage | Candidate photos and video clips served via CDN |
| **Hosting** | Vercel | Zero-config Next.js deploys, global CDN, preview deploys per branch |
| **Domain** | Custom domain via Vercel | e.g. `vote.hallofgiants.org` |

---

## Data Model (PostgreSQL via Supabase)

```sql
categories (
  id            uuid PK,
  name          text NOT NULL,         -- "Cities" or "People"
  description   text,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
)

candidates (
  id            uuid PK,
  category_id   uuid FK → categories,
  name          text NOT NULL,         -- city name or person name
  description   text,
  image_url     text,
  video_url     text,                  -- nullable; storage path or YouTube/Vimeo link
  display_order integer DEFAULT 0,
  is_active     boolean DEFAULT true,
  created_at    timestamptz DEFAULT now()
)

votes (
  id              uuid PK,
  candidate_id    uuid FK → candidates,
  voter_email     text NOT NULL,
  ip_hash         text,                -- hashed IP for rate-limit ref (not raw)
  email_opt_in    boolean DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(candidate_id, voter_email)    -- one vote per email per candidate
)

qr_codes (
  id            uuid PK,
  label         text,                  -- "Lobby Poster", "Event Flyer"
  target_url    text NOT NULL,
  scan_count    integer DEFAULT 0,
  created_at    timestamptz DEFAULT now()
)
```

---

## User Flow

1. **Scan QR** → lands on `/` or `/vote/[categoryId]`
2. **Browse candidates** — photo/video cards with name and short bio
3. **Tap a candidate** → detail view with full bio, embedded video, vote form
4. **Enter email** + optional **"Join our mailing list"** checkbox → submit
5. **Server validates**: email format, unique constraint, IP rate limit
6. **Success** → animated "Thanks for voting!" screen
7. **Duplicate email** → friendly "You already voted in this category!" message

---

## Key Pages

| Route | Description |
|---|---|
| `/` | Branded landing page with category selection |
| `/vote/[categoryId]` | Scrollable grid of candidate cards |
| `/vote/[categoryId]/[candidateId]` | Detail view with video, bio, email + vote form |
| `/thanks` | Animated confirmation + share prompt |
| `/results` | Public live leaderboard (admin-toggleable) |
| `/admin` | Protected dashboard — candidate CRUD, tallies, QR generator |

---

## Video Integration

- Short clips (30–90 sec) in Supabase Storage or linked from YouTube/Vimeo
- Embedded via `react-player` on candidate detail cards
- Autoplay muted on mobile, tap-to-unmute
- Admin uploads via dashboard or pastes external URL

---

## Anti-Spam / Vote Integrity

| Technique | Detail |
|---|---|
| **One vote per email per candidate** | DB unique constraint — hard enforcement |
| **IP rate limiting** | Upstash Redis — max N votes per IP per hour |
| **Honeypot field** | Hidden form field catches bots |
| **Server-side email validation** | Format check + reject obviously fake patterns |

---

## Real-Time Results

- Supabase Realtime subscriptions on `votes` table
- Admin dashboard auto-refreshes tallies
- Optional public `/results` leaderboard with live counts

---

## Full Technology Summary

| Category | Technology |
|---|---|
| Language | TypeScript |
| Framework | Next.js 14 (App Router) |
| UI | Tailwind CSS, shadcn/ui |
| Forms | React Hook Form, Zod |
| Video | react-player |
| QR Codes | qrcode.react |
| Animation | Framer Motion |
| Charts | Recharts |
| Database | PostgreSQL (Supabase) |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage |
| Rate Limiting | Upstash Redis |
| Hosting | Vercel |

---

## Why This Stack

1. **No backend to build** — Next.js API routes + Supabase handle everything
2. **Mobile-first** — Tailwind + shadcn responsive by default; QR → web feels native
3. **Minimal friction** — email only, no accounts, no passwords
4. **Email list built-in** — opt-in checkbox on vote form; easy CSV export later
5. **Scales to 50K+** — Supabase Postgres + Vercel CDN handle this comfortably
6. **Cost-effective** — free tiers cover development and moderate traffic
7. **Fast to build** — one codebase, one deploy target, off-the-shelf components

---

## Implementation Phases

| Phase | Scope |
|---|---|
| **Phase 1 — Core Voting** | Next.js project setup, Supabase schema, candidate cards, email vote form, unique-vote enforcement, QR landing |
| **Phase 2 — Admin Dashboard** | Auth-protected admin, candidate CRUD, vote tallies, QR code generator |
| **Phase 3 — Video & Polish** | Video embeds, animations, mobile UX refinement, email list export |
| **Phase 4 — Real-Time & Analytics** | Live leaderboard, QR scan tracking, vote analytics charts |
