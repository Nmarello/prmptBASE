import { useState } from 'react'
import AuthModal from '../components/auth/AuthModal'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const SUPABASE_STORAGE = 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets'
const U1 = '0a44a1d5-f0ef-4e0c-ad0a-995eb44cec90'
const U2 = 'f9965304-4af9-4eba-a762-7b7c892473e1'

// Real generated assets from the vault
const SHOWCASE_ASSET = `${SUPABASE_STORAGE}/${U1}/1773262454542-k1hcqk0lpr.webp`
const GALLERY_ASSETS = [
  `${SUPABASE_STORAGE}/${U1}/1773262268853.png`,
  `${SUPABASE_STORAGE}/${U2}/1773121140586-hhuk0k4iz3a.jpg`,
  `${SUPABASE_STORAGE}/${U1}/1773261705891.png`,
  `${SUPABASE_STORAGE}/${U2}/1773097728856-v3ap7gzlfnn.jpg`,
  `${SUPABASE_STORAGE}/${U2}/1773097779411-6tbdqm308qy.jpg`,
  `${SUPABASE_STORAGE}/${U1}/1773261524475.png`,
  `${SUPABASE_STORAGE}/${U2}/1773121140586-oca8u7wy5v.jpg`,
  `${SUPABASE_STORAGE}/${U2}/1773097669991-vcaf8o2fhni.jpg`,
]

