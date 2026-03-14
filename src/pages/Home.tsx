import { useState, useEffect } from 'react'
import Logo from '../components/Logo'
import AuthModal from '../components/auth/AuthModal'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const S = 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets'
const U = 'f9965304-4af9-4eba-a762-7b7c892473e1'

// Workspace mockup showcase — photorealistic Flux output
const SHOWCASE_ASSET = `${S}/${U}/1773192400838-hyayxhlodt.webp`

// Gallery — manually shuffled to mix eras and interleave videos throughout
type GalleryItem = { url: string; video: boolean }
const GALLERY_ASSETS: GalleryItem[] = [
  { url: `${S}/${U}/1773276565870-gc1ziwuizgu.webp`,       video: false },
  { url: `${S}/${U}/1773102057074-8lky3sgejaq.mp4`,        video: true  },
  { url: `${S}/${U}/1773121140586-hhuk0k4iz3a.jpg`,        video: false },
  { url: `${S}/${U}/1772772002691.png`,                    video: false },
  { url: `${S}/${U}/1773275602324-jm6unhe3yg.mp4`,         video: true  },
  { url: `${S}/${U}/1773191631204-uu3nt8u53o.jpg`,         video: false },
  { url: `${S}/${U}/1773265297836.png`,                    video: false },
  { url: `${S}/${U}/1773122231715-ucfvkydadi9.mp4`,        video: true  },
  { url: `${S}/${U}/1773097669991-vcaf8o2fhni.jpg`,        video: false },
  { url: `${S}/${U}/1773249473034.png`,                    video: false },
  { url: `${S}/${U}/1773193147392-dupb0dqsjdj.mp4`,        video: true  },
  { url: `${S}/${U}/1773121140603-b8x1m020cwu.jpg`,        video: false },
  { url: `${S}/${U}/1772773304799.png`,                    video: false },
  { url: `${S}/${U}/1773234353024-8ettbnmug4g.mp4`,        video: true  },
  { url: `${S}/${U}/1773168565808-hq41x9wlrjo.jpg`,        video: false },
  { url: `${S}/${U}/1773272870789-fmnshh3tee9.png`,        video: false },
  { url: `${S}/${U}/1773276571664-izhbdgt2vtq.mp4`,        video: true  },
  { url: `${S}/${U}/1773097779411-6tbdqm308qy.jpg`,        video: false },
  { url: `${S}/${U}/1773271432448.png`,                    video: false },
  { url: `${S}/${U}/1773149521681-33oxodtbep5.mp4`,        video: true  },
  { url: `${S}/${U}/1773189262873-bdvfolfm3x5.jpg`,        video: false },
  { url: `${S}/${U}/1772772445427.png`,                    video: false },
  { url: `${S}/${U}/1773281096192-3ko42n3qfbv.mp4`,        video: true  },
  { url: `${S}/${U}/1773121196651-6yczb7uvhtd.jpg`,        video: false },
  { url: `${S}/${U}/1773265806557.png`,                    video: false },
  { url: `${S}/${U}/1773238785803-oug93xafgc9.mp4`,        video: true  },
  { url: `${S}/${U}/1773097840496-zln7cfsexdb.jpg`,        video: false },
  { url: `${S}/${U}/1773250936737.png`,                    video: false },
  { url: `${S}/${U}/1773106216078-opq0kulv11b.mp4`,        video: true  },
  { url: `${S}/${U}/1773192090990-d0f4il12bg.jpg`,         video: false },
  { url: `${S}/${U}/1772726010394.png`,                    video: false },
  { url: `${S}/${U}/1773155848247-t6h55dqnmka.mp4`,        video: true  },
  { url: `${S}/${U}/1773273530824-kfnn11kkf6.webp`,        video: false },
  { url: `${S}/${U}/1773167880458.png`,                    video: false },
  { url: `${S}/${U}/1773274984200-e09ebqbxg2t.mp4`,        video: true  },
  { url: `${S}/${U}/1773121140602-9qavd1fhiie.jpg`,        video: false },
  { url: `${S}/${U}/1773252682825-eynyylfklh.jpg`,         video: false },
  { url: `${S}/${U}/1773121567051-qei4c5elpj.mp4`,         video: true  },
  { url: `${S}/${U}/1773272947223-yt22djpgk0o.png`,        video: false },
  { url: `${S}/${U}/1773097957715-vbcmkai9f0h.jpg`,        video: false },
  { url: `${S}/${U}/1773286040352-cy3jf9c873m.mp4`,        video: true  },
  { url: `${S}/${U}/1773167726198.png`,                    video: false },
  { url: `${S}/${U}/1773120073813-dygigi20mw7.jpg`,        video: false },
  { url: `${S}/${U}/1773168450544.png`,                    video: false },
  { url: `${S}/${U}/1773191916158-e8x9a1u7dt9.jpg`,        video: false },
  { url: `${S}/${U}/1772729476761.png`,                    video: false },
  { url: `${S}/${U}/1773119774536-nmt8pitqvpc.jpg`,        video: false },
  { url: `${S}/${U}/1773278431301-mn8y3tw9fp.jpg`,         video: false },
  { url: `${S}/${U}/1773168026347.png`,                    video: false },
  { url: `${S}/${U}/1773097728856-v3ap7gzlfnn.jpg`,        video: false },
  { url: `${S}/${U}/1773249541519.png`,                    video: false },
  { url: `${S}/${U}/1773167969354.png`,                    video: false },
  { url: `${S}/${U}/1773121140586-oca8u7wy5v.jpg`,         video: false },
  { url: `${S}/${U}/1773121196652-hvh2uf66b6h.jpg`,        video: false },
  { url: `${S}/${U}/1772772684856.png`,                    video: false },
  { url: `${S}/${U}/1773192256036-4xvglnwuq23.jpg`,        video: false },
  { url: `${S}/${U}/1773105432147.png`,                    video: false },
  { url: `${S}/${U}/1773275392279-mp7lake1ihf.jpg`,        video: false },
  { url: `${S}/${U}/1773097895754-gisdzjotcn9.jpg`,        video: false },
  { url: `${S}/${U}/1773167850979.png`,                    video: false },
  { url: `${S}/${U}/1773238327397-lnmxu6g9z4a.png`,        video: false },
  { url: `${S}/${U}/1772772089090.png`,                    video: false },
  { url: `${S}/${U}/1773119774537-nmlxwhj38vk.jpg`,        video: false },
  { url: `${S}/${U}/1772726421198.png`,                    video: false },
  { url: `${S}/${U}/1772772580175.png`,                    video: false },
  { url: `${S}/${U}/1772729597864.png`,                    video: false },
  { url: `${S}/${U}/1772772981088.png`,                    video: false },
  { url: `${S}/${U}/1773281096192-3ko42n3qfbv.mp4`,        video: true  },
  { url: `${S}/${U}/1773286040352-cy3jf9c873m.mp4`,        video: true  },
]

