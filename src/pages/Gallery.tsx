import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'

// Supabase Pro image transform — serve resized thumbnails for the grid
function thumb(url: string, width = 400): string {
  // Only transform Supabase storage URLs, skip videos and external URLs
  if (!url.includes('/storage/v1/object/public/')) return url
  if (url.endsWith('.mp4') || url.endsWith('.webm')) return url
  return url.replace('/storage/v1/object/public/', `/storage/v1/render/image/public/`) + `?width=${width}&quality=60`
}

const DARK = {
  bg: '#0f0e0c', text: '#f0ede8', text2: 'rgba(240,237,232,0.5)', text3: 'rgba(240,237,232,0.28)',
  border: 'rgba(255,255,255,0.08)', navBg: 'rgba(20,18,16,0.92)',
  surface: 'rgba(255,255,255,0.04)', surface2: '#1a1816',
}
const LIGHT = {
  bg: '#f5f5f7', text: '#1d1d1f', text2: 'rgba(29,29,31,0.55)', text3: 'rgba(29,29,31,0.35)',
  border: 'rgba(0,0,0,0.1)', navBg: 'rgba(245,245,247,0.92)',
  surface: 'rgba(0,0,0,0.04)', surface2: '#fff',
}

interface ShowcaseAsset {
  id: string
  url: string
  gen_type: string | null
  created_at: string
  metadata: Record<string, unknown> | null
  model_name: string | null
  width: number | null
  height: number | null
}

const FORMATS: [number, number][] = [
  [1, 1],
  [16, 9],
  [9, 16],
  [2, 1],
  [9, 8],
]

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const COL_WIDTH = 320
const MIN_COLS = 2
const SCROLL_DURATION = 150

