import { Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pv-bg)', color: 'var(--pv-text)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', -apple-system, sans-serif", textAlign: 'center', padding: '24px' }}>
      <Logo height={40} style={{ marginBottom: 32 }} />
      <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: '-4px', color: 'var(--pv-text3)', lineHeight: 1, marginBottom: 16 }}>404</div>
      <p style={{ fontSize: 18, color: 'var(--pv-text2)', marginBottom: 32 }}>This page doesn't exist.</p>
      <Link to="/" style={{ padding: '10px 24px', background: 'var(--pv-accent)', color: '#fff', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
        Go home
      </Link>
    </div>
  )
}
