import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

// OAuth sign-ups for new accounts are rejected by the DB (signups closed ahead of the Oct 19
// shutdown) and come back with error params instead of a code — explain rather than bounce.
function oauthErrorDescription(): string | null {
  const query = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  return query.get('error_description') ?? hash.get('error_description')
}

export default function AuthCallback() {
  const navigate = useNavigate()
  const [errorDescription] = useState(oauthErrorDescription)

  useEffect(() => {
    if (errorDescription) return
    supabase.auth.exchangeCodeForSession(window.location.href)
      .then(({ error }) => {
        if (error) console.error('Auth callback error:', error.message)
        navigate('/dashboard', { replace: true })
      })
  }, [])

  if (errorDescription) {
    const signupBlocked = /database error/i.test(errorDescription)
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-6">
        <div className="max-w-sm text-center">
          <p className="text-white font-semibold mb-2">We couldn't sign you in</p>
          <p className="text-sm text-slate-400 mb-6">
            {signupBlocked
              ? 'New signups are closed. prmptVAULT is shutting down on October 19. If you already have an account, sign in the same way you did before.'
              : errorDescription}
          </p>
          <a href="/" className="text-sm text-sky-400 hover:underline">Back to prmptVAULT</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
      <div className="text-slate-400 text-sm animate-pulse">Signing you in…</div>
    </div>
  )
}
