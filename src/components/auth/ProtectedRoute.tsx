import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import AuthModal from './AuthModal'
import { useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const [showModal, setShowModal] = useState(true)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!user) {
    if (showModal) {
      return <AuthModal onClose={() => setShowModal(false)} />
    }
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
