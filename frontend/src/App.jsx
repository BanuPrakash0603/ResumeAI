import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Nav from './components/Nav.jsx'
import Landing from './pages/Landing.jsx'
import Pricing from './pages/Pricing.jsx'
import Analyze from './pages/Analyze.jsx'
import Login from './pages/Login.jsx'
import Success from './pages/Success.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotificationCenter from './components/NotificationCenter.jsx'
import OnboardingFlow from './components/onboarding/OnboardingFlow.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { StoreProvider, useOnboarding } from './store/index.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/"          element={<Landing />} />
        <Route path="/pricing"   element={<Pricing />} />
        <Route path="/analyze"   element={<ProtectedRoute> <Analyze /> </ProtectedRoute>} />
        <Route path="/login"     element={<Login />} />
        <Route path="/success"   element={<Success />} />
        <Route path="/dashboard" element={<ProtectedRoute> <Dashboard /> </ProtectedRoute>} />
      </Routes>
    </AnimatePresence>
  )
}

function AppContent() {
  const { complete, finish } = useOnboarding()
  return (
    <>
      {!complete && <OnboardingFlow onComplete={finish} />}
      <Nav />
      <AnimatedRoutes />
      <NotificationCenter />
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <StoreProvider>
        <Router>
          <AppContent />
        </Router>
      </StoreProvider>
    </ThemeProvider>
  )
}
