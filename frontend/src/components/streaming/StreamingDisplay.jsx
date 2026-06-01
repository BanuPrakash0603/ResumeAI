import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Bot, StopCircle, Loader2 } from 'lucide-react'

// Blinking cursor
function Cursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ repeat: Infinity, duration: 0.6, ease: 'linear' }}
      style={{ display: 'inline-block', width: 2, height: '1em', background: 'var(--gold)', marginLeft: 2, verticalAlign: 'middle' }}
    />
  )
}

/**
 * StreamingDisplay — renders the streaming AI text with a live cursor
 */
export function StreamingDisplay({ text, isStreaming, label = 'AI Analysis', onStop }) {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [text])

  if (!text && !isStreaming) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'var(--ink2)',
        border: '1px solid rgba(226,168,64,0.2)',
        borderRadius: 14,
        padding: '1.5rem',
        marginBottom: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(226,168,64,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {isStreaming
              ? <Loader2 size={14} color="var(--gold)" style={{ animation: 'spin 1s linear infinite' }} />
              : <Bot size={14} color="var(--gold)" />
            }
          </div>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {label}
          </span>
          {isStreaming && (
            <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
              streaming…
            </span>
          )}
        </div>

        {isStreaming && onStop && (
          <button
            onClick={onStop}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444',
              padding: '4px 10px',
              borderRadius: 6,
              fontSize: '0.72rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <StopCircle size={11} /> Stop
          </button>
        )}
      </div>

      {/* Streaming glow bar */}
      {isStreaming && (
        <motion.div
          animate={{ x: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
          }}
        />
      )}

      {/* Text content */}
      <div style={{
        fontSize: '0.88rem',
        lineHeight: 1.75,
        color: 'var(--cream)',
        fontFamily: 'var(--sans)',
        whiteSpace: 'pre-wrap',
        maxHeight: 400,
        overflowY: 'auto',
      }}>
        {text}
        {isStreaming && <Cursor />}
        <div ref={endRef} />
      </div>
    </motion.div>
  )
}

/**
 * AIChat — interactive chat panel for asking follow-up questions about resume
 */
export function AIChat({ messages, thinking, onSend, resumeContext }) {
  const [input, setInput] = React.useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || thinking) return
    onSend(input.trim(), resumeContext)
    setInput('')
  }

  const suggestions = [
    'What is my biggest weakness?',
    'How can I improve my ATS score?',
    'Rewrite my summary section',
    'What keywords am I missing?',
  ]

  return (
    <div style={{
      background: 'var(--ink2)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      height: 400,
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--ink3)',
      }}>
        <Bot size={16} color="var(--gold)" />
        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Ask the AI</span>
        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', marginLeft: 4 }}>about your resume</span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div>
            <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>Suggested questions:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s, resumeContext)}
                  style={{
                    background: 'var(--ink3)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    color: 'var(--muted)',
                    fontSize: '0.78rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              background: msg.role === 'user' ? 'rgba(226,168,64,0.12)' : 'var(--ink3)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(226,168,64,0.25)' : 'var(--border)'}`,
              borderRadius: 10,
              padding: '0.6rem 0.9rem',
              fontSize: '0.82rem',
              lineHeight: 1.6,
              color: msg.error ? '#ef4444' : 'var(--cream)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {msg.content}
            {msg.streaming && <Cursor />}
          </motion.div>
        ))}

        {thinking && messages[messages.length - 1]?.role !== 'assistant' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              alignSelf: 'flex-start',
              background: 'var(--ink3)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: '0.6rem 0.9rem',
              display: 'flex',
              gap: 4,
              alignItems: 'center',
            }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ y: [-2, 2, -2] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--muted)' }}
              />
            ))}
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '0.75rem 1rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about your resume…"
          style={{
            flex: 1,
            background: 'var(--ink3)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 12px',
            color: 'var(--cream)',
            fontSize: '0.82rem',
            outline: 'none',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--gold)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
        />
        <button
          type="submit"
          disabled={!input.trim() || thinking}
          style={{
            background: 'var(--gold)',
            border: 'none',
            borderRadius: 8,
            padding: '8px 16px',
            color: 'var(--ink)',
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed',
            opacity: input.trim() && !thinking ? 1 : 0.5,
          }}
        >
          Send
        </button>
      </form>
    </div>
  )
}

import React from 'react'
