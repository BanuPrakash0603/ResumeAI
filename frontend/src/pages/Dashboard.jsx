import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BarChart2, Upload, ArrowRight } from 'lucide-react'
import AnalyticsDashboard from '../components/dashboard/AnalyticsDashboard.jsx'
import { auth } from '../utils/api.js'

function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

export default function Dashboard() {
  const user = auth.get()

  return (
    <Page>
      <div className="page-section">
        <div className="page-inner">
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'rgba(226,168,64,0.12)',
                  border: '1px solid rgba(226,168,64,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BarChart2 size={18} color="var(--gold)" />
                </div>
                <h1 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 400 }}>
                  Dashboard
                </h1>
              </div>
              {user.email && (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  {user.email} · <span style={{ color: user.plan === 'free' ? 'var(--muted)' : 'var(--gold)', fontWeight: 700, textTransform: 'capitalize' }}>{user.plan} plan</span>
                </p>
              )}
            </div>

            <Link to="/analyze" className="btn btn-gold" style={{ gap: 8, padding: '10px 20px', fontSize: '0.85rem' }}>
              <Upload size={14} /> New Analysis
            </Link>
          </div>

          {/* Analytics */}
          <AnalyticsDashboard />

          {/* CTA if free */}
          {user.plan === 'free' && user.isLoggedIn && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              style={{
                marginTop: '2rem',
                background: 'linear-gradient(135deg, rgba(226,168,64,0.08), rgba(226,168,64,0.04))',
                border: '1px solid rgba(226,168,64,0.2)',
                borderRadius: 16,
                padding: '1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 400, marginBottom: '0.25rem' }}>
                  Unlock unlimited scans & AI rewriting
                </h3>
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
                  Pro plan starts at $9/mo. Cancel anytime.
                </p>
              </div>
              <Link to="/pricing" className="btn btn-gold" style={{ gap: 8, padding: '10px 20px', fontSize: '0.85rem' }}>
                Upgrade to Pro <ArrowRight size={14} />
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </Page>
  )
}
