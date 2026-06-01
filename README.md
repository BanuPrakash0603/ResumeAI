# ResumeAI v3.0

AI-powered resume analyzer with streaming responses, heatmap visualization, and full analytics dashboard.

## ✅ Features in v3.0

### New in this version
- **Dark/Light theme system** — Toggleable via Nav button, persists in localStorage
- **Advanced state management** — React Context + useReducer store (store/index.jsx)
- **Real-time streaming AI responses** — SSE streaming from `/analyze/stream` and `/ai/chat`
- **Resume heatmap visualization** — Section-by-section color-coded strength map
- **Historical analytics dashboard** — `/dashboard` with score trends, radar chart, scan history
- **Onboarding flow** — 4-step animated welcome wizard for first-time visitors
- **AI-native interactions** — Multi-turn chat panel ("Ask AI" tab on results)
- **Mobile-first enterprise UX** — Responsive breakpoints, touch-friendly, accessible
- **Notification system** — Toast notifications with auto-dismiss
- **SEO optimization** — Full meta tags, OG tags, Twitter card in index.html

## Project Structure

```
ResumeAI-v3/
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── ThemeContext.jsx        # Dark/light theme
│   │   ├── store/
│   │   │   └── index.jsx              # Global state (useReducer)
│   │   ├── hooks/
│   │   │   └── useStreaming.js        # SSE streaming hooks
│   │   ├── components/
│   │   │   ├── Nav.jsx                # + theme toggle, dashboard link
│   │   │   ├── ScoreRing.jsx
│   │   │   ├── NotificationCenter.jsx # Toast notifications
│   │   │   ├── heatmap/
│   │   │   │   └── ResumeHeatmap.jsx  # Section heatmap
│   │   │   ├── onboarding/
│   │   │   │   └── OnboardingFlow.jsx # 4-step wizard
│   │   │   ├── streaming/
│   │   │   │   └── StreamingDisplay.jsx # SSE display + AI chat
│   │   │   └── dashboard/
│   │   │       └── AnalyticsDashboard.jsx # Charts + history
│   │   ├── pages/
│   │   │   ├── Analyze.jsx            # + heatmap, streaming, AI chat tabs
│   │   │   ├── Dashboard.jsx          # NEW: analytics dashboard page
│   │   │   ├── Landing.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Pricing.jsx
│   │   │   └── Success.jsx
│   │   ├── App.jsx                    # + Dashboard route, providers
│   │   └── index.css                  # Dark + light theme variables
│   └── index.html                     # SEO meta tags
└── backend/
    ├── app.py                         # + /analyze/stream, /ai/chat SSE endpoints
    ├── analyzer.py
    └── database.py
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Add OPENAI_API_KEY to .env for AI features
python app.py
```

## Environment Variables
```
OPENAI_API_KEY=sk-...    # Required for streaming AI features
SECRET_KEY=...           # JWT secret
STRIPE_SECRET_KEY=...    # For payments
FRONTEND_URL=http://localhost:5173
```
