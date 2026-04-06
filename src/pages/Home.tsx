import { useState, useEffect, useRef } from 'react'
import { motion, useScroll, useTransform, useInView } from 'motion/react'
import Logo from '../components/Logo'
import AuthModal from '../components/auth/AuthModal'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../contexts/ThemeContext'

// Scroll-triggered fade+slide wrapper
function FadeIn({ children, delay = 0, y = 40, x = 0, className, style, once = true }: {
  children: React.ReactNode; delay?: number; y?: number; x?: number;
  className?: string; style?: React.CSSProperties; once?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once, margin: '0px 0px -200px 0px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y, x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] as const }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// Staggered children container
function StaggerIn({ children, stagger = 0.1, className, style }: {
  children: React.ReactNode; stagger?: number; className?: string; style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -200px 0px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  )
}

// Section CTA pill
function SectionCta({ onClick, label = 'Try for free →' }: { onClick: () => void; label?: string }) {
  return (
    <FadeIn style={{ textAlign: 'center', marginTop: 40 }}>
      <button onClick={onClick} style={{
        background: '#3d7fff', color: '#fff', border: 'none',
        padding: '10px 24px', borderRadius: 100, fontSize: 14, fontWeight: 600,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s',
        boxShadow: '0 0 24px rgba(61,127,255,0.2)',
      }}
        onMouseEnter={e => { e.currentTarget.style.background = '#5590ff'; e.currentTarget.style.boxShadow = '0 0 40px rgba(61,127,255,0.35)' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#3d7fff'; e.currentTarget.style.boxShadow = '0 0 24px rgba(61,127,255,0.2)' }}
      >{label}</button>
    </FadeIn>
  )
}

// FAQ accordion component
function FaqItem({ q, a, open, onToggle, T }: { q: string; a: string; open: boolean; onToggle: () => void; T: typeof DARK }) {
  return (
    <div style={{ borderBottom: '1px solid ' + T.border }}>
      <button onClick={onToggle} style={{
        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 0', background: 'none', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', textAlign: 'left',
      }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: T.text, paddingRight: 16 }}>{q}</span>
        <span style={{ fontSize: 20, color: T.text3, flexShrink: 0, transition: 'transform 0.2s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && (
        <div style={{ paddingBottom: 20, fontSize: 15, color: T.text2, lineHeight: 1.7 }}>{a}</div>
      )}
    </div>
  )
}

const staggerChild = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const } },
}

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

const IMAGE_MODELS = ['Imagen 4', 'Flux Pro Ultra', 'DALL-E 3', 'Flux Pro', 'Flux Dev', 'Imagen 4', 'Flux Pro Ultra', 'DALL-E 3']
const MOCKUP_MODELS = ['Flux Pro Ultra', 'Flux Dev', 'Imagen 4', 'DALL-E 3']
const VIDEO_MODELS = ['Veo 2', 'Kling', 'Luma', 'Veo 2', 'Kling', 'Luma', 'Veo 2', 'Kling']

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
const BLUE = {
  bg: '#060B18', surface: 'rgba(58,123,247,0.06)', surfaceHover: 'rgba(58,123,247,0.12)',
  text: '#E8EDF5', text2: 'rgba(232,237,245,0.5)', text3: 'rgba(232,237,245,0.28)',
  border: 'rgba(58,123,247,0.15)', borderHover: 'rgba(58,123,247,0.35)',
  navBg: 'rgba(6,11,24,0.88)', cardBg: 'rgba(12,21,41,0.6)',
  socialBorder: '#060B18', pricingFeatured: 'rgba(58,123,247,0.12)',
}

