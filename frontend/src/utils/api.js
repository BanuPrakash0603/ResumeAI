// utils/api.js — All API calls in one place. Change VITE_API_URL in .env to update base URL.

export const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function getToken() {
  return localStorage.getItem('resumeai_token')
}

function authHeaders() {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { ...authHeaders(), ...(opts.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  register: (email, password) =>
    request('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),

  me: () => request('/auth/me'),

  // ── Analysis ───────────────────────────────────────────────────────────────
  analyze: (file, jobDescription = '') => {
    const fd = new FormData()
    fd.append('file', file)
    if (jobDescription) fd.append('job_description', jobDescription)
    return request('/analyze', { method: 'POST', body: fd })
  },

  // ── Dashboard ──────────────────────────────────────────────────────────────
  getScans: () => request('/dashboard/scans'),

  // ── Stripe ────────────────────────────────────────────────────────────────
  createCheckout: (plan, email, ref_code) =>
    request('/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, email, ref_code }),
    }),

  // ── Misc ──────────────────────────────────────────────────────────────────
  captureEmail: (email, source, ref_code) =>
    request('/capture-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source, ref_code }),
    }),

  referralClick: (ref_code) =>
    request('/referral-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref_code }),
    }),

  health: () => request('/health'),
}

// ── Auth storage helpers ───────────────────────────────────────────────────────
export const auth = {
  save: (token, email, plan) => {
    localStorage.setItem('resumeai_token', token)
    localStorage.setItem('resumeai_email', email)
    localStorage.setItem('resumeai_plan', plan)
  },
  clear: () => {
    localStorage.removeItem('resumeai_token')
    localStorage.removeItem('resumeai_email')
    localStorage.removeItem('resumeai_plan')
  },
  get: () => ({
    token: localStorage.getItem('resumeai_token'),
    email: localStorage.getItem('resumeai_email'),
    plan:  localStorage.getItem('resumeai_plan') || 'free',
    isLoggedIn: !!localStorage.getItem('resumeai_token'),
  }),
}

// ── Referral code helper ───────────────────────────────────────────────────────
export function getOrCreateRefCode() {
  let code = localStorage.getItem('my_ref_code')
  if (!code) {
    code = 'REF' + Math.random().toString(36).slice(2, 10).toUpperCase()
    localStorage.setItem('my_ref_code', code)
  }
  return code
}

export function getReferredBy() {
  const params = new URLSearchParams(window.location.search)
  const ref = params.get('ref')
  if (ref) localStorage.setItem('referred_by', ref)
  return localStorage.getItem('referred_by') || ''
}
