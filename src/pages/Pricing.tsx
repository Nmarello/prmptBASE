import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { createCheckoutSession } from '../lib/stripe'
import AuthModal from '../components/auth/AuthModal'

type BillingCycle = 'monthly' | 'annual'

const MONTHLY_PRICES: Record<string, number> = {
  creator: 12,
  studio: 29,
  pro: 59,
}

const ANNUAL_MONTHLY: Record<string, number> = {
  creator: 10,
  studio: 24,
  pro: 49,
}

const ANNUAL_YEARLY: Record<string, number> = {
  creator: 120,
  studio: 290,
  pro: 590,
}

const tiers = [
  {
    name: 'Free',
    tier: 'newbie' as const,
    price: 0,
    features: [
      '15 images / month',
      'DALL-E 3 + Flux Schnell',
      'Core models only',
      'No video models',
      'Assets saved to vault',
    ],
    cta: 'Get started',
    highlight: false,
    trial: false,
  },
  {
    name: 'Creator',
    tier: 'creator' as const,
    price: 12,
    features: [
      '500 images / month',
      'All image models',
      'No video models',
      'Priority queue',
      'Assets saved to vault',
      'AI Assist',
    ],
    cta: 'Start free trial',
    highlight: false,
    trial: true,
  },
  {
    name: 'Studio',
    tier: 'studio' as const,
    price: 29,
    features: [
      '2,000 images / month',
      'All image models',
      'All video models',
      'Priority queue',
      'Assets saved to vault',
      'AI Assist',
      'Export library',
    ],
    cta: 'Start free trial',
    highlight: true,
    trial: true,
  },
  {
    name: 'Pro',
    tier: 'pro' as const,
    price: 59,
    features: [
      'Unlimited images',
      'All image models',
      'All video models',
      'Priority queue',
      'Unlimited storage',
      'AI Assist',
      'Export library',
      'API access',
    ],
    cta: 'Start free trial',
    highlight: false,
    trial: true,
  },
]

export default function Pricing() {
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [userTier, setUserTier] = useState<string | null>(null)
  const [billing, setBilling] = useState<BillingCycle>('monthly')
  const [teamsEmail, setTeamsEmail] = useState('')

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

  function getPrice(tier: typeof tiers[0]) {
    if (tier.price === 0) return '$0'
    if (billing === 'annual') return `$${ANNUAL_MONTHLY[tier.tier]}`
    return `$${MONTHLY_PRICES[tier.tier]}`
  }

  function getBillingNote(tier: typeof tiers[0]) {
    if (tier.price === 0) return null
    if (billing === 'annual') return `Billed $${ANNUAL_YEARLY[tier.tier]}/yr`
    return 'per month'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f7', color: '#1d1d1f', fontFamily: "'Inter', -apple-system, sans-serif", padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
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
          <p style={{ fontSize: 17, color: '#6e6e73', marginBottom: 32 }}>Start free. Scale when you're ready.</p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: '#e5e5ea', borderRadius: 100, padding: 4, gap: 2 }}>
            <button
              onClick={() => setBilling('monthly')}
              style={{
                padding: '6px 20px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: billing === 'monthly' ? '#fff' : 'transparent',
                color: billing === 'monthly' ? '#1d1d1f' : '#6e6e73',
                boxShadow: billing === 'monthly' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >Monthly</button>
            <button
              onClick={() => setBilling('annual')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 20px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: billing === 'annual' ? '#fff' : 'transparent',
                color: billing === 'annual' ? '#1d1d1f' : '#6e6e73',
                boxShadow: billing === 'annual' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Annual
              <span style={{ background: '#34c759', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100 }}>2 months free</span>
            </button>
          </div>
        </div>

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, alignItems: 'start' }}>
          {tiers.map((tier) => {
            const isCurrent = userTier === tier.tier
            const tierIndex = tierOrder.indexOf(tier.tier)
            const isDowngrade = userTierIndex > tierIndex
            return (
              <div key={tier.name} style={{
                position: 'relative', borderRadius: 20, padding: '28px 24px',
                display: 'flex', flexDirection: 'column',
                background: '#fff',
                border: isCurrent ? '1px solid rgba(0,113,227,0.5)' : tier.highlight ? '1px solid rgba(0,113,227,0.35)' : '1px solid #d2d2d7',
                boxShadow: isCurrent || tier.highlight ? '0 0 0 3px rgba(0,113,227,0.08)' : 'none',
              }}>
                {/* Trial badge */}
                {tier.trial && !isCurrent && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#ff9500', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>
                      3-day free trial
                    </span>
                  </div>
                )}

                {/* Current plan / Most popular badges */}
                {isCurrent && (
                  <div style={{ position: 'absolute', top: tier.trial ? 8 : -12, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#0071e3', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 100 }}>Current plan</span>
                  </div>
                )}
                {!isCurrent && tier.highlight && (
                  <div style={{ position: 'absolute', top: tier.trial ? 8 : -12, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#0071e3', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 100 }}>Most popular</span>
                  </div>
                )}

                {/* Tier name + price */}
                <div style={{ marginBottom: 20, marginTop: (tier.trial || tier.highlight) ? 12 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tier.highlight ? '#0071e3' : '#aeaeb2', marginBottom: 10 }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-2px', color: '#1d1d1f', lineHeight: 1 }}>
                    {getPrice(tier)}
                    {tier.price > 0 && <span style={{ fontSize: 15, fontWeight: 500, color: '#aeaeb2', letterSpacing: 0 }}>/mo</span>}
                  </div>
                  {getBillingNote(tier) && (
                    <div style={{ fontSize: 11, color: '#aeaeb2', marginTop: 4 }}>{getBillingNote(tier)}</div>
                  )}
                </div>

                {/* Features */}
                <ul style={{ flex: 1, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#6e6e73' }}>
                      <span style={{ color: '#34c759', fontSize: 11, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>✓</span>
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

          {/* Teams — coming soon */}
          <div style={{
            borderRadius: 20, padding: '28px 24px',
            display: 'flex', flexDirection: 'column',
            background: '#fff',
            border: '1.5px dashed #d2d2d7',
            opacity: 0.85,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aeaeb2', marginBottom: 10 }}>
              Teams
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', color: '#1d1d1f', marginBottom: 6 }}>Coming soon</div>
            <p style={{ fontSize: 13, color: '#aeaeb2', marginBottom: 20, lineHeight: 1.5 }}>
              Shared vaults, team billing, role-based access, and more.
            </p>
            <div style={{ marginTop: 'auto' }}>
              <input
                type="email"
                value={teamsEmail}
                onChange={e => setTeamsEmail(e.target.value)}
                placeholder="your@email.com"
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: 10, fontSize: 13,
                  border: '1.5px solid #d2d2d7', fontFamily: 'inherit', marginBottom: 8,
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
              <button
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', background: 'transparent',
                  color: '#6e6e73', border: '1.5px solid #d2d2d7', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#aeaeb2'; e.currentTarget.style.color = '#1d1d1f' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#d2d2d7'; e.currentTarget.style.color = '#6e6e73' }}
                onClick={() => setTeamsEmail('')}
              >
                Notify me
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
