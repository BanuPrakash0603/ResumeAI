import { Navigate } from 'react-router-dom'
import { auth } from '../utils/api'

export default function ProtectedRoute({ children }) {
  const user = auth.get()

  return user.isLoggedIn
    ? children
    : <Navigate to="/login" replace />
}