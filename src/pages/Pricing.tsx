import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { createCheckoutSession } from '../lib/stripe'
import AuthModal from '../components/auth/AuthModal'

const tiers = [
  {
    name: 'Newbie',
    price: 0,
    priceLabel: 'Free',
    tier: 'newbie' as const,
    agents: '1 agent',
    prompts: '5 prompts/day',
    features: ['1 AI agent', '5 prompts per day', 'Basic templates', 'Community support'],
    cta: 'Get started',
    highlight: false,
  },
  {
    name: 'Creator',
    price: 12,
    priceLabel: '$12/mo',
    tier: 'creator' as const,
    agents: '2 agents',
    prompts: '20 prompts/day',
    features: ['2 AI agents', '20 prompts per day', 'All templates', 'Prompt history', 'Email support'],
    cta: 'Start creating',
    highlight: false,
  },
  {
    name: 'Studio',
    price: 29,
    priceLabel: '$29/mo',
    tier: 'studio' as const,
    agents: '5 agents',
    prompts: '50 prompts/day',
    features: ['5 AI agents', '50 prompts per day', 'All templates', 'Prompt history', 'Priority support', 'Export library'],
    cta: 'Build your studio',
    highlight: true,
  },
  {
    name: 'Pro',
    price: 59,
    priceLabel: '$59/mo',
    tier: 'pro' as const,
    agents: 'Unlimited agents',
    prompts: 'Unlimited prompts',
    features: ['Unlimited agents', 'Unlimited prompts', 'All templates', 'Full history', 'Priority support', 'Export library', 'API access'],
    cta: 'Go pro',
    highlight: false,
  },
]

export default function Pricing() {
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('tier').eq('id', user.id).single()
      .then(({ data }) => { if (data) setUserTier(data.tier) })
  }, [user])

  async function handleSelect(tier: typeof tiers[0]) {
    if (tier.price === 0) {
      if (!user) setShowAuth(true)
      else window.location.href = '/dashboard'
      return
    }

    if (!user) {
      setShowAuth(true)
      return
    }

    setLoading(tier.tier)
    try {
      await createCheckoutSession(tier.tier as 'creator' | 'studio' | 'pro')
    } catch (err) {
      console.error(err)
      setLoading(null)
    }
  }

  const tierOrder = ['newbie', 'creator', 'studio', 'pro']
  const userTierIndex = userTier ? tierOrder.indexOf(userTier) : -1

  return (
    <div className="min-h-screen bg-[#0d1117] text-white px-4 py-16">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          {user && (
            <a href="/dashboard" className="inline-block text-xs text-slate-500 hover:text-slate-300 mb-6 transition-colors">
              ← Back to dashboard
            </a>
          )}
          <h1 className="text-4xl font-black tracking-tight mb-3">
            prmpt<span className="text-sky-400">VAULT</span> pricing
          </h1>
          <p className="text-slate-400">Start free. Scale when you're ready.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {tiers.map((tier) => {
            const isCurrent = userTier === tier.tier
            const tierIndex = tierOrder.indexOf(tier.tier)
            const isDowngrade = userTierIndex > tierIndex
            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  isCurrent
                    ? 'bg-white/5 border border-white/20'
                    : tier.highlight
                    ? 'bg-sky-500/10 border border-sky-500/40'
                    : 'bg-white/3 border border-white/8'
                }`}
              >
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Current plan
                    </span>
                  </div>
                )}
                {!isCurrent && tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-sky-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most popular
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {tier.name}
                  </div>
                  <div className="text-3xl font-black text-white">{tier.priceLabel}</div>
                  {tier.price > 0 && (
                    <div className="text-xs text-slate-500 mt-0.5">per month</div>
                  )}
                </div>

                <ul className="flex-1 space-y-2 mb-6">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <span className="text-sky-400 text-xs">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrent && !isDowngrade && handleSelect(tier)}
                  disabled={loading === tier.tier || isCurrent || isDowngrade}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isCurrent
                      ? 'bg-white/8 text-slate-500 border border-white/10 cursor-default'
                      : isDowngrade
                      ? 'bg-white/5 text-slate-600 border border-white/8 cursor-default'
                      : tier.highlight
                      ? 'bg-sky-500 hover:bg-sky-400 text-white'
                      : 'bg-white/8 hover:bg-white/12 text-white border border-white/10'
                  } disabled:cursor-not-allowed`}
                >
                  {loading === tier.tier
                    ? 'Redirecting…'
                    : isCurrent
                    ? 'Current plan'
                    : isDowngrade
                    ? 'Downgrade'
                    : tier.cta}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
