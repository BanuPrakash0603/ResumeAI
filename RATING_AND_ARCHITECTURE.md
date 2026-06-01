# ResumeAI — Current Rating & 10/10 Architecture Plan

## Current Ratings

### Frontend: 5.5 / 10
**What's good:**
- Clean dark aesthetic with Playfair Display + DM Sans — solid font pairing
- Mouse-parallax hero glow is a nice touch
- Intersection Observer animations work
- Exit-intent popup, referral system, score card canvas — good growth features
- Testimonial slider auto-rotates

**What's missing / weak:**
- No real motion library (Framer Motion / CSS keyframe transitions are too basic)
- Zero page transitions — navigating feels abrupt
- No actual PDF upload / file drag-drop (the "analyze" button just shows email modal)
- ATS score widget shows static hardcoded values — not interactive
- No resume upload → analysis flow (the core product promise is missing)
- Pricing page has no connection to backend checkout (href="#checkout" goes nowhere)
- No loading/skeleton states
- Mobile nav missing entirely (hamburger menu not implemented)
- Fonts loaded without `font-display: swap` — causes layout shift

---

### Backend: 4 / 10
**What's good:**
- Stripe checkout session creation works
- Webhook handler structure is correct
- Email capture to JSON file
- Referral click tracking
- CORS configured

**What's missing / critical issues:**
- `leads.json` and `referrals.json` are local files → **data is lost on every EC2 restart / redeploy**
- No SQLite/PostgreSQL — zero persistence
- No `/analyze` endpoint — the core resume analysis API doesn't exist at all
- No JWT auth — no user sessions, no login, no "my account"
- No rate limiting → anyone can spam the API
- No input validation (email capture accepts anything)
- Stripe webhook doesn't persist subscription status anywhere
- No `/success` page handler
- `API_URL` hardcoded to `http://3.215.79.96` in App.js — breaks on any new deployment
- No `.env` file — secrets baked into code
- No requirements.txt

---

## 10/10 Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│  Landing · Pricing · Upload/Analyze · Dashboard · Blog   │
│  Framer Motion · Recharts · React-Dropzone · react-pdf  │
└───────────────────┬─────────────────────────────────────┘
                    │ HTTPS + JWT
┌───────────────────▼─────────────────────────────────────┐
│               Flask REST API  (backend)                  │
│  /analyze  /auth  /checkout  /webhook  /dashboard        │
│  Rate-limited · JWT Auth · Input validation              │
└──┬──────────────┬───────────────┬────────────────────────┘
   │              │               │
   ▼              ▼               ▼
SQLite DB     OpenAI API      Stripe API
(users,       (GPT-4o for     (subscriptions,
 scans,        NLP analysis)   webhooks)
 leads)
```

## New Features Added (v2)

1. **Real PDF/DOCX Upload** — drag-drop with progress animation
2. **AI Analysis Engine** — calls OpenAI GPT-4o-mini for real ATS scoring
3. **Animated Results Dashboard** — score ring, keyword heatmap, improvement cards
4. **JWT Auth** — email/password signup + login, session persistence
5. **User Dashboard** — scan history, improvement over time chart
6. **SQLite persistence** — users, scans, leads, referrals all survive reboots
7. **Rate limiting** — 5 req/min for free, 60 req/min for pro
8. **Mobile-first nav** — hamburger menu, responsive grid
9. **Framer Motion** — page transitions, staggered reveals, micro-interactions
10. **Blog section** — SEO-friendly static content pages
11. **Real /success page** — shows subscription confirmation
12. **`.env` based config** — no hardcoded secrets
