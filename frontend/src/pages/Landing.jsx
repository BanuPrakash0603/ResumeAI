import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { ArrowRight, Zap, Search, RefreshCw, Target, Shield, Star, ChevronDown } from 'lucide-react'
import { api, auth, getOrCreateRefCode, getReferredBy } from '../utils/api.js'
import AuthModal from '../components/AuthModal.jsx'

/* ── Data ── */
const STATS = [
  { value: '94%', label: 'Interview Rate' },
  { value: '3.2×', label: 'More Callbacks' },
  { value: '48h',  label: 'Avg. Response' },
  { value: '50K+', label: 'Resumes Fixed' },
]

const FEATURES = [
  { Icon: Search, title: 'ATS Decoder', desc: 'Reverse-engineers Applicant Tracking Systems so your resume clears every filter before human eyes see it.', tag: 'CORE' },
  { Icon: Zap, title: 'Keyword Intelligence', desc: 'Match job descriptions with surgical precision — surface the exact terms hiring managers are programmed to find.', tag: 'AI-POWERED' },
  { Icon: RefreshCw, title: 'Impact Rewriting', desc: 'Transform weak bullet points into quantified achievements that make recruiters stop scrolling and start calling.', tag: 'POPULAR' },
  { Icon: Target, title: 'Role Targeting', desc: 'One resume, infinite variants. Auto-tailor to each job posting in seconds — not hours.', tag: 'PRO' },
]

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Senior Engineer @ Google', initials: 'PS', text: 'Got 4 FAANG interviews in 2 weeks. The ATS scanner found issues I never would have caught myself.', stars: 5 },
  { name: 'Marcus Chen', role: 'Product Manager @ Stripe', initials: 'MC', text: 'I was sending 50+ applications with zero responses. After the AI rewrite, I had 3 offers in a month.', stars: 5 },
  { name: 'Aisha Johnson', role: 'Data Scientist @ Netflix', initials: 'AJ', text: 'The keyword intelligence feature is unreal. Like having an insider at every company you apply to.', stars: 5 },
]

const HOW = [
  { n: '01', title: 'Upload Resume', desc: 'Drop your PDF or DOCX — we accept any format.' },
  { n: '02', title: 'AI Deep Scan', desc: '200+ data points analyzed against live ATS systems in seconds.' },
  { n: '03', title: 'Get Your Report', desc: 'Prioritized action plan with exact changes — zero guesswork.' },
  { n: '04', title: 'Land Interviews', desc: 'Apply with confidence. Your resume is built to convert.' },
]

