import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
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
      'Pick up to 10 image models',
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
      'Pick up to 5 video models',
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
      'All video models (incl. Sora 2 + Kling)',
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
  const location = useLocation()
  const highlightTier = new URLSearchParams(location.search).get('highlight')
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
      await createCheckoutSession(tier.tier as 'creator' | 'studio' | 'pro', billing)
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
    <div style={{ minHeight: '100vh', background: 'var(--pv-bg)', color: 'var(--pv-text)', fontFamily: "'DM Sans', -apple-system, sans-serif", padding: '80px 24px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {user && (
            <a href="/dashboard" style={{ display: 'inline-block', fontSize: 12, color: 'var(--pv-text3)', marginBottom: 24, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--pv-text2)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--pv-text3)')}
            >← Back to dashboard</a>
          )}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--pv-text3)', marginBottom: 12 }}>Pricing</div>
          <Logo height={48} style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 17, color: 'var(--pv-text2)', marginBottom: 32 }}>Start free. Scale when you're ready.</p>

          {/* Billing toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'var(--pv-surface2)', borderRadius: 100, padding: 4, gap: 2 }}>
            <button
              onClick={() => setBilling('monthly')}
              style={{
                padding: '6px 20px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: billing === 'monthly' ? 'var(--pv-surface)' : 'transparent',
                color: billing === 'monthly' ? 'var(--pv-text)' : 'var(--pv-text2)',
                boxShadow: billing === 'monthly' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
              }}
            >Monthly</button>
            <button
              onClick={() => setBilling('annual')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 20px', borderRadius: 100, fontSize: 13, fontWeight: 600,
                fontFamily: 'inherit', cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: billing === 'annual' ? 'var(--pv-surface)' : 'transparent',
                color: billing === 'annual' ? 'var(--pv-text)' : 'var(--pv-text2)',
                boxShadow: billing === 'annual' ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
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
            const isHighlighted = highlightTier === tier.tier
            return (
              <div key={tier.name} style={{
                position: 'relative', borderRadius: 20, padding: '28px 24px',
                display: 'flex', flexDirection: 'column',
                background: 'var(--pv-surface)',
                border: isCurrent ? '1px solid color-mix(in srgb, var(--pv-accent) 50%, transparent)' : isHighlighted ? '2px solid #f59e0b' : tier.highlight ? '1px solid color-mix(in srgb, var(--pv-accent) 35%, transparent)' : '1px solid var(--pv-border)',
                boxShadow: isCurrent ? '0 0 0 3px color-mix(in srgb, var(--pv-accent) 8%, transparent)' : isHighlighted ? '0 0 0 4px rgba(245,158,11,0.15)' : tier.highlight ? '0 0 0 3px color-mix(in srgb, var(--pv-accent) 8%, transparent)' : 'none',
              }}>
                {/* Highlighted (required for model) badge */}
                {isHighlighted && !isCurrent && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#f59e0b', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>
                      Required for this model
                    </span>
                  </div>
                )}

                {/* Trial badge */}
                {tier.trial && !isCurrent && !isHighlighted && (
                  <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    <span style={{ background: '#ff9500', color: '#fff', fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>
                      3-day free trial
                    </span>
                  </div>
                )}

                {/* Current plan / Most popular badges */}
                {isCurrent && (
                  <div style={{ position: 'absolute', top: tier.trial ? 8 : -12, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    <span style={{ background: 'var(--pv-accent)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 100 }}>Current plan</span>
                  </div>
                )}
                {!isCurrent && tier.highlight && (
                  <div style={{ position: 'absolute', top: tier.trial ? 8 : -12, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                    <span style={{ background: 'var(--pv-accent)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 100 }}>Most popular</span>
                  </div>
                )}

                {/* Tier name + price */}
                <div style={{ marginBottom: 20, marginTop: (tier.trial || tier.highlight) ? 12 : 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tier.highlight ? 'var(--pv-accent)' : 'var(--pv-text3)', marginBottom: 10 }}>
                    {tier.name}
                  </div>
                  <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-2px', color: 'var(--pv-text)', lineHeight: 1 }}>
                    {getPrice(tier)}
                    {tier.price > 0 && <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--pv-text3)', letterSpacing: 0 }}>/mo</span>}
                  </div>
                  {getBillingNote(tier) && (
                    <div style={{ fontSize: 11, color: 'var(--pv-text3)', marginTop: 4 }}>{getBillingNote(tier)}</div>
                  )}
                </div>

                {/* Features */}
                <ul style={{ flex: 1, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
                  {tier.features.map((f) => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--pv-text2)' }}>
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
                    background: isCurrent ? 'transparent' : isDowngrade ? 'transparent' : tier.highlight ? 'var(--pv-accent)' : 'transparent',
                    color: isCurrent ? 'var(--pv-text3)' : isDowngrade ? 'var(--pv-text3)' : tier.highlight ? '#fff' : 'var(--pv-text2)',
                    border: tier.highlight && !isCurrent && !isDowngrade ? 'none' : '1.5px solid var(--pv-border)',
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
            background: 'var(--pv-surface)',
            border: '1.5px dashed var(--pv-border)',
            opacity: 0.75,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--pv-text3)', marginBottom: 10 }}>
              Teams
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-1px', color: 'var(--pv-text)', marginBottom: 6 }}>Coming soon</div>
            <p style={{ fontSize: 13, color: 'var(--pv-text3)', marginBottom: 20, lineHeight: 1.5 }}>
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
                  border: '1.5px solid var(--pv-border)', fontFamily: 'inherit', marginBottom: 8,
                  outline: 'none', boxSizing: 'border-box',
                  background: 'var(--pv-bg)', color: 'var(--pv-text)',
                }}
              />
              <button
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', background: 'transparent',
                  color: 'var(--pv-text2)', border: '1.5px solid var(--pv-border)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--pv-text3)'; e.currentTarget.style.color = 'var(--pv-text)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--pv-border)'; e.currentTarget.style.color = 'var(--pv-text2)' }}
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
