import type { Model } from '../../types'
import ModelCard from './ModelCard'

// ── Gradient art + copy per family ───────────────────────────────────────────
const FAMILY_ART: Record<string, { gradient: string; accent: string; initial: string; maker: string; tagline: string }> = {
  'Flux':     { gradient: 'linear-gradient(145deg,#050518,#1a0080,#4400ff)', accent: '#7c5cfc', initial: 'FL', maker: 'Black Forest Labs', tagline: 'Unmatched prompt adherence · Creative control' },
  'Imagen':   { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', accent: '#00cc88', initial: 'IM', maker: 'Google DeepMind', tagline: 'Photorealistic quality · Natural language understanding' },
  'Recraft':  { gradient: 'linear-gradient(145deg,#3d1a00,#a05000,#f0900a)', accent: '#f0900a', initial: 'RC', maker: 'Recraft', tagline: 'Vector-sharp · Designer-grade precision' },
  'Ideogram': { gradient: 'linear-gradient(145deg,#1a001a,#660044,#cc0077)', accent: '#cc0077', initial: 'ID', maker: 'Ideogram', tagline: 'Best-in-class text rendering' },
  'Kling':    { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', accent: '#ff4d94', initial: 'KL', maker: 'Kuaishou', tagline: 'Cinematic motion · Physics-aware generation' },
  'LTX':      { gradient: 'linear-gradient(145deg,#001a33,#004d99,#0080ff)', accent: '#0080ff', initial: 'LX', maker: 'Lightricks', tagline: 'Real-time generation · Pro-grade motion quality' },
  'Luma':     { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', accent: '#2952e3', initial: 'LM', maker: 'Luma AI', tagline: 'Fluid motion · Photorealistic scenes' },
  'Sora':     { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#4040a0)', accent: '#6666cc', initial: 'SR', maker: 'OpenAI', tagline: 'World simulation · Cinematic storytelling' },
  'WAN':      { gradient: 'linear-gradient(145deg,#001a1a,#005555,#00aaaa)', accent: '#00aaaa', initial: 'WN', maker: 'Alibaba', tagline: 'Open-source · Fast, versatile generation' },
  'Hunyuan':  { gradient: 'linear-gradient(145deg,#1a0a00,#663300,#cc6600)', accent: '#cc6600', initial: 'HY', maker: 'Tencent', tagline: 'High fidelity · Strong motion coherence' },
  'Seedance': { gradient: 'linear-gradient(145deg,#0a001a,#330066,#6600cc)', accent: '#9933ff', initial: 'SD', maker: 'ByteDance', tagline: 'Smooth motion · Consistent character animation' },
  'MiniMax':  { gradient: 'linear-gradient(145deg,#002b36,#007070,#00c9a7)', accent: '#00c9a7', initial: 'MM', maker: 'MiniMax', tagline: 'Expressive characters · Consistent motion' },
  'Pika':     { gradient: 'linear-gradient(145deg,#1a0a00,#7a2800,#e05000)', accent: '#e05000', initial: 'PK', maker: 'Pika Labs', tagline: 'Creative effects · Animate anything' },
  'HiDream':  { gradient: 'linear-gradient(145deg,#001a2e,#004d80,#0099cc)', accent: '#0099cc', initial: 'HD', maker: 'HiDream AI', tagline: 'Open-source · Ultra-high fidelity detail' },
  'Veo':      { gradient: 'linear-gradient(145deg,#001a00,#004422,#00aa55)', accent: '#00cc66', initial: 'VE', maker: 'Google DeepMind', tagline: 'Highest fidelity · Long-form video generation' },
  'Seedream': { gradient: 'linear-gradient(145deg,#0d001a,#3d0066,#7700cc)', accent: '#aa44ff', initial: 'SD', maker: 'ByteDance', tagline: 'Aesthetic quality · Creative visual styles' },
  'Stable Diffusion': { gradient: 'linear-gradient(145deg,#1a1000,#4d3000,#996600)', accent: '#cc9900', initial: 'SD', maker: 'Stability AI', tagline: 'Open-source · Highly customizable generation' },
  'Bria':     { gradient: 'linear-gradient(145deg,#1a0010,#660033,#cc0055)', accent: '#ff2266', initial: 'BR', maker: 'Bria', tagline: 'Commercial-safe · Professional editing tools' },
  'GPT Image':   { gradient: 'linear-gradient(145deg,#001a0d,#00401a,#00a844)', accent: '#00cc55', initial: 'GP', maker: 'OpenAI', tagline: 'Instruction following · Native editing support' },
  'Nano Banana': { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', accent: '#00cc88', initial: 'NB', maker: 'Google', tagline: 'Experimental · High-efficiency image generation' },
}

const DEFAULT_ART = { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', accent: '#888', initial: '??', maker: '', tagline: '' }

const stackOverhang = (n: number) => n <= 4 ? 30 : 50

// ── Main FamilyCard ───────────────────────────────────────────────────────────
interface Props {
  family: string
  models: Model[]
  userTier: string
  isOpen: boolean
  onToggle: () => void
  onSelectModel: (m: Model) => void
  latestRenderBySlug: Record<string, { url: string; isVideo: boolean }>
}

export default function FamilyCard({ family, models, userTier, isOpen, onToggle, onSelectModel, latestRenderBySlug }: Props) {
  const art = FAMILY_ART[family] ?? DEFAULT_ART
  const activeCount = models.filter(m => !m.coming_soon).length
  const totalCount = models.length

  // Peek sliver widths — 50px total overhang divided evenly, min 3px each
  const overhang = stackOverhang(totalCount)
  const peekWidth = Math.max(3, Math.floor(overhang / totalCount))
  const totalWidth = 230 + overhang

  // Family latest render — most recent across all models in this family
  const familyRender = models
    .map(m => latestRenderBySlug[m.slug])
    .filter(Boolean)[0] // latestRenderBySlug is already ordered by recency

  const sortedModels = [...models].sort((a, b) => (a.family_order ?? 0) - (b.family_order ?? 0))

  return (
    <div className="flex items-stretch gap-1.5 flex-shrink-0">

      {/* ── Collapsed stack: anchor card + peek slivers ── */}
      <div
        className="relative flex-shrink-0"
        style={{ width: isOpen ? 230 : totalWidth, transition: 'width 0.3s ease' }}
      >
        {/* Peek slivers — rendered back-to-front (last model furthest right, lowest z) */}
        {!isOpen && sortedModels.map((_, i) => {
          const rightEdge = 230 + (i + 1) * peekWidth
          const leftEdge = rightEdge - 230
          return (
            <div
              key={i}
              className="absolute inset-y-0 rounded-[18px] border overflow-hidden"
              style={{
                left: leftEdge,
                width: 230,
                background: 'var(--pv-surface)',
                borderColor: 'var(--pv-border)',
                zIndex: totalCount - i,
                opacity: 1 - (i * 0.12),
              }}
            >
              {/* Gradient only in the header zone — mirrors card structure */}
              <div className="absolute top-0 left-0 right-0" style={{ height: 148, background: art.gradient }} />
            </div>
          )
        })}

        {/* Anchor card — on top of all slivers, slightly inset so stack peeks out */}
        <button
          onClick={onToggle}
          className="group relative text-left rounded-[18px] border overflow-hidden flex flex-col transition-all duration-200 cursor-pointer select-none"
          style={{
            width: 222,
            minHeight: 293,
            margin: '4px 0 4px 0',
            background: 'var(--pv-surface)',
            borderColor: isOpen ? art.accent : 'var(--pv-border)',
            boxShadow: isOpen ? `0 0 0 1px ${art.accent}44` : undefined,
            zIndex: totalCount + 1,
            position: 'relative',
          }}
        >
          {/* Gradient header — same 148px as ModelCard */}
          <div className="relative overflow-hidden" style={{ height: 148 }}>
            {/* Latest family render or gradient fallback */}
            {familyRender ? (
              <>
                {familyRender.isVideo ? (
                  <video
                    src={familyRender.url}
                    autoPlay muted loop playsInline
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <img
                    src={familyRender.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom,rgba(0,0,0,0) 50%,rgba(0,0,0,0.28) 100%)' }} />
              </>
            ) : (
              <>
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
              </>
            )}

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

          {/* Info */}
          <div className="p-3.5 flex flex-col flex-1">
            <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:'14px', fontWeight:800, color:'var(--pv-text)', letterSpacing:'-0.02em', lineHeight:1.2 }}>
              {family}
            </div>
            {art.maker && (
              <div style={{ fontSize:'11px', color: art.accent, marginTop:'3px', fontWeight:600 }}>
                {art.maker}
              </div>
            )}
            {art.tagline && (
              <div style={{ fontSize:'11px', color:'var(--pv-text3)', marginTop:'5px', lineHeight:1.45 }}>
                {art.tagline}
              </div>
            )}
            <div style={{ fontSize:'11px', color:'var(--pv-text3)', marginTop:'8px', opacity: 0.6 }}>
              {totalCount} model{totalCount !== 1 ? 's' : ''} · {activeCount} active{totalCount > activeCount ? ` · ${totalCount - activeCount} soon` : ''}
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
          maxWidth: isOpen ? `${sortedModels.length * (230 + 6)}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        {sortedModels.map(model => (
          <ModelCard
            key={model.id}
            model={model}
            userTier={userTier}
            selected={false}
            onClick={() => onSelectModel(model)}
            comingSoon={model.coming_soon}
            latestRenderUrl={latestRenderBySlug[model.slug]?.url}
            latestRenderIsVideo={latestRenderBySlug[model.slug]?.isVideo}
            borderColor={art.accent}
          />
        ))}
      </div>
    </div>
  )
}
