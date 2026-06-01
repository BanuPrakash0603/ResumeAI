import { motion } from 'framer-motion'

// Heatmap data derived from analysis result
function buildHeatmapSections(result) {
  return [
    {
      id: 'header',
      label: 'Contact & Header',
      score: Math.min(100, result.ats_score + 10),
      height: 60,
      issues: result.keywords_missing?.length > 3 ? ['Missing LinkedIn URL', 'Add GitHub profile'] : [],
      color: getHeatColor(Math.min(100, result.ats_score + 10)),
    },
    {
      id: 'summary',
      label: 'Professional Summary',
      score: result.impact_score,
      height: 70,
      issues: result.impact_score < 60 ? ['Weak action verbs', 'No quantified achievements'] : [],
      color: getHeatColor(result.impact_score),
    },
    {
      id: 'experience',
      label: 'Work Experience',
      score: result.overall,
      height: 180,
      issues: result.suggestions?.filter(s => s.category === 'Impact').map(s => s.title) || [],
      color: getHeatColor(result.overall),
    },
    {
      id: 'skills',
      label: 'Skills',
      score: result.keyword_score,
      height: 80,
      issues: result.keywords_missing?.slice(0, 3).map(k => `Add: ${k}`) || [],
      color: getHeatColor(result.keyword_score),
    },
    {
      id: 'education',
      label: 'Education',
      score: result.readability,
      height: 70,
      issues: result.readability < 60 ? ['Improve formatting', 'Add GPA if > 3.5'] : [],
      color: getHeatColor(result.readability),
    },
  ]
}

function getHeatColor(score) {
  if (score >= 80) return { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.5)', label: '#22c55e', emoji: '🟢' }
  if (score >= 60) return { bg: 'rgba(226,168,64,0.15)', border: 'rgba(226,168,64,0.5)', label: '#e2a840', emoji: '🟡' }
  if (score >= 40) return { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.5)', label: '#f97316', emoji: '🟠' }
  return { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)', label: '#ef4444', emoji: '🔴' }
}

export default function ResumeHeatmap({ result }) {
  const sections = buildHeatmapSections(result)
  const [hoveredSection, setHoveredSection] = React.useState(null)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
      {/* Resume Layout Preview */}
      <div>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          Resume Section Analysis
        </h4>
        <div style={{
          background: 'var(--ink2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          {sections.map((section, i) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onMouseEnter={() => setHoveredSection(section.id)}
              onMouseLeave={() => setHoveredSection(null)}
              style={{
                height: section.height,
                background: hoveredSection === section.id
                  ? section.color.bg.replace('0.15', '0.25')
                  : section.color.bg,
                border: `1.5px solid ${hoveredSection === section.id ? section.color.border : section.color.border.replace('0.5', '0.3')}`,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Score fill bar */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${section.score}%` }}
                transition={{ duration: 1, delay: i * 0.1 + 0.3, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  background: section.color.bg.replace('0.15', '0.08'),
                  borderRadius: 8,
                }}
              />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--cream)' }}>
                  {section.label}
                </div>
                {section.issues.length > 0 && (
                  <div style={{ fontSize: '0.7rem', color: section.color.label, marginTop: 2 }}>
                    {section.issues.length} issue{section.issues.length > 1 ? 's' : ''} found
                  </div>
                )}
              </div>

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  fontFamily: 'var(--mono)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: section.color.label,
                }}>
                  {section.score}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginTop: '1rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Excellent', color: '#22c55e', min: 80 },
            { label: 'Good', color: '#e2a840', min: 60 },
            { label: 'Needs work', color: '#f97316', min: 40 },
            { label: 'Critical', color: '#ef4444', min: 0 },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section Details Panel */}
      <div>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          {hoveredSection ? 'Section Issues' : 'Hover a section'}
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(hoveredSection
            ? sections.filter(s => s.id === hoveredSection)
            : sections.filter(s => s.issues.length > 0).slice(0, 3)
          ).map(section => (
            <motion.div key={section.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'var(--ink2)',
                border: `1px solid ${section.color.border}`,
                borderRadius: 10,
                padding: '1rem',
              }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{section.label}</span>
                <span style={{ color: section.color.label, fontWeight: 700, fontFamily: 'var(--mono)', fontSize: '0.85rem' }}>
                  {section.score}/100
                </span>
              </div>
              {section.issues.length > 0 ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {section.issues.map((issue, i) => (
                    <li key={i} style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      <span style={{ color: section.color.label, flexShrink: 0 }}>→</span>
                      {issue}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '0.78rem', color: '#22c55e' }}>✓ This section looks great!</p>
              )}
            </motion.div>
          ))}

          {!hoveredSection && sections.filter(s => s.issues.length === 0).length > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', padding: '0.5rem' }}>
              Hover any section to see detailed feedback
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Need React import since we use React.useState
import React from 'react'
