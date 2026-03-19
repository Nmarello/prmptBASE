import { useRef, useState } from 'react'
import type { Model } from '../../types'
import FamilyCard from './FamilyCard'

// Family display order per row
const FAMILY_ORDER: Record<string, string[]> = {
  images:     ['Flux', 'Imagen', 'Recraft', 'Ideogram'],
  video:      ['Kling', 'LTX', 'Luma', 'Sora', 'Seedance', 'MiniMax', 'WAN', 'Hunyuan', 'Pika'],
  characters: [],  // populated as character models are added
}

interface Props {
  category: 'images' | 'video' | 'characters'
  models: Model[]        // all models for this category (active + coming_soon)
  userTier: string
  onSelectModel: (m: Model) => void
}

const LABELS: Record<string, string> = {
  images: 'Images',
  video: 'Video',
  characters: 'Characters',
}

export default function FamilyRow({ category, models, userTier, onSelectModel }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [openFamily, setOpenFamily] = useState<string | null>(null)

  // Group models by family
  const familyMap = new Map<string, Model[]>()
  const unfamilied: Model[] = []

  for (const m of models) {
    if (m.family) {
      const arr = familyMap.get(m.family) ?? []
      arr.push(m)
      familyMap.set(m.family, arr)
    } else {
      unfamilied.push(m)
    }
  }

  // Order families by the defined order, then any extras alphabetically
  const orderedFamilies = FAMILY_ORDER[category]
    .filter(f => familyMap.has(f))
    .concat(
      [...familyMap.keys()]
        .filter(f => !FAMILY_ORDER[category].includes(f))
        .sort()
    )

  // Coming-soon without a family go at the end as solo cards
  const soloComingSoon = unfamilied.filter(m => m.coming_soon)
  const soloActive = unfamilied.filter(m => !m.coming_soon)

  if (orderedFamilies.length === 0 && soloActive.length === 0 && soloComingSoon.length === 0) {
    return null
  }

  function handleToggle(family: string) {
    setOpenFamily(prev => prev === family ? null : family)
    // Scroll the row so opened family is visible
    setTimeout(() => {
      const el = scrollRef.current?.querySelector(`[data-family="${family}"]`) as HTMLElement | null
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    }, 50)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Row label */}
      <div className="px-1 flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--pv-text3)' }}>
          {LABELS[category]}
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--pv-border)' }} />
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Family cards */}
        {orderedFamilies.map(family => (
          <div key={family} data-family={family}>
            <FamilyCard
              family={family}
              models={familyMap.get(family)!}
              userTier={userTier}
              isOpen={openFamily === family}
              onToggle={() => handleToggle(family)}
              onSelectModel={m => { onSelectModel(m); setOpenFamily(null) }}
            />
          </div>
        ))}

        {/* Solo active models (no family) */}
        {soloActive.map(model => (
          <SoloCard key={model.id} model={model} userTier={userTier} onSelect={onSelectModel} />
        ))}

        {/* Coming soon without a family — at the end */}
        {soloComingSoon.map(model => (
          <SoloCard key={model.id} model={model} userTier={userTier} onSelect={onSelectModel} comingSoon />
        ))}
      </div>
    </div>
  )
}

// ── Solo card for unfamilied models ──────────────────────────────────────────
function SoloCard({
  model,
  onSelect,
  comingSoon,
}: {
  model: Model
  userTier: string
  onSelect: (m: Model) => void
  comingSoon?: boolean
}) {
  const typeLabel = model.supported_gen_types
    .map(g => g === 'txt2img' ? 'Text→Img' : g === 'img2img' ? 'Img→Img' : g === 'txt2vid' ? 'Text→Vid' : g === 'img2vid' ? 'Img→Vid' : g === 'vid2vid' ? 'Vid→Vid' : g)
    .join(' · ')

  return (
    <div
      onClick={() => !comingSoon && onSelect(model)}
      className="flex-shrink-0 w-36 rounded-2xl overflow-hidden border transition-all duration-150 select-none"
      style={{
        background: 'var(--pv-surface)',
        borderColor: 'var(--pv-border)',
        cursor: comingSoon ? 'default' : 'pointer',
        opacity: comingSoon ? 0.55 : 1,
      }}
    >
      <div className="h-14" style={{ background: 'linear-gradient(145deg,#1a1a1a,#333,#555)' }} />
      <div className="p-2.5">
        <div className="flex items-start justify-between gap-1">
          <div className="text-xs font-semibold leading-tight truncate" style={{ color: 'var(--pv-text)' }}>
            {model.name}
          </div>
          {comingSoon && (
            <span className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0 px-1 py-0.5 rounded-full"
              style={{ background: 'var(--pv-surface2)', color: 'var(--pv-text3)' }}>
              Soon
            </span>
          )}
        </div>
        <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--pv-text3)' }}>
          {typeLabel}
        </div>
      </div>
    </div>
  )
}
