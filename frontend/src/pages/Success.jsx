import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, ArrowRight } from 'lucide-react'

function Page({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4 }}>
      {children}
    </motion.div>
  )
}

export default function Success() {
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [countdown, setCountdown] = useState(8)

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); window.location.href = '/analyze' }
      return c - 1
    }), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <Page>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        {/* Animated rings */}
        {[120, 220, 340].map((s, i) => (
          <motion.div key={i}
            initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.6, ease: 'easeOut' }}
            style={{ position: 'absolute', top: '50%', left: '50%', width: s, height: s, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.2)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        ))}

        <div style={{ textAlign: 'center', position: 'relative', zIndex: 2, maxWidth: 480 }}>
          {/* Checkmark */}
          <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '2px solid rgba(34,197,94,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
            <CheckCircle size={40} color="#22c55e" />
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 400, marginBottom: '0.75rem' }}>
            You're all set!
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ color: 'var(--muted)', fontSize: '1.05rem', marginBottom: '0.5rem', lineHeight: 1.6 }}>
            Your Pro subscription is now active. Welcome to the community of professionals who actually get hired.
          </motion.p>

          {sessionId && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              style={{ fontFamily: 'var(--mono)', fontSize: '0.72rem', color: 'var(--muted2)', marginBottom: '2rem' }}>
              Session: {sessionId.slice(0, 24)}...
            </motion.p>
          )}

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Link to="/analyze" className="btn btn-gold btn-lg" style={{ gap: 10 }}>
              Start Analyzing <ArrowRight size={18} />
            </Link>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted2)' }}>
              Auto-redirecting in {countdown}s…
            </p>
          </motion.div>

          {/* Confetti dots */}
          {[...Array(12)].map((_, i) => (
            <motion.div key={i}
              initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
              animate={{ y: -(80 + Math.random() * 120), x: (Math.random() - 0.5) * 200, opacity: 0, scale: 0 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 1.2, ease: 'easeOut' }}
              style={{ position: 'absolute', top: '35%', left: '50%', width: 8, height: 8, borderRadius: '50%', background: ['var(--gold)', '#22c55e', '#3b82f6', '#e2a840'][i % 4], pointerEvents: 'none' }} />
          ))}
        </div>
      </div>
    </Page>
  )
}
