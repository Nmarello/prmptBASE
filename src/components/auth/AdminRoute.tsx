import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-slate-400 text-sm animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!user || !isAdmin) return <Navigate to="/" replace />

  return <>{children}</>
}
