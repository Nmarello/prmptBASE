import type { Model, GenType } from '../../types'
import { tierCanAccess, GEN_TYPE_LABELS } from '../../types'

interface Props {
  model: Model
  userTier: string
  selected: boolean
  onClick: () => void
  comingSoon?: boolean
  rendering?: boolean
  latestRenderUrl?: string
}

const MODEL_ART: Record<string, { gradient: string; initial: string }> = {
  'dalle':              { gradient: 'linear-gradient(145deg,#c0392b,#e8570a,#f5a623)', initial: 'D3' },
  'flux-schnell':       { gradient: 'linear-gradient(145deg,#003566,#0096c7,#48cae4)', initial: 'FS' },
  'flux-dev':           { gradient: 'linear-gradient(145deg,#3d0066,#7b2ff7,#c084fc)', initial: 'FD' },
  'flux-pro':           { gradient: 'linear-gradient(145deg,#00004d,#0050ff,#60a5fa)', initial: 'FP' },
  'flux-pro-ultra':     { gradient: 'linear-gradient(145deg,#050505,#0f0f1a,#1a1a3e)', initial: 'FU' },
  'flux-dev-img2img':   { gradient: 'linear-gradient(145deg,#004d26,#00a550,#57cc99)', initial: 'F2' },
  'flux-kontext-pro':   { gradient: 'linear-gradient(145deg,#1a0033,#4400aa,#8855ff)', initial: 'FK' },
  'recraft-v4-pro':     { gradient: 'linear-gradient(145deg,#3d1a00,#a05000,#e8a020)', initial: 'RV' },
  'nano-banana':        { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', initial: 'NB' },
  'nano-banana-edit':   { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', initial: 'NE' },
  'kling':              { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
  'kling-txt2vid':      { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
  'kling-img2vid':      { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
  'luma':               { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
  'luma-txt2vid':       { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
  'luma-img2vid':       { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
  'minimax-txt2vid':    { gradient: 'linear-gradient(145deg,#002b36,#007070,#00c9a7)', initial: 'MM' },
  'sora':               { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#3d3d7a)', initial: 'SR' },
  'sora2':              { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#3d3d7a)', initial: 'SR' },
  'cs-midjourney':      { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: 'MJ' },
  'cs-ideogram':        { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: 'ID' },
  'cs-firefly':         { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: 'FF' },
  'cs-runway':          { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: 'RW' },
  'cs-pika':            { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: 'PK' },
}
const DEFAULT_ART = { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: '??' }

const slugBrandLabels: Record<string, string> = {
  'dalle':            'OpenAI',
  'sora':             'OpenAI',
  'sora2':            'OpenAI',
  'flux-schnell':     'Black Forest Labs',
  'flux-dev':         'Black Forest Labs',
  'flux-pro':         'Black Forest Labs',
  'flux-pro-ultra':   'Black Forest Labs',
  'flux-dev-img2img': 'Black Forest Labs',
  'flux-kontext-pro': 'Black Forest Labs',
  'recraft-v4-pro':   'Recraft',
  'nano-banana':      'Google',
  'nano-banana-edit': 'Google',
  'kling':            'Kuaishou',
  'kling-txt2vid':    'Kuaishou',
  'kling-img2vid':    'Kuaishou',
  'luma':             'Luma AI',
  'luma-txt2vid':     'Luma AI',
  'luma-img2vid':     'Luma AI',
  'minimax-txt2vid':  'MiniMax',
}

// Provider logo mark — SVG or styled wordmark
function ProviderLogo({ slug }: { slug: string }) {
  const s = { fill: 'rgba(255,255,255,0.92)' }

  // OpenAI — 6-petal asterisk
  if (['dalle', 'sora', 'sora2'].includes(slug)) {
    return (
      <span className="flex items-center gap-1.5">
        <svg width="16" height="16" viewBox="0 0 24 24" {...s}>
          <path d="M22.28 9.77a5.45 5.45 0 0 0-.46-4.49 5.5 5.5 0 0 0-5.92-2.64A5.48 5.48 0 0 0 11.76 1a5.5 5.5 0 0 0-5.25 3.81 5.48 5.48 0 0 0-3.66 2.66 5.5 5.5 0 0 0 .68 6.44 5.45 5.45 0 0 0 .46 4.49 5.5 5.5 0 0 0 5.92 2.64A5.47 5.47 0 0 0 12.24 23a5.5 5.5 0 0 0 5.25-3.81 5.48 5.48 0 0 0 3.66-2.67 5.5 5.5 0 0 0-.68-6.43l.81-.32zM13.85 21.3a4.07 4.07 0 0 1-2.6-.94l.13-.07 4.32-2.5a.71.71 0 0 0 .36-.62v-6.1l1.83 1.05a.07.07 0 0 1 .04.05v5.06a4.09 4.09 0 0 1-4.08 4.07zm-8.8-3.75a4.07 4.07 0 0 1-.49-2.74l.13.08 4.32 2.5a.72.72 0 0 0 .71 0l5.28-3.05v2.1a.07.07 0 0 1-.03.06l-4.37 2.52a4.1 4.1 0 0 1-5.55-1.47zm-1.14-9.5A4.07 4.07 0 0 1 6.04 6.3v5.12a.72.72 0 0 0 .36.62l5.27 3.04-1.83 1.06a.07.07 0 0 1-.07 0L5.4 13.6a4.09 4.09 0 0 1-1.5-5.56zm15.04 3.5-5.28-3.05 1.83-1.05a.07.07 0 0 1 .07 0l4.37 2.53a4.08 4.08 0 0 1-.63 7.37v-5.12a.71.71 0 0 0-.36-.68zm1.82-2.75-.13-.08-4.31-2.51a.72.72 0 0 0-.72 0L10.33 9.7V7.6a.07.07 0 0 1 .03-.06l4.37-2.52a4.08 4.08 0 0 1 6.08 4.23l-.84-.25zM9.27 12.77l-1.83-1.06a.07.07 0 0 1-.03-.06V6.6a4.08 4.08 0 0 1 6.7-3.13l-.13.07-4.32 2.5a.71.71 0 0 0-.36.62l-.03 6.1zm.99-2.14 2.35-1.36 2.35 1.35v2.71l-2.35 1.36-2.35-1.36v-2.7z"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.01em', color: 'rgba(255,255,255,0.92)' }}>OpenAI</span>
      </span>
    )
  }

  // Black Forest Labs / Flux — wordmark
  if (slug.startsWith('flux')) {
    return (
      <span className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.92)">
          {/* BFL-style abstract mark: two overlapping diamond shapes */}
          <polygon points="12,2 20,8 20,16 12,22 4,16 4,8" opacity="0.5"/>
          <polygon points="12,5 18,10 18,14 12,19 6,14 6,10"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.92)', fontFamily: 'monospace' }}>FLUX</span>
      </span>
    )
  }

  // Luma AI — their circular ray mark
  if (slug.startsWith('luma')) {
    return (
      <span className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255,255,255,0.92)">
          <circle cx="12" cy="12" r="3"/>
          <line x1="12" y1="2" x2="12" y2="6" stroke="rgba(255,255,255,0.92)" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="12" y1="18" x2="12" y2="22" stroke="rgba(255,255,255,0.92)" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="2" y1="12" x2="6" y2="12" stroke="rgba(255,255,255,0.92)" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="18" y1="12" x2="22" y2="12" stroke="rgba(255,255,255,0.92)" strokeWidth="2.5" strokeLinecap="round"/>
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" stroke="rgba(255,255,255,0.92)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" stroke="rgba(255,255,255,0.92)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="19.07" y1="4.93" x2="16.24" y2="7.76" stroke="rgba(255,255,255,0.92)" strokeWidth="2" strokeLinecap="round"/>
          <line x1="7.76" y1="16.24" x2="4.93" y2="19.07" stroke="rgba(255,255,255,0.92)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.01em', color: 'rgba(255,255,255,0.92)' }}>Luma</span>
      </span>
    )
  }

  // Google — colored G
  if (['nano-banana', 'nano-banana-edit'].includes(slug)) {
    return (
      <span className="flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Google</span>
      </span>
    )
  }

  // Recraft — stylized R
  if (slug === 'recraft-v4-pro') {
    return (
      <span className="flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.92)">
          <path d="M4 3h9a6 6 0 0 1 0 12H4V3zm4 4v4h5a2 2 0 1 0 0-4H8zm5.5 6L18 21h-4.5l-4-8H8v8H4V15h9.5z"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Recraft</span>
      </span>
    )
  }

  // Kling — K mark
  if (slug.startsWith('kling')) {
    return (
      <span className="flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="rgba(255,255,255,0.92)">
          <path d="M5 3h4v7.5L17 3h5L13.5 12 22 21h-5l-8-8.5V21H5V3z"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Kling</span>
      </span>
    )
  }

  // MiniMax
  if (slug.startsWith('minimax')) {
    return (
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.02em', color: 'rgba(255,255,255,0.92)' }}>
        MiniMax
      </span>
    )
  }

  // Midjourney
  if (slug === 'cs-midjourney') {
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Midjourney</span>
    )
  }

  // Ideogram
  if (slug === 'cs-ideogram') {
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Ideogram</span>
    )
  }

  // Adobe Firefly
  if (slug === 'cs-firefly') {
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Firefly</span>
    )
  }

  // Runway
  if (slug === 'cs-runway') {
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Runway</span>
    )
  }

  // Pika
  if (slug === 'cs-pika') {
    return (
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>Pika</span>
    )
  }

  return null
}

export default function ModelCard({ model, userTier, selected, onClick, comingSoon: comingSoonProp, rendering, latestRenderUrl }: Props) {
  const accessible = tierCanAccess(userTier, model.min_tier)
  const comingSoon = comingSoonProp || false
  const art = MODEL_ART[model.slug] ?? DEFAULT_ART
  const maker = slugBrandLabels[model.slug] ?? model.provider
  const isVideo = model.supported_gen_types.some(g => g === 'txt2vid' || g === 'img2vid')
  const typeLabel = isVideo ? 'VIDEO' : 'IMAGE'
  const hasUserImage = !!latestRenderUrl

  return (
    <button
      onClick={!comingSoon && accessible ? onClick : undefined}
      style={{ width: '230px', flexShrink: 0, background: 'var(--pv-surface)' }}
      className={`group relative text-left rounded-[18px] border overflow-hidden flex flex-col transition-all duration-200 ${
        comingSoon
          ? 'opacity-40 cursor-not-allowed border-[var(--pv-border)]'
          : selected
          ? 'border-[var(--pv-accent)] shadow-lg cursor-pointer'
          : 'border-[var(--pv-border)] hover:-translate-y-0.5 hover:shadow-md hover:border-transparent cursor-pointer'
      }`}
    >
      {/* Art header */}
      <div className="relative overflow-hidden" style={{ height: '148px' }}>

        {/* Background */}
        {hasUserImage ? (
          <>
            <img
              src={latestRenderUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg,rgba(0,0,0,0.22) 0%,rgba(0,0,0,0.55) 100%)' }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: art.gradient }} />
            {/* Noise */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")", opacity:0.5, mixBlendMode:'overlay' as const }} />
            {/* Decorative circles */}
            <span className="absolute rounded-full pointer-events-none" style={{ width:120, height:120, top:-30, right:-20, background:'rgba(255,255,255,0.12)' }} />
            <span className="absolute rounded-full pointer-events-none" style={{ width:60, height:60, bottom:-10, left:20, background:'rgba(255,255,255,0.08)' }} />
            {/* Watermark initial */}
            <div className="absolute select-none pointer-events-none" style={{ bottom:'-12px', right:'-2px', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'88px', fontWeight:800, color:'rgba(255,255,255,0.11)', lineHeight:1, letterSpacing:'-0.06em' }}>
              {art.initial}
            </div>
          </>
        )}

        {/* Rendering LED */}
        {rendering && (
          <div className="absolute z-20" style={{ top:10, left:10, width:10, height:10, borderRadius:'50%', background:'#ff3b30', animation:'ledPulse 1.4s ease-in-out infinite' }} />
        )}

        {/* Type badge — top right */}
        {!comingSoon && (
          <div className="absolute top-2.5 right-2.5 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded z-10" style={{ background:'rgba(0,0,0,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.92)' }}>
            {typeLabel}
          </div>
        )}

        {/* Coming soon */}
        {comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ background:'rgba(0,0,0,0.2)', backdropFilter:'blur(2px)' }}>
            <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background:'rgba(0,0,0,0.5)', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.7)' }}>
              Coming Soon
            </span>
          </div>
        )}

        {/* Tier lock — top left (only when no rendering LED) */}
        {!comingSoon && !accessible && !rendering && (
          <div className="absolute top-2.5 left-2.5 text-[10px] font-bold capitalize px-2 py-0.5 rounded z-10" style={{ background:'rgba(0,0,0,0.45)', color:'rgba(255,255,255,0.8)', border:'1px solid rgba(255,255,255,0.15)' }}>
            {model.min_tier}
          </div>
        )}

        {/* Hover CTA */}
        {!comingSoon && accessible && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" style={{ background:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)' }}>
            <span className="text-[12.5px] font-bold px-4 py-1.5 rounded-full" style={{ background:'#fff', color:'#18140e' }}>
              Use this model →
            </span>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'14px', fontWeight:800, color:'var(--pv-text)', letterSpacing:'-0.02em', lineHeight:1.2 }}>
          {model.name}
        </div>
        <div style={{ fontSize:'11.5px', color:'var(--pv-text3)' }}>{maker}</div>
        <div style={{ fontSize:'12px', color:'var(--pv-text2)', lineHeight:1.45 }} className="line-clamp-2">
          {model.description}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {model.supported_gen_types.map(gt => (
            <span key={gt} style={{ fontSize:'10.5px', fontWeight:600, padding:'2px 7px', borderRadius:'5px', background:'var(--pv-surface2)', color:'var(--pv-text2)', border:'1px solid var(--pv-border)' }}>
              {GEN_TYPE_LABELS[gt as GenType] ?? gt}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}
