export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pv-bg, #0a0908)', color: 'var(--pv-text, #f0ede8)', fontFamily: "'Inter', -apple-system, sans-serif", padding: '80px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <a
          href="/"
          style={{ display: 'inline-block', fontSize: 13, color: 'var(--pv-text3, rgba(240,237,232,0.35))', textDecoration: 'none', marginBottom: 40, transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--pv-text2, rgba(240,237,232,0.6))')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--pv-text3, rgba(240,237,232,0.35))')}
        >
          ← Back to home
        </a>

        <h1 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 8 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: 'var(--pv-text3, rgba(240,237,232,0.35))', marginBottom: 40 }}>
          Last updated: March 2026
        </p>

        <div style={{
          background: 'var(--pv-surface, rgba(255,255,255,0.03))',
          border: '1px solid var(--pv-border, rgba(255,255,255,0.07))',
          borderRadius: 16,
          padding: '32px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 15, color: 'var(--pv-text2, rgba(240,237,232,0.6))', lineHeight: 1.7, margin: 0 }}>
            Our Privacy Policy is being finalized. Please check back soon.
          </p>
        </div>

        <div style={{ marginTop: 40, textAlign: 'center' }}>
          <a
            href="/"
            style={{ fontSize: 13, color: 'var(--pv-text3, rgba(240,237,232,0.35))', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--pv-text2, rgba(240,237,232,0.6))')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--pv-text3, rgba(240,237,232,0.35))')}
          >
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  )
}