// Theme tokens for landing page
const DARK = {
  bg: '#0f0e0c', surface: 'rgba(255,255,255,0.04)', surfaceHover: 'rgba(255,255,255,0.07)',
  text: '#f0ede8', text2: 'rgba(240,237,232,0.5)', text3: 'rgba(240,237,232,0.28)',
  border: 'rgba(255,255,255,0.08)', borderHover: 'rgba(255,255,255,0.18)',
  navBg: 'rgba(20,18,16,0.85)', cardBg: 'rgba(255,255,255,0.03)',
  socialBorder: '#0f0e0c', pricingFeatured: 'rgba(61,127,255,0.08)',
}
const LIGHT = {
  bg: '#f5f5f7', surface: 'rgba(0,0,0,0.04)', surfaceHover: 'rgba(0,0,0,0.07)',
  text: '#1d1d1f', text2: 'rgba(29,29,31,0.55)', text3: 'rgba(29,29,31,0.35)',
  border: 'rgba(0,0,0,0.1)', borderHover: 'rgba(0,0,0,0.25)',
  navBg: 'rgba(245,245,247,0.88)', cardBg: '#fff',
  socialBorder: '#f5f5f7', pricingFeatured: 'rgba(61,127,255,0.06)',
}

export default function Home() {
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [dark, setDark] = useState(true)
  const T = dark ? DARK : LIGHT
  const navigate = useNavigate()

  useEffect(() => {
    GALLERY_ASSETS.filter(a => !a.video).forEach(a => { new Image().src = a.url })
  }, [])

  if (user) navigate('/dashboard')

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>

      {/* NAV — desktop floating pill */}
      <nav className="hidden sm:flex" style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
        alignItems: 'center', gap: 32, padding: '0 20px', height: 48,
        background: T.navBg, backdropFilter: 'blur(24px) saturate(1.6)',
        border: `1px solid ${T.border}`, borderRadius: 100,
        boxShadow: '0 2px 32px rgba(0,0,0,0.15)',
        minWidth: 600, justifyContent: 'space-between',
      }}>
        <Logo height={21} theme={dark ? 'dark' : 'light'} />
        <div style={{ display: 'flex', gap: 24 }}>
          {[{ label: 'Models', href: '#models' }, { label: 'Pricing', href: '/pricing' }, { label: 'Gallery', href: '#gallery' }].map(l => (
            <a key={l.label} href={l.href} style={{ color: T.text2, textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text)}
              onMouseLeave={e => (e.currentTarget.style.color = T.text2)}
            >{l.label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Dark / Light toggle */}
          <button onClick={() => setDark(d => !d)} style={{
            background: T.surface, border: `1px solid ${T.border}`, color: T.text2,
            width: 32, height: 32, borderRadius: 100, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0,
          }} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {dark ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <button onClick={() => setShowAuth(true)} style={{
            background: 'transparent', border: `1px solid ${T.border}`, color: T.text2,
            padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.text }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2 }}
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
        background: T.navBg, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <Logo height={21} theme={dark ? 'dark' : 'light'} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setDark(d => !d)} style={{
            background: T.surface, border: `1px solid ${T.border}`, color: T.text2,
            width: 32, height: 32, borderRadius: 100, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {dark ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          </button>
          <button onClick={() => setShowAuth(true)} style={{
            background: '#3d7fff', border: 'none', color: '#fff',
            padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>Start free</button>
        </div>
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

        <h1 style={{ fontSize: 'clamp(48px, 7vw, 92px)', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-3px', marginBottom: 24, color: T.text }}>
          Every top AI model.<br />
          <span style={{ background: 'linear-gradient(135deg, #3d7fff 0%, #9b7aff 50%, #ff7a9b 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            One studio.
          </span>
        </h1>

        <p style={{ fontSize: 18, color: T.text2, maxWidth: 520, margin: '0 auto 44px', fontWeight: 400, lineHeight: 1.65 }}>
          Generate images and video with DALL-E, Flux, Kling, Luma and more. Save every prompt. Pick up where you left off.
        </p>

        {/* PROMPT BAR */}
        <div style={{
          width: '100%', maxWidth: 640, margin: '0 auto 48px',
          background: T.surface, border: '1px solid ' + T.border,
          borderRadius: 14, padding: '6px 6px 6px 16px',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 0 0 1px rgba(61,127,255,0.08), 0 8px 40px rgba(0,0,0,0.3)',
        }}>
          <input readOnly placeholder="A lone lighthouse at stormy dusk, cinematic…" onClick={() => setShowAuth(true)} style={{
            flex: 1, background: 'none', border: 'none', outline: 'none', minWidth: 0,
            color: T.text, fontFamily: 'inherit', fontSize: 14, cursor: 'text',
          }} />
          <div className="hidden sm:block" style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
            color: T.text2, padding: '6px 12px', borderRadius: 8,
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

      </section>

      {/* ── ASSET GALLERY STRIP ────────────────────────── */}
      <section id="gallery" style={{ overflow: 'hidden', paddingBottom: 4 }}>
        <div style={{
          display: 'flex', gap: 10,
          animation: 'marquee 160s linear infinite',
          width: 'max-content', padding: '0 10px',
        }}>
          {/* Double the array for seamless infinite loop — no repeats in the original set */}
          {[...GALLERY_ASSETS, ...GALLERY_ASSETS].map((item, i) => (
            <div key={i} style={{
              width: 220, height: 160, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
              border: '1px solid rgba(255,255,255,0.06)', position: 'relative',
            }}>
              {item.video ? (
                <>
                  <video
                    src={item.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', top: 6, left: 6,
                    width: 18, height: 18, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="7" height="7" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                </>
              ) : (
                <img src={item.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
              )}
            </div>
          ))}
        </div>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      </section>

      {/* ── WHY PRMPTVAULT ────────────────────────────── */}
      <section className="px-5 sm:px-10 py-20 sm:py-28" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.text3, marginBottom: 14 }}>
            Why prmptVAULT
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 50px)', fontWeight: 800, letterSpacing: '-1.5px', color: T.text, marginBottom: 16, lineHeight: 1.1 }}>
            Not a blank box.<br />A structured studio.
          </h2>
          <p style={{ fontSize: 17, color: T.text2, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Every other tool gives you a text field and wishes you luck. prmptVAULT gives you purpose-built fields for every model — so your subject, style, lighting, mood, and lens are all intentional, not accidental.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {/* Card 1 — Structured fields */}
          <div style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 20, padding: 28, transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.25)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(61,127,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3d7fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="4" rx="1"/><rect x="3" y="10" width="11" height="4" rx="1"/><rect x="3" y="17" width="14" height="4" rx="1"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 10, letterSpacing: '-0.3px' }}>Guided by structure</h3>
            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7 }}>
              Subject. Style. Lighting. Mood. Lens. Composition. Each field is purpose-built for the model you're using — no guessing, no prompt engineering degree required.
            </p>
          </div>

          {/* Card 2 — All models */}
          <div style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 20, padding: 28, transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(155,122,255,0.25)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(155,122,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9b7aff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 10, letterSpacing: '-0.3px' }}>Every model. One place.</h3>
            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7 }}>
              DALL-E 3. Flux Pro Ultra. Kling. Luma Ray-2. Veo 3. Minimax. 12+ image and video models, all in one workspace — no switching tabs, no managing API keys, no stitching tools together.
            </p>
          </div>

          {/* Card 3 — Your vault */}
          <div style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 20, padding: 28, transition: 'all 0.2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(52,199,89,0.25)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(52,199,89,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34c759" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16 11h6M19 8v6"/>
              </svg>
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 10, letterSpacing: '-0.3px' }}>Everything saved. Always.</h3>
            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7 }}>
              Every image and video you generate lives in your personal vault. Download it, send it to img2img, run it through a different model, or pick up exactly where you left off — months later.
            </p>
          </div>
        </div>

        {/* Before / after comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Without */}
          <div style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 20, padding: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.text3, marginBottom: 16 }}>Without prmptVAULT</div>
            <div style={{ background: dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', border: '1px solid ' + T.border, borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: T.text3, fontStyle: 'italic' }}>a lighthouse at night...</div>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Blank text box, no guidance',
                'Switch tabs to compare models',
                'Download and lose track of outputs',
                'Start from scratch every time',
              ].map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text2 }}>
                  <span style={{ color: '#f87171', fontSize: 14, fontWeight: 700 }}>✕</span> {t}
                </li>
              ))}
            </ul>
          </div>
          {/* With */}
          <div style={{ background: dark ? 'rgba(61,127,255,0.06)' : 'rgba(61,127,255,0.04)', border: '1px solid rgba(61,127,255,0.2)', borderRadius: 20, padding: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7aabff', marginBottom: 16 }}>With prmptVAULT</div>
            <div style={{ background: 'rgba(61,127,255,0.08)', border: '1px solid rgba(61,127,255,0.15)', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[['Subject', 'A lone lighthouse'], ['Lighting', 'Golden hour'], ['Mood', 'Dramatic, cinematic'], ['Lens', '24mm wide']].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                    <span style={{ color: T.text3, width: 60, flexShrink: 0 }}>{l}</span>
                    <span style={{ color: T.text }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'Structured fields for every model',
                '12+ models in one workspace',
                'Every output saved to your vault',
                'Remix and iterate on anything',
              ].map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text2 }}>
                  <span style={{ color: '#34c759', fontSize: 14, fontWeight: 700 }}>✓</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── STUDIO WORKSPACE ──────────────────────────── */}
      <section id="workspace" className="px-5 sm:px-10 py-20 sm:py-28">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.text3, marginBottom: 14 }}>
            The Generator
          </div>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 800, letterSpacing: '-1.5px', color: T.text, marginBottom: 14 }}>
            A studio-grade workspace.
          </h2>
          <p style={{ fontSize: 16, color: T.text2, maxWidth: 480, margin: '0 auto' }}>
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
            <Logo height={16} theme={dark ? 'dark' : 'light'} style={{ marginLeft: 6 }} />
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
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.text3, marginBottom: 8, padding: '0 6px' }}>Image Models</div>
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
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.text3, margin: '16px 0 8px', padding: '0 6px' }}>Video Models</div>
              {[
                { name: 'Luma Ray-2', tag: 'txt2vid · img2vid' },
                { name: 'Kling 1.6', tag: 'txt2vid · img2vid' },
                { name: 'Minimax', tag: 'txt2vid' },
              ].map(m => (
                <div key={m.name} style={{ padding: '7px 10px', borderRadius: 8, marginBottom: 2, cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.text2 }}>{m.name}</div>
                  <div style={{ fontSize: 9, color: T.text3, marginTop: 2 }}>{m.tag}</div>
                </div>
              ))}
            </div>

            {/* Form panel */}
            <div className="hidden sm:flex" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: 20, flexDirection: 'column', gap: 14, background: '#111009' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.text3, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prompt</div>
                <div style={{
                  background: T.surface, border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, padding: '10px 12px', fontSize: 12,
                  color: T.text, lineHeight: 1.6, minHeight: 80,
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
                  <div key={s.label} style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 8, padding: '8px 10px' }}>
                    <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text2 }}>{s.val}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: 9, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Model</div>
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
                <span style={{ fontSize: 10, color: T.text3 }}>· 8s</span>
              </div>
              {/* Actions */}
              <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 6 }}>
                {['↓', '→ img2img'].map(lbl => (
                  <div key={lbl} style={{
                    background: 'rgba(15,14,12,0.75)', backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                    padding: '5px 9px', fontSize: 11, fontWeight: 600, color: T.text2, cursor: 'pointer',
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
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-1.5px', color: T.text }}>
            Everything you need.<br />Nothing you don't.
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          {/* WIDE — showcase asset */}
          <div className="col-span-2 sm:row-span-2" style={{
            borderRadius: 18, border: '1px solid ' + T.border,
            overflow: 'hidden', position: 'relative', minHeight: 260,
            transition: 'transform 0.2s, border-color 0.2s', cursor: 'default',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.25)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
          >
            <img src={GALLERY_ASSETS[21].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,9,8,0.92) 0%, rgba(10,9,8,0.1) 60%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.text3, marginBottom: 6 }}>Featured · Flux Pro Ultra</div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, color: T.text }}>State-of-the-art<br />image generation</div>
            </div>
          </div>

          {/* STAT — models */}
          <div style={{
            background: T.cardBg, borderRadius: 18, border: '1px solid ' + T.border,
            padding: 22, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: '#3d7fff' }}>12+</div>
            <div style={{ fontSize: 14, color: T.text2, marginTop: 6 }}>AI models<br />connected</div>
          </div>

          {/* FEATURE — Prompt Library */}
          <div style={{
            background: T.cardBg, borderRadius: 18, border: '1px solid ' + T.border,
            padding: 22, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(61,127,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3d7fff" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: T.text }}>Prompt Vault</h3>
            <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.6 }}>Every prompt saved. Search, remix, and build on what works.</p>
          </div>

          {/* STAT — storage */}
          <div style={{
            background: T.cardBg, borderRadius: 18, border: '1px solid ' + T.border,
            padding: 22, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(52,199,89,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: '#34c759' }}>∞</div>
            <div style={{ fontSize: 14, color: T.text2, marginTop: 6 }}>Asset storage<br />on Pro</div>
          </div>

          {/* MODELS LIST */}
          <div style={{
            background: T.cardBg, borderRadius: 18, border: '1px solid ' + T.border,
            padding: '18px 20px', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: T.text }}>All models</h3>
            {[
              { dot: '#10b981', name: 'DALL-E 3', prov: 'OpenAI' },
              { dot: '#3d7fff', name: 'Flux Pro Ultra', prov: 'BFL' },
              { dot: '#3b82f6', name: 'Veo 3', prov: 'Google' },
              { dot: '#84cc16', name: 'Dream Machine', prov: 'Luma AI' },
              { dot: '#a78bfa', name: 'Kling', prov: 'Kuaishou' },
            ].map((m, i, arr) => (
              <div key={m.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: i < arr.length - 1 ? '1px solid ' + T.border : 'none' }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: T.text }}>{m.name}</span>
                <span style={{ fontSize: 10, color: T.text3 }}>{m.prov}</span>
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
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 5, color: T.text }}>Generate &amp; go</h3>
            <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.6 }}>Start a render, close the tab. We'll notify you the second it's done.</p>
          </div>

        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────── */}
      <section className="px-5 sm:px-10 py-16 sm:py-20" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.text3, marginBottom: 12 }}>Pricing</div>
        <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 36, color: T.text }}>Start free.<br />Scale when ready.</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              name: 'Free', price: '$0', period: '', desc: 'Try it out — no card needed', featured: false, trial: false,
              features: [
                { text: '15 images / month', inc: true }, { text: 'DALL-E 3 + Flux Schnell', inc: true },
                { text: 'Core models only', inc: true }, { text: 'No video models', inc: false },
                { text: 'Assets saved to vault', inc: true },
              ],
              cta: 'Get started', ctaFilled: false,
            },
            {
              name: 'Creator', price: '$12', period: '/mo', desc: 'For growing creators', featured: false, trial: true,
              features: [
                { text: '500 images / month', inc: true }, { text: 'Pick up to 10 image models', inc: true },
                { text: 'No video models', inc: false }, { text: 'Priority queue', inc: true },
                { text: 'AI Assist', inc: true },
              ],
              cta: 'Start free trial', ctaFilled: false,
            },
            {
              name: 'Studio', price: '$29', period: '/mo', desc: 'For serious creators', featured: true, trial: true,
              features: [
                { text: '2,000 images / month', inc: true }, { text: 'All image models', inc: true },
                { text: 'Pick up to 5 video models', inc: true }, { text: 'Priority queue', inc: true },
                { text: 'AI Assist + Export', inc: true },
              ],
              cta: 'Start free trial', ctaFilled: true,
            },
            {
              name: 'Pro', price: '$59', period: '/mo', desc: 'Teams and power users', featured: false, trial: true,
              features: [
                { text: 'Unlimited images', inc: true }, { text: 'All image models', inc: true },
                { text: 'All video models (incl. Sora 2 + Kling)', inc: true }, { text: 'Unlimited storage', inc: true },
                { text: 'API access', inc: true },
              ],
              cta: 'Start free trial', ctaFilled: false,
            },
            {
              name: 'Teams', price: 'Soon', period: '', desc: 'Shared vaults, team billing', featured: false, trial: false, comingSoon: true,
              features: [
                { text: 'Everything in Pro', inc: true }, { text: 'Shared vault', inc: true },
                { text: 'Role-based access', inc: true }, { text: 'Team analytics', inc: true },
                { text: 'Dedicated support', inc: true },
              ],
              cta: 'Notify me', ctaFilled: false,
            },
          ].map((tier: { name: string; price: string; period: string; desc: string; featured: boolean; trial: boolean; comingSoon?: boolean; features: { text: string; inc: boolean }[]; cta: string; ctaFilled: boolean }) => (
            <div key={tier.name} style={{
              position: 'relative',
              background: tier.featured ? T.pricingFeatured : T.cardBg,
              border: `1px solid ${tier.featured ? 'rgba(61,127,255,0.35)' : tier.comingSoon ? 'rgba(255,255,255,0.06)' : T.border}`,
              borderRadius: 18, padding: 22,
              boxShadow: tier.featured ? '0 0 40px rgba(61,127,255,0.08)' : 'none',
              opacity: tier.comingSoon ? 0.7 : 1,
              display: 'flex', flexDirection: 'column',
            }}>
              {tier.trial && (
                <div style={{ position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                  <span style={{ background: '#ff9500', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>3-day free trial</span>
                </div>
              )}
              {tier.featured && (
                <div style={{ position: 'absolute', top: tier.trial ? 8 : -11, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>
                  <span style={{ background: '#3d7fff', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 100 }}>Most popular</span>
                </div>
              )}
              <div style={{ marginTop: (tier.trial || tier.featured) ? 10 : 0, marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: tier.featured ? '#7aabff' : T.text3, marginBottom: 8 }}>
                  {tier.name}
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 2, color: T.text, lineHeight: 1 }}>
                  {tier.price}{tier.period && <span style={{ fontSize: 13, fontWeight: 500, color: T.text3 }}>{tier.period}</span>}
                </div>
                <div style={{ fontSize: 11, color: T.text2 }}>{tier.desc}</div>
              </div>
              <ul style={{ flex: 1, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                {tier.features.map(f => (
                  <li key={f.text} style={{ fontSize: 12, color: T.text2, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                    <span style={{ color: f.inc ? '#34c759' : T.text3, fontSize: f.inc ? 10 : 12, fontWeight: 700, marginTop: 1, flexShrink: 0 }}>{f.inc ? '✓' : '–'}</span>
                    {f.text}
                  </li>
                ))}
              </ul>
              <button onClick={() => !tier.comingSoon && setShowAuth(true)} style={{
                width: '100%', padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                cursor: tier.comingSoon ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: tier.ctaFilled ? '#3d7fff' : 'transparent',
                color: tier.ctaFilled ? '#fff' : 'rgba(240,237,232,0.45)',
                border: tier.ctaFilled ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
                onMouseEnter={e => { if (tier.ctaFilled) e.currentTarget.style.background = '#5590ff'; else if (!tier.comingSoon) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#f0ede8' } }}
                onMouseLeave={e => { if (tier.ctaFilled) e.currentTarget.style.background = '#3d7fff'; else { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(240,237,232,0.45)' } }}
              >{tier.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section className="px-5 sm:px-10 py-20 sm:py-28" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(61,127,255,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 18, color: T.text, position: 'relative' }}>
          Ready to build your<br />
          <span style={{ background: 'linear-gradient(135deg, #3d7fff, #9b7aff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            creative vault?
          </span>
        </h2>
        <p style={{ fontSize: 17, color: T.text2, marginBottom: 36, position: 'relative' }}>Free forever on the core plan. No credit card required.</p>
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
            background: 'transparent', border: '1px solid ' + T.border, color: T.text2,
            padding: '14px 28px', borderRadius: 100, fontSize: 15, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.borderHover; (e.currentTarget as HTMLAnchorElement).style.color = T.text }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.border; (e.currentTarget as HTMLAnchorElement).style.color = T.text2 }}
          >View all models</a>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between px-5 sm:px-10 py-8"
        style={{ borderTop: '1px solid ' + T.border, color: T.text3, fontSize: 13 }}>
        <Logo height={21} theme={dark ? 'dark' : 'light'} />
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Docs'].map(l => (
            <a key={l} href="#" style={{ color: T.text3, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text2)}
              onMouseLeave={e => (e.currentTarget.style.color = T.text3)}
            >{l}</a>
          ))}
        </div>
        <div>© 2026 Marello Productions</div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
