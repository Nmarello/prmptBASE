import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) console.error('Auth callback error:', error.message)
        navigate('/dashboard', { replace: true })
      })
  }, [])

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Signing you in…</div>
    </div>
  )
}
