import { useState, useCallback, useRef } from 'react'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * useStreamingAnalysis — streams AI feedback token-by-token
 * Falls back to regular fetch if server doesn't support streaming.
 */
export function useStreamingAnalysis() {
  const [streamText, setStreamText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamDone, setStreamDone] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  const stream = useCallback(async (file, onChunk) => {
    setStreamText('')
    setIsStreaming(true)
    setStreamDone(false)
    setError(null)

    abortRef.current = new AbortController()
    const fd = new FormData()
    fd.append('file', file)

    try {
      const token = localStorage.getItem('resumeai_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const res = await fetch(`${BASE}/analyze/stream`, {
        method: 'POST',
        body: fd,
        headers,
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        // Fallback: use regular analyze endpoint
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Stream not supported, use /analyze')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6).trim()
            if (raw === '[DONE]') {
              setStreamDone(true)
              break
            }
            try {
              const parsed = JSON.parse(raw)
              const chunk = parsed.delta || parsed.text || parsed.content || ''
              if (chunk) {
                setStreamText(t => t + chunk)
                onChunk?.(chunk)
              }
            } catch {
              // Non-JSON chunk, treat as raw text
              if (raw) {
                setStreamText(t => t + raw)
                onChunk?.(raw)
              }
            }
          }
        }
      }

      setStreamDone(true)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setIsStreaming(false)
    }
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    setStreamText('')
    setIsStreaming(false)
    setStreamDone(false)
    setError(null)
  }, [])

  return { streamText, isStreaming, streamDone, error, stream, stop, reset }
}

/**
 * useAIChat — multi-turn streaming chat with the AI about your resume
 */
export function useAIChat() {
  const [messages, setMessages] = useState([])
  const [thinking, setThinking] = useState(false)
  const abortRef = useRef(null)

  const send = useCallback(async (userMsg, resumeContext = '') => {
    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setThinking(true)

    // Add empty assistant message that will stream in
    setMessages(prev => [...prev, { role: 'assistant', content: '', streaming: true }])

    abortRef.current = new AbortController()

    try {
      const token = localStorage.getItem('resumeai_token')
      const res = await fetch(`${BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: newMessages, context: resumeContext }),
        signal: abortRef.current.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error('Chat unavailable')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        full += chunk
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: full, streaming: true }
          return updated
        })
      }

      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: full, streaming: false }
        return updated
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: "I couldn't connect to the AI. Please check your API key and try again.",
            streaming: false,
            error: true,
          }
          return updated
        })
      }
    } finally {
      setThinking(false)
    }
  }, [messages])

  const clear = useCallback(() => setMessages([]), [])

  return { messages, thinking, send, clear }
}
