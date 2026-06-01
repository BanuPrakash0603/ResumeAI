import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts'
import { TrendingUp, FileText, Award, Calendar, BarChart2 } from 'lucide-react'
import { api } from '../../utils/api.js'
import { useStore, Actions } from '../../store/index.jsx'

const GRADE_COLORS = { A: '#22c55e', B: '#e2a840', C: '#f59e0b', D: '#f97316', F: '#ef4444' }

function StatCard({ label, value, sub, icon: Icon, color = 'var(--gold)', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: 'var(--ink2)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}15`,
        border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={18} color={color} />
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: 'var(--mono)', lineHeight: 1, color }}>
          {value}
        </div>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
      </div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--ink3)',
      border: '1px solid var(--border-hi)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: '0.78rem',
    }}>
      <div style={{ color: 'var(--muted)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontWeight: 700 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsDashboard() {
  const { state, dispatch } = useStore()
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('overview') // 'overview' | 'history' | 'radar'

  useEffect(() => {
    if (state.user && state.scans.length === 0) {
      loadScans()
    }
  }, [state.user])

  const loadScans = async () => {
    setLoading(true)
    try {
      const res = await api.getScans()
      dispatch({ type: Actions.SET_SCANS, payload: res.scans || [] })
    } catch {
      // Not logged in or no scans yet
    } finally {
      setLoading(false)
    }
  }

  // Build chart data from scans
  const chartData = state.scans.slice().reverse().map((scan, i) => ({
    name: `Scan ${i + 1}`,
    date: new Date(scan.created_at || Date.now()).toLocaleDateString('en', { month: 'short', day: 'numeric' }),
    overall: scan.overall || 0,
    ats: scan.ats_score || 0,
    keywords: scan.keyword_score || 0,
    impact: scan.impact_score || 0,
  }))

  const latest = state.scans[0]
  const prev = state.scans[1]
  const improvement = latest && prev ? latest.overall - prev.overall : null

  const radarData = latest ? [
    { metric: 'ATS', score: latest.ats_score || 0 },
    { metric: 'Keywords', score: latest.keyword_score || 0 },
    { metric: 'Readability', score: latest.readability || 0 },
    { metric: 'Impact', score: latest.impact_score || 0 },
    { metric: 'Overall', score: latest.overall || 0 },
    ...(latest.job_match_score !== null && latest.job_match_score !== undefined
      ? [{ metric: 'Job Match', score: latest.job_match_score }]
      : []),
  ] : []

  const avgScore = state.scans.length
    ? Math.round(state.scans.reduce((a, s) => a + (s.overall || 0), 0) / state.scans.length)
    : 0

  const bestGrade = state.scans.length
    ? state.scans.reduce((best, s) => (s.overall > (best.overall || 0) ? s : best), {}).grade
    : '—'

  if (!state.user) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          background: 'var(--ink2)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '3rem',
          textAlign: 'center',
        }}
      >
        <BarChart2 size={40} color="var(--muted)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 400, marginBottom: '0.5rem' }}>
          Sign in to unlock Analytics
        </h3>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          Track your resume improvement over time with detailed historical analytics.
        </p>
        <a href="/login" className="btn btn-gold" style={{ display: 'inline-flex', gap: 8, padding: '10px 24px' }}>
          Sign In Free →
        </a>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 32, height: 32, border: '2px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%' }}
        />
      </div>
    )
  }

  if (state.scans.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
        <FileText size={36} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
        <p>No scans yet. Analyze your first resume to see analytics here.</p>
      </div>
    )
  }

  return (
    <div>
      {/* View tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'var(--ink3)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {[['overview', 'Overview'], ['history', 'History'], ['radar', 'Radar']].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              padding: '6px 16px',
              borderRadius: 7,
              border: 'none',
              background: view === v ? 'var(--surface)' : 'transparent',
              color: view === v ? 'var(--cream)' : 'var(--muted)',
              fontSize: '0.8rem',
              fontWeight: view === v ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'overview' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <StatCard label="Total Scans" value={state.scans.length} icon={FileText} color="#3b82f6" delay={0} />
            <StatCard label="Average Score" value={`${avgScore}%`} icon={TrendingUp} color="#e2a840" delay={0.05} />
            <StatCard label="Best Grade" value={bestGrade} icon={Award} color={GRADE_COLORS[bestGrade] || '#22c55e'} delay={0.1} />
            {improvement !== null && (
              <StatCard
                label="Improvement"
                value={`${improvement > 0 ? '+' : ''}${improvement}%`}
                sub="vs previous scan"
                icon={TrendingUp}
                color={improvement >= 0 ? '#22c55e' : '#ef4444'}
                delay={0.15}
              />
            )}
          </div>

          {/* Score trend chart */}
          {chartData.length > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: 'var(--ink2)',
                border: '1px solid var(--border)',
                borderRadius: 14,
                padding: '1.5rem',
              }}
            >
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1.25rem' }}>Score Over Time</h4>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e2a840" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#e2a840" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="overall" name="Overall" stroke="#e2a840" strokeWidth={2} fill="url(#scoreGrad)" dot={{ fill: '#e2a840', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </>
      )}

      {view === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.scans.map((scan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                background: 'var(--ink2)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 10,
                background: `${GRADE_COLORS[scan.grade] || '#e2a840'}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 700,
                color: GRADE_COLORS[scan.grade] || '#e2a840',
                flexShrink: 0,
              }}>
                {scan.grade}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {scan.filename || 'resume.pdf'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 1 }}>
                  {scan.created_at ? new Date(scan.created_at).toLocaleDateString() : 'Recent'} · {scan.used_ai ? 'AI Analysis' : 'Heuristic'}
                </div>
                {scan.job_match_score !== null && scan.job_match_score !== undefined && (
                  <div style={{ fontSize: '0.72rem', color: 'var(--gold)', marginTop: 2, fontWeight: 600 }}>
                    🎯 Job Match: {scan.job_match_score}%
                  </div>
                )}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '1.1rem', fontWeight: 700, color: GRADE_COLORS[scan.grade] || '#e2a840' }}>
                {scan.overall}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {view === 'radar' && latest && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            background: 'var(--ink2)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            padding: '1.5rem',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: 'var(--muted)', fontSize: 12 }} />
              <Radar name="Score" dataKey="score" stroke="#e2a840" fill="#e2a840" fillOpacity={0.15} strokeWidth={2} />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  )
}
