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
    prompts: '15 prompts/day',
    features: ['1 AI agent', 'DALL-E 3', '15 prompts per day', 'Basic templates', 'Community support'],
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
    <div style={{ minHeight: '100vh', background: '#f5f5f7', color: '#1d1d1f', fontFamily: "'Inter', -apple-system, sans-serif", padding: '80px 24px' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {user && (
            <a href="/dashboard" style={{ display: 'inline-block', fontSize: 12, color: '#aeaeb2', marginBottom: 24, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6e6e73')}
              onMouseLeave={e => (e.currentTarget.style.color = '#aeaeb2')}
            >← Back to dashboard</a>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aeaeb2', marginBottom: 12 }}>Pricing</div>
          <h1 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 12, color: '#1d1d1f' }}>
            prmpt<span style={{ color: '#0071e3' }}>VAULT</span>
          </h1>
          <p style={{ fontSize: 17, color: '#6e6e73' }}>Start free. Scale when you're ready.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {tiers.map((tier) => {
            const isCurrent = userTier === tier.tier
            const tierIndex = tierOrder.indexOf(tier.tier)
            const isDowngrade = userTierIndex > tierIndex
            return (
              <div key={tier.name} style={{
                position: 'relative', borderRadius: 20, padding: 24,
                display: 'flex', flexDirection: 'column',
                background: '#fff',
                border: isCurrent ? '1px solid rgba(0,113,227,0.4)' : tier.highlight ? '1px solid rgba(0,113,227,0.3)' : '1px solid #d2d2d7',
                boxShadow: isCurrent || tier.highlight ? '0 0 0 3px rgba(0,113,227,0.08)' : 'none',
              }}>
                {isCurrent && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{ background: '#0071e3', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 100 }}>Current plan</span>
                  </div>
                )}
                {!isCurrent && tier.highlight && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                    <span style={{ background: '#0071e3', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 100 }}>Most popular</span>
                  </div>
                )}

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tier.highlight ? '#0071e3' : '#aeaeb2', marginBottom: 8 }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-2px', color: '#1d1d1f' }}>{tier.priceLabel}</div>
                  {tier.price > 0 && <div style={{ fontSize: 12, color: '#aeaeb2', marginTop: 2 }}>per month</div>}
                </div>

                <ul style={{ flex: 1, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6e6e73' }}>
                      <span style={{ color: '#34c759', fontSize: 12, fontWeight: 700 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => !isCurrent && !isDowngrade && handleSelect(tier)}
                  disabled={loading === tier.tier || isCurrent || isDowngrade}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 10,
                    fontSize: 13, fontWeight: 600, cursor: isCurrent || isDowngrade ? 'default' : 'pointer',
                    fontFamily: 'inherit', transition: 'all 0.15s',
                    background: isCurrent ? 'transparent' : isDowngrade ? 'transparent' : tier.highlight ? '#0071e3' : 'transparent',
                    color: isCurrent ? '#aeaeb2' : isDowngrade ? '#aeaeb2' : tier.highlight ? '#fff' : '#6e6e73',
                    border: tier.highlight && !isCurrent && !isDowngrade ? 'none' : '1.5px solid #d2d2d7',
                  }}
                >
                  {loading === tier.tier ? 'Redirecting…' : isCurrent ? 'Current plan' : isDowngrade ? 'Downgrade' : tier.cta}
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
