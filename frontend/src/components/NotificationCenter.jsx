import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, Zap } from 'lucide-react'
import { useNotifications } from "../store/index.jsx";

const ICONS = {
  success: { icon: CheckCircle, color: '#22c55e' },
  error: { icon: AlertCircle, color: '#ef4444' },
  info: { icon: Info, color: '#3b82f6' },
  ai: { icon: Zap, color: '#e2a840' },
}

export default function NotificationCenter() {
  const { items, remove } = useNotifications()

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      maxWidth: 360,
    }}>
      <AnimatePresence>
        {items.map(notif => {
          const { icon: Icon, color } = ICONS[notif.type] || ICONS.info
          return (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{
                background: 'var(--ink2)',
                border: `1px solid ${color}30`,
                borderRadius: 12,
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ flex: 1 }}>
                {notif.title && (
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2 }}>{notif.title}</div>
                )}
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>{notif.message}</div>
              </div>
              <button
                onClick={() => remove(notif.id)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', flexShrink: 0, padding: 2 }}
              >
                <X size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
