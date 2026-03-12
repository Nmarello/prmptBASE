import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

interface OnboardingModalProps {
  onDone: () => void
}

export default function OnboardingModal({ onDone }: OnboardingModalProps) {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [tosAccepted, setTosAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError(null)

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const jwt = sessionData.session?.access_token
      if (!jwt) throw new Error('No session')

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${jwt}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            display_name: displayName.trim(),
            ...(phone.trim() ? { phone: phone.trim() } : {}),
          }),
        }
      )

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Failed to save profile')
      }

      localStorage.setItem('prmptVAULT_tos_accepted', '1')
      onDone()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = displayName.trim().length > 0 && tosAccepted && !loading

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <div
        style={{
          background: 'var(--pv-surface)',
          border: '1px solid var(--pv-border)',
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: 'var(--pv-text)' }}>
            prmpt<span style={{ color: 'var(--pv-accent)' }}>VAULT</span>
          </div>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--pv-text)', marginBottom: 8, textAlign: 'center' }}>
          Welcome! Let's set up your account.
        </h2>
        <p style={{ fontSize: 13, color: 'var(--pv-text2)', textAlign: 'center', marginBottom: 28 }}>
          Just a couple of things before you dive in.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Display name */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--pv-text2)', marginBottom: 6 }}>
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name or handle"
              required
              style={{
                width: '100%',
                background: 'var(--pv-surface2, rgba(255,255,255,0.04))',
                border: '1px solid var(--pv-border)',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 14,
                color: 'var(--pv-text)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Phone */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--pv-text2)', marginBottom: 6 }}>
              Phone <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--pv-text3)' }}>(optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              style={{
                width: '100%',
                background: 'var(--pv-surface2, rgba(255,255,255,0.04))',
                border: '1px solid var(--pv-border)',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 14,
                color: 'var(--pv-text)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* ToS checkbox */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={tosAccepted}
              onChange={e => setTosAccepted(e.target.checked)}
              style={{ marginTop: 2, accentColor: 'var(--pv-accent)', width: 15, height: 15, flexShrink: 0 }}
            />
            <span style={{ fontSize: 12, color: 'var(--pv-text2)', lineHeight: 1.5 }}>
              I agree to the{' '}
              <a href="/tos" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pv-accent)', textDecoration: 'none' }}>
                Terms of Service
              </a>
              {' '}and{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pv-accent)', textDecoration: 'none' }}>
                Privacy Policy
              </a>
            </span>
          </label>

          {error && (
            <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              marginTop: 4,
              width: '100%',
              padding: '12px',
              borderRadius: 12,
              background: canSubmit ? 'var(--pv-accent)' : 'rgba(255,255,255,0.08)',
              color: canSubmit ? '#fff' : 'var(--pv-text3)',
              border: 'none',
              fontSize: 14,
              fontWeight: 700,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
          >
            {loading ? 'Saving…' : 'Get started →'}
          </button>
        </form>
      </div>
    </div>
  )
}
