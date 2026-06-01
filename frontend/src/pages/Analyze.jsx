import { Navigate } from 'react-router-dom'
import { auth } from '../utils/api'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight, Download, Bot, Map, BarChart2, Target, Zap, XCircle, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../utils/api.js'
import ScoreRing from '../components/ScoreRing.jsx'
import ResumeHeatmap from '../components/heatmap/ResumeHeatmap.jsx'
import { StreamingDisplay, AIChat } from '../components/streaming/StreamingDisplay.jsx'
import { useAIChat } from '../hooks/useStreaming.js'
import { useStore, Actions } from '../store/index.jsx'
import { useNotifications } from '../store/index.jsx'

function Page({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}

const GRADE_COLORS = { A: '#22c55e', B: '#e2a840', C: '#f59e0b', D: '#f97316', F: '#ef4444' }

function ScoreBar({ label, value, color, delay = 0 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
        <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700, color }}>{value}%</span>
      </div>
      <div className="progress-track">
        <motion.div className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.2, delay, ease: 'easeOut' }}
          style={{ background: `linear-gradient(90deg, ${color}aa, ${color})` }}
        />
      </div>
    </div>
  )
}

function SuggestionCard({ s, i }) {
  const badgeClass = `badge-${s.priority}`
  const catColors = { ATS: '#3b82f6', Keywords: '#8b5cf6', Impact: '#f59e0b', Format: '#22c55e', Content: '#e2a840', 'Job Match': '#e879f9' }
  return (
    <motion.div className="result-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08, ease: 'easeOut' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.75rem' }}>
        <span className={badgeClass}>{s.priority}</span>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: catColors[s.category] || 'var(--muted)', background: `${catColors[s.category]}18`, border: `1px solid ${catColors[s.category]}30`, padding: '2px 8px', borderRadius: 100 }}>{s.category}</span>
      </div>
      <h4 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem' }}>{s.title}</h4>
      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.65 }}>{s.detail}</p>
    </motion.div>
  )
}

