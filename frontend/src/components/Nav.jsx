import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, BarChart2 } from 'lucide-react'
import { auth } from '../utils/api.js'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const user = auth.get()
  const { isDark, toggle } = useTheme()

  const handleLogout = () => {
    auth.clear()
    navigate('/')
  }

  const links = [
    { to: '/#features', label: 'Features' },
    { to: '/#how', label: 'How It Works' },
    { to: '/#reviews', label: 'Reviews' },
    { to: '/pricing', label: 'Pricing' },
  ]

  return (
    <nav className="nav">
      <div className="nav-inner">
        {/* Logo */}
        <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>
          <div className="nav-logo-mark">R</div>
          <span>ResumeAI</span>
        </Link>

        {/* Desktop links */}
        <div className="nav-links">
          {links.map(l => (
            <Link key={l.to} to={l.to}
              style={{ textDecoration: 'none', color: pathname === l.to ? 'var(--cream)' : 'var(--muted)', transition: 'color 0.2s' }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="nav-actions">
          {/* Theme toggle */}
          <button className="theme-toggle" onClick={toggle} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {user.isLoggedIn ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '0.82rem', gap: 6 }}>
                <BarChart2 size={14} /> Dashboard
              </Link>
              <Link to="/analyze" className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                Analyze
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
                Sign in
              </Link>
              <Link to="/analyze" className="btn btn-gold" style={{ padding: '9px 18px', fontSize: '0.82rem' }}>
                Try Free →
              </Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button className="nav-hamburger" onClick={() => setMenuOpen(o => !o)}>
          {menuOpen ? <X size={22} color="var(--cream)" /> : <Menu size={22} color="var(--cream)" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mobile-menu open"
            style={{ overflow: 'hidden' }}
          >
            {links.map(l => (
              <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)}
                style={{ fontSize: '1rem', color: 'var(--muted)', padding: '0.6rem 0', display: 'block', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem', flexWrap: 'wrap' }}>
              <button className="theme-toggle" onClick={toggle} style={{ width: 'auto', padding: '8px 14px', gap: 6, display: 'flex', alignItems: 'center', fontSize: '0.82rem', color: 'var(--cream)' }}>
                {isDark ? <><Sun size={14} /> Light mode</> : <><Moon size={14} /> Dark mode</>}
              </button>
              {user.isLoggedIn ? (
                <Link to="/dashboard" className="btn btn-ghost" onClick={() => setMenuOpen(false)} style={{ padding: '8px 14px', fontSize: '0.82rem', gap: 6 }}>
                  <BarChart2 size={14} /> Dashboard
                </Link>
              ) : null}
            </div>
            <Link to="/analyze" className="btn btn-gold mobile-full" onClick={() => setMenuOpen(false)} style={{ marginTop: '0.75rem', justifyContent: 'center' }}>
              Try Free →
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
