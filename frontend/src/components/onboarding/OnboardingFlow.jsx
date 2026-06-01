import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Zap, Target, TrendingUp, Shield, ArrowRight, Check } from 'lucide-react'
import { useOnboarding } from '../../store/index.jsx'

const STEPS = [
  {
    id: 'welcome',
    icon: Zap,
    iconColor: '#e2a840',
    title: 'Welcome to ResumeAI',
    subtitle: 'Your AI-powered career advantage',
    body: "You're about to unlock the most advanced resume analysis engine available. We scan for 40+ ATS factors, keyword density, and impact language — all in under 30 seconds.",
    cta: 'Get Started',
    visual: 'welcome',
  },
  {
    id: 'how',
    icon: Target,
    iconColor: '#3b82f6',
    title: 'How it works',
    subtitle: 'Three steps to a better resume',
    body: null,
    steps: [
      { n: '01', label: 'Upload', desc: 'Drop your PDF, DOCX, or TXT resume' },
      { n: '02', label: 'AI Analysis', desc: 'Our engine runs 40+ ATS compatibility checks' },
      { n: '03', label: 'Improve', desc: 'Act on prioritized, specific suggestions' },
    ],
    cta: 'Next',
    visual: 'how',
  },
  {
    id: 'features',
    icon: TrendingUp,
    iconColor: '#22c55e',
    title: "What you'll get",
    subtitle: 'Built for serious job seekers',
    body: null,
    features: [
      { icon: '🎯', label: 'ATS Score', desc: 'See exactly how recruiter bots rank you' },
      { icon: '🔥', label: 'Resume Heatmap', desc: 'Visual section-by-section strength map' },
      { icon: '⚡', label: 'Streaming AI', desc: 'Real-time AI feedback as it generates' },
      { icon: '📊', label: 'Analytics', desc: 'Track your improvement over time' },
    ],
    cta: 'Almost there',
    visual: 'features',
  },
  {
    id: 'ready',
    icon: Shield,
    iconColor: '#22c55e',
    title: "You're all set",
    subtitle: 'No account needed for your first scan',
    body: 'Upload your resume now and get a full analysis instantly. Create a free account to save your history and track improvements over time.',
    cta: 'Analyze My Resume →',
    visual: 'ready',
    final: true,
  },
]

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)
  const { finish } = useOnboarding()

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const next = () => {
    if (isLast) {
      setExiting(true)
      setTimeout(() => {
        finish()
        onComplete?.()
      }, 400)
      return
    }
    setStep(s => s + 1)
  }

  const skip = () => {
    finish()
    onComplete?.()
  }

  return (
    <AnimatePresence>
      {!exiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12,12,14,0.96)',
            backdropFilter: 'blur(20px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          {/* Skip */}
          <button
            onClick={skip}
            style={{
              position: 'absolute',
              top: '1.5rem',
              right: '1.5rem',
              background: 'none',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            Skip intro
          </button>

          {/* Card */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              background: 'var(--ink2)',
              border: '1px solid var(--border-hi)',
              borderRadius: 24,
              padding: '3rem',
              maxWidth: 520,
              width: '100%',
              position: 'relative',
            }}
          >
            {/* Step dots */}
            <div style={{ display: 'flex', gap: 6, marginBottom: '2rem' }}>
              {STEPS.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === step ? 24 : 8,
                    background: i === step ? '#e2a840' : i < step ? '#22c55e' : 'var(--surface)',
                  }}
                  style={{ height: 8, borderRadius: 4, transition: 'all 0.3s' }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
              >
                {/* Icon */}
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `${current.iconColor}18`,
                  border: `1px solid ${current.iconColor}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                }}>
                  <current.icon size={26} color={current.iconColor} />
                </div>

                <div style={{ fontSize: '0.72rem', color: current.iconColor, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {current.subtitle}
                </div>

                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '2rem', fontWeight: 400, marginBottom: '1rem', lineHeight: 1.15 }}>
                  {current.title}
                </h2>

                {current.body && (
                  <p style={{ color: 'var(--muted)', lineHeight: 1.7, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                    {current.body}
                  </p>
                )}

                {current.steps && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.5rem' }}>
                    {current.steps.map((s, i) => (
                      <motion.div
                        key={s.n}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                      >
                        <div style={{
                          fontFamily: 'var(--mono)',
                          fontSize: '0.7rem',
                          color: '#3b82f6',
                          background: 'rgba(59,130,246,0.12)',
                          border: '1px solid rgba(59,130,246,0.25)',
                          padding: '4px 8px',
                          borderRadius: 6,
                          minWidth: 32,
                          textAlign: 'center',
                          fontWeight: 700,
                        }}>
                          {s.n}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.label}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{s.desc}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {current.features && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1.5rem' }}>
                    {current.features.map((f, i) => (
                      <motion.div
                        key={f.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.08 }}
                        style={{
                          background: 'var(--ink3)',
                          border: '1px solid var(--border)',
                          borderRadius: 12,
                          padding: '0.85rem',
                        }}
                      >
                        <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{f.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>{f.label}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.4 }}>{f.desc}</div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={next}
              className="btn btn-gold"
              style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', marginTop: '0.5rem' }}
            >
              {current.cta}
              {!isLast && <ArrowRight size={16} />}
              {isLast && <Check size={16} />}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