export default function Home() {
  const { user } = useAuth()
  const [showAuth, setShowAuth] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [reelPlaying, setReelPlaying] = useState(true)
  const [reelMuted, setReelMuted] = useState(true)
  const reelRef = useRef<HTMLVideoElement>(null)
  const reelSrc = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
    ? 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/videos/launch-reel-9x16.mp4'
    : 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/videos/launch-reel-16x9.mp4'
  const { theme, setTheme } = useTheme()
  const dark = theme === 'dark' || theme === 'blue'
  const T = theme === 'blue' ? BLUE : dark ? DARK : LIGHT
  const navigate = useNavigate()

  // Mockup cursor animation
  const [animCursor, setAnimCursor] = useState({ x: 185, y: 81 })
  const [animDropdown, setAnimDropdown] = useState(false)
  const [animHovered, setAnimHovered] = useState<string | null>(null)
  const [animModel, setAnimModel] = useState('Flux Pro Ultra')
  const [animClicking, setAnimClicking] = useState(false)
  const [animMs, setAnimMs] = useState(1200)

  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = []
    let dead = false
    const q = (fn: () => void, ms: number) => { const id = setTimeout(() => { if (!dead) fn() }, ms); ids.push(id) }
    const cycle = () => {
      if (dead) return
      setAnimCursor({ x: 185, y: 81 }); setAnimModel('Flux Pro Ultra')
      setAnimDropdown(false); setAnimHovered(null); setAnimClicking(false); setAnimMs(1200)
      q(() => setAnimCursor({ x: 185, y: 324 }), 600)                                     // move to model field
      q(() => setAnimClicking(true), 1900)                                                   // click down
      q(() => { setAnimClicking(false); setAnimDropdown(true) }, 2120)                      // dropdown opens
      q(() => { setAnimMs(380); setAnimCursor({ x: 185, y: 249 }) }, 2700)                 // move to Imagen 4
      q(() => setAnimHovered('Imagen 4'), 3080)
      q(() => { setAnimCursor({ x: 185, y: 217 }); setAnimHovered('Flux Dev') }, 3500)     // browse to Flux Dev
      q(() => { setAnimCursor({ x: 185, y: 249 }); setAnimHovered('Imagen 4') }, 3950)     // back to Imagen 4
      q(() => setAnimClicking(true), 4400)                                                   // click
      q(() => { setAnimClicking(false); setAnimModel('Imagen 4'); setAnimDropdown(false); setAnimHovered(null) }, 4620)
      q(() => { setAnimMs(1200); setAnimCursor({ x: 185, y: 81 }) }, 4950)                 // return to prompt
      q(cycle, 10200)                                                                        // 4950 + ~1200 travel + 4050 idle
    }
    cycle()
    return () => { dead = true; ids.forEach(clearTimeout) }
  }, [])

  useEffect(() => {
    GALLERY_ASSETS.filter(a => !a.video).forEach(a => { new Image().src = a.url })
  }, [])

  const [liveModels, setLiveModels] = useState<{ name: string; provider: string; slug: string }[]>([])
  useEffect(() => {
    supabase.from('models').select('name, provider, slug').eq('is_active', true).eq('sandbox', false).order('sort_order')
      .then(({ data }) => { if (data) setLiveModels(data) })
  }, [])

  // Parallax
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroGlowY = useTransform(heroProgress, [0, 1], [0, 120])
  const heroMockupY = useTransform(heroProgress, [0, 1], [0, 60])

  const ctaRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress: ctaProgress } = useScroll({ target: ctaRef, offset: ['start end', 'end start'] })
  const ctaGlowY = useTransform(ctaProgress, [0, 1], [60, -60])

  if (user) navigate('/dashboard')

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: "'Inter', -apple-system, sans-serif", overflowX: 'hidden' }}>

      {/* NAV — desktop floating pill */}
      <nav className="hidden lg:flex" style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 50,
        alignItems: 'center', gap: 32, padding: '0 20px', height: 48,
        background: T.navBg, backdropFilter: 'blur(24px) saturate(1.6)',
        border: `1px solid ${T.border}`, borderRadius: 100,
        boxShadow: '0 2px 32px rgba(0,0,0,0.15)',
        minWidth: 600, justifyContent: 'space-between', whiteSpace: 'nowrap',
      }}>
        <Logo height={32} theme={dark ? 'dark' : 'light'} />
        <div style={{ display: 'flex', gap: 24 }}>
          {[{ label: 'Blog', href: 'https://blog.prmptvault.ai', ext: true }, { label: 'Gallery', href: '/gallery', ext: false }, { label: 'Pricing', href: '/pricing', ext: false }].map(l => (
            <a key={l.label} href={l.href} {...(l.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} style={{ color: T.text2, textDecoration: 'none', fontSize: 13, fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text)}
              onMouseLeave={e => (e.currentTarget.style.color = T.text2)}
            >{l.label}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Dark / Light toggle */}
          <button onClick={() => setTheme(dark ? 'light' : 'dark')} style={{
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
            padding: '0 14px', borderRadius: 100, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            height: 36, display: 'flex', alignItems: 'center',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.borderHover; e.currentTarget.style.color = T.text }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2 }}
          >Sign in</button>
          <button onClick={() => setShowAuth(true)} style={{
            background: '#3d7fff', border: 'none', color: '#fff',
            padding: '0 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
            height: 36, display: 'flex', alignItems: 'center',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#5590ff')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3d7fff')}
          >Try 50+ models free</button>
        </div>
      </nav>

      {/* MOBILE NAV */}
      <nav className="lg:hidden" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: T.navBg, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 52 }}>
          <Logo height={32} theme={dark ? 'dark' : 'light'} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setTheme(dark ? 'light' : 'dark')} style={{
              background: T.surface, border: `1px solid ${T.border}`, color: T.text2,
              width: 32, height: 32, borderRadius: 100, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {dark ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
            </button>
            <button onClick={() => setShowAuth(true)} style={{
              background: '#3d7fff', border: 'none', color: '#fff',
              padding: '7px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Try 50+ models free</button>
            <button onClick={() => setMobileMenu(v => !v)} style={{
              background: T.surface, border: `1px solid ${T.border}`, color: T.text2,
              width: 32, height: 32, borderRadius: 100, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {mobileMenu ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>
          </div>
        </div>
        {mobileMenu && (
          <div style={{ padding: '8px 20px 16px', display: 'flex', flexDirection: 'column', gap: 4, borderTop: `1px solid ${T.border}` }}>
            {[{ label: 'Blog', href: 'https://blog.prmptvault.ai', ext: true }, { label: 'Gallery', href: '/gallery', ext: false }, { label: 'Pricing', href: '/pricing', ext: false }].map(l => (
              <a key={l.label} href={l.href} {...(l.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} onClick={() => setMobileMenu(false)} style={{
                color: T.text2, textDecoration: 'none', fontSize: 15, fontWeight: 500, padding: '10px 0',
                borderBottom: `1px solid ${T.border}`,
              }}>{l.label}</a>
            ))}
            <button onClick={() => { setShowAuth(true); setMobileMenu(false) }} style={{
              background: 'transparent', border: `1px solid ${T.border}`, color: T.text2,
              padding: '10px 0', borderRadius: 100, fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', marginTop: 4,
            }}>Sign in</button>
          </div>
        )}
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section ref={heroRef} className="px-5 sm:px-10 pt-20 sm:pt-24 pb-12 sm:pb-20" style={{ textAlign: 'center', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

        {/* Glow behind headline — parallax */}
        <motion.div style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 400, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(61,127,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          y: heroGlowY,
        }} />

        <FadeIn delay={0.1} y={-20}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(61,127,255,0.12)', border: '1px solid rgba(61,127,255,0.25)',
            color: '#7aabff', padding: '6px 14px', borderRadius: 100,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3d7fff', display: 'inline-block' }} />
            50+ models · 0 API keys needed · Free to start
          </div>
        </FadeIn>

        {/* Launch Reel */}
        <FadeIn delay={0.2}>
          <div style={{
            position: 'relative', width: '100%', margin: '0 auto 32px', borderRadius: 16, overflow: 'hidden',
            border: dark ? '1px solid rgba(61,127,255,0.2)' : 'none',
            boxShadow: dark ? '0 0 60px rgba(61,127,255,0.15), 0 0 120px rgba(61,127,255,0.08)' : '0 20px 60px rgba(0,0,0,0.15)',
          }}>
            <video
              ref={reelRef}
              autoPlay
              muted
              loop
              playsInline
              src={reelSrc}
              style={{ width: '100%', display: 'block' }}
            />
            <div style={{
              position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 6,
            }}>
              <button
                onClick={() => {
                  if (reelRef.current) {
                    if (reelPlaying) reelRef.current.pause()
                    else reelRef.current.play()
                    setReelPlaying(!reelPlaying)
                  }
                }}
                style={{
                  width: 36, height: 36, borderRadius: 100, border: 'none', cursor: 'pointer',
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {reelPlaying ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4l14 8-14 8V4z"/></svg>
                )}
              </button>
              <button
                onClick={() => {
                  if (reelRef.current) {
                    reelRef.current.muted = !reelMuted
                    setReelMuted(!reelMuted)
                  }
                }}
                style={{
                  width: 36, height: 36, borderRadius: 100, border: 'none', cursor: 'pointer',
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {reelMuted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                )}
              </button>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.25}>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 72px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24, color: T.text }}>
            Every top AI model.<br />
            <span style={{ color: '#3d7fff' }}>
              One studio.
            </span>
          </h1>
        </FadeIn>

        {/* Text + Mockup row */}
        <motion.div className="flex flex-col xl:flex-row xl:items-start" style={{ gap: 40, marginTop: 40, textAlign: 'left', width: '100%', y: heroMockupY }}>
          <div className="hidden xl:block" style={{ flexShrink: 0, width: 260, position: 'relative', alignSelf: 'stretch' }}>
            <FadeIn delay={0.5} x={-30} y={0}>
              <p style={{ position: 'absolute', top: 102, right: 0, width: '100%', fontSize: 17, color: T.text, fontWeight: 400, lineHeight: 1.7, margin: 0, textAlign: 'right' }}>
                Rough idea in. Polished prompt out. AI does the heavy lifting.
              </p>
            </FadeIn>
            <FadeIn delay={0.7} x={-30} y={0}>
              <p style={{ position: 'absolute', top: 184, right: 0, width: '100%', fontSize: 17, color: T.text, fontWeight: 400, lineHeight: 1.7, margin: 0, textAlign: 'right', display: '-webkit-box', WebkitLineClamp: 7, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                Structured prompt templates tuned for every model. Purpose-built fields for subject, style, lighting, mood, and more. No blank text boxes. No&nbsp;guesswork.
              </p>
            </FadeIn>
            <FadeIn delay={0.9} x={-30} y={0}>
              <p style={{ position: 'absolute', top: 380, right: 0, width: '100%', fontSize: 17, color: T.text, fontWeight: 400, lineHeight: 1.7, margin: 0, textAlign: 'right' }}>
                Over 50 models to choose from
              </p>
            </FadeIn>
          </div>

        {/* APP WINDOW — product mockup */}
        <FadeIn delay={0.4} y={50} style={{ flex: 1, minWidth: 0, textAlign: 'left', width: '100%' }}>
          <div style={{
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
              <Logo height={24} theme="dark" style={{ marginLeft: 6 }} />
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
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
            {/* App body — 2 columns */}
            <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr]" style={{ minHeight: 340 }}>
              {/* Form panel */}
              <div className="hidden xl:flex" style={{ borderRight: '1px solid rgba(255,255,255,0.06)', padding: 20, flexDirection: 'column', gap: 12, background: '#111009', position: 'relative' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(240,237,232,0.28)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Prompt</div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#7aabff', cursor: 'pointer' }}>AI assist</div>
                  </div>
                  <div style={{
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10, padding: '10px 12px', fontSize: 12,
                    color: '#f0ede8', lineHeight: 1.6,
                    height: 78, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                  }}>
                    Luxury penthouse dinner for two, couple in formal attire, floor-to-ceiling windows overlooking city skyline at night, warm candlelight, bokeh city lights, cinematic photography, golden ambient glow
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { label: 'Aspect', val: '16:9' },
                    { label: 'Quality', val: 'Ultra' },
                    { label: 'Steps', val: '28' },
                    { label: 'Guidance', val: '3.5' },
                    { label: 'Lighting', val: 'Golden hour' },
                    { label: 'Camera', val: 'Handheld' },
                    { label: 'Lens', val: '24mm wide' },
                    { label: 'Mood', val: 'Dramatic' },
                    { label: 'Style', val: 'Cinematic' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 9, color: 'rgba(240,237,232,0.28)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{s.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(240,237,232,0.5)' }}>{s.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${animDropdown ? 'rgba(61,127,255,0.4)' : 'rgba(255,255,255,0.08)'}`, borderRadius: 8, padding: '8px 10px', position: 'relative' }}>
                  <div style={{ fontSize: 9, color: 'rgba(240,237,232,0.28)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Model</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#7aabff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {animModel}
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ opacity: 0.4, transition: 'transform 0.2s', transform: animDropdown ? 'rotate(180deg)' : 'none', flexShrink: 0 }}>
                      <path d="M1 1L5 5L9 1" stroke="rgba(240,237,232,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  {animDropdown && (
                    <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: -1, right: -1, background: '#1c1a16', border: '1px solid rgba(255,255,255,0.14)', borderRadius: 8, overflow: 'hidden', zIndex: 20, boxShadow: '0 -8px 24px rgba(0,0,0,0.6)' }}>
                      {MOCKUP_MODELS.map(m => (
                        <div key={m} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 500, color: animHovered === m ? '#f0ede8' : m === animModel ? '#7aabff' : 'rgba(240,237,232,0.45)', background: animHovered === m ? 'rgba(255,255,255,0.07)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}>{m}</div>
                      ))}
                    </div>
                  )}
                </div>
                <button style={{
                  marginTop: 'auto', width: '100%', padding: '11px',
                  background: '#3d7fff', color: '#fff', border: 'none',
                  borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>Generate →</button>
                {/* Animated cursor */}
                <div style={{ position: 'absolute', left: animCursor.x, top: animCursor.y, transition: `left ${animMs}ms cubic-bezier(0.4,0,0.2,1), top ${animMs}ms cubic-bezier(0.4,0,0.2,1)`, zIndex: 30, pointerEvents: 'none', transformOrigin: '3px 2px', transform: `scale(${animClicking ? 0.8 : 1})`, filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.9))' }}>
                  <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
                    <path d="M3 1L3 17L6.5 13.5L9 19L11.2 18.2L8.5 12.5L14 12.5Z" fill="white" stroke="rgba(0,0,0,0.55)" strokeWidth="1.5" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              {/* Mobile-only condensed fields */}
              <div className="xl:hidden" style={{ background: '#111009', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                  {[
                    { label: 'Subject', val: 'Luxury dinner...' },
                    { label: 'Style', val: 'Cinematic' },
                    { label: 'Lighting', val: 'Golden hour' },
                    { label: 'Mood', val: 'Dramatic' },
                    { label: 'Lens', val: '24mm wide' },
                    { label: 'Model', val: 'Flux Pro Ultra', blue: true },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '6px 8px' }}>
                      <div style={{ fontSize: 8, color: 'rgba(240,237,232,0.28)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: (s as { blue?: boolean }).blue ? '#7aabff' : 'rgba(240,237,232,0.5)' }}>{s.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Output / canvas */}
              <div style={{ position: 'relative', background: '#0a0908', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
                <img
                  src={SHOWCASE_ASSET}
                  alt="AI-generated output in prmptVAULT workspace"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', position: 'absolute', inset: 0 }}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 100, background: 'linear-gradient(to top, rgba(10,9,8,0.9), transparent)', pointerEvents: 'none' }} />
                <div style={{
                  position: 'absolute', bottom: 14, left: 14,
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(15,14,12,0.75)', backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3d7fff' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,237,232,0.8)' }}>Flux Pro Ultra</span>
                  <span style={{ fontSize: 10, color: 'rgba(240,237,232,0.28)' }}>· 8s</span>
                </div>
                <div style={{ position: 'absolute', bottom: 14, right: 14, display: 'flex', gap: 6 }}>
                  {['↓', '→ img2img'].map(lbl => (
                    <div key={lbl} style={{
                      background: 'rgba(15,14,12,0.75)', backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      padding: '5px 9px', fontSize: 11, fontWeight: 600, color: 'rgba(240,237,232,0.5)', cursor: 'pointer',
                    }}>{lbl}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
        </motion.div>{/* end text+mockup row */}

        <SectionCta onClick={() => setShowAuth(true)} label="Start generating →" />
      </section>

      {/* ── ASSET GALLERY STRIP ────────────────────────── */}
      <section id="gallery" style={{ overflow: 'hidden', paddingBottom: 4 }}>
        <FadeIn y={60}>
        <div style={{
          display: 'flex', gap: 10,
          animation: 'marquee 160s linear infinite',
          width: 'max-content', padding: '0 10px',
        }}>
          {/* Double the array for seamless infinite loop — no repeats in the original set */}
          {[...GALLERY_ASSETS, ...GALLERY_ASSETS].map((item, i) => {
            const models = item.video ? VIDEO_MODELS : IMAGE_MODELS
            const modelName = models[i % models.length]
            return (
              <div key={i} onClick={() => window.location.href = '/gallery'} style={{
                width: 220, height: 160, borderRadius: 14, overflow: 'hidden', flexShrink: 0,
                border: '1px solid rgba(255,255,255,0.06)', position: 'relative', cursor: 'pointer',
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
                  <img src={item.url} alt="AI-generated image" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                )}
                <div style={{
                  position: 'absolute', bottom: 8, left: 8,
                  background: 'rgba(0,0,0,0.6)', borderRadius: 4,
                  padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {item.video && <span style={{ fontSize: 9, color: '#fff' }}>▶</span>}
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', fontFamily: '-apple-system, system-ui, sans-serif' }}>{modelName}</span>
                </div>
              </div>
            )
          })}
        </div>
        </FadeIn>
        <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
        <SectionCta onClick={() => setShowAuth(true)} />
      </section>

      {/* ── WHY PRMPTVAULT ────────────────────────────── */}
      <section className="px-5 sm:px-10 py-20 sm:py-28" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.text3, marginBottom: 14 }}>
            Why prmptVAULT
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 50px)', fontWeight: 800, letterSpacing: '-1.5px', color: T.text, marginBottom: 16, lineHeight: 1.1 }}>
            Not a blank box.<br />A structured studio.
          </h2>
          <p style={{ fontSize: 17, color: T.text2, maxWidth: 560, margin: '0 auto', lineHeight: 1.7 }}>
            Every other tool gives you a text field and wishes you luck. prmptVAULT gives you purpose-built fields for every model — so your subject, style, lighting, mood, and lens are all intentional, not accidental.
          </p>
        </FadeIn>

        <StaggerIn stagger={0.12} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {/* Card 1 — Structured fields */}
          <motion.div variants={staggerChild} style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 20, padding: 28, transition: 'all 0.2s' }}
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
          </motion.div>

          {/* Card 2 — All models */}
          <motion.div variants={staggerChild} style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 20, padding: 28, transition: 'all 0.2s' }}
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
              DALL-E 3. Flux Pro Ultra. Kling. Luma Ray-2. Veo 3. Minimax. 20+ image and video models, all in one workspace — no switching tabs, no managing API keys, no stitching tools together.
            </p>
          </motion.div>

          {/* Card 3 — Your vault */}
          <motion.div variants={staggerChild} style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 20, padding: 28, transition: 'all 0.2s' }}
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
          </motion.div>
        </StaggerIn>

        {/* ── HOW IT WORKS ──────────────────────────────── */}
        <FadeIn style={{ textAlign: 'center', marginTop: 64, marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.text3, marginBottom: 14 }}>
            How it works
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', color: T.text, lineHeight: 1.1 }}>
            How it works.
          </h2>
        </FadeIn>
        <StaggerIn stagger={0.15} className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16" style={{ position: 'relative' }}>
          {[
            { num: '01', title: 'Pick your model', desc: 'Choose from 20+ image and video models — DALL-E, Flux, Imagen, Kling, Veo, and more. Switch anytime with one click.' },
            { num: '02', title: 'Fill the fields', desc: 'Every model gets purpose-built prompt fields — subject, style, lighting, mood, lens, camera. No guessing. No blank text boxes.' },
            { num: '03', title: 'Generate & save', desc: 'Hit generate. Your output and the prompt that made it are saved to your vault automatically. Remix, iterate, or move on.' },
          ].map(step => (
            <motion.div key={step.num} variants={staggerChild} style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#3d7fff', letterSpacing: '-2px', marginBottom: 16, lineHeight: 1 }}>{step.num}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 10, letterSpacing: '-0.3px' }}>{step.title}</h3>
              <p style={{ fontSize: 14, color: T.text2, lineHeight: 1.7 }}>{step.desc}</p>
            </motion.div>
          ))}
        </StaggerIn>

        {/* Before / after comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Without */}
          <FadeIn x={-40} y={0} style={{ background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 20, padding: 28 }}>
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
          </FadeIn>
          {/* With */}
          <FadeIn x={40} y={0} style={{ background: dark ? 'rgba(61,127,255,0.06)' : 'rgba(61,127,255,0.04)', border: '1px solid rgba(61,127,255,0.2)', borderRadius: 20, padding: 28 }}>
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
                '50+ models in one workspace',
                'Every output saved to your vault',
                'Remix and iterate on anything',
              ].map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: T.text2 }}>
                  <span style={{ color: '#34c759', fontSize: 14, fontWeight: 700 }}>✓</span> {t}
                </li>
              ))}
            </ul>
          </FadeIn>
        </div>
        <SectionCta onClick={() => setShowAuth(true)} label="Try structured prompts →" />
      </section>

      {/* ── BENTO FEATURES ────────────────────────────── */}
      <section id="models" className="px-5 sm:px-10 pb-16 sm:pb-20" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-1.5px', color: T.text }}>
            Everything you need.<br />Nothing you don't.
          </h2>
        </FadeIn>
        <StaggerIn stagger={0.08} className="grid grid-cols-2 sm:grid-cols-4 gap-3">

          {/* WIDE — showcase asset */}
          <motion.div variants={staggerChild} className="col-span-2 sm:row-span-2" style={{
            borderRadius: 18, border: '1px solid ' + T.border,
            overflow: 'hidden', position: 'relative', minHeight: 260,
            transition: 'transform 0.2s, border-color 0.2s', cursor: 'default',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.25)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'none'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)' }}
          >
            <img src="https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773105432147.png" alt="prmptVAULT workspace preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,9,8,0.7) 0%, rgba(10,9,8,0.05) 50%)' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 22 }}>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, color: T.text }}>State-of-the-art<br />image generation</div>
            </div>
            <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: '3px 8px' }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', fontFamily: '-apple-system, system-ui, sans-serif' }}>DALL-E 3</span>
            </div>
          </motion.div>

          {/* STAT — models */}
          <motion.div variants={staggerChild} style={{
            background: T.cardBg, borderRadius: 18, border: '1px solid ' + T.border,
            padding: 22, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: '#3d7fff' }}>20+</div>
            <div style={{ fontSize: 14, color: T.text2, marginTop: 6 }}>AI models<br />connected</div>
          </motion.div>

          {/* FEATURE — Prompt Library */}
          <motion.div variants={staggerChild} style={{
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
          </motion.div>

          {/* STAT — storage */}
          <motion.div variants={staggerChild} style={{
            background: T.cardBg, borderRadius: 18, border: '1px solid ' + T.border,
            padding: 22, transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(52,199,89,0.2)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
          >
            <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-2px', lineHeight: 1, color: '#34c759' }}>∞</div>
            <div style={{ fontSize: 14, color: T.text2, marginTop: 6 }}>Asset storage<br />on Pro</div>
          </motion.div>

          {/* NOTIFICATION — Generate & go (moved here) */}
          <motion.div variants={staggerChild} style={{
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
          </motion.div>

          {/* ALL MODELS — full width, wide and short (moved here) */}
          <motion.div variants={staggerChild} className="col-span-2 sm:col-span-4" style={{
            background: T.cardBg, borderRadius: 18, border: '1px solid ' + T.border,
            padding: '16px 22px', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Live models</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(52,199,89,0.12)', border: '1px solid rgba(52,199,89,0.25)', borderRadius: 100, padding: '2px 8px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34c759' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: '#34c759' }}>{liveModels.length} active</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {liveModels.map(m => {
                const provColor: Record<string, string> = {
                  'OpenAI': '#10b981', 'Black Forest Labs': '#3d7fff', 'Google': '#4285f4',
                  'Luma AI': '#84cc16', 'Kuaishou': '#a78bfa', 'Recraft': '#f59e0b',
                  'ByteDance': '#ff6b6b', 'Stability AI': '#8b5cf6', 'Ideogram': '#ec4899',
                  'HiDream': '#06b6d4', 'MiniMax': '#f97316', 'Pika': '#e879f9',
                  'Runway': '#fbbf24', 'Sora': '#10b981',
                }
                const dot = provColor[m.provider] ?? '#6b7280'
                return (
                  <div key={m.slug} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: '1px solid ' + T.border, borderRadius: 8,
                    padding: '4px 10px',
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: 'nowrap' }}>{m.name}</span>
                    <span style={{ fontSize: 10, color: T.text3, whiteSpace: 'nowrap' }}>{m.provider}</span>
                  </div>
                )
              })}
            </div>
          </motion.div>

        </StaggerIn>
        <SectionCta onClick={() => setShowAuth(true)} label="Start creating →" />
      </section>

      {/* ── WHO IS THIS FOR ─────────────────────────────── */}
      <section className="px-5 sm:px-10 py-16 sm:py-20" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.text3, marginBottom: 14 }}>
            Built for creators
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', color: T.text, lineHeight: 1.1 }}>
            Made for people who make things.
          </h2>
        </FadeIn>
        <StaggerIn stagger={0.1} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: '📱', title: 'Social Media Managers', desc: 'Generate scroll-stopping visuals across every model without managing API keys or juggling five different tools.' },
            { icon: '🎮', title: 'Indie Game Developers', desc: 'Concept art, character sprites, environment art, and cinematic trailers — all from one workspace. Prototype faster.' },
            { icon: '✨', title: 'AI-Curious Creators', desc: 'No prompt engineering degree required. Structured fields guide you to better results from day one.' },
            { icon: '📈', title: 'Freelancers & Solopreneurs', desc: 'Client-ready assets without subscribing to Midjourney AND Runway AND Pika. One studio, one bill, every model.' },
          ].map(card => (
            <motion.div key={card.title} variants={staggerChild} style={{
              background: T.cardBg, border: '1px solid ' + T.border, borderRadius: 20, padding: 28,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(61,127,255,0.25)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = T.border; (e.currentTarget as HTMLDivElement).style.transform = 'none' }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: T.text, marginBottom: 10, letterSpacing: '-0.3px' }}>{card.title}</h3>
              <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.7 }}>{card.desc}</p>
            </motion.div>
          ))}
        </StaggerIn>
      </section>

      {/* ── PRICING ───────────────────────────────────── */}
      <section className="px-5 sm:px-10 py-16 sm:py-20" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.text3, marginBottom: 12 }}>Pricing</div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', marginBottom: 36, color: T.text }}>Start free.<br />Scale when ready.</h2>
        </FadeIn>
        <StaggerIn stagger={0.1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              name: 'Free', price: '$0', period: '', desc: 'Try it out — no card needed', featured: false, trial: false,
              features: [
                { text: '25 generations / month', inc: true }, { text: 'DALL-E 3 + Flux Schnell', inc: true },
                { text: 'Core models only', inc: true }, { text: 'No video models', inc: false },
                { text: 'Assets saved to vault', inc: true },
              ],
              cta: 'Get started', ctaFilled: false,
            },
            {
              name: 'Creator', price: '$12', period: '/mo', desc: 'For growing creators', featured: false, trial: true,
              features: [
                { text: '500 generations / month', inc: true }, { text: 'Pick up to 10 image models', inc: true },
                { text: 'No video models', inc: false }, { text: 'Priority queue', inc: true },
                { text: 'AI Assist', inc: true },
              ],
              cta: 'Start free trial', ctaFilled: false,
            },
            {
              name: 'Studio', price: '$29', period: '/mo', desc: 'For serious creators', featured: true, trial: true,
              features: [
                { text: '2,000 generations / month', inc: true }, { text: 'All image models', inc: true },
                { text: 'Pick up to 5 video models', inc: true }, { text: 'Priority queue', inc: true },
                { text: 'AI Assist + Export', inc: true },
              ],
              cta: 'Start free trial', ctaFilled: true,
            },
            {
              name: 'Pro', price: '$59', period: '/mo', desc: 'Teams and power users', featured: false, trial: true,
              features: [
                { text: 'Unlimited generations', inc: true }, { text: 'All image models', inc: true },
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
            <motion.div variants={staggerChild} key={tier.name} style={{
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
              <button onClick={() => { if (!tier.comingSoon) window.location.href = tier.name === 'Free' ? '/pricing' : `/pricing?highlight=${tier.name.toLowerCase()}` }} style={{
                width: '100%', padding: '9px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                cursor: tier.comingSoon ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                background: tier.ctaFilled ? '#3d7fff' : 'transparent',
                color: tier.ctaFilled ? '#fff' : 'rgba(240,237,232,0.45)',
                border: tier.ctaFilled ? 'none' : '1px solid rgba(255,255,255,0.1)',
              }}
                onMouseEnter={e => { if (tier.ctaFilled) e.currentTarget.style.background = '#5590ff'; else if (!tier.comingSoon) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'; e.currentTarget.style.color = '#f0ede8' } }}
                onMouseLeave={e => { if (tier.ctaFilled) e.currentTarget.style.background = '#3d7fff'; else { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(240,237,232,0.45)' } }}
              >{tier.cta}</button>
            </motion.div>
          ))}
        </StaggerIn>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="px-5 sm:px-10 py-16 sm:py-20" style={{ maxWidth: 800, margin: '0 auto' }}>
        <FadeIn style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.text3, marginBottom: 14 }}>
            FAQ
          </div>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-1.5px', color: T.text, lineHeight: 1.1 }}>
            Questions? Answers.
          </h2>
        </FadeIn>
        <FadeIn>
          <div style={{ borderTop: '1px solid ' + T.border }}>
            {[
              { q: 'Do I need my own API keys?', a: "No. prmptVAULT handles all model access — you don't need accounts with OpenAI, Google, Black Forest Labs, or anyone else. Just sign up and generate." },
              { q: 'What happens when new models launch?', a: 'We add new models regularly — often within days of release. Your templates update automatically. No manual setup, no configuration.' },
              { q: 'How is this different from Midjourney or Leonardo?', a: 'Most tools lock you into one model behind a blank text box. prmptVAULT gives you structured prompt fields tuned to each model, plus access to 20+ image and video models in one workspace. Switch models in one click without switching tools.' },
              { q: "What counts as a 'generation'?", a: "Each time you hit Generate and produce an image or video, that's one generation. Failed generations don't count against your limit." },
              { q: 'Can I cancel anytime?', a: 'Yes. All paid plans are month-to-month with no contracts. Cancel from your account settings at any time. Your saved assets stay in your vault.' },
              { q: 'Is there a free plan?', a: 'Yes. The free plan includes 25 generations per month with access to core models like DALL-E 3 and Flux Schnell. No credit card required.' },
            ].map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} T={T} />
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section ref={ctaRef} className="px-5 sm:px-10 py-20 sm:py-28" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <motion.div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(61,127,255,0.1) 0%, transparent 65%)', pointerEvents: 'none', y: ctaGlowY }} />
        <FadeIn>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 60px)', fontWeight: 800, letterSpacing: '-2px', marginBottom: 18, color: T.text, position: 'relative' }}>
            Ready to build your<br />
          <span style={{ color: '#3d7fff' }}>
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
          >Try 50+ models free →</button>
          <a href="#models" style={{
            background: 'transparent', border: '1px solid ' + T.border, color: T.text2,
            padding: '14px 28px', borderRadius: 100, fontSize: 15, fontWeight: 600,
            fontFamily: 'inherit', cursor: 'pointer', textDecoration: 'none', display: 'inline-block', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.borderHover; (e.currentTarget as HTMLAnchorElement).style.color = T.text }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = T.border; (e.currentTarget as HTMLAnchorElement).style.color = T.text2 }}
          >View all models</a>
        </div>
        </FadeIn>
      </section>

      {/* ── FOOTER ───────────────────────────────────── */}
      <footer className="flex flex-col gap-6 items-center px-5 sm:px-10 py-8"
        style={{ borderTop: '1px solid ' + T.border, color: T.text3, fontSize: 13 }}>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-0 items-center justify-between w-full">
          <Logo height={32} theme={dark ? 'dark' : 'light'} />
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Privacy', href: '/privacy', ext: false },
              { label: 'Terms', href: '/tos', ext: false },
              { label: 'Docs', href: 'https://docs.prmptvault.ai', ext: false },
              { label: 'Blog', href: 'https://blog.prmptvault.ai', ext: true },
            ].map(l => (
              <a key={l.label} href={l.href} {...(l.ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} style={{ color: T.text3, textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.text2)}
                onMouseLeave={e => (e.currentTarget.style.color = T.text3)}
              >{l.label}</a>
            ))}
            {/* Social icons */}
            <div style={{ display: 'flex', gap: 12, marginLeft: 8 }}>
              <a href="https://x.com/prmptvault" target="_blank" rel="noopener noreferrer" style={{ color: T.text3, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.text2)}
                onMouseLeave={e => (e.currentTarget.style.color = T.text3)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href="https://www.linkedin.com/company/prmptvault" target="_blank" rel="noopener noreferrer" style={{ color: T.text3, transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.text2)}
                onMouseLeave={e => (e.currentTarget.style.color = T.text3)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
          <div>© 2026 Marello Productions</div>
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  )
}
