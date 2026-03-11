import type { Model, GenType } from '../../types'
import { tierCanAccess, GEN_TYPE_LABELS } from '../../types'

interface Props {
  model: Model
  userTier: string
  selected: boolean
  onClick: () => void
  comingSoon?: boolean
}

const MODEL_ART: Record<string, { gradient: string; initial: string }> = {
  'dalle-3':            { gradient: 'linear-gradient(145deg,#c0392b,#e8570a,#f5a623)', initial: 'D3' },
  'flux-schnell':       { gradient: 'linear-gradient(145deg,#003566,#0096c7,#48cae4)', initial: 'FS' },
  'flux-dev':           { gradient: 'linear-gradient(145deg,#3d0066,#7b2ff7,#c084fc)', initial: 'FD' },
  'flux-pro':           { gradient: 'linear-gradient(145deg,#00004d,#0050ff,#60a5fa)', initial: 'FP' },
  'flux-pro-ultra':     { gradient: 'linear-gradient(145deg,#050505,#0f0f1a,#1a1a3e)', initial: 'FU' },
  'flux-dev-img2img':   { gradient: 'linear-gradient(145deg,#004d26,#00a550,#57cc99)', initial: 'F2' },
  'flux-kontext-pro':   { gradient: 'linear-gradient(145deg,#1a0033,#4400aa,#8855ff)', initial: 'FK' },
  'recraft-v4-pro':     { gradient: 'linear-gradient(145deg,#3d1a00,#a05000,#e8a020)', initial: 'RV' },
  'nano-banana':        { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', initial: 'NB' },
  'nano-banana-2':      { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', initial: 'NB' },
  'kling':              { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
  'luma':               { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
  'minimax-txt2vid':    { gradient: 'linear-gradient(145deg,#002b36,#007070,#00c9a7)', initial: 'MM' },
  'sora2':              { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#3d3d7a)', initial: 'SR' },
  'cs-midjourney':      { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: 'MJ' },
  'cs-ideogram':        { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: 'ID' },
  'cs-firefly':         { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: 'FF' },
  'cs-runway':          { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: 'RW' },
  'cs-pika':            { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: 'PK' },
}
const DEFAULT_ART = { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: '??' }

const slugBrandLabels: Record<string, string> = {
  'kling':           'Kuaishou',
  'luma':            'Luma AI',
  'minimax-txt2vid': 'MiniMax',
  'nano-banana':     'Google',
  'nano-banana-2':   'Google',
  'recraft-v4-pro':  'Recraft',
  'sora2':           'OpenAI',
  'flux-kontext-pro':'Black Forest Labs',
}

export default function ModelCard({ model, userTier, selected, onClick, comingSoon: comingSoonProp }: Props) {
  const accessible = tierCanAccess(userTier, model.min_tier)
  const comingSoon = comingSoonProp || false
  const art = MODEL_ART[model.slug] ?? DEFAULT_ART
  const maker = slugBrandLabels[model.slug] ?? model.provider
  const isVideo = model.supported_gen_types.some(g => g === 'txt2vid' || g === 'img2vid')
  const typeLabel = isVideo ? 'VIDEO' : 'IMAGE'

  return (
    <button
      onClick={!comingSoon && accessible ? onClick : undefined}
      style={{ width: '230px', flexShrink: 0, scrollSnapAlign: 'start', background: 'var(--pv-surface)' }}
      className={`relative text-left rounded-[18px] border overflow-hidden flex flex-col transition-all duration-200 ${
        comingSoon
          ? 'opacity-40 cursor-not-allowed border-[var(--pv-border)]'
          : selected
          ? 'border-[var(--pv-accent)] shadow-lg cursor-pointer'
          : 'border-[var(--pv-border)] hover:-translate-y-1 hover:scale-[1.01] hover:shadow-xl hover:border-transparent cursor-pointer'
      }`}
    >
      {/* Art header */}
      <div className="relative overflow-hidden" style={{ height: '148px' }}>
        <div
          className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
          style={{ background: art.gradient }}
        />
        {/* Noise texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")",
            opacity: 0.5, mixBlendMode: 'overlay',
          }}
        />
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none">
          <span className="absolute rounded-full" style={{ width: 120, height: 120, top: -30, right: -20, background: 'rgba(255,255,255,0.12)' }} />
          <span className="absolute rounded-full" style={{ width: 60, height: 60, bottom: -10, left: 20, background: 'rgba(255,255,255,0.08)' }} />
        </div>
        {/* Watermark initial */}
        <div
          className="absolute select-none pointer-events-none"
          style={{
            bottom: '-12px', right: '-2px',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: '88px', fontWeight: 800,
            color: 'rgba(255,255,255,0.11)',
            lineHeight: 1, letterSpacing: '-0.06em',
          }}
        >
          {art.initial}
        </div>
        {/* Type badge */}
        {!comingSoon && (
          <div
            className="absolute top-2.5 right-2.5 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.92)' }}
          >
            {typeLabel}
          </div>
        )}
        {comingSoon && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)' }}>
            <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)' }}>
              Coming Soon
            </span>
          </div>
        )}
        {/* Tier lock */}
        {!comingSoon && !accessible && (
          <div
            className="absolute top-2.5 left-2.5 text-[10px] font-bold capitalize px-2 py-0.5 rounded"
            style={{ background: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {model.min_tier}
          </div>
        )}
        {/* Hover CTA */}
        {!comingSoon && accessible && (
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
          >
            <span className="text-[12.5px] font-bold px-4 py-1.5 rounded-full" style={{ background: '#fff', color: '#18140e' }}>
              Use this model →
            </span>
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3.5 flex flex-col gap-1.5 flex-1">
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '14px', fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {model.name}
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--pv-text3)' }}>{maker}</div>
        <div style={{ fontSize: '12px', color: 'var(--pv-text2)', lineHeight: 1.45 }} className="line-clamp-2">
          {model.description}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {model.supported_gen_types.map(gt => (
            <span key={gt} style={{ fontSize: '10.5px', fontWeight: 600, padding: '2px 7px', borderRadius: '5px', background: 'var(--pv-surface2)', color: 'var(--pv-text2)', border: '1px solid var(--pv-border)' }}>
              {GEN_TYPE_LABELS[gt as GenType] ?? gt}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}
