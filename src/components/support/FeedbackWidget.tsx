import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const PILL_W = 130

type Category = 'bug' | 'feature' | 'general'

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'bug', label: 'Bug Report' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'general', label: 'General' },
]

export default function FeedbackWidget() {
  const { session } = useAuth()
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [category, setCategory] = useState<Category>('bug')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    if (!message.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-feedback`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            category,
            message: message.trim(),
            user_token: session?.access_token ?? null,
          }),
        }
      )
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setSuccess(true)
      setMessage('')
      setTimeout(() => { setSuccess(false); setOpen(false) }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setSubmitting(false)
  }

  return (
    <div style={{ position: 'fixed', bottom: 90, right: 20, zIndex: 9998 }}>
      {/* Panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 52,
            right: 0,
            width: 300,
            background: 'var(--pv-surface)',
            border: '1px solid var(--pv-border)',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            overflow: 'hidden',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {success ? (
            <div style={{ padding: '20px 18px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>✓</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--pv-text)' }}>Thanks!</div>
              <div style={{ fontSize: 12, color: 'var(--pv-text3)', marginTop: 3 }}>We'll review this shortly.</div>
            </div>
          ) : (
            <>
              <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--pv-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>Send Feedback</span>
                <button
                  onClick={() => setOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pv-text3)', fontSize: 16, lineHeight: 1, padding: 2 }}
                  className="hover:text-[var(--pv-text)] transition-colors"
                >✕</button>
              </div>
              <div style={{ padding: '12px 16px 14px' }}>
                {/* Category */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {CATEGORIES.map(c => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      style={{
                        flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        border: category === c.value ? '1px solid var(--pv-accent)' : '1px solid var(--pv-border)',
                        background: category === c.value ? 'var(--pv-accent)' : 'var(--pv-surface2)',
                        color: category === c.value ? '#fff' : 'var(--pv-text3)',
                      }}
                    >{c.label}</button>
                  ))}
                </div>
                {/* Message */}
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Describe the issue or idea…"
                  rows={4}
                  style={{
                    width: '100%', resize: 'none', boxSizing: 'border-box',
                    background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)',
                    borderRadius: 10, padding: '9px 11px', fontSize: 12.5,
                    color: 'var(--pv-text)', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                  }}
                  className="pv-placeholder focus:border-[var(--pv-accent)] transition-colors"
                />
                {error && (
                  <p style={{ fontSize: 11.5, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 8, padding: '6px 10px', marginTop: 6 }}>
                    {error}
                  </p>
                )}
                <button
                  onClick={submit}
                  disabled={submitting || !message.trim()}
                  style={{
                    width: '100%', marginTop: 8, padding: '9px 0', background: 'var(--pv-accent)',
                    borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  className="hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >{submitting ? 'Sending…' : 'Submit'}</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Send feedback"
        style={{
          height: 40,
          width: (!open && hovered) ? PILL_W : 40,
          borderRadius: 9999,
          background: open ? 'var(--pv-surface2)' : 'var(--pv-surface)',
          border: `1px solid ${(!open && hovered) ? 'var(--pv-accent)' : 'var(--pv-border)'}`,
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: 11, paddingLeft: (!open && hovered) ? 14 : 11,
          overflow: 'hidden', whiteSpace: 'nowrap',
          color: (!open && hovered) ? 'var(--pv-accent)' : 'var(--pv-text3)',
          transition: 'width 0.22s ease, padding-left 0.22s ease, border-color 0.15s, color 0.15s',
        }}
      >
        <span style={{
          flex: 1, fontSize: 12.5, fontWeight: 600, minWidth: 0,
          opacity: (!open && hovered) ? 1 : 0,
          transition: 'opacity 0.12s 0.08s',
          overflow: 'hidden',
        }}>Feedback</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: (!open && hovered) ? 7 : 0, transition: 'margin-left 0.22s ease' }}>
          <line x1="9" y1="18" x2="15" y2="18"/>
          <line x1="10" y1="22" x2="14" y2="22"/>
          <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
        </svg>
      </button>
    </div>
  )
}
