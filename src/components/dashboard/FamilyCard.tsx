import type { Model } from '../../types'
import ModelCard from './ModelCard'

// ── Gradient art per family ───────────────────────────────────────────────────
const FAMILY_ART: Record<string, { gradient: string; accent: string; initial: string }> = {
  'Flux':     { gradient: 'linear-gradient(145deg,#050518,#1a0080,#4400ff)', accent: '#7c5cfc', initial: 'FL' },
  'Imagen':   { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', accent: '#00cc88', initial: 'IM' },
  'Recraft':  { gradient: 'linear-gradient(145deg,#3d1a00,#a05000,#f0900a)', accent: '#f0900a', initial: 'RC' },
  'Ideogram': { gradient: 'linear-gradient(145deg,#1a001a,#660044,#cc0077)', accent: '#cc0077', initial: 'ID' },
  'Kling':    { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', accent: '#ff4d94', initial: 'KL' },
  'LTX':      { gradient: 'linear-gradient(145deg,#001a33,#004d99,#0080ff)', accent: '#0080ff', initial: 'LX' },
  'Luma':     { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', accent: '#2952e3', initial: 'LM' },
  'Sora':     { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#4040a0)', accent: '#6666cc', initial: 'SR' },
  'WAN':      { gradient: 'linear-gradient(145deg,#001a1a,#005555,#00aaaa)', accent: '#00aaaa', initial: 'WN' },
  'Hunyuan':  { gradient: 'linear-gradient(145deg,#1a0a00,#663300,#cc6600)', accent: '#cc6600', initial: 'HY' },
  'Seedance': { gradient: 'linear-gradient(145deg,#0a001a,#330066,#6600cc)', accent: '#9933ff', initial: 'SD' },
  'MiniMax':  { gradient: 'linear-gradient(145deg,#002b36,#007070,#00c9a7)', accent: '#00c9a7', initial: 'MM' },
  'Pika':     { gradient: 'linear-gradient(145deg,#1a0a00,#7a2800,#e05000)', accent: '#e05000', initial: 'PK' },
}

const DEFAULT_ART = { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', accent: '#888', initial: '??' }

// ── Main FamilyCard ───────────────────────────────────────────────────────────
interface Props {
  family: string
  models: Model[]
  userTier: string
  isOpen: boolean
  onToggle: () => void
  onSelectModel: (m: Model) => void
}

export default function FamilyCard({ family, models, userTier, isOpen, onToggle, onSelectModel }: Props) {
  const art = FAMILY_ART[family] ?? DEFAULT_ART
  const activeCount = models.filter(m => !m.coming_soon).length
  const totalCount = models.length

  return (
    <div className="flex items-stretch gap-1.5 flex-shrink-0">
      {/* ── Family anchor card — matches ModelCard exactly (230px × 148px header) ── */}
      <div className="relative flex-shrink-0" style={{ width: 230 }}>
        {/* Stacked peek shadows behind (collapsed only) */}
        {!isOpen && (
          <>
            <div className="absolute inset-0 rounded-[18px] -z-10 translate-x-1.5 translate-y-1.5 opacity-40"
              style={{ background: art.gradient, border: '1.5px solid var(--pv-border)' }} />
            <div className="absolute inset-0 rounded-[18px] -z-20 translate-x-3 translate-y-3 opacity-20"
              style={{ background: art.gradient, border: '1.5px solid var(--pv-border)' }} />
          </>
        )}

        <button
          onClick={onToggle}
          className="group w-full text-left rounded-[18px] border overflow-hidden flex flex-col transition-all duration-200 cursor-pointer select-none"
          style={{
            background: 'var(--pv-surface)',
            borderColor: isOpen ? art.accent : 'var(--pv-border)',
            boxShadow: isOpen ? `0 0 0 1px ${art.accent}44` : undefined,
          }}
        >
          {/* Gradient header — same 148px as ModelCard */}
          <div className="relative overflow-hidden" style={{ height: 148 }}>
            <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105" style={{ background: art.gradient }} />
            {/* Noise overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")", opacity:0.5, mixBlendMode:'overlay' as const }} />
            {/* Decorative circles */}
            <span className="absolute rounded-full pointer-events-none" style={{ width:120, height:120, top:-30, right:-20, background:'rgba(255,255,255,0.12)' }} />
            <span className="absolute rounded-full pointer-events-none" style={{ width:60, height:60, bottom:-10, left:20, background:'rgba(255,255,255,0.08)' }} />
            {/* Watermark initial */}
            <div className="absolute select-none pointer-events-none" style={{ bottom:'-12px', right:'-2px', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'88px', fontWeight:800, color:'rgba(255,255,255,0.11)', lineHeight:1, letterSpacing:'-0.06em' }}>
              {art.initial}
            </div>
            {/* Model count badge — bottom left */}
            <div className="absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(0,0,0,0.4)', color: art.accent, backdropFilter: 'blur(4px)', border: `1px solid ${art.accent}55` }}>
              {totalCount} model{totalCount !== 1 ? 's' : ''}
            </div>
            {/* Chevron — top right */}
            <div className="absolute top-2.5 right-2.5 w-6 h-6 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.18)' }}>
              <svg
                className="w-3 h-3 transition-transform duration-200"
                style={{ color: '#fff', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>

          {/* Info — same padding as ModelCard */}
          <div className="p-3.5 flex flex-col flex-1">
            <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'14px', fontWeight:800, color:'var(--pv-text)', letterSpacing:'-0.02em', lineHeight:1.2 }}>
              {family}
            </div>
            <div style={{ fontSize:'11.5px', color:'var(--pv-text3)', marginTop:'4px' }}>
              {activeCount} active{totalCount > activeCount ? ` · ${totalCount - activeCount} coming soon` : ''}
            </div>
            {/* Hover CTA */}
            <div className="mt-auto pt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <span className="text-[11px] font-semibold" style={{ color: art.accent }}>
                {isOpen ? 'Collapse ←' : 'Expand models →'}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* ── Variant cards — slide in to the right ── */}
      <div
        className="flex items-stretch gap-1.5 overflow-hidden transition-all duration-300"
        style={{
          maxWidth: isOpen ? `${models.length * (230 + 6)}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        {models
          .slice()
          .sort((a, b) => (a.family_order ?? 0) - (b.family_order ?? 0))
          .map(model => (
            <ModelCard
              key={model.id}
              model={model}
              userTier={userTier}
              selected={false}
              onClick={() => onSelectModel(model)}
              comingSoon={model.coming_soon}
            />
          ))}
      </div>
    </div>
  )
}
