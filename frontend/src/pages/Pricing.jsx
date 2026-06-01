import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Check, X, ChevronDown } from 'lucide-react'
import { api, auth, getReferredBy } from '../utils/api.js'

function Page({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

function Reveal({ children, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  )
}

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0, yearly: 0,
    desc: 'Get started with AI-powered resume analysis.',
    features: [
      { text: '3 resume scans per day', yes: true },
      { text: 'ATS compatibility check', yes: true },
      { text: 'Basic keyword suggestions', yes: true },
      { text: 'PDF export', yes: true },
      { text: 'Unlimited scans', yes: false },
      { text: 'Advanced AI rewriting', yes: false },
      { text: 'Role targeting variants', yes: false },
      { text: 'Priority support', yes: false },
    ],
    cta: 'Start Free',
    ctaTo: '/analyze',
    highlight: false,
  },
  {
    id: 'pro_monthly',
    name: 'Pro',
    monthly: 9, yearly: 7,
    desc: 'Everything you need to land your dream role.',
    badge: 'MOST POPULAR',
    features: [
      { text: 'Unlimited resume scans', yes: true },
      { text: 'ATS compatibility check', yes: true },
      { text: 'Advanced keyword intelligence', yes: true },
      { text: 'AI impact rewriting', yes: true },
      { text: 'Role targeting variants', yes: true },
      { text: 'LinkedIn optimization', yes: true },
      { text: 'Cover letter generator', yes: true },
      { text: 'Priority support', yes: false },
    ],
    cta: 'Start 7-Day Free Trial',
    highlight: true,
  },
  {
    id: 'team_monthly',
    name: 'Team',
    monthly: 29, yearly: 23,
    desc: 'For career coaches and recruiting teams.',
    features: [
      { text: 'Everything in Pro', yes: true },
      { text: 'Up to 10 team members', yes: true },
      { text: 'Team analytics dashboard', yes: true },
      { text: 'Bulk candidate scanning', yes: true },
      { text: 'White-label reports', yes: true },
      { text: 'API access', yes: true },
      { text: 'Custom integrations', yes: true },
      { text: 'Dedicated account manager', yes: true },
    ],
    cta: 'Contact Sales',
    ctaTo: 'mailto:sales@resumeai.app',
    highlight: false,
  },
]

const FAQ = [
  { q: 'How does the free trial work?', a: 'Start your Pro trial with no credit card required. You get full Pro access for 7 days. We remind you before it ends — no surprises.' },
  { q: 'How accurate is the ATS scanner?', a: 'Our model is trained on 200,000+ job postings and validated against 40+ major ATS platforms including Workday, Greenhouse, and Lever. Users report 3× higher callback rates.' },
  { q: 'Can I cancel anytime?', a: 'Yes. Cancel with one click from your dashboard. No fees, no hidden charges. Access continues until the billing period ends.' },
  { q: 'What formats does it support?', a: 'PDF, DOCX, and TXT. We handle virtually any standard resume format up to 5MB.' },
  { q: 'Is my resume data private?', a: 'Absolutely. Your data is encrypted in transit and at rest. We never share or sell it. Delete all data anytime from settings.' },
]

