import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

const STROKE = 8
const R = 60
const CIRC = 2 * Math.PI * R

function gradeColor(score) {
  if (score >= 85) return '#22c55e'
  if (score >= 70) return '#e2a840'
  if (score >= 55) return '#f59e0b'
  return '#ef4444'
}

export default function ScoreRing({ score = 0, size = 140, animate: shouldAnimate = true }) {
  const count = useMotionValue(0)
  const rounded = useRef(0)

  useEffect(() => {
    if (!shouldAnimate) { count.set(score); return }
    const controls = animate(count, score, {
      duration: 1.6,
      ease: 'easeOut',
      onUpdate: v => { rounded.current = Math.round(v) },
    })
    return controls.stop
  }, [score])

  const stroke = gradeColor(score)
  const dash = (score / 100) * CIRC

  return (
    <div className="score-ring-wrap" style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <svg className="score-ring-svg" viewBox="0 0 140 140" style={{ width: size, height: size }}>
        {/* Track */}
        <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={STROKE} />
        {/* Animated progress */}
        <motion.circle
          cx="70" cy="70" r={R}
          fill="none"
          stroke={stroke}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: CIRC - dash }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${stroke})` }}
        />
        {/* Pulse ring at end position */}
        <circle cx="70" cy="70" r={R} fill="none" stroke={stroke} strokeWidth={1}
          strokeDasharray="2 999" strokeDashoffset={-((1 - score / 100) * CIRC + CIRC * 0.005)}
          opacity="0.3"
        />
      </svg>
      <div className="score-ring-text" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <motion.span className="score-ring-num" style={{ color: stroke, fontFamily: 'var(--mono, monospace)', fontSize: `${size * 0.22}px`, fontWeight: 700, lineHeight: 1 }}>
          {Math.round(score)}
        </motion.span>
        <span className="score-ring-label" style={{ color: 'var(--muted, #888)', fontSize: `${size * 0.1}px`, marginTop: 2 }}>/ 100</span>
      </div>
    </div>
  )
}
