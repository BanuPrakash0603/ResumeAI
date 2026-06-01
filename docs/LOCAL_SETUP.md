# ResumeAI v2 — Local Setup Guide

## Prerequisites
- Python 3.11+
- Node.js 20+
- pip

---

## 1. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
# Edit .env — at minimum set a SECRET_KEY
# Add OPENAI_API_KEY for real AI analysis (optional, heuristic fallback works without it)
# Add STRIPE_SECRET_KEY for payments (optional for local dev)

# Run the backend
python app.py
# API runs at http://localhost:5000
# Swagger-style health check: http://localhost:5000/health
```

The SQLite database (`resumeai.db`) is auto-created in `backend/` on first run.

---

## 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env
echo "VITE_API_URL=http://localhost:5000" > .env

# Run dev server
npm run dev
# Opens at http://localhost:5173
```

---

## 3. Test the Full Flow

1. Open http://localhost:5173
2. Go to `/analyze`, drag-drop a resume PDF
3. See scores, keywords, suggestions
4. Register an account at `/login` to save scan history
5. Visit `/pricing` to test Stripe checkout (needs `STRIPE_SECRET_KEY`)

---

## Manual Changes You Can Make

### Change brand colors
Edit `frontend/src/index.css` → `:root` block:
```css
--gold: #e2a840;   /* change to any accent color */
--ink:  #0c0c0e;   /* change dark background */
```

### Change pricing
Edit `backend/app.py` → `PLANS` dict:
```python
PLANS = {
    "pro_monthly": {"amount": 900, ...},  # 900 = $9.00 in cents
}
```
Then mirror the prices in `frontend/src/pages/Pricing.jsx` → `PLANS` array.

### Change AI model
Edit `backend/analyzer.py` → `analyze_with_ai()`:
```python
model="gpt-4o-mini"   # change to gpt-4o for better (pricier) analysis
```

### Add/remove features on pricing page
Edit `frontend/src/pages/Pricing.jsx` → the `PLANS` array `features` list.

### Change testimonials / stats
Edit `frontend/src/pages/Landing.jsx` → `STATS` and `TESTIMONIALS` constants at the top.

### Disable exit popup
In `Landing.jsx`, remove the `ExitPopup` component and its state from `Landing()`.

### Change fraud rate limit
Edit `backend/app.py`:
```python
@limiter.limit("5 per minute")   # change to "20 per minute" for testing
def analyze():
```

### Change max file size
Edit `backend/app.py`:
```python
MAX_FILE_SIZE = 5 * 1024 * 1024   # 5MB → change to 10 * 1024 * 1024 for 10MB
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Random string for JWT signing |
| `FRONTEND_URL` | Yes | Your frontend URL (for CORS + Stripe redirect) |
| `OPENAI_API_KEY` | No | Enables real AI analysis (falls back to heuristic) |
| `STRIPE_SECRET_KEY` | No | Enables payments |
| `STRIPE_WEBHOOK_SECRET` | No | Validates Stripe webhook events |
| `PORT` | No | Backend port (default 5000) |