export default function Pricing() {
  const [yearly, setYearly] = useState(false)
  const [openFaq, setOpenFaq] = useState(null)
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [checkoutError, setCheckoutError] = useState('')
  const user = auth.get()

  const handleCheckout = async (plan) => {
    if (plan.ctaTo) return  // external / free link handled by Link
    setCheckoutError('')
    setLoadingPlan(plan.id)
    const planId = yearly && plan.id === 'pro_monthly' ? 'pro_yearly' : plan.id
    try {
      const ref = getReferredBy()
      const { url } = await api.createCheckout(planId, user.email || '', ref)
      window.location.href = url
    } catch (err) {
      setCheckoutError(err.message || 'Checkout unavailable. Stripe may not be configured.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <Page>
      {/* Hero */}
      <section style={{ position: 'relative', padding: '120px 1.5rem 5rem', textAlign: 'center', overflow: 'hidden', background: 'var(--ink)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(226,168,64,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: 'relative', zIndex: 2, maxWidth: 680, margin: '0 auto' }}>
          <div className="tag">Pricing</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.2rem,5vw,3.6rem)', fontWeight: 400, marginBottom: '1rem', lineHeight: 1.1 }}>
            Invest in Your <em style={{ color: 'var(--gold)' }}>Career,<br />Not Job Boards</em>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.05rem', marginBottom: '2rem', lineHeight: 1.65 }}>
            Less than a coffee per week. More interviews than you can handle.
          </p>

          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'var(--ink2)', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 16px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: !yearly ? 'var(--cream)' : 'var(--muted)', transition: 'color 0.2s' }}>Monthly</span>
            <motion.button onClick={() => setYearly(y => !y)} whileTap={{ scale: 0.94 }}
              style={{ width: 44, height: 24, borderRadius: 100, background: yearly ? 'var(--gold)' : 'var(--surface)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.3s', flexShrink: 0 }}>
              <motion.div animate={{ x: yearly ? 20 : 2 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: 'white' }} />
            </motion.button>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: yearly ? 'var(--cream)' : 'var(--muted)', transition: 'color 0.2s' }}>
              Yearly{' '}
              <span style={{ fontSize: '0.7rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 7px', borderRadius: 100, fontWeight: 700 }}>
                Save 22%
              </span>
            </span>
          </div>
        </motion.div>
      </section>

      {/* Plans */}
      <section style={{ padding: '0 1.5rem 5rem', background: 'var(--ink)' }}>
        {checkoutError && (
          <div style={{ maxWidth: 860, margin: '0 auto 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', padding: '0.75rem 1.25rem', borderRadius: 10, fontSize: '0.875rem' }}>
            {checkoutError}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.25rem', maxWidth: 1000, margin: '0 auto' }}>
          {PLANS.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 0.08}>
              <motion.div whileHover={{ y: -4 }}
                style={{ position: 'relative', background: plan.highlight ? 'linear-gradient(160deg, rgba(226,168,64,0.09) 0%, rgba(226,168,64,0.03) 100%)' : 'var(--ink2)', border: `1px solid ${plan.highlight ? 'rgba(226,168,64,0.4)' : 'var(--border)'}`, borderRadius: 20, padding: '2rem', display: 'flex', flexDirection: 'column', boxShadow: plan.highlight ? '0 20px 60px rgba(226,168,64,0.1)' : 'none', transition: 'border-color 0.2s' }}>
                {plan.badge && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--gold)', color: 'var(--ink)', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.12em', padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                    {plan.badge}
                  </div>
                )}

                <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 400, marginBottom: '0.25rem' }}>{plan.name}</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: '0.5rem' }}>
                  <span style={{ fontFamily: 'var(--serif)', fontSize: '3rem', fontWeight: 400, color: plan.highlight ? 'var(--gold)' : 'var(--cream)', lineHeight: 1 }}>
                    <AnimatePresence mode="wait">
                      <motion.span key={yearly ? 'y' : 'm'} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} style={{ display: 'inline-block' }}>
                        ${yearly ? plan.yearly : plan.monthly}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                  {plan.monthly > 0 && <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>/mo</span>}
                </div>
                {plan.monthly > 0 && yearly && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                    Billed ${plan.yearly * 12}/year
                  </p>
                )}
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.55 }}>{plan.desc}</p>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem', flex: 1 }}>
                  {plan.features.map((f, fi) => (
                    <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: f.yes ? 'var(--cream)' : 'var(--muted2)', textDecoration: f.yes ? 'none' : 'line-through' }}>
                      {f.yes
                        ? <Check size={14} color="var(--gold)" style={{ flexShrink: 0 }} />
                        : <X size={14} color="var(--muted2)" style={{ flexShrink: 0 }} />}
                      {f.text}
                    </li>
                  ))}
                </ul>

                {plan.ctaTo ? (
                  <Link to={plan.ctaTo} className={`btn ${plan.highlight ? 'btn-gold' : 'btn-ghost'}`} style={{ justifyContent: 'center', padding: '13px' }}>
                    {plan.cta}
                  </Link>
                ) : (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => handleCheckout(plan)} disabled={!!loadingPlan}
                    className={`btn ${plan.highlight ? 'btn-gold' : 'btn-ghost'}`}
                    style={{ justifyContent: 'center', padding: '13px', opacity: loadingPlan === plan.id ? 0.7 : 1 }}>
                    {loadingPlan === plan.id ? 'Redirecting...' : plan.cta}
                  </motion.button>
                )}
              </motion.div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.3}>
          <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', marginTop: '1.5rem' }}>
            🛡 7-day money-back guarantee on all paid plans. No questions asked.
          </p>
        </Reveal>
      </section>

      {/* Comparison table */}
      <section style={{ background: 'var(--ink2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <div className="tag">Comparison</div>
              <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 400 }}>
                Why Professionals<br /><em style={{ color: 'var(--gold)' }}>Choose ResumeAI</em>
              </h2>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div style={{ border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3,100px)', gap: 0, background: 'var(--surface)', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 600 }}>Feature</div>
                {['Career Coach<br/>~$200/session', 'ResumeAI Pro<br/>$9/mo', 'DIY<br/>Free'].map((col, i) => (
                  <div key={i} style={{ textAlign: 'center', fontSize: '0.78rem', fontWeight: 700, color: i === 1 ? 'var(--gold)' : 'var(--muted)', lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: col }} />
                ))}
              </div>
              {[
                ['ATS Optimization', '✕', '✓', '✕'],
                ['Keyword Intelligence', 'Manual', '✓ AI', '✕'],
                ['Instant Feedback', '✕', '✓', '✕'],
                ['Unlimited Rewrites', '✕', '✓', '✓'],
                ['Job-Specific Tailoring', '✓', '✓', '✕'],
                ['Available 24/7', '✕', '✓', '✓'],
              ].map(([feat, coach, ours, diy], i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(3,100px)', padding: '0.85rem 1.5rem', borderBottom: i < 5 ? '1px solid var(--border)' : 'none', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--cream)' }}>{feat}</span>
                  <span style={{ textAlign: 'center', fontSize: '0.85rem', color: coach === '✕' ? 'var(--muted2)' : 'var(--muted)' }}>{coach}</span>
                  <span style={{ textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: 'var(--gold)' }}>{ours}</span>
                  <span style={{ textAlign: 'center', fontSize: '0.85rem', color: diy === '✕' ? 'var(--muted2)' : 'var(--muted)' }}>{diy}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '5rem 1.5rem', maxWidth: 720, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div className="tag">FAQ</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 400 }}>
              Everything You<br /><em style={{ color: 'var(--gold)' }}>Need to Know</em>
            </h2>
          </div>
        </Reveal>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {FAQ.map((item, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.2s', borderColor: openFaq === i ? 'var(--border-hi)' : 'var(--border)' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.1rem 1.25rem', background: 'var(--ink2)', border: 'none', color: 'var(--cream)', fontFamily: 'var(--sans)', fontWeight: 600, fontSize: '0.925rem', cursor: 'pointer', gap: '1rem', textAlign: 'left' }}>
                  {item.q}
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown size={18} color="var(--muted)" style={{ flexShrink: 0 }} />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}>
                      <p style={{ padding: '0 1.25rem 1.1rem', fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.7 }}>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ position: 'relative', padding: '7rem 1.5rem', textAlign: 'center', overflow: 'hidden', background: 'var(--ink2)', borderTop: '1px solid var(--border)' }}>
        {[160, 280, 400].map((s, i) => (
          <motion.div key={i} animate={{ scale: [1, 1.06, 1], opacity: [0.05, 0.02, 0.05] }}
            transition={{ duration: 4 + i * 1.5, repeat: Infinity }}
            style={{ position: 'absolute', top: '50%', left: '50%', width: s, height: s, borderRadius: '50%', border: '1px solid var(--gold)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        ))}
        <Reveal>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, marginBottom: '0.75rem' }}>
              Ready to Stop Getting<br /><em style={{ color: 'var(--gold)' }}>Ignored by Employers?</em>
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>Start your free trial today. No credit card required.</p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ display: 'inline-block' }}>
              <Link to="/analyze" className="btn btn-gold btn-lg">Get Started Free →</Link>
            </motion.div>
          </div>
        </Reveal>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>
            <div className="nav-logo-mark" style={{ width: 28, height: 28, fontSize: '0.85rem' }}>R</div>
            ResumeAI
          </div>
          <div className="footer-links">
            <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a>
          </div>
          <p className="footer-copy">© 2025 ResumeAI. All rights reserved.</p>
        </div>
      </footer>
    </Page>
  )
}
