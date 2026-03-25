import type { Model, GenType } from '../../types'
import { GEN_TYPE_LABELS } from '../../types'

interface Props {
  model: Model
  onClick: () => void
  rendering?: boolean
  latestRenderUrl?: string
  latestRenderIsVideo?: boolean
  dataTour?: string
}

const MODEL_ART: Record<string, { gradient: string; initial: string }> = {
  'dalle':          { gradient: 'linear-gradient(145deg,#c0392b,#e8570a,#f5a623)', initial: 'D3' },
  'flux-schnell':   { gradient: 'linear-gradient(145deg,#003566,#0096c7,#48cae4)', initial: 'FS' },
}
const DEFAULT_ART = { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: '??' }

const slugBrand: Record<string, string> = {
  'dalle': 'OpenAI',
  'flux-schnell': 'Black Forest Labs',
}

export default function HeroCard({ model, onClick, rendering, latestRenderUrl, latestRenderIsVideo, dataTour }: Props) {
  const art = MODEL_ART[model.slug] ?? DEFAULT_ART
  const maker = slugBrand[model.slug] ?? model.provider
  const isVideo = model.supported_gen_types.some(g => g === 'txt2vid' || g === 'img2vid' || g === 'vid2vid')
  const typeLabel = isVideo ? 'VIDEO' : 'IMAGE'
  const hasUserImage = !!latestRenderUrl

  return (
    <button
      onClick={onClick}
      data-tour={dataTour}
      className="group relative text-left rounded-[20px] border overflow-hidden flex flex-col transition-all duration-200 cursor-pointer border-[var(--pv-border)] hover:-translate-y-1 hover:shadow-lg hover:border-transparent"
      style={{ width: '100%', minWidth: 0, flex: '1 1 0', background: 'var(--pv-surface)' }}
    >
      {/* Art header — taller than standard card */}
      <div className="relative overflow-hidden" style={{ height: '200px' }}>
        {hasUserImage ? (
          <>
            {latestRenderIsVideo ? (
              <video
                src={latestRenderUrl}
                autoPlay muted loop playsInline
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <img
                src={latestRenderUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0) 50%,rgba(0,0,0,0.28) 100%)' }} />
          </>
        ) : (
          <>
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: art.gradient }} />
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")", opacity:0.5, mixBlendMode:'overlay' as const }} />
            <span className="absolute rounded-full pointer-events-none" style={{ width:160, height:160, top:-40, right:-30, background:'rgba(255,255,255,0.12)' }} />
            <span className="absolute rounded-full pointer-events-none" style={{ width:80, height:80, bottom:-20, left:30, background:'rgba(255,255,255,0.08)' }} />
            <div className="absolute select-none pointer-events-none" style={{ bottom:'-16px', right:'-4px', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'110px', fontWeight:800, color:'rgba(255,255,255,0.11)', lineHeight:1, letterSpacing:'-0.06em' }}>
              {art.initial}
            </div>
          </>
        )}

        {/* Rendering LED */}
        {rendering && (
          <div className="absolute z-20" style={{ top:12, left:12, width:12, height:12, borderRadius:'50%', background:'#ff3b30', animation:'ledPulse 1.4s ease-in-out infinite' }} />
        )}

        {/* Type badge */}
        <div className="absolute top-3 right-3 text-[10px] font-bold tracking-widest uppercase px-2.5 py-0.5 rounded z-10" style={{ background:'rgba(0,0,0,0.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.92)' }}>
          {typeLabel}
        </div>

        {/* "Included free" badge */}
        <div className="absolute bottom-3 left-3 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full z-10" style={{ background:'rgba(16,185,129,0.25)', backdropFilter:'blur(8px)', border:'1px solid rgba(16,185,129,0.35)', color:'#34d399' }}>
          Included Free
        </div>

        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" style={{ background:'rgba(0,0,0,0.35)', backdropFilter:'blur(4px)' }}>
          <span className="text-[13px] font-bold px-5 py-2 rounded-full" style={{ background:'#fff', color:'#18140e' }}>
            Use this model →
          </span>
        </div>
      </div>

      {/* Card info */}
      <div className="p-4 flex flex-col flex-1">
        <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'16px', fontWeight:800, color:'var(--pv-text)', letterSpacing:'-0.02em', lineHeight:1.2 }}>
          {model.name}
        </div>
        <div style={{ fontSize:'12px', color:'var(--pv-text3)', marginTop:'4px' }}>{maker}</div>
        <div style={{ fontSize:'12.5px', color:'var(--pv-text2)', lineHeight:1.5, marginTop:'8px' }} className="line-clamp-2">
          {model.description}
        </div>
        <div className="flex flex-wrap gap-1 mt-auto pt-3">
          {model.supported_gen_types.map(gt => {
            const pillStyle = gt.startsWith('txt')
              ? { background:'rgba(251,191,36,0.13)', color:'#f59e0b', border:'1px solid rgba(251,191,36,0.28)' }
              : gt.startsWith('img')
              ? { background:'rgba(52,211,153,0.13)', color:'#10b981', border:'1px solid rgba(52,211,153,0.28)' }
              : { background:'var(--pv-surface2)', color:'var(--pv-text2)', border:'1px solid var(--pv-border)' }
            return (
              <span key={gt} style={{ fontSize:'10.5px', fontWeight:600, padding:'2px 7px', borderRadius:'5px', ...pillStyle }}>
                {GEN_TYPE_LABELS[gt as GenType] ?? gt}
              </span>
            )
          })}
        </div>
      </div>
    </button>
  )
}