/* ── Page wrapper with entry transition ── */
function Page({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

/* ── Animated section reveal ── */
function Reveal({ children, delay = 0, y = 30 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}>
      {children}
    </motion.div>
  )
}

// /* ── Exit intent popup ── */
// function ExitPopup({ onClose }) {
//   const [email, setEmail] = useState('')
//   const [done, setDone] = useState(false)

//   const submit = async (e) => {
//     e.preventDefault()
//     try { await api.captureEmail(email, 'exit_popup', '') } catch (_) {}
//     setDone(true)
//     setTimeout(onClose, 2200)
//   }

//   return (
//     <div className="overlay" onClick={onClose}>
//       <motion.div className="modal" onClick={e => e.stopPropagation()}
//         initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
//         exit={{ scale: 0.88, opacity: 0 }} transition={{ duration: 0.3, ease: 'backOut' }}>
//         <button className="modal-close" onClick={onClose}><span>✕</span></button>
//         <AnimatePresence mode="wait">
//           {done ? (
//             <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
//               style={{ textAlign: 'center', padding: '1rem 0' }}>
//               <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✓</div>
//               <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.5rem', fontWeight: 400 }}>You're on the list!</h3>
//               <p style={{ color: 'var(--muted)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Free report coming to your inbox shortly.</p>
//             </motion.div>
//           ) : (
//             <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//               <div style={{ display: 'inline-block', background: 'var(--gold-dim)', border: '1px solid rgba(226,168,64,0.3)', color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', padding: '4px 12px', borderRadius: 100, marginBottom: '1rem', textTransform: 'uppercase' }}>
//                 Wait — Free Offer
//               </div>
//               <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.7rem', fontWeight: 400, marginBottom: '0.6rem' }}>Before You Go...</h2>
//               <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6 }}>
//                 Get your <strong style={{ color: 'var(--cream)' }}>free ATS score report</strong> sent to your inbox. No sign-up required.
//               </p>
//               <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
//                 <input type="email" placeholder="your@email.com" value={email}
//                   onChange={e => setEmail(e.target.value)} required />
//                 <button type="submit" className="btn btn-gold" style={{ justifyContent: 'center' }}>
//                   Send My Free Report →
//                 </button>
//               </form>
//               <p style={{ fontSize: '0.72rem', color: 'var(--muted2)', marginTop: '0.75rem', textAlign: 'center' }}>No spam. Unsubscribe anytime.</p>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     </div>
//   )
// }

/* ── Hero mock resume card ── */
function ResumeMockCard() {
  const bars = [
    { label: 'ATS Score', val: 74, color: '#f59e0b' },
    { label: 'Keyword Match', val: 45, color: '#ef4444' },
    { label: 'Readability', val: 88, color: '#22c55e' },
  ]
  return (
    <motion.div initial={{ opacity: 0, x: 40, rotate: 2 }} animate={{ opacity: 1, x: 0, rotate: 0 }}
      transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: 'var(--ink2)', border: '1px solid var(--border-hi)', borderRadius: 20, padding: '1.5rem', boxShadow: 'var(--shadow)', position: 'relative', animation: 'float 6s ease-in-out infinite' }}>
      {/* Gold gradient border */}
      <div style={{ position: 'absolute', inset: -1, borderRadius: 21, background: 'linear-gradient(135deg, rgba(226,168,64,0.3) 0%, transparent 40%, rgba(226,168,64,0.1) 100%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold2), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--ink)', flexShrink: 0 }}>JD</div>
        <div style={{ flex: 1 }}>
          <div style={{ height: 12, background: 'rgba(255,255,255,0.15)', borderRadius: 6, width: '60%', marginBottom: 6 }} />
          <div style={{ height: 8, background: 'rgba(255,255,255,0.07)', borderRadius: 6, width: '40%' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', border: '2px solid var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: 'var(--amber)' }}>74</div>
          <div style={{ fontSize: '0.58rem', color: 'var(--muted)', marginTop: 3 }}>ATS Score</div>
        </div>
      </div>

      {/* Issues */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {[
          { icon: '⚠', text: 'Missing keywords (12)', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          { icon: '✕', text: 'Weak action verbs', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
          { icon: '✓', text: 'Contact format valid', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
        ].map(i => (
          <div key={i.text} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: i.bg, color: i.color, fontSize: '0.78rem', fontWeight: 500 }}>
            <span style={{ fontSize: '0.7rem' }}>{i.icon}</span> {i.text}
          </div>
        ))}
      </div>

      {/* Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {bars.map(b => (
          <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.73rem' }}>
            <span style={{ flex: '0 0 90px', color: 'var(--muted)' }}>{b.label}</span>
            <div style={{ flex: 1, height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 100, overflow: 'hidden' }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${b.val}%` }}
                transition={{ duration: 1.4, delay: 0.8, ease: 'easeOut' }}
                style={{ height: '100%', background: b.color, borderRadius: 100 }} />
            </div>
            <span style={{ flex: '0 0 32px', textAlign: 'right', fontWeight: 600, fontSize: '0.72rem' }}>{b.val}%</span>
          </div>
        ))}
      </div>

      <Link to="/analyze" style={{ display: 'block', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: 'var(--gold)', padding: '10px', borderRadius: 8, background: 'rgba(226,168,64,0.08)', border: '1px solid rgba(226,168,64,0.2)', marginTop: 16, textDecoration: 'none', transition: 'background 0.2s' }}>
        Fix all issues →
      </Link>
    </motion.div>
  )
}

/* ── Referral section ── */
function ReferralSection() {
  const [copied, setCopied] = useState(false)
  const code = getOrCreateRefCode()

  const copy = () => {
    const link = `${window.location.origin}/?ref=${code}`
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
    try { api.referralClick(code) } catch (_) {}
  }

  return (
    <Reveal>
      <div style={{ background: 'var(--ink2)', border: '1px solid rgba(226,168,64,0.2)', borderRadius: 16, padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ fontSize: '2rem', flexShrink: 0 }}>🎁</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontWeight: 700, marginBottom: 4, fontSize: '0.95rem' }}>Refer a Friend — Get 1 Month Pro Free</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Every friend who signs up gives you a free Pro month. No limits.</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          onClick={copy} className="btn btn-gold" style={{ padding: '10px 22px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
          {copied ? '✓ Copied!' : 'Copy My Link'}
        </motion.button>
      </div>
    </Reveal>
  )
}

/* ── Main Landing ── */
export default function Landing() {
  const [activeT, setActiveT] = useState(0)
  const [showExit, setShowExit] = useState(false)
  const [exitShown, setExitShown] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const heroRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 })
  const { scrollYProgress } = useScroll()
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0])

  // Read referral code from URL
  useEffect(() => { getReferredBy() }, [])

  // Mouse parallax
  useEffect(() => {
    const h = e => {
      if (!heroRef.current) return
      const r = heroRef.current.getBoundingClientRect()
      setMousePos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 })
    }
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  // Testimonial auto-rotate
  useEffect(() => {
    const t = setInterval(() => setActiveT(p => (p + 1) % TESTIMONIALS.length), 4500)
    return () => clearInterval(t)
  }, [])

  // Exit intent
  const handleLeave = useCallback(e => {
    if (e.clientY <= 0 && !exitShown) { setShowExit(true); setExitShown(true) }
  }, [exitShown])
  useEffect(() => {
    document.addEventListener('mouseleave', handleLeave)
    return () => document.removeEventListener('mouseleave', handleLeave)
  }, [handleLeave])

  const user = auth.get()

  return (
    <Page>
      {/* <AnimatePresence>{showExit && <ExitPopup onClose={() => setShowExit(false)} />}</AnimatePresence> */}
      <AnimatePresence>{showAuth && <AuthModal mode="register" onClose={() => setShowAuth(false)} onSuccess={() => {}} />}</AnimatePresence>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '3rem', padding: '120px 1.5rem 80px', overflow: 'hidden' }}>
        {/* Radial glow follows cursor */}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 60% 50% at ${mousePos.x}% ${mousePos.y}%, rgba(226,168,64,0.09) 0%, transparent 70%)`, pointerEvents: 'none', transition: 'background 0.06s' }} />
        {/* Grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.022) 1px,transparent 1px)', backgroundSize: '64px 64px', maskImage: 'radial-gradient(ellipse at center,black 20%,transparent 72%)', pointerEvents: 'none' }} />
        {/* Orbs */}
        {[
          { size: 380, color: 'rgba(226,168,64,0.1)',  top: '-100px', right: '-80px',  dur: 8 },
          { size: 280, color: 'rgba(34,197,94,0.06)',  bottom: '10%', left: '-60px',   dur: 11 },
          { size: 200, color: 'rgba(226,168,64,0.06)', top: '55%',    left: '45%',     dur: 13 },
        ].map((o, i) => (
          <motion.div key={i} animate={{ y: [0, -16, 0] }} transition={{ duration: o.dur, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', width: o.size, height: o.size, borderRadius: '50%', background: o.color, filter: 'blur(60px)', pointerEvents: 'none', opacity: 0.5, ...o }} />
        ))}

        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', alignItems: 'flex-start', gap: '3rem', width: '100%', flexWrap: 'wrap' }}>
          {/* Left copy */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ flex: 1, minWidth: 300, maxWidth: 560, position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(226,168,64,0.1)', border: '1px solid rgba(226,168,64,0.25)', color: 'var(--gold)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', padding: '6px 14px', borderRadius: 100, marginBottom: '1.5rem' }}>
              <motion.span animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />
              AI-Powered Resume Intelligence
            </div>

            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2.6rem, 5.5vw, 4.4rem)', fontWeight: 400, lineHeight: 1.07, color: 'var(--cream)', marginBottom: '1.5rem' }}>
              <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} style={{ display: 'block' }}>Your Resume Is</motion.span>
              <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.28 }} style={{ display: 'block', color: 'var(--gold)', fontStyle: 'italic' }}>Getting Rejected</motion.span>
              <motion.span initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.41 }} style={{ display: 'block' }}>Before They Read It</motion.span>
            </h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
              style={{ fontSize: '1.05rem', color: 'var(--muted)', lineHeight: 1.75, marginBottom: '2.5rem', maxWidth: 480 }}>
              75% of resumes never reach human eyes. Our AI decodes ATS systems, rewrites your story, and gets you the interviews you deserve.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
              style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link to="/analyze" className="btn btn-gold btn-lg" style={{ gap: 10 }}>
                  <span>Analyze My Resume</span>
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Link to="/pricing" className="btn btn-ghost btn-lg">View Pricing</Link>
              </motion.div>
            </motion.div>

            {/* Social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex' }}>
                {['SL','AK','RJ','NP','TW'].map((a, i) => (
                  <div key={i} style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface)', border: '2px solid var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: 'var(--gold)', marginLeft: i === 0 ? 0 : -8 }}>{a}</div>
                ))}
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                <strong style={{ color: 'var(--cream)' }}>2,400+ professionals</strong> hired this month
              </p>
            </motion.div>
          </motion.div>

          {/* Right — resume mock card */}
          <div style={{ flex: '0 0 340px', position: 'relative', zIndex: 2 }}>
            <ResumeMockCard />
          </div>
        </div>

        {/* Scroll cue */}
        <motion.div style={{ position: 'absolute', bottom: '2rem', left: '50%', translateX: '-50%', opacity: heroOpacity }}
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <ChevronDown size={24} color="var(--muted)" />
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--ink2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map((s, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <div style={{ textAlign: 'center', padding: '1rem', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem,4vw,3rem)', color: 'var(--gold)', lineHeight: 1, marginBottom: 6 }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ maxWidth: 1180, margin: '0 auto', padding: '6rem 1.5rem' }}>
        <Reveal style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div className="tag">Capabilities</div>
            <h2 className="section-title">The AI Stack Behind<br /><em>Every Hired Candidate</em></h2>
          </div>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1.25rem' }}>
          {FEATURES.map((f, i) => (
            <Reveal key={i} delay={i * 0.1}>
              <motion.div whileHover={{ y: -6, borderColor: 'rgba(226,168,64,0.3)' }}
                style={{ background: 'var(--ink2)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem', cursor: 'default', position: 'relative', overflow: 'hidden', transition: 'border-color 0.25s' }}>
                {/* Top gradient line on hover */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,var(--gold),transparent)', opacity: 0 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <f.Icon size={20} color="var(--gold)" />
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--gold)', background: 'var(--gold-dim)', border: '1px solid rgba(226,168,64,0.2)', padding: '3px 9px', borderRadius: 100 }}>{f.tag}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.25rem', fontWeight: 400, marginBottom: '0.75rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.7 }}>{f.desc}</p>
                <div style={{ marginTop: '1.25rem', color: 'var(--gold)', fontSize: '1.1rem' }}>→</div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" style={{ background: 'var(--ink2)', padding: '6rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <div className="tag">Process</div>
              <h2 className="section-title">From Upload to<br /><em>Offer Letter</em></h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem', position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: '2.5rem', left: '12%', right: '12%', height: 1, background: 'linear-gradient(90deg,transparent,var(--border-hi),transparent)', pointerEvents: 'none' }} />
            {HOW.map((h, i) => (
              <Reveal key={i} delay={i * 0.12}>
                <div style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontFamily: 'var(--serif)', fontSize: '3rem', color: 'rgba(226,168,64,0.15)', lineHeight: 1, marginBottom: '0.5rem' }}>{h.n}</div>
                  <div style={{ width: 1, height: 28, background: 'linear-gradient(to bottom,var(--gold),transparent)', margin: '0 auto 1rem' }} />
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', fontWeight: 400, marginBottom: '0.5rem' }}>{h.title}</h3>
                  <p style={{ fontSize: '0.83rem', color: 'var(--muted)', lineHeight: 1.65 }}>{h.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="reviews" style={{ maxWidth: 900, margin: '0 auto', padding: '6rem 1.5rem', textAlign: 'center' }}>
        <Reveal>
          <div className="tag">Social Proof</div>
          <h2 className="section-title" style={{ marginBottom: '3rem' }}>Real People.<br /><em>Real Offers.</em></h2>
        </Reveal>
        <div style={{ position: 'relative', minHeight: 220, marginBottom: '2rem' }}>
          <AnimatePresence mode="wait">
            {TESTIMONIALS.map((t, i) => i === activeT && (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4 }}
                style={{ background: 'var(--ink2)', border: '1px solid var(--border)', borderRadius: 20, padding: '2.5rem', textAlign: 'left' }}>
                <div style={{ color: 'var(--gold)', fontSize: '1.1rem', letterSpacing: '3px', marginBottom: '1rem' }}>{'★'.repeat(t.stars)}</div>
                <p style={{ fontFamily: 'var(--serif)', fontSize: '1.15rem', fontStyle: 'italic', lineHeight: 1.65, marginBottom: '1.5rem' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,var(--gold2),var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: 'var(--ink)' }}>{t.initials}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
          {TESTIMONIALS.map((_, i) => (
            <motion.button key={i} onClick={() => setActiveT(i)} whileHover={{ scale: 1.3 }}
              style={{ width: i === activeT ? 24 : 8, height: 8, borderRadius: 100, background: i === activeT ? 'var(--gold)' : 'var(--surface)', border: 'none', cursor: 'pointer', transition: 'all 0.3s' }} />
          ))}
        </div>
      </section>

      {/* ── REFERRAL ── */}
      <section style={{ background: 'var(--ink2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <div className="tag">Referral Program</div>
            <h2 className="section-title" style={{ marginBottom: '2rem' }}>Invite Friends,<br /><em>Earn Free Pro Months</em></h2>
          </Reveal>
          <ReferralSection />
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: 'relative', padding: '8rem 1.5rem', textAlign: 'center', overflow: 'hidden' }}>
        {[180, 300, 420].map((s, i) => (
          <motion.div key={i} animate={{ scale: [1, 1.08, 1], opacity: [0.06, 0.03, 0.06] }}
            transition={{ duration: 4 + i * 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ position: 'absolute', top: '50%', left: '50%', width: s, height: s, borderRadius: '50%', border: '1px solid var(--gold)', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
        ))}
        <Reveal>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'inline-block', background: 'var(--gold-dim)', border: '1px solid rgba(226,168,64,0.3)', color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', padding: '4px 14px', borderRadius: 100, marginBottom: '1.5rem', textTransform: 'uppercase' }}>
              Limited Time — Free Analysis
            </div>
            <h2 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: 400, marginBottom: '1rem' }}>
              Your Dream Job Is<br /><em style={{ color: 'var(--gold)' }}>One Resume Away</em>
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '1rem', marginBottom: '2.5rem', maxWidth: 500, margin: '0 auto 2.5rem' }}>
              Join 50,000+ professionals who stopped getting rejected and started getting hired.
            </p>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} style={{ display: 'inline-block' }}>
              <Link to="/analyze" className="btn btn-gold btn-lg">
                Start Free — No Credit Card <ArrowRight size={18} />
              </Link>
            </motion.div>
            <p style={{ fontSize: '0.78rem', color: 'var(--muted2)', marginTop: '1.25rem' }}>
              7-day money-back guarantee · Cancel anytime · No risk
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="footer-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>
            <div className="nav-logo-mark" style={{ width: 28, height: 28, fontSize: '0.85rem' }}>R</div>
            ResumeAI
          </div>
          <div className="footer-links">
            <a href="#">Privacy</a><a href="#">Terms</a><a href="#">Contact</a><a href="#">Blog</a>
          </div>
          <p className="footer-copy">© 2025 ResumeAI. All rights reserved.</p>
        </div>
      </footer>
    </Page>
  )
}