function JobMatchCard({ result }) {
  const score = result.job_match_score
  if (score === null || score === undefined) return null

  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#e2a840' : '#ef4444'
  const label = score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Match' : 'Weak Match'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        background: `${color}08`,
        border: `1px solid ${color}30`,
        borderRadius: 16,
        padding: '1.5rem',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Target size={18} color={color} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Job Match Score</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>vs. the provided job description</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: '2rem', fontWeight: 700, color }}>{score}%</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color, background: `${color}15`, padding: '2px 8px', borderRadius: 100 }}>{label}</span>
        </div>
      </div>

      <div className="progress-track" style={{ marginBottom: '1.25rem' }}>
        <motion.div className="progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Matched Keywords */}
        {result.matched_keywords?.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.6rem' }}>
              <CheckCircle size={13} color="#22c55e" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#22c55e' }}>
                Matched Keywords ({result.matched_keywords.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {result.matched_keywords.slice(0, 12).map(kw => (
                <span key={kw} style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 100, color: '#22c55e', fontWeight: 600 }}>
                  ✓ {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Missing Keywords */}
        {result.missing_keywords?.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.6rem' }}>
              <XCircle size={13} color="#ef4444" />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ef4444' }}>
                Missing Keywords ({result.missing_keywords.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {result.missing_keywords.slice(0, 12).map(kw => (
                <span key={kw} style={{ fontSize: '0.72rem', padding: '2px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 100, color: '#ef4444', fontWeight: 600 }}>
                  ✗ {kw}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Missing Skills */}
      {result.missing_skills?.length > 0 && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.6rem' }}>
            <Zap size={13} color="#f59e0b" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f59e0b' }}>
              Missing Skills
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {result.missing_skills.map(skill => (
              <span key={skill} style={{ fontSize: '0.72rem', padding: '3px 10px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 100, color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                ❌ {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function ResultsDashboard({ result, filename, onReset }) {
  const [activeTab, setActiveTab] = useState('scores')
  const gradeColor = GRADE_COLORS[result.grade] || '#e2a840'
  const hasJobMatch = result.job_match_score !== null && result.job_match_score !== undefined

  const scoreMetrics = [
    ...(hasJobMatch ? [{ label: 'Job Match', value: result.job_match_score, color: '#e879f9' }] : []),
    { label: 'ATS Compatibility', value: result.ats_score, color: '#3b82f6' },
    { label: 'Keyword Match', value: result.keyword_score, color: '#8b5cf6' },
    { label: 'Readability', value: result.readability, color: '#22c55e' },
    { label: 'Impact Score', value: result.impact_score, color: '#f59e0b' },
  ]
  const { messages, thinking, send } = useAIChat()
  const resumeContext = JSON.stringify({
    score: result.overall,
    grade: result.grade,
    job_match_score: result.job_match_score,
    suggestions: result.suggestions?.slice(0, 3),
    missing_keywords: result.missing_keywords?.slice(0, 5),
    missing_skills: result.missing_skills?.slice(0, 5),
  })

  const [streamText, setStreamText] = useState(result.ai_insight || '')
  const isStreaming = false

  const downloadReport = () => {
    const matchSection = hasJobMatch ? `\nJOB MATCH SCORE: ${result.job_match_score}/100\n\nMATCHED KEYWORDS\n${(result.matched_keywords || []).join(', ')}\n\nMISSING KEYWORDS\n${(result.missing_keywords || []).join(', ')}\n\nMISSING SKILLS\n${(result.missing_skills || []).join(', ')}\n` : ''
    const data = `ResumeAI Analysis Report\n${'='.repeat(40)}\nFile: ${filename}\nDate: ${new Date().toLocaleString()}\n\nOverall Score: ${result.overall}/100 (Grade ${result.grade})${matchSection}\n\nSCORES\n${scoreMetrics.map(m => `${m.label}: ${m.value}%`).join('\n')}\n\nSUGGESTIONS\n${result.suggestions.map((s, i) => `\n${i+1}. [${s.priority.toUpperCase()}] ${s.title}\n   ${s.detail}`).join('\n')}`
    const blob = new Blob([data], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'resumeai-report.txt'; a.click()
    URL.revokeObjectURL(url)
  }

  const tabs = [
    { id: 'scores', label: 'Scores', icon: BarChart2 },
    { id: 'heatmap', label: 'Heatmap', icon: Map },
    { id: 'chat', label: 'Ask AI', icon: Bot },
  ]

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 4 }}>
            {filename} · {result.used_ai ? '🤖 GPT-4o-mini' : '⚡ Heuristic'} {hasJobMatch ? '· 🎯 Job Matched' : ''}
          </div>
          <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.8rem', fontWeight: 400 }}>{result.headline}</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={downloadReport} className="btn btn-ghost" style={{ padding: '9px 16px', fontSize: '0.82rem', gap: 6 }}>
            <Download size={13} /> Download
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={onReset} className="btn btn-ghost" style={{ padding: '9px 16px', fontSize: '0.82rem' }}>
            New Analysis
          </motion.button>
        </div>
      </motion.div>

      {/* Job Match Card — shown prominently when JD was provided */}
      <JobMatchCard result={result} />

      {/* Score overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'center', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.75rem', marginBottom: '1.5rem' }}
        className="grid-2col">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <ScoreRing score={result.overall} size={130} />
          <div style={{ marginTop: '10px', fontFamily: 'var(--serif)', fontSize: '2.6rem', fontWeight: 400, color: gradeColor, lineHeight: 1, display: 'flex', alignItems: 'flex-start', gap: 4 }}>
            {result.grade}
            <span style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.4rem' }}>grade</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {scoreMetrics.map((m, i) => <ScoreBar key={m.label} {...m} delay={i * 0.12} />)}
        </div>
      </div>

      {/* Streaming AI insight */}
      {streamText && (
        <StreamingDisplay text={streamText} isStreaming={isStreaming} label="AI Summary" />
      )}

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: 4, marginBottom: '1.25rem', background: 'var(--ink3)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 16px',
              borderRadius: 7,
              border: 'none',
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--cream)' : 'var(--muted)',
              fontSize: '0.8rem',
              fontWeight: activeTab === tab.id ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}>
            <tab.icon size={13} />{tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'scores' && (
          <motion.div key="scores" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {result.suggestions?.map((s, i) => <SuggestionCard key={i} s={s} i={i} />)}
            </div>
          </motion.div>
        )}
        {activeTab === 'heatmap' && (
          <motion.div key="heatmap" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResumeHeatmap result={result} />
          </motion.div>
        )}
        {activeTab === 'chat' && (
          <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AIChat messages={messages} thinking={thinking} onSend={send} context={resumeContext} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pro upsell */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        style={{ marginTop: '2rem', background: 'linear-gradient(135deg, rgba(226,168,64,0.07), rgba(226,168,64,0.03))', border: '1px solid rgba(226,168,64,0.18)', borderRadius: 16, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.3rem', fontWeight: 400, marginBottom: '0.5rem' }}>
            Ready to fix everything above?
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            Pro users get AI-powered rewriting that applies all suggestions automatically.
          </p>
          <Link to="/pricing" className="btn btn-gold" style={{ gap: 8 }}>
            Upgrade to Pro <ArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function Analyze() {
  const user = auth.get()

  if (!user.isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [progress, setProgress] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const { dispatch } = useStore()
  const { add: addNotification } = useNotifications()

  const onDrop = useCallback(files => {
    if (files[0]) setFile(files[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: (r) => setError(r[0]?.errors[0]?.message || 'File rejected.'),
  })

  const runAnalysis = async () => {
    if (!file) return
    setAnalyzing(true)
    setError('')
    setProgress(0)

    const interval = setInterval(() => {
      setProgress(p => p >= 88 ? 88 : p + Math.random() * 10 + 3)
    }, 200)

    try {
      const res = await api.analyze(file, jobDescription)
      clearInterval(interval)
      setProgress(100)
      await new Promise(r => setTimeout(r, 400))
      setResult(res)
      dispatch({ type: Actions.ADD_SCAN, payload: { ...res, filename: file.name, created_at: new Date().toISOString() } })
      const matchStr = res.job_match_score !== null && res.job_match_score !== undefined ? ` · Job Match: ${res.job_match_score}%` : ''
      addNotification({ type: 'success', title: 'Analysis complete', message: `Your resume scored ${res.overall}/100 — Grade ${res.grade}${matchStr}` })
    } catch (err) {
      clearInterval(interval)
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <Page>
      <div className="page-section">
        <div className="page-inner">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                  <div className="tag">Free Analysis</div>
                  <h1 className="hero-title" style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 400, marginBottom: '0.75rem' }}>
                    Analyze Your Resume
                  </h1>
                  <p style={{ color: 'var(--muted)', fontSize: '1rem' }}>
                    Paste the job description for a real-time match score · PDF, DOCX, or TXT
                  </p>
                </div>

                {/* Job Description */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontWeight: 600, fontSize: '0.9rem' }}>
                    <Target size={15} color="var(--gold)" />
                    Job Description
                    <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 400, marginLeft: 4 }}>
                      (paste to get a job match score)
                    </span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the complete job description here to get a personalised ATS match score, matched/missing keywords, and tailored suggestions..."
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: jobDescription ? '1px solid rgba(226,168,64,0.4)' : '1px solid var(--border)',
                      background: 'var(--ink2)',
                      color: 'var(--cream)',
                      resize: 'vertical',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                  />
                  {jobDescription && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--gold)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={11} /> {jobDescription.length} chars · Job match scoring enabled
                    </div>
                  )}
                </div>

                {/* Drop zone */}
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: 8 }}>
                  Resume File
                </label>
                <motion.div {...getRootProps()} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className={`dropzone ${isDragActive ? 'active' : ''}`}
                  style={{ marginBottom: '1.25rem', cursor: 'pointer' }}>
                  <input {...getInputProps()} />
                  <motion.div animate={isDragActive ? { scale: 1.1 } : { scale: 1 }} style={{ marginBottom: '1rem' }}>
                    <Upload size={40} color="var(--gold)" />
                  </motion.div>
                  <h3>{isDragActive ? 'Drop it here!' : 'Drag & drop your resume'}</h3>
                  <p style={{ marginTop: '0.5rem' }}>or click to browse files</p>
                  <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--muted2)' }}>PDF, DOCX, TXT · up to 5MB</p>
                </motion.div>

                <AnimatePresence>
                  {file && !analyzing && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ background: 'var(--card-bg)', border: '1px solid rgba(226,168,64,0.3)', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
                      <FileText size={20} color="var(--gold)" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{file.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                      </div>
                      <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {analyzing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem' }}>
                        <span style={{ color: 'var(--muted)' }}>
                          {progress < 25 ? 'Extracting text...' : progress < 50 ? 'Running ATS checks...' : progress < 75 ? jobDescription ? 'Matching against job description...' : 'AI scoring resume...' : 'Finalizing report...'}
                        </span>
                        <span style={{ color: 'var(--gold)', fontFamily: 'var(--mono)' }}>{Math.round(progress)}%</span>
                      </div>
                      <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: 10, marginBottom: '1rem', fontSize: '0.875rem' }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button whileHover={{ scale: file ? 1.02 : 1 }} whileTap={{ scale: file ? 0.97 : 1 }}
                  onClick={runAnalysis} disabled={!file || analyzing}
                  className="btn btn-gold btn-lg mobile-full"
                  style={{ width: '100%', justifyContent: 'center', opacity: (!file || analyzing) ? 0.5 : 1, cursor: !file ? 'not-allowed' : 'pointer' }}>
                  {analyzing ? 'Analyzing...' : jobDescription ? '🎯 Analyze & Match to Job' : 'Analyze My Resume'} {!analyzing && <ArrowRight size={18} />}
                </motion.button>

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--muted2)', marginTop: '1rem' }}>
                  Sign in Required · Secured analysis · Instant results
                </p>
              </motion.div>
            ) : (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <ResultsDashboard result={result} filename={file?.name || 'resume'} onReset={() => { setResult(null); setFile(null); setJobDescription(''); setProgress(0) }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Page>
  )
}
