import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { api, auth } from '../utils/api.js'

function Page({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

export default function Login() {
  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = tab === 'login'
        ? await api.login(email, password)
        : await api.register(email, password)
      auth.save(res.token, res.email, res.plan)
      navigate('/analyze')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(226,168,64,0.15)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: 'var(--cream)',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
  }
  
  return (
    <Page>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1.5rem', position: 'relative' }}>
        {/* Background glow */}
        <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 50% 60% at 50% 40%, rgba(226,168,64,0.05) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }}
          style={{ background: 'var(--ink2)', border: '1px solid var(--border-hi)', borderRadius: 20, padding: '2.5rem', width: '100%', maxWidth: 420, boxShadow: 'var(--shadow)', position: 'relative', zIndex: 2 }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem', textDecoration: 'none', fontFamily: 'var(--serif)', fontSize: '1.1rem', color: 'var(--cream)' }}>
            <div className="nav-logo-mark" style={{ width: 28, height: 28, fontSize: '0.82rem' }}>R</div>
            ResumeAI
          </Link>

          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 4, background: 'var(--ink3)', padding: 4, borderRadius: 10, marginBottom: '1.75rem' }}>
            {['login', 'register'].map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }}
                style={{ flex: 1, padding: '8px', borderRadius: 8, fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s', border: 'none', cursor: 'pointer', background: tab === t ? 'var(--surface)' : 'transparent', color: tab === t ? 'var(--cream)' : 'var(--muted)' }}>
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 400, marginBottom: '0.4rem' }}>
            {tab === 'login' ? 'Welcome back' : 'Start for free'}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
            {tab === 'login' ? 'Access your resume analysis history.' : 'No credit card required.'}
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <input type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} />

            <div style={{ position: 'relative' }}>
              <input type={showPw ? 'text' : 'password'} placeholder="Password (min 6 chars)"
                value={password} onChange={e => setPassword(e.target.value)} required
                style={{ ...inputStyle, paddingRight: '2.75rem' }} />
              <button type="button" onClick={() => setShowPw(s => !s)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ color: 'var(--red)', fontSize: '0.8rem', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', margin: 0 }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>

            <motion.button type="submit" className="btn btn-gold" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              disabled={loading} style={{ justifyContent: 'center', marginTop: '0.25rem', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Please wait...' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
            </motion.button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--muted)', marginTop: '1.5rem' }}>
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
              style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.78rem', fontWeight: 600 }}>
              {tab === 'login' ? 'Create one free' : 'Sign in'}
            </button>
          </p>

          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted2)', marginTop: '1rem' }}>
            By continuing, you agree to our{' '}
            <a href="#" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Terms</a>
            {' '}and{' '}
            <a href="#" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>Privacy Policy</a>.
          </p>
        </motion.div>
      </div>
    </Page>
  )
}
