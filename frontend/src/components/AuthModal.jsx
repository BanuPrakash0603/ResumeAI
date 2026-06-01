import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff } from 'lucide-react'
import { api, auth } from '../utils/api.js'

export default function AuthModal({ mode = 'login', onClose, onSuccess }) {
  const [tab, setTab] = useState(mode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = tab === 'login'
        ? await api.login(email, password)
        : await api.register(email, password)
      auth.save(res.token, res.email, res.plan)
      onSuccess?.(res)
      onClose?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="overlay" onClick={onClose}>
      <motion.div
        className="modal"
        onClick={e => e.stopPropagation()}
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <button className="modal-close" onClick={onClose}><X size={14} /></button>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--ink3)', padding: 4, borderRadius: 10, marginBottom: '1.75rem' }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              style={{
                flex: 1, padding: '8px', borderRadius: 8, fontFamily: 'var(--sans)',
                fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s',
                background: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--cream)' : 'var(--muted)',
              }}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.6rem', fontWeight: 400, marginBottom: '0.5rem' }}>
          {tab === 'login' ? 'Welcome back' : 'Start for free'}
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
          {tab === 'login' ? 'Access your resume analysis history.' : 'No credit card required.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input type="email" placeholder="your@email.com" value={email}
            onChange={e => setEmail(e.target.value)} required autoComplete="email" />

          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} placeholder="Password (min 6 chars)"
              value={password} onChange={e => setPassword(e.target.value)} required
              style={{ paddingRight: '2.5rem' }} />
            <button type="button" onClick={() => setShowPw(s => !s)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ color: 'var(--red)', fontSize: '0.8rem', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button type="submit" className="btn btn-gold" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted)', marginTop: '1.25rem' }}>
          {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setTab(tab === 'login' ? 'register' : 'login')}
            style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'var(--sans)', fontSize: '0.75rem' }}>
            {tab === 'login' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  )
}
