import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import Logo from '../Logo'

type Mode = 'signin' | 'signup' | 'verify'

interface AuthModalProps {
  onClose?: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithApple, signInWithMicrosoft, signInWithFacebook, signInWithDiscord, signInWithGithub, signInWithEmail, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendDone, setResendDone] = useState(false)

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setUnconfirmedEmail(false)
    setLoading(true)
    const { error: err } = await signInWithEmail(email, password)
    if (err) {
      if (err.toLowerCase().includes('email not confirmed')) {
        setUnconfirmedEmail(true)
      } else {
        setError(err)
      }
    }
    setLoading(false)
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error: err } = await signUp(email, password)
    if (err) {
      setError(err)
    } else {
      setMode('verify')
    }
    setLoading(false)
  }

  async function handleResend() {
    setResendLoading(true)
    setResendDone(false)
    await supabase.auth.resend({ type: 'signup', email })
    setResendLoading(false)
    setResendDone(true)
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
    setUnconfirmedEmail(false)
    setResendDone(false)
    setPassword('')
    setConfirmPassword('')
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500/50'

  const btnCls = "flex items-center justify-center gap-3 w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all cursor-pointer"

  const oauthButtons = (
    <div className="flex flex-col gap-2">
      <button onClick={signInWithGoogle} className={btnCls}>
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>
      <button onClick={signInWithApple} className={btnCls}>
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
        Continue with Apple
      </button>
      <button onClick={signInWithMicrosoft} className={btnCls}>
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
        Continue with Microsoft
      </button>
    </div>
  )

  const divider = (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-white/8" />
      <span className="text-xs text-slate-500">or</span>
      <div className="flex-1 h-px bg-white/8" />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-white/10 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl relative">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <Logo height={35} theme="dark" style={{ marginBottom: 4 }} />
          {mode === 'signin' && <p className="text-sm text-slate-400">Sign in to start building better prompts</p>}
          {mode === 'signup' && <p className="text-sm text-slate-400">Create your account</p>}
          {mode === 'verify' && <p className="text-sm text-slate-400">Almost there!</p>}
        </div>

        {/* VERIFY mode */}
        {mode === 'verify' && (
          <div className="text-center">
            <div className="text-5xl mb-4">📬</div>
            <p className="text-white font-semibold mb-2">Check your email</p>
            <p className="text-sm text-slate-400 mb-6">
              We sent a confirmation link to <span className="text-sky-400">{email}</span>. Click it to activate your account.
            </p>
            {resendDone && <p className="text-xs text-green-400 mb-3">Email resent! Check your inbox.</p>}
            <button
              onClick={handleResend}
              disabled={resendLoading}
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50 mb-3"
            >
              {resendLoading ? 'Sending…' : 'Resend email'}
            </button>
            <button
              onClick={() => switchMode('signin')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Back to sign in
            </button>
          </div>
        )}

        {/* SIGNIN mode */}
        {mode === 'signin' && (
          <>
            {oauthButtons}
            {divider}
            <form onSubmit={handleSignIn} className="flex flex-col gap-3">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
              {unconfirmedEmail && (
                <div className="text-xs text-amber-400">
                  Please confirm your email first. Check your inbox.{' '}
                  {resendDone
                    ? <span className="text-green-400">Email resent!</span>
                    : <button type="button" onClick={handleResend} disabled={resendLoading} className="underline hover:text-amber-300 transition-colors">
                        {resendLoading ? 'Sending…' : 'Resend email'}
                      </button>
                  }
                </div>
              )}
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-all"
              >
                {loading ? 'Signing in…' : 'Sign in with email'}
              </button>
            </form>
            <p className="text-center text-xs text-slate-600 mt-4">
              By signing in you agree to our{' '}
              <a href="/tos" className="text-sky-500 hover:underline">Terms</a>{' '}
              and{' '}
              <a href="/privacy" className="text-sky-500 hover:underline">Privacy Policy</a>
            </p>
            <p className="text-center text-xs text-slate-500 mt-3">
              Don't have an account?{' '}
              <button onClick={() => switchMode('signup')} className="text-sky-400 hover:underline">Sign up</button>
            </p>
          </>
        )}

        {/* SIGNUP mode */}
        {mode === 'signup' && (
          <>
            {oauthButtons}
            {divider}
            <form onSubmit={handleSignUp} className="flex flex-col gap-3">
              <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} />
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className={inputCls} />
              <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={inputCls} />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 rounded-xl text-sm font-semibold text-white transition-all"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
            <p className="text-center text-xs text-slate-600 mt-4">
              By signing up you agree to our{' '}
              <a href="/tos" className="text-sky-500 hover:underline">Terms</a>{' '}
              and{' '}
              <a href="/privacy" className="text-sky-500 hover:underline">Privacy Policy</a>
            </p>
            <p className="text-center text-xs text-slate-500 mt-3">
              Already have an account?{' '}
              <button onClick={() => switchMode('signin')} className="text-sky-400 hover:underline">Sign in</button>
            </p>
          </>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-500 hover:text-white text-xl"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
