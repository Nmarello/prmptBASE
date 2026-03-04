import { useAuth } from '../../contexts/AuthContext'

interface AuthModalProps {
  onClose?: () => void
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { signInWithGoogle, signInWithMicrosoft, signInWithFacebook } = useAuth()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-white/10 rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">

        {/* Logo + heading */}
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-tight text-white mb-1">
            prmpt<span className="text-sky-400">BASE</span>
          </div>
          <p className="text-sm text-slate-400">Sign in to start building better prompts</p>
        </div>

        {/* OAuth buttons */}
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

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/8" />
          <span className="text-xs text-slate-500">more coming soon</span>
          <div className="flex-1 h-px bg-white/8" />
        </div>

        {/* Apple — placeholder */}
        <button
          disabled
          className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-white/3 border border-white/6 rounded-xl text-sm font-medium text-slate-600 cursor-not-allowed"
        >
          <span className="text-base leading-none"></span>
          Continue with Apple <span className="text-xs ml-1 text-slate-600">(soon)</span>
        </button>

        <p className="text-center text-xs text-slate-600 mt-6">
          By signing in you agree to our{' '}
          <a href="/terms" className="text-sky-500 hover:underline">Terms</a>{' '}
          and{' '}
          <a href="/privacy" className="text-sky-500 hover:underline">Privacy Policy</a>
        </p>

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
