# PRD — Deepak Padliya ❤ Shruti Minda Wedding Website (10–12 December 2026)

## Original Problem Statement
Build a complete, production-ready, premium Indian wedding website for Deepak Padliya and Shruti Minda — an animated, responsive digital royal invitation with a secure RSVP system, admin dashboard and MongoDB. Exact wedding facts: groom Deepak Padliya (parents Kailash Ji Padliya & Naiyan Bala Padliya), bride Shruti Minda (parents Ajit Minda & Vandna Minda), wedding Saturday 12 December 2026, main venue Lal Bagh, Pratapgarh, Rajasthan. Tagline "Two Souls, One Beautiful Journey". Contacts 8742005204 / 9828844627 ("Wedding Enquiries & Assistance", call + WhatsApp via wa.me/91…). Eight events across three days (all times IST): D1 Shanti Vidhan & Pujan 07:30 AM @ Bhaiji Ka Mandir, Gacha Gali; Mehendi 01:00 PM @ Lal Bagh. D2 Dev Darshan 08:30 AM @ At Residence; Vanak/Haldi 12:15 PM, Mamera 03:00 PM, DJ Night 07:00 PM @ Lal Bagh. D3 Var Nikasi 09:00 AM @ At Residence; Shubh Lagna 12:30 PM @ Lal Bagh; Reception 05:00 PM @ Lal Bagh (venue defaulted to main venue per user request 2026-11-08). Royal palette (ivory #FFF9F0, gold #D6B36A, maroon #641E2B, sage #A5AA8A, beige #EDE0CE, brown #392C26); fonts Cormorant Garamond / Playfair Display / Lora / Inter / Great Vibes. Original illustrated (non-photorealistic) bride & groom characters reused across 8 event scenes. RSVP stores to MongoDB with validation, duplicate strategy and rate limiting; protected /admin with JWT auth, stats, guest management, CSV export. User chose (ask_human): Emergent managed stack (React + FastAPI + MongoDB, not the Docker monorepo), flat-vector + Rajasthani miniature illustration style, externally-hosted royalty-free music toggle, and duplicates REJECTED with the existing response displayed.

## Architecture (as built)
- Frontend: React 19 (CRA/craco) + Tailwind + Framer Motion + Lenis smooth scroll + react-router-dom v7; central config at src/config/weddingDetails.js; components in src/components; pages Home + Admin(→AdminLogin/AdminDashboard).
- Backend: FastAPI (server.py) — /api/health, /api/v1/events, /api/v1/rsvp, /api/v1/admin/{login,refresh,logout,me,dashboard,guests,guests/:id,guests/export}; bcrypt + PyJWT httpOnly SameSite=None cookies; in-memory rate limiting; login lockout (login_attempts TTL); security headers; CORS locked to preview origin.
- Database: MongoDB (motor), collections wedding_guests (unique mobileNumber index, createdAt desc), admin_users (unique email), login_attempts (TTL). Admin seeded once at startup from env.
- Illustrations: 11 original generated assets (bride, groom, couple, 8 event scenes) in frontend/public/images.

## Implemented (2026-11-08)
- Hero with animated golden arch (stroke-draw), hanging garland sway, falling petals, masked line-by-line name reveal, tagline, date/location pills, countdown to 2026-12-12T12:30 IST with flip animation and wedding-day end state, Explore/View Invitation CTAs, parallax mandalas.
- Slow editorial marquee; Our Story with couple cards, parents, placeholder timeline (no invented memories); Events with 8 day-grouped cards + detail modals + directions only for named venues; Digital Invitation (exact wording, WhatsApp share, print CSS); Gallery masonry + lightbox; Venue & Travel with placeholder guidance; RSVP form (client+server validation, Indian/international mobile, chips, duplicate 409 card, success card); Contact with call/WhatsApp; Footer with "Made with love for our special day."; music toggle (off by default, external royalty-free track).
- Admin dashboard: login, 6 stat cards, event-wise attendance bars, latest RSVPs, guest table (search debounce, status filter, pagination), edit modal, delete confirm, CSV export.
- SEO: title/description/OG/Twitter/favicon (D♥S monogram SVG), JSON-LD Event schema, semantic HTML, lazy images, reduced-motion support, data-testids throughout.

## Verified
- curl suite: health, events(8), RSVP 201, duplicate 409 w/ existing, invalid mobile 422, unauth 401, wrong login 401, dashboard stats, PATCH, CSV export, DELETE.
- Screenshots: home desktop 1440 + mobile 390 (no overflow-x), RSVP submit success toast+card, admin login→dashboard with live data.

## Backlog
- P0: —
- P1: replace Our Story / travel placeholders with real memories & travel tips (user content); real wedding photos in gallery (slots ready).
- P2: guest photo uploads; WhatsApp RSVP reminders; multi-language (Hindi) toggle; Docker Compose export if the user ever self-hosts.
