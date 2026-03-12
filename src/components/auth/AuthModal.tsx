import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

type Mode = 'signin' | 'signup' | 'verify'

interface AuthModalProps {
  onClose?: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithMicrosoft, signInWithFacebook, signInWithEmail, signUp } = useAuth()
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

  const oauthButtons = (
    <div className="flex flex-col gap-3">
      <button
        onClick={signInWithGoogle}
        className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
      >
        <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
        Continue with Google
      </button>
      <button
        onClick={signInWithMicrosoft}
        className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
      >
        <span className="text-base leading-none">⊞</span>
        Continue with Microsoft
      </button>
      <button
        onClick={signInWithFacebook}
        className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all"
      >
        <span className="text-blue-400 font-bold text-base leading-none">f</span>
        Continue with Facebook
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
          <div className="text-3xl font-black tracking-tight text-white mb-1">
            prmpt<span className="text-sky-400">VAULT</span>
          </div>
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
