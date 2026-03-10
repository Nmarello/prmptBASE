import { useState } from 'react'
import AuthModal from '../components/auth/AuthModal'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Home() {
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  if (user) navigate('/dashboard')

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-black tracking-tight mb-3">
          prmpt<span className="text-sky-400">VAULT</span>
        </h1>
        <p className="text-xl text-slate-400 mb-2">Build better AI prompts, faster.</p>
        <p className="text-sm text-slate-500 mb-10">
          Structured templates for every AI agent. Unified asset library. One dashboard.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setShowAuth(true)}
            className="px-6 py-3 bg-sky-500 hover:bg-sky-400 rounded-xl font-semibold text-sm transition-all"
          >
            Get started free →
          </button>
          <a
            href="/pricing"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-sm transition-all"
          >
            See pricing
          </a>
        </div>

        {/* Tier teaser */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
          {[
            { name: 'Newbie', price: 'Free', agents: '1 agent', prompts: '5/day' },
            { name: 'Creator', price: '$12/mo', agents: '2 agents', prompts: '20/day' },
            { name: 'Studio', price: '$29/mo', agents: '5 agents', prompts: '50/day' },
            { name: 'Pro', price: '$59/mo', agents: 'Unlimited', prompts: 'Unlimited' },
          ].map((tier) => (
            <div key={tier.name} className="bg-white/3 border border-white/8 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{tier.name}</div>
              <div className="text-lg font-bold text-white">{tier.price}</div>
              <div className="text-xs text-slate-500 mt-1">{tier.agents}</div>
              <div className="text-xs text-slate-500">{tier.prompts}</div>
            </div>
          ))}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