function useNumCols() {
  const get = () => Math.max(MIN_COLS, Math.floor((window.innerWidth - 12) / (COL_WIDTH + 6)))
  const [n, setN] = useState(get)
  useEffect(() => {
    const h = () => setN(get())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return n
}

// Inject keyframes + hover styles once
const styleId = 'gallery-scroll-keyframes'
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @keyframes gallery-scroll-up {
      from { transform: translateY(0); }
      to { transform: translateY(-50%); }
    }
    @keyframes gallery-scroll-down {
      from { transform: translateY(-50%); }
      to { transform: translateY(0); }
    }
    .gallery-col {
      position: relative;
    }
    .gallery-float {
      position: fixed;
      z-index: 60;
      pointer-events: none;
      border-radius: 10px;
      overflow: hidden;
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.3s;
      transform: scale(1.1);
      box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    }
  `
  document.head.appendChild(style)
}

// Extract params from metadata that aren't the prompt itself
// Keys to hide from lightbox params
const HIDDEN_KEYS = new Set([
  'prompt', 'revised_prompt', 'seed',
  'status_url', 'response_url', 'request_url', 'model_slug', 'status',
  'model_id', 'user_token', 'gen_type', 'prompt_id',
  'source_image', 'source_image_b64', 'image_url', 'response_url',
])
function extractParams(meta: Record<string, unknown> | null): [string, string][] {
  if (!meta) return []
  const params: [string, string][] = []
  for (const [k, v] of Object.entries(meta)) {
    if (HIDDEN_KEYS.has(k) || v == null || v === '' || typeof v === 'object') continue
    // Skip anything that looks like a URL
    if (typeof v === 'string' && (v.startsWith('http') || v.startsWith('/'))) continue
    const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    params.push([label, String(v)])
  }
  return params
}

export default function Gallery() {
  const { theme } = useTheme()
  const dark = theme === 'dark'
  const T = dark ? DARK : LIGHT
  const numCols = useNumCols()

  const [assets, setAssets] = useState<ShowcaseAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [broken, setBroken] = useState<Set<string>>(new Set())
  const [hovered, setHovered] = useState<{ asset: ShowcaseAsset; rect: DOMRect } | null>(null)

  const handleBroken = useCallback((id: string) => {
    setBroken(prev => { const s = new Set(prev); s.add(id); return s })
  }, [])

  useEffect(() => {
    supabase
      .from('showcase_assets')
      .select('*')
      .neq('url', '')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const valid = (data as ShowcaseAsset[]).filter(a => a.url && a.url.length > 10)
          setAssets(shuffle(valid))
        }
        setLoading(false)
      })
  }, [])

  const assetFormats = useMemo(() =>
    assets.map(() => FORMATS[Math.floor(Math.random() * FORMATS.length)]),
    [assets]
  )

  const validAssets = useMemo(() =>
    assets.filter(a => !broken.has(a.id)),
    [assets, broken]
  )

  const columns = useMemo(() => {
    const cols: { asset: ShowcaseAsset; format: [number, number]; globalIdx: number }[][] = Array.from({ length: numCols }, () => [])
    validAssets.forEach((asset, i) => {
      const origIdx = assets.indexOf(asset)
      cols[i % numCols].push({ asset, format: assetFormats[origIdx], globalIdx: origIdx })
    })
    return cols
  }, [validAssets, assets, assetFormats, numCols])

  // Lightbox keyboard nav
  useEffect(() => {
    if (lightboxIdx === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxIdx(null)
      if (e.key === 'ArrowRight') setLightboxIdx(i => i !== null ? Math.min(i + 1, assets.length - 1) : null)
      if (e.key === 'ArrowLeft') setLightboxIdx(i => i !== null ? Math.max(i - 1, 0) : null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxIdx, assets.length])

  const isVideo = (a: ShowcaseAsset) =>
    a.gen_type?.includes('vid') || a.url.endsWith('.mp4') || a.url.endsWith('.webm')

  const lbAsset = lightboxIdx !== null ? assets[lightboxIdx] : null
  const lbPrompt = lbAsset?.metadata?.prompt as string | undefined
  const lbSeed = lbAsset?.metadata?.seed != null ? String(lbAsset.metadata.seed) : null
  const lbParams = lbAsset ? extractParams(lbAsset.metadata) : []
  const lbSourceImg = lbAsset?.metadata?.image_url as string | undefined
  const lbIsTransform = lbAsset?.gen_type === 'img2img' || lbAsset?.gen_type === 'img2vid'

  return (
    <div style={{
      background: T.bg, color: T.text, fontFamily: "'Inter', -apple-system, sans-serif",
      height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      {/* Nav with title + subtitle */}
      <nav style={{
        position: 'relative', zIndex: 50, flexShrink: 0,
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        background: T.navBg,
        padding: '14px 24px',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'flex-start' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 2 }}>
            <Logo height={28} theme={dark ? 'dark' : 'light'} />
          </Link>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', margin: 0, lineHeight: 1 }}>
              Gallery
            </h1>
            <p style={{ color: T.text2, fontSize: 12, margin: '4px 0 0' }}>
              Everything here was made with prmptVAULT.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 2, justifySelf: 'end' }}>
            {[{ label: 'Home', href: '/' }, { label: 'Models', href: '/#models' }, { label: 'Pricing', href: '/pricing' }].map(l => (
              <a key={l.label} href={l.href} style={{ color: T.text2, textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>{l.label}</a>
            ))}
            <Link to="/dashboard" style={{
              background: '#3d7fff', border: 'none', color: '#fff',
              padding: '6px 16px', borderRadius: 100, fontSize: 12, fontWeight: 600, textDecoration: 'none',
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}>Try 20+ models free</Link>
          </div>
        </div>
      </nav>

      {/* Gradient transition from nav to grid */}
      <div style={{
        height: 50, flexShrink: 0, position: 'relative', zIndex: 40,
        background: `linear-gradient(to bottom, ${dark ? '#0f0e0c' : '#f5f5f7'}, transparent)`,
        pointerEvents: 'none',
        marginBottom: -50,
      }} />

      {/* Auto-scrolling columns */}
      <div style={{ flex: 1, display: 'flex', gap: 6, padding: '0 6px', overflow: 'hidden', minHeight: 0, justifyContent: 'center' }}>
        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ color: T.text2 }}>Loading...</p>
          </div>
        ) : (
          columns.map((col, colIdx) => {
            const goesUp = colIdx % 2 === 0
            return (
              <div
                key={colIdx}
                className="gallery-col"
                style={{ width: COL_WIDTH, flexShrink: 0, overflow: 'clip' }}
                onMouseEnter={e => {
                  const strip = e.currentTarget.querySelector('.gallery-strip') as HTMLElement
                  if (!strip) return
                  const anims = strip.getAnimations()
                  anims.forEach(a => { if ('playbackRate' in a) a.playbackRate = 0.15 })
                }}
                onMouseLeave={e => {
                  const strip = e.currentTarget.querySelector('.gallery-strip') as HTMLElement
                  if (!strip) return
                  const anims = strip.getAnimations()
                  anims.forEach(a => { if ('playbackRate' in a) a.playbackRate = 1 })
                }}
              >
                <div
                  className="gallery-strip"
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 6,
                    animation: `${goesUp ? 'gallery-scroll-up' : 'gallery-scroll-down'} ${SCROLL_DURATION}s linear infinite`,
                    willChange: 'transform',
                  }}
                >
                  {[0, 1].map(copy => (
                    col.map((item, i) => (
                      <div
                        key={`${item.asset.id}-${copy}-${i}`}
                        className="gallery-item"
                        onClick={() => setLightboxIdx(item.globalIdx)}
                        onMouseEnter={e => {
                          const rect = e.currentTarget.getBoundingClientRect()
                          setHovered({ asset: item.asset, rect })
                        }}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          position: 'relative', borderRadius: 10,
                          cursor: 'pointer', flexShrink: 0,
                          width: COL_WIDTH,
                          height: Math.round(COL_WIDTH * item.format[1] / item.format[0]),
                          background: 'rgba(128,128,128,0.1)',
                          overflow: 'hidden',
                          contain: 'strict',
                        }}
                      >
                        {isVideo(item.asset) ? (
                          <video
                            src={item.asset.url}
                            muted
                            loop
                            playsInline
                            autoPlay
                            onError={() => handleBroken(item.asset.id)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 10 }}
                          />
                        ) : (
                          <img
                            src={thumb(item.asset.url)}
                            alt=""
                            onError={() => handleBroken(item.asset.id)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: 10 }}
                          />
                        )}
                        {item.asset.model_name && (
                          <div style={{
                            position: 'absolute', bottom: 8, left: 8,
                            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                            borderRadius: 6, padding: '3px 8px',
                            fontSize: 10, fontWeight: 600, color: '#fff',
                          }}>{item.asset.model_name}</div>
                        )}
                      </div>
                    ))
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Floating hover overlay — rendered outside columns so it's not clipped */}
      {hovered && !lbAsset && (
        <div
          className="gallery-float"
          style={{
            top: hovered.rect.top, left: hovered.rect.left,
            width: hovered.rect.width, height: hovered.rect.height,
            transformOrigin: 'center center',
          }}
        >
          {isVideo(hovered.asset) ? (
            <video
              src={hovered.asset.url}
              muted loop playsInline autoPlay
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <img
              src={thumb(hovered.asset.url)}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>
      )}

      {/* Lightbox */}
      {lbAsset && (
        <div
          onClick={() => setLightboxIdx(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'zoom-out',
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setLightboxIdx(null) }}
            style={{
              position: 'absolute', top: 20, right: 20, background: 'none', border: 'none',
              color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1, zIndex: 101,
            }}
          >&times;</button>

          {lightboxIdx! > 0 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx! - 1) }}
              style={{
                position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                color: '#fff', fontSize: 24, padding: '12px 16px', cursor: 'pointer', zIndex: 101,
              }}
            >&lsaquo;</button>
          )}
          {lightboxIdx! < assets.length - 1 && (
            <button
              onClick={e => { e.stopPropagation(); setLightboxIdx(lightboxIdx! + 1) }}
              style={{
                position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
                color: '#fff', fontSize: 24, padding: '12px 16px', cursor: 'pointer', zIndex: 101,
              }}
            >&rsaquo;</button>
          )}

          <div
            onClick={e => e.stopPropagation()}
            style={{
              cursor: 'default', display: 'flex', flexDirection: 'row',
              maxWidth: '90vw', maxHeight: '90vh',
              background: dark ? '#1a1816' : '#fff',
              borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
              border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            {/* Asset */}
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: dark ? '#0f0e0c' : '#f0f0f2', minWidth: 0, minHeight: 300,
            }}>
              {isVideo(lbAsset) ? (
                <video
                  src={lbAsset.url}
                  controls autoPlay loop
                  style={{ maxWidth: '100%', maxHeight: '85vh', display: 'block' }}
                />
              ) : (
                <img
                  src={lbAsset.url}
                  alt=""
                  style={{ maxWidth: '100%', maxHeight: '85vh', display: 'block', objectFit: 'contain' }}
                />
              )}
            </div>

            {/* Info panel */}
            <div style={{
              width: 300, flexShrink: 0, padding: 24, overflowY: 'auto',
              display: 'flex', flexDirection: 'column', gap: 16,
              borderLeft: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'}`,
              color: T.text,
            }}>
              {/* Model + type */}
              <div>
                {lbAsset.model_name && (
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{lbAsset.model_name}</div>
                )}
                <div style={{ fontSize: 12, color: T.text2 }}>
                  {lbAsset.gen_type?.replace(/_/g, ' → ') ?? 'Image'}
                  {lbAsset.width && lbAsset.height ? ` · ${lbAsset.width}×${lbAsset.height}` : ''}
                </div>
              </div>

              {/* Prompt */}
              {lbPrompt && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Prompt</div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, margin: 0, color: T.text }}>{lbPrompt}</p>
                </div>
              )}

              {/* Source image for img2img / img2vid */}
              {lbIsTransform && lbSourceImg && !lbSourceImg.includes('queue.fal.run') && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Source Image</div>
                  <img
                    src={lbSourceImg}
                    alt="Source"
                    onError={e => { (e.target as HTMLElement).style.display = 'none' }}
                    style={{ width: '100%', borderRadius: 8, objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* Seed */}
              {lbSeed && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Seed</div>
                  <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.text2 }}>{lbSeed}</span>
                </div>
              )}

              {/* Parameters */}
              {lbParams.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.text3, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Parameters</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {lbParams.map(([label, val]) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: T.text2 }}>{label}</span>
                        <span style={{ fontWeight: 600, color: T.text }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date */}
              <div style={{ fontSize: 11, color: T.text3, marginTop: 'auto' }}>
                {new Date(lbAsset.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
