import type { Model } from '../../types'

// ── Gradient art per family ───────────────────────────────────────────────────
const FAMILY_ART: Record<string, { gradient: string; accent: string }> = {
  'Flux':     { gradient: 'linear-gradient(145deg,#050518,#1a0080,#4400ff)', accent: '#7c5cfc' },
  'Imagen':   { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', accent: '#00cc88' },
  'Recraft':  { gradient: 'linear-gradient(145deg,#3d1a00,#a05000,#f0900a)', accent: '#f0900a' },
  'Ideogram': { gradient: 'linear-gradient(145deg,#1a001a,#660044,#cc0077)', accent: '#cc0077' },
  'Kling':    { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', accent: '#ff4d94' },
  'LTX':      { gradient: 'linear-gradient(145deg,#001a33,#004d99,#0080ff)', accent: '#0080ff' },
  'Luma':     { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', accent: '#2952e3' },
  'Sora':     { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#4040a0)', accent: '#6666cc' },
  'WAN':      { gradient: 'linear-gradient(145deg,#001a1a,#005555,#00aaaa)', accent: '#00aaaa' },
  'Hunyuan':  { gradient: 'linear-gradient(145deg,#1a0a00,#663300,#cc6600)', accent: '#cc6600' },
  'Seedance': { gradient: 'linear-gradient(145deg,#0a001a,#330066,#6600cc)', accent: '#9933ff' },
  'MiniMax':  { gradient: 'linear-gradient(145deg,#002b36,#007070,#00c9a7)', accent: '#00c9a7' },
  'Pika':     { gradient: 'linear-gradient(145deg,#1a0a00,#7a2800,#e05000)', accent: '#e05000' },
}

const DEFAULT_ART = { gradient: 'linear-gradient(145deg,#1a1a1a,#333,#555)', accent: '#888' }

// Variant card — shown when family is expanded
function VariantCard({
  model,
  userTier,
  onSelect,
}: {
  model: Model
  userTier: string
  onSelect: (m: Model) => void
}) {
  const isVideo = model.supported_gen_types.some(g => ['txt2vid','img2vid','vid2vid'].includes(g))
  const tierOrder = ['newbie','creator','studio','pro']
  const locked = tierOrder.indexOf(userTier) < tierOrder.indexOf(model.min_tier ?? 'newbie')
  const art = FAMILY_ART[model.family ?? ''] ?? DEFAULT_ART

  const typeLabel = model.supported_gen_types
    .map(g => g === 'txt2img' ? 'Text→Img' : g === 'img2img' ? 'Img→Img' : g === 'txt2vid' ? 'Text→Vid' : g === 'img2vid' ? 'Img→Vid' : g === 'vid2vid' ? 'Vid→Vid' : g)
    .join(' · ')

  return (
    <div
      onClick={() => !model.coming_soon && onSelect(model)}
      className="flex-shrink-0 w-48 rounded-2xl overflow-hidden border transition-all duration-150 select-none"
      style={{
        background: 'var(--pv-surface)',
        borderColor: 'var(--pv-border)',
        cursor: model.coming_soon ? 'default' : 'pointer',
        opacity: model.coming_soon ? 0.65 : 1,
      }}
    >
      {/* Mini gradient header */}
      <div className="h-24 flex items-center justify-center relative" style={{ background: art.gradient }}>
        {model.coming_soon && (
          <span className="absolute top-1.5 right-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.5)', color: '#aaa' }}>
            Soon
          </span>
        )}
        {locked && !model.coming_soon && (
          <svg className="w-4 h-4 opacity-60" fill="currentColor" viewBox="0 0 20 20" style={{ color: art.accent }}>
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
        )}
      </div>
      {/* Info */}
      <div className="p-2.5">
        <div className="text-sm font-semibold leading-tight mb-0.5 truncate" style={{ color: 'var(--pv-text)' }}>
          {model.name.replace(model.family ?? '', '').trim() || model.name}
        </div>
        <div className="text-xs leading-tight truncate" style={{ color: 'var(--pv-text3)' }}>
          {typeLabel}
        </div>
        {isVideo && !locked && !model.coming_soon && (
          <div className="mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full inline-block"
            style={{ background: `${art.accent}22`, color: art.accent }}>
            Video
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main FamilyCard ───────────────────────────────────────────────────────────
interface Props {
  family: string
  models: Model[]         // all models in this family (active + coming_soon)
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
      {/* ── Family anchor card ── */}
      <div
        onClick={onToggle}
        className="flex-shrink-0 w-48 rounded-2xl overflow-hidden cursor-pointer select-none transition-all duration-150 relative"
        style={{
          background: 'var(--pv-surface)',
          border: `1.5px solid ${isOpen ? art.accent : 'var(--pv-border)'}`,
          boxShadow: isOpen ? `0 0 0 1px ${art.accent}44` : undefined,
        }}
      >
        {/* Stacked card peek effect — two shadow cards behind */}
        {!isOpen && (
          <>
            <div className="absolute inset-0 rounded-2xl -z-10 translate-x-1.5 translate-y-1.5 opacity-40"
              style={{ background: art.gradient, border: '1.5px solid var(--pv-border)' }} />
            <div className="absolute inset-0 rounded-2xl -z-20 translate-x-3 translate-y-3 opacity-20"
              style={{ background: art.gradient, border: '1.5px solid var(--pv-border)' }} />
          </>
        )}

        {/* Gradient hero */}
        <div className="h-28 flex items-end justify-start p-3 relative" style={{ background: art.gradient }}>
          <div className="text-xs font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(0,0,0,0.4)', color: art.accent, backdropFilter: 'blur(4px)' }}>
            {totalCount} model{totalCount !== 1 ? 's' : ''}
          </div>
          {/* Expand/collapse chevron */}
          <div className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(0,0,0,0.35)' }}>
            <svg
              className="w-3 h-3 transition-transform duration-200"
              style={{ color: '#fff', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Name + active count */}
        <div className="p-3">
          <div className="text-base font-bold truncate" style={{ color: 'var(--pv-text)' }}>{family}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--pv-text3)' }}>
            {activeCount} active
            {totalCount > activeCount ? ` · ${totalCount - activeCount} soon` : ''}
          </div>
        </div>
      </div>

      {/* ── Variant cards — slide in to the right ── */}
      <div
        className="flex items-stretch gap-1.5 overflow-hidden transition-all duration-300"
        style={{
          maxWidth: isOpen ? `${models.length * (144 + 6)}px` : '0px',
          opacity: isOpen ? 1 : 0,
        }}
      >
        {models
          .slice()
          .sort((a, b) => (a.family_order ?? 0) - (b.family_order ?? 0))
          .map(model => (
            <VariantCard
              key={model.id}
              model={model}
              userTier={userTier}
              onSelect={onSelectModel}
            />
          ))}
      </div>
    </div>
  )
}
