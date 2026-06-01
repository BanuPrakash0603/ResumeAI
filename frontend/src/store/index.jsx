import { createContext, useContext, useReducer, useEffect } from 'react'
import { auth } from '../utils/api.js'

// ── State shape ───────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  scans: [],
  currentScan: null,
  onboardingComplete: false,
  onboardingStep: 0,
  streamingText: '',
  isStreaming: false,
  notifications: [],
  analyticsView: 'overview', // 'overview' | 'history' | 'trends'
}

// ── Actions ───────────────────────────────────────────────────────────────────
export const Actions = {
  SET_USER: 'SET_USER',
  LOGOUT: 'LOGOUT',
  ADD_SCAN: 'ADD_SCAN',
  SET_SCANS: 'SET_SCANS',
  SET_CURRENT_SCAN: 'SET_CURRENT_SCAN',
  COMPLETE_ONBOARDING: 'COMPLETE_ONBOARDING',
  SET_ONBOARDING_STEP: 'SET_ONBOARDING_STEP',
  SET_STREAMING: 'SET_STREAMING',
  APPEND_STREAM: 'APPEND_STREAM',
  CLEAR_STREAM: 'CLEAR_STREAM',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_ANALYTICS_VIEW: 'SET_ANALYTICS_VIEW',
}

function reducer(state, action) {
  switch (action.type) {
    case Actions.SET_USER:
      return { ...state, user: action.payload }
    case Actions.LOGOUT:
      return { ...state, user: null, scans: [], currentScan: null }
    case Actions.ADD_SCAN:
      return { ...state, scans: [action.payload, ...state.scans] }
    case Actions.SET_SCANS:
      return { ...state, scans: action.payload }
    case Actions.SET_CURRENT_SCAN:
      return { ...state, currentScan: action.payload }
    case Actions.COMPLETE_ONBOARDING:
      return { ...state, onboardingComplete: true }
    case Actions.SET_ONBOARDING_STEP:
      return { ...state, onboardingStep: action.payload }
    case Actions.SET_STREAMING:
      return { ...state, isStreaming: action.payload }
    case Actions.APPEND_STREAM:
      return { ...state, streamingText: state.streamingText + action.payload }
    case Actions.CLEAR_STREAM:
      return { ...state, streamingText: '', isStreaming: false }
    case Actions.ADD_NOTIFICATION: {
      const notif = { id: Date.now(), ...action.payload }
      return { ...state, notifications: [...state.notifications, notif] }
    }
    case Actions.REMOVE_NOTIFICATION:
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.payload) }
    case Actions.SET_ANALYTICS_VIEW:
      return { ...state, analyticsView: action.payload }
    default:
      return state
  }
}

// ── Context ───────────────────────────────────────────────────────────────────
const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const saved = localStorage.getItem('resumeai_onboarding')
    const authData = auth.get()
    return {
      ...init,
      onboardingComplete: saved === 'done',
      user: authData.isLoggedIn ? { email: authData.email, plan: authData.plan } : null,
    }
  })

  // Persist onboarding state
  useEffect(() => {
    if (state.onboardingComplete) {
      localStorage.setItem('resumeai_onboarding', 'done')
    }
  }, [state.onboardingComplete])

  // Auto-dismiss notifications after 5s
  useEffect(() => {
    state.notifications.forEach(n => {
      if (!n.persistent) {
        const t = setTimeout(() => dispatch({ type: Actions.REMOVE_NOTIFICATION, payload: n.id }), 5000)
        return () => clearTimeout(t)
      }
    })
  }, [state.notifications])

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => useContext(StoreContext)

// ── Convenience selectors ─────────────────────────────────────────────────────
export const useUser = () => useStore().state.user
export const useScans = () => useStore().state.scans
export const useCurrentScan = () => useStore().state.currentScan
export const useOnboarding = () => {
  const { state, dispatch } = useStore()
  return {
    complete: state.onboardingComplete,
    step: state.onboardingStep,
    setStep: (s) => dispatch({ type: Actions.SET_ONBOARDING_STEP, payload: s }),
    finish: () => dispatch({ type: Actions.COMPLETE_ONBOARDING }),
  }
}
export const useStreaming = () => {
  const { state, dispatch } = useStore()
  return {
    text: state.streamingText,
    isStreaming: state.isStreaming,
    setStreaming: (v) => dispatch({ type: Actions.SET_STREAMING, payload: v }),
    append: (t) => dispatch({ type: Actions.APPEND_STREAM, payload: t }),
    clear: () => dispatch({ type: Actions.CLEAR_STREAM }),
  }
}
export const useNotifications = () => {
  const { state, dispatch } = useStore()
  return {
    items: state.notifications,
    add: (notif) => dispatch({ type: Actions.ADD_NOTIFICATION, payload: notif }),
    remove: (id) => dispatch({ type: Actions.REMOVE_NOTIFICATION, payload: id }),
  }
}
