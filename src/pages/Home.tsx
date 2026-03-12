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
    <div style={{ background: '#f5f5f7', color: '#1d1d1f', fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>

      {/* FLOATING PILL NAV — desktop */}
      <nav className="hidden sm:flex" style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
        alignItems: 'center', gap: 32,
        padding: '0 20px', height: 48,
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px) saturate(1.8)',
        border: '1px solid rgba(0,0,0,0.08)', borderRadius: 100,
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        minWidth: 580, justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', color: '#1d1d1f' }}>
          prmpt<span style={{ color: '#0071e3' }}>VAULT</span>
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Models', 'Pricing', 'Gallery'].map(l => (
            <a key={l} href={l === 'Pricing' ? '/pricing' : '#'} style={{ color: '#6e6e73', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1d1d1f')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6e6e73')}
            >{l}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowAuth(true)} style={{
            background: 'transparent', border: '1px solid #d2d2d7', color: '#6e6e73',
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#aeaeb2'; e.currentTarget.style.color = '#1d1d1f' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#d2d2d7'; e.currentTarget.style.color = '#6e6e73' }}
          >Sign in</button>
          <button onClick={() => setShowAuth(true)} style={{
            background: '#0071e3', border: 'none', color: '#fff',
            padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0077ed')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0071e3')}
          >Start free</button>
        </div>
      </nav>

      {/* MOBILE NAV */}
      <nav className="sm:hidden flex items-center justify-between px-5" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 52,
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', color: '#1d1d1f' }}>
          prmpt<span style={{ color: '#0071e3' }}>VAULT</span>
        </span>
        <button onClick={() => setShowAuth(true)} style={{
          background: '#0071e3', border: 'none', color: '#fff',
          padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Start free</button>
      </nav>

      {/* HERO */}
      <section className="px-5 sm:px-10 pt-28 sm:pt-36 pb-12 sm:pb-20" style={{ textAlign: 'center', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,113,227,0.08)', border: '1px solid rgba(0,113,227,0.2)',
          color: '#0071e3', padding: '6px 14px', borderRadius: 100,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.02em', marginBottom: 28,
        }}>
          ✦ 12 models · Images · Video
        </div>

        <h1 style={{ fontSize: 'clamp(44px, 6vw, 80px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2.5px', marginBottom: 20, color: '#1d1d1f' }}>
          The creative AI<br />workspace you've<br />been{' '}
          <span style={{ background: 'linear-gradient(135deg, #0071e3, #5e5ce6)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            waiting for.
          </span>
        </h1>

        <p style={{ fontSize: 19, color: '#6e6e73', maxWidth: 560, margin: '0 auto 44px', fontWeight: 400, lineHeight: 1.6 }}>
          One interface for every top AI model. Generate images and video, save your prompts, and get notified when renders finish.
        </p>

        {/* PROMPT BAR */}
        <div style={{
          width: '100%', maxWidth: 660, margin: '0 auto 48px',
          background: '#fff', border: '1px solid #d2d2d7', borderRadius: 14,
          padding: '6px 6px 6px 16px', display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <input
            readOnly
            placeholder="A lone lighthouse at stormy dusk…"
            onClick={() => setShowAuth(true)}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none', minWidth: 0,
              color: '#1d1d1f', fontFamily: 'inherit', fontSize: 14, cursor: 'text',
            }}
          />
          <div className="hidden sm:block" style={{
            background: '#f0f0f2', border: '1px solid #d2d2d7', color: '#6e6e73',
            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}>Flux Pro Ultra ▾</div>
          <button onClick={() => setShowAuth(true)} style={{
            background: '#0071e3', color: '#fff', border: 'none',
            padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            transition: 'background 0.15s', flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0077ed')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0071e3')}
          >Generate →</button>
        </div>

        {/* SOCIAL PROOF */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', fontSize: 13, color: '#6e6e73' }}>
          <div style={{ display: 'flex' }}>
            {[
              'linear-gradient(135deg, #ff6b6b, #ee5a24)',
              'linear-gradient(135deg, #a29bfe, #6c5ce7)',
              'linear-gradient(135deg, #fd79a8, #e84393)',
              'linear-gradient(135deg, #55efc4, #00b894)',
            ].map((bg, i) => (
              <div key={i} style={{
                width: 24, height: 24, borderRadius: '50%', border: '2px solid #f5f5f7',
                marginLeft: i === 0 ? 0 : -6, background: bg,
              }} />
            ))}
          </div>
          <span>Joined by <strong>2,400+ creators</strong> this month</span>
        </div>
      </section>

      {/* BENTO GRID */}
      <section className="px-5 sm:px-10 pb-16 sm:pb-20" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          {/* TALL WIDE — Featured model */}
          <div className="col-span-2 sm:row-span-2" style={{
            background: '#fff', borderRadius: 20, border: '1px solid #d2d2d7',
            padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
            transition: 'all 0.2s', cursor: 'default',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aeaeb2' }}>Featured · Flux Pro Ultra</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2 }}>State-of-the-art<br />image generation</div>
            <div style={{
              flex: 1, borderRadius: 12, minHeight: 200,
              background: 'linear-gradient(135deg, #e8f4fd, #dbeafe, #ede9fe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', gap: 8,
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>4MP · 2:3 · Photorealistic</span>
            </div>
          </div>

          {/* STAT — models */}
          <div style={{
            background: '#fff', borderRadius: 20, border: '1px solid #d2d2d7', padding: 24,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: '#0071e3' }}>12+</div>
            <div style={{ fontSize: 14, color: '#6e6e73', marginTop: 6 }}>AI models<br />connected</div>
          </div>

          {/* FEATURE — Prompt Library */}
          <div style={{
            background: '#fff', borderRadius: 20, border: '1px solid #d2d2d7', padding: 24,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0,113,227,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0071e3" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>Prompt Vault</h3>
            <p style={{ fontSize: 13, color: '#6e6e73', lineHeight: 1.6 }}>Every prompt saved. Search, remix, and build on what works.</p>
          </div>

          {/* STAT — storage */}
          <div style={{
            background: '#fff', borderRadius: 20, border: '1px solid #d2d2d7', padding: 24,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: '#34c759' }}>∞</div>
            <div style={{ fontSize: 14, color: '#6e6e73', marginTop: 6 }}>Asset storage<br />on Pro</div>
          </div>

          {/* MODELS LIST */}
          <div style={{
            background: '#fff', borderRadius: 20, border: '1px solid #d2d2d7', padding: '20px 24px',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>All models</h3>
            {[
              { dot: '#10b981', name: 'DALL-E 3', prov: 'OpenAI' },
              { dot: '#38bdf8', name: 'Flux Pro Ultra', prov: 'Black Forest Labs' },
              { dot: '#3b82f6', name: 'Veo 3', prov: 'Google' },
              { dot: '#84cc16', name: 'Dream Machine', prov: 'Luma AI' },
              { dot: '#a78bfa', name: 'Kling', prov: 'Kuaishou' },
            ].map((m, i, arr) => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f0f0f2' : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{m.name}</span>
                <span style={{ fontSize: 11, color: '#aeaeb2' }}>{m.prov}</span>
              </div>
            ))}
          </div>

          {/* NOTIFICATION */}
          <div style={{
            background: 'linear-gradient(135deg, #0071e3, #5e5ce6)', borderRadius: 20,
            padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            color: 'white', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 40px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{
              background: 'rgba(255,255,255,0.15)', borderRadius: 100, padding: '8px 14px',
              display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600,
              marginBottom: 16, width: 'fit-content',
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34c759' }} />
              Your video is ready!
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Generate &amp; go</h3>
            <p style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.6 }}>Start a render, close the tab. We'll notify you the second it's done.</p>
          </div>

        </div>
      </section>

      {/* DARK APP PREVIEW */}
      <section className="px-5 sm:px-10 py-16 sm:py-20" style={{ background: '#0a0a0f', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', marginBottom: 16 }}>
          The Generator
        </div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', color: '#f8fafc', marginBottom: 12 }}>
          A studio-grade workspace.
        </h2>
        <p style={{ fontSize: 16, color: '#64748b', marginBottom: 36 }}>
          Clean. Fast. Built for high-volume creative work.
        </p>
        <div style={{
          maxWidth: 1000, margin: '0 auto',
          background: '#111118', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
        }}>
          {/* App bar */}
          <div style={{ background: '#0d1117', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#f8fafc', marginLeft: 8 }}>
              prmpt<span style={{ color: '#e11d48' }}>VAULT</span>
            </span>
          </div>
          {/* App content */}
          <div style={{ display: 'grid', minHeight: 300 }} className="grid-cols-1 sm:grid-cols-[240px_1fr]">
            <div className="hidden sm:block" style={{ borderRight: '1px solid rgba(255,255,255,0.08)', padding: 16 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', marginBottom: 10, padding: '0 4px' }}>
                Image Models
              </div>
              {[
                { name: 'Flux Pro Ultra', tag: 'txt2img', active: true },
                { name: 'DALL-E 3', tag: 'txt2img', active: false },
                { name: 'Recraft V4 Pro', tag: 'txt2img', active: false },
              ].map(m => (
                <div key={m.name} style={{
                  padding: '8px 10px', borderRadius: 8, fontSize: 12,
                  color: m.active ? '#38bdf8' : '#94a3b8', marginBottom: 2, cursor: 'pointer',
                  background: m.active ? 'rgba(56,189,248,0.1)' : 'transparent',
                }}>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{m.tag}</div>
                </div>
              ))}
              <div style={{ marginTop: 16, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#475569', marginBottom: 10, padding: '0 4px' }}>
                Video Models
              </div>
              {[
                { name: 'Luma Ray-2', tag: 'txt2vid · img2vid' },
                { name: 'Kling 1.6', tag: 'txt2vid' },
                { name: 'Minimax', tag: 'txt2vid' },
              ].map(m => (
                <div key={m.name} style={{ padding: '8px 10px', borderRadius: 8, fontSize: 12, color: '#94a3b8', marginBottom: 2, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>{m.tag}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center', color: '#334155', fontSize: 13 }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block' }}>
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                Select a model to start generating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="px-5 sm:px-10 py-16 sm:py-20" style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#aeaeb2', marginBottom: 12 }}>Pricing</div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 36 }}>Start free.<br />Scale when ready.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              name: 'Free', price: '$0', period: '/mo', desc: 'Try it out, no card needed', featured: false,
              features: [
                { text: '20 images / month', inc: true },
                { text: '5 video renders', inc: true },
                { text: 'Core models', inc: true },
                { text: 'Pro models', inc: false },
                { text: 'Priority queue', inc: false },
                { text: 'Unlimited storage', inc: false },
              ],
              cta: 'Get started', ctaFilled: false,
            },
            {
              name: 'Studio', price: '$19', period: '/mo', desc: 'For serious creators', featured: true,
              features: [
                { text: '500 images / month', inc: true },
                { text: '50 video renders', inc: true },
                { text: 'All models', inc: true },
                { text: 'Priority queue', inc: true },
                { text: 'Unlimited storage', inc: true },
                { text: 'Team sharing', inc: false },
              ],
              cta: 'Start Studio trial →', ctaFilled: true,
            },
            {
              name: 'Pro', price: '$49', period: '/mo', desc: 'Teams and agencies', featured: false,
              features: [
                { text: 'Unlimited images', inc: true },
                { text: '200 video renders', inc: true },
                { text: 'All models', inc: true },
                { text: 'Priority queue', inc: true },
                { text: 'Unlimited storage', inc: true },
                { text: 'Team sharing', inc: true },
              ],
              cta: 'Contact us', ctaFilled: false,
            },
          ].map(tier => (
            <div key={tier.name} style={{
              background: '#fff', border: `1px solid ${tier.featured ? 'rgba(0,113,227,0.4)' : '#d2d2d7'}`,
              borderRadius: 20, padding: 28,
              boxShadow: tier.featured ? '0 0 0 3px rgba(0,113,227,0.08)' : 'none',
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tier.featured ? '#0071e3' : '#aeaeb2', marginBottom: 12 }}>
                {tier.name}
              </div>
              <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-2px', marginBottom: 4, color: '#1d1d1f' }}>
                {tier.price} <span style={{ fontSize: 15, fontWeight: 500, color: '#6e6e73' }}>{tier.period}</span>
              </div>
              <div style={{ fontSize: 13, color: '#6e6e73', marginBottom: 20 }}>{tier.desc}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {tier.features.map(f => (
                  <li key={f.text} style={{ fontSize: 13, color: '#6e6e73', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: f.inc ? '#34c759' : '#aeaeb2', fontSize: f.inc ? 12 : 14, fontWeight: f.inc ? 700 : 400, width: 16 }}>{f.inc ? '✓' : '–'}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowAuth(true)} style={{
                width: '100%', padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: tier.ctaFilled ? '#0071e3' : 'transparent',
                color: tier.ctaFilled ? '#fff' : '#6e6e73',
                border: tier.ctaFilled ? 'none' : '1.5px solid #d2d2d7',
              }}
                onMouseEnter={e => {
                  if (tier.ctaFilled) (e.currentTarget.style.background = '#0077ed')
                  else { e.currentTarget.style.borderColor = '#aeaeb2'; e.currentTarget.style.color = '#1d1d1f' }
                }}
                onMouseLeave={e => {
                  if (tier.ctaFilled) (e.currentTarget.style.background = '#0071e3')
                  else { e.currentTarget.style.borderColor = '#d2d2d7'; e.currentTarget.style.color = '#6e6e73' }
                }}
              >{tier.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 sm:px-10 py-20 sm:py-24" style={{ textAlign: 'center', background: '#f5f5f7' }}>
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 20, color: '#1d1d1f' }}>
          Ready to build your<br /><span style={{ color: '#0071e3' }}>creative vault?</span>
        </h2>
        <p style={{ fontSize: 18, color: '#6e6e73', marginBottom: 36 }}>Free forever on the core plan. No credit card required.</p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button onClick={() => setShowAuth(true)} style={{
            background: '#0071e3', color: '#fff', border: 'none', padding: '14px 28px',
            borderRadius: 100, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0077ed')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0071e3')}
          >Start for free →</button>
          <a href="/pricing" style={{
            background: 'transparent', border: '1.5px solid #d2d2d7', color: '#6e6e73',
            padding: '14px 28px', borderRadius: 100, fontSize: 15, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#aeaeb2'; (e.currentTarget as HTMLAnchorElement).style.color = '#1d1d1f' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = '#d2d2d7'; (e.currentTarget as HTMLAnchorElement).style.color = '#6e6e73' }}
          >View all models</a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between px-5 sm:px-10 py-8" style={{ borderTop: '1px solid #d2d2d7', color: '#aeaeb2', fontSize: 13 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#1d1d1f' }}>
          prmpt<span style={{ color: '#0071e3' }}>VAULT</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Docs'].map(l => (
            <a key={l} href="#" style={{ color: '#aeaeb2', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#6e6e73')}
              onMouseLeave={e => (e.currentTarget.style.color = '#aeaeb2')}
            >{l}</a>
          ))}
        </div>
        <div>© 2026 Marello Productions</div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