export default function Home() {
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const navigate = useNavigate()

  if (user) navigate('/dashboard')

  return (
    <div style={{ background: '#0f0e0c', color: '#f0ede8', fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>

      {/* NAV — desktop floating pill */}
      <nav className="hidden sm:flex" style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
        alignItems: 'center', gap: 32, padding: '0 20px', height: 48,
        background: 'rgba(20,18,16,0.85)', backdropFilter: 'blur(24px) saturate(1.6)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: 100,
        boxShadow: '0 2px 32px rgba(0,0,0,0.4)',
        minWidth: 580, justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', color: '#f0ede8' }}>
          prmpt<span style={{ color: '#3d7fff' }}>VAULT</span>
        </span>
        <div style={{ display: 'flex', gap: 24 }}>
          {[{ label: 'Models', href: '#models' }, { label: 'Pricing', href: '/pricing' }, { label: 'Gallery', href: '#gallery' }].map(l => (
            <a key={l.label} href={l.href} style={{ color: 'rgba(240,237,232,0.45)', textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#f0ede8')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,237,232,0.45)')}
            >{l.label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowAuth(true)} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(240,237,232,0.6)',
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; e.currentTarget.style.color = '#f0ede8' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = 'rgba(240,237,232,0.6)' }}
          >Sign in</button>
          <button onClick={() => setShowAuth(true)} style={{
            background: '#3d7fff', border: 'none', color: '#fff',
            padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#5590ff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3d7fff')}
          >Start free</button>
        </div>
      </nav>

      {/* MOBILE NAV */}
      <nav className="sm:hidden flex items-center justify-between px-5" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 52,
        background: 'rgba(15,14,12,0.92)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.3px', color: '#f0ede8' }}>
          prmpt<span style={{ color: '#3d7fff' }}>VAULT</span>
        </span>
        <button onClick={() => setShowAuth(true)} style={{
          background: '#3d7fff', border: 'none', color: '#fff',
          padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Start free</button>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="px-5 sm:px-10 pt-32 sm:pt-40 pb-12 sm:pb-20" style={{ textAlign: 'center', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

        {/* Glow behind headline */}
        <div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(61,127,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(61,127,255,0.12)', border: '1px solid rgba(61,127,255,0.25)',
          color: '#7aabff', padding: '6px 14px', borderRadius: 100,
          fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3d7fff', display: 'inline-block' }} />
          12 models · Images · Video
        </div>

        <h1 style={{ fontSize: 'clamp(48px, 7vw, 92px)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-3px', marginBottom: 24, color: '#f0ede8' }}>
          Every top AI model.<br />
          <span style={{ background: 'linear-gradient(135deg, #3d7fff 0%, #9b7aff 50%, #ff7a9b 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            One studio.
          </span>
        </h1>

        <p style={{ fontSize: 18, color: 'rgba(240,237,232,0.5)', maxWidth: 520, margin: '0 auto 44px', fontWeight: 400, lineHeight: 1.65 }}>
          Generate images and video with DALL-E, Flux, Kling, Luma and more. Save every prompt. Pick up where you left off.
        </p>

        {/* PROMPT BAR */}
        <div style={{
          width: '100%', maxWidth: 640, margin: '0 auto 48px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '6px 6px 6px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 0 0 1px rgba(61,127,255,0.08), 0 8px 40px rgba(0,0,0,0.3)',
        }}>
          <input readOnly placeholder="A lone lighthouse at stormy dusk, cinematic…" onClick={() => setShowAuth(true)} style={{
            flex: 1, background: 'none', border: 'none', outline: 'none', minWidth: 0,
            color: '#f0ede8', fontFamily: 'inherit', fontSize: 14, cursor: 'text',
          }} />
          <div className="hidden sm:block" style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(240,237,232,0.5)', padding: '6px 12px', borderRadius: 8,
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', cursor: 'pointer',
          }}>Flux Pro Ultra ▾</div>
          <button onClick={() => setShowAuth(true)} style={{
            background: '#3d7fff', color: '#fff', border: 'none',
            padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'background 0.15s', flexShrink: 0,
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#5590ff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3d7fff')}
          >Generate →</button>
        </div>

        {/* SOCIAL PROOF */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', fontSize: 13, color: 'rgba(240,237,232,0.35)' }}>
          <div style={{ display: 'flex' }}>
            {['linear-gradient(135deg,#ff6b6b,#ee5a24)', 'linear-gradient(135deg,#a29bfe,#6c5ce7)', 'linear-gradient(135deg,#fd79a8,#e84393)', 'linear-gradient(135deg,#55efc4,#00b894)'].map((bg, i) => (
              <div key={i} style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #0f0e0c', marginLeft: i === 0 ? 0 : -6, background: bg }} />
            ))}
          </div>
          <span>Joined by <strong style={{ color: 'rgba(240,237,232,0.6)' }}>2,400+ creators</strong> this month</span>
        </div>
      </section>

      {/* ── ASSET GALLERY STRIP ────────────────────────── */}
      <section id="gallery" style={{ overflow: 'hidden', paddingBottom: 4 }}>
        <div style={{
          display: 'flex', gap: 10,
          animation: 'marquee 32s linear infinite',
          width: 'max-content', padding: '0 10px',
        }}>
          {[...GALLERY_ASSETS, ...GALLERY_ASSETS].map((url, i) => (
            <div key={i} style={{
              width: 220, height: 160, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </section>

      {/* ── STUDIO WORKSPACE ──────────────────────────── */}
      <section id="workspace" className="px-5 sm:px-10 py-20 sm:py-28">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(240,237,232,0.28)', marginBottom: 14 }}>
            The Generator
          </div>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-1.5px', color: '#f0ede8', marginBottom: 14 }}>
            A studio-grade workspace.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(240,237,232,0.45)', maxWidth: 480, margin: '0 auto' }}>
            Every model, every setting, one clean interface built for high-volume creative work.
          </p>
        </div>

        {/* APP WINDOW */}
        <div style={{
          maxWidth: 1080, margin: '0 auto',
          background: '#131210', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 60px 140px rgba(0,0,0,0.7), 0 0 80px rgba(61,127,255,0.06)',
        }}>

          {/* Window chrome */}
          <div style={{ background: '#0d0c0a', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e' }} />
              <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f0ede8', marginLeft: 6 }}>
              prmpt<span style={{ color: '#3d7fff' }}>VAULT</span>
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Notification toast */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 7,
                background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.25)',
                borderRadius: 100, padding: '4px 10px',
              }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34c759' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#34c759' }}>Render complete · 8s</span>
              </div>
            </div>
          </div>

          {/* App body — 3 columns */}
          <div className="grid grid-cols-1 sm:grid-cols-[200px_300px_1fr]" style={{ minHeight: 460 }}>

            {/* Sidebar */}
            <div className="hidden sm:block" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: '16px 12px', background: '#0f0e0c' }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(240,237,232,0.25)', marginBottom: 8, padding: '0 6px' }}>Image Models</div>
              {[
                { name: 'Flux Pro Ultra', tag: 'txt2img', active: true, dot: '#3d7fff' },
                { name: 'DALL-E 3', tag: 'txt2img', active: false, dot: '#10b981' },
                { name: 'Flux Dev', tag: 'txt2img', active: false, dot: '#3d7fff' },
                { name: 'Flux Schnell', tag: 'txt2img', active: false, dot: '#3d7fff' },
              ].map(m => (
                <div key={m.name} style={{
                  padding: '7px 10px', borderRadius: 8, marginBottom: 2, cursor: 'pointer',
                  background: m.active ? 'rgba(61,127,255,0.12)' : 'transparent',
                  border: m.active ? '1px solid rgba(61,127,255,0.2)' : '1px solid transparent',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: m.active ? m.dot : 'rgba(240,237,232,0.2)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: m.active ? '#7aabff' : 'rgba(240,237,232,0.45)' }}>{m.name}</span>
                  </div>
                  <div style={{ fontSize: 9, color: 'rgba(240,237,232,0.2)', marginTop: 2, paddingLeft: 12 }}>{m.tag}</div>
                </div>
              ))}
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(240,237,232,0.25)', margin: '16px 0 8px', padding: '0 6px' }}>Video Models</div>
              {[
                { name: 'Luma Ray-2', tag: 'txt2vid · img2vid' },
                { name: 'Kling 1.6', tag: 'txt2vid · img2vid' },
                { name: 'Minimax', tag: 'txt2vid' },
              ].map(m => (
                <div key={m.name} style={{ padding: '7px 10px', borderRadius: 8, marginBottom: 2, cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,237,232,0.4)' }}>{m.name}</div>
                  <div style={{ fontSize: 9, color: 'rgba(240,237,232,0.18)', marginTop: 2 }}>{m.tag}</div>
                </div>
              ))}
            </div>

            {/* Form panel */}
            <div className="hidden sm:flex" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: 20, flexDirection: 'column', gap: 14, background: '#111009' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(240,237,232,0.3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prompt</div>
                <div style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 12px', fontSize: 12,
                  color: 'rgba(240,237,232,0.7)', lineHeight: 1.6, minHeight: 80,
                }}>
                  Cinematic wide shot of a lone lighthouse on volcanic cliffs, golden hour, crashing waves, atmospheric haze, film grain, Kodak portra 400
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Aspect', val: '16:9' },
                  { label: 'Quality', val: 'Ultra' },
                  { label: 'Steps', val: '28' },
                  { label: 'Guidance', val: '3.5' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: 'rgba(240,237,232,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,237,232,0.6)' }}>{s.val}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: 'rgba(240,237,232,0.25)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Model</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7aabff' }}>Flux Pro Ultra</div>
              </div>

              <button style={{
                marginTop: 'auto', width: '100%', padding: '11px',
                background: '#3d7fff', color: '#fff', border: 'none',
                borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>Generate →</button>
            </div>

            {/* Output / canvas */}
            <div style={{ position: 'relative', background: '#0a0908', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
              <img
                src={SHOWCASE_ASSET}
                alt="AI-generated output in prmptVAULT workspace"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }}
              />
              {/* Overlay gradient at bottom */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to top, rgba(10,9,8,0.9), transparent)', pointerEvents: 'none' }} />
              {/* Model badge */}
              <div style={{
                position: 'absolute', bottom: 14, left: 14,
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(15,14,12,0.75)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3d7fff' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,237,232,0.8)' }}>Flux Pro Ultra</span>
                <span style={{ fontSize: 10, color: 'rgba(240,237,232,0.3)' }}>· 8s</span>
              </div>
              {/* Actions */}
              <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 6 }}>
                {['↓', '→ img2img'].map(lbl => (
                  <div key={lbl} style={{
                    background: 'rgba(15,14,12,0.75)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    padding: '5px 9px', fontSize: 11, fontWeight: 600, color: 'rgba(240,237,232,0.6)', cursor: 'pointer',
                  }}>{lbl}</div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── BENTO FEATURES ────────────────────────────── */}
      <section id="models" className="px-5 sm:px-10 pb-16 sm:pb-20" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-1.5px', color: '#f0ede8' }}>
            Everything you need.<br />Nothing you don't.
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          {/* WIDE — showcase asset */}
          <div className="col-span-2 sm:row-span-2" style={{
            borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden', position: 'relative', minHeight: 260,
            transition: 'transform 0.2s, border-color 0.2s', cursor: 'default',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.25)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
          >
            <img src={GALLERY_ASSETS[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,9,8,0.92) 0%, rgba(10,9,8,0.1) 60%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(240,237,232,0.35)', marginBottom: 6 }}>Featured · Flux Pro Ultra</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, color: '#f0ede8' }}>State-of-the-art<br />image generation</div>
            </div>
          </div>

          {/* STAT — models */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)',
            padding: 22, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: '#3d7fff' }}>12+</div>
            <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.4)', marginTop: 6 }}>AI models<br />connected</div>
          </div>

          {/* FEATURE — Prompt Library */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)',
            padding: 22, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(61,127,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3d7fff" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#f0ede8' }}>Prompt Vault</h3>
            <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.4)', lineHeight: 1.6 }}>Every prompt saved. Search, remix, and build on what works.</p>
          </div>

          {/* STAT — storage */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)',
            padding: 22, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(52,199,89,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: '#34c759' }}>∞</div>
            <div style={{ fontSize: 14, color: 'rgba(240,237,232,0.4)', marginTop: 6 }}>Asset storage<br />on Pro</div>
          </div>

          {/* MODELS LIST */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)',
            padding: '18px 20px', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#f0ede8' }}>All models</h3>
            {[
              { dot: '#10b981', name: 'DALL-E 3', prov: 'OpenAI' },
              { dot: '#3d7fff', name: 'Flux Pro Ultra', prov: 'BFL' },
              { dot: '#3b82f6', name: 'Veo 3', prov: 'Google' },
              { dot: '#84cc16', name: 'Dream Machine', prov: 'Luma AI' },
              { dot: '#a78bfa', name: 'Kling', prov: 'Kuaishou' },
            ].map((m, i, arr) => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: 'rgba(240,237,232,0.7)' }}>{m.name}</span>
                <span style={{ fontSize: 10, color: 'rgba(240,237,232,0.25)' }}>{m.prov}</span>
              </div>
            ))}
          </div>

          {/* NOTIFICATION */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(61,127,255,0.2), rgba(155,122,255,0.2))',
            border: '1px solid rgba(61,127,255,0.2)', borderRadius: 18,
            padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{
              background: 'rgba(52,199,89,0.15)', border: '1px solid rgba(52,199,89,0.3)',
              borderRadius: 100, padding: '6px 12px',
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600,
              color: '#34c759', marginBottom: 14, width: 'fit-content',
            }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#34c759' }} />
              Your video is ready!
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 5, color: '#f0ede8' }}>Generate &amp; go</h3>
            <p style={{ fontSize: 12, color: 'rgba(240,237,232,0.45)', lineHeight: 1.6 }}>Start a render, close the tab. We'll notify you the second it's done.</p>
          </div>

        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────── */}
      <section className="px-5 sm:px-10 py-16 sm:py-20" style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(240,237,232,0.25)', marginBottom: 12 }}>Pricing</div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 36, color: '#f0ede8' }}>Start free.<br />Scale when ready.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              name: 'Free', price: '$0', period: '/mo', desc: 'Try it out, no card needed', featured: false,
              features: [
                { text: '20 images / month', inc: true }, { text: '5 video renders', inc: true },
                { text: 'Core models', inc: true }, { text: 'Pro models', inc: false },
                { text: 'Priority queue', inc: false }, { text: 'Unlimited storage', inc: false },
              ],
              cta: 'Get started', ctaFilled: false,
            },
            {
              name: 'Studio', price: '$19', period: '/mo', desc: 'For serious creators', featured: true,
              features: [
                { text: '500 images / month', inc: true }, { text: '50 video renders', inc: true },
                { text: 'All models', inc: true }, { text: 'Priority queue', inc: true },
                { text: 'Unlimited storage', inc: true }, { text: 'Team sharing', inc: false },
              ],
              cta: 'Start Studio trial →', ctaFilled: true,
            },
            {
              name: 'Pro', price: '$49', period: '/mo', desc: 'Teams and agencies', featured: false,
              features: [
                { text: 'Unlimited images', inc: true }, { text: '200 video renders', inc: true },
                { text: 'All models', inc: true }, { text: 'Priority queue', inc: true },
                { text: 'Unlimited storage', inc: true }, { text: 'Team sharing', inc: true },
              ],
              cta: 'Contact us', ctaFilled: false,
            },
          ].map(tier => (
            <div key={tier.name} style={{
              background: tier.featured ? 'rgba(61,127,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${tier.featured ? 'rgba(61,127,255,0.35)' : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 18, padding: 26,
              boxShadow: tier.featured ? '0 0 40px rgba(61,127,255,0.08)' : 'none',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tier.featured ? '#7aabff' : 'rgba(240,237,232,0.3)', marginBottom: 12 }}>
                {tier.name}
              </div>
              <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-2px', marginBottom: 4, color: '#f0ede8' }}>
                {tier.price} <span style={{ fontSize: 14, fontWeight: 500, color: 'rgba(240,237,232,0.35)' }}>{tier.period}</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(240,237,232,0.4)', marginBottom: 20 }}>{tier.desc}</div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                {tier.features.map(f => (
                  <li key={f.text} style={{ fontSize: 13, color: 'rgba(240,237,232,0.5)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: f.inc ? '#34c759' : 'rgba(240,237,232,0.2)', fontSize: f.inc ? 11 : 13, fontWeight: 700, width: 16 }}>{f.inc ? '✓' : '–'}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowAuth(true)} style={{
                width: '100%', padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: tier.ctaFilled ? '#3d7fff' : 'transparent',
                color: tier.ctaFilled ? '#fff' : 'rgba(240,237,232,0.45)',
                border: tier.ctaFilled ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
                onMouseEnter={e => { if (tier.ctaFilled) e.currentTarget.style.background = '#5590ff'; else { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#f0ede8' } }}
                onMouseLeave={e => { if (tier.ctaFilled) e.currentTarget.style.background = '#3d7fff'; else { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(240,237,232,0.45)' } }}
              >{tier.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="px-5 sm:px-10 py-20 sm:py-28" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(61,127,255,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 18, color: '#f0ede8', position: 'relative' }}>
          Ready to build your<br />
          <span style={{ background: 'linear-gradient(135deg, #3d7fff, #9b7aff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            creative vault?
          </span>
        </h2>
        <p style={{ fontSize: 17, color: 'rgba(240,237,232,0.4)', marginBottom: 36, position: 'relative' }}>Free forever on the core plan. No credit card required.</p>
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center" style={{ position: 'relative' }}>
          <button onClick={() => setShowAuth(true)} style={{
            background: '#3d7fff', color: '#fff', border: 'none', padding: '14px 30px',
            borderRadius: 100, fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 0 40px rgba(61,127,255,0.3)',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#5590ff'; e.currentTarget.style.boxShadow = '0 0 56px rgba(61,127,255,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#3d7fff'; e.currentTarget.style.boxShadow = '0 0 40px rgba(61,127,255,0.3)' }}
          >Start for free →</button>
          <a href="/pricing" style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(240,237,232,0.5)',
            padding: '14px 28px', borderRadius: 100, fontSize: 15, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.25)'; (e.currentTarget as HTMLAnchorElement).style.color = '#f0ede8' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(240,237,232,0.5)' }}
          >View all models</a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between px-5 sm:px-10 py-8"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)', color: 'rgba(240,237,232,0.25)', fontSize: 13 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#f0ede8' }}>
          prmpt<span style={{ color: '#3d7fff' }}>VAULT</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Docs'].map(l => (
            <a key={l} href="#" style={{ color: 'rgba(240,237,232,0.25)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(240,237,232,0.6)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(240,237,232,0.25)')}
            >{l}</a>
          ))}
        </div>
        <div>© 2026 Marello Productions</div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
