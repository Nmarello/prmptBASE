import { useRef, useState } from 'react'
import React from 'react'
import type { Model } from '../../types'
import FamilyCard from './FamilyCard'
import ModelCard from './ModelCard'

// Family display order per row
const FAMILY_ORDER: Record<string, string[]> = {
  images:     ['Flux', 'Imagen', 'Recraft', 'Ideogram', 'HiDream', 'GPT Image', 'Stable Diffusion', 'Bria', 'Seedream'],
  video:      ['Kling', 'LTX', 'Luma', 'Sora', 'Veo', 'MiniMax', 'WAN', 'Pika'],
  characters: [],
}

interface Props {
  category: 'images' | 'video' | 'characters'
  models: Model[]        // all models for this category (active + coming_soon)
  userTier: string
  onSelectModel: (m: Model) => void
  latestRenderBySlug: Record<string, { url: string; isVideo: boolean }>
}

const LABELS: Record<string, string> = {
  images: 'Images',
  video: 'Video',
  characters: 'Characters',
}

export default function FamilyRow({ category, models, userTier, onSelectModel, latestRenderBySlug }: Props) {
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
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Row label */}
      <div className="flex items-center gap-3 mb-2">
        <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
          {LABELS[category]}
        </h2>
      </div>

      {/* Horizontal scroll */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', overflowAnchor: 'none' } as React.CSSProperties}
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
              latestRenderBySlug={latestRenderBySlug}
            />
          </div>
        ))}

        {/* Solo active models (no family) */}
        {soloActive.map(model => (
          <ModelCard
            key={model.id}
            model={model}
            userTier={userTier}
            selected={false}
            onClick={() => onSelectModel(model)}
            latestRenderUrl={latestRenderBySlug[model.slug]?.url}
            latestRenderIsVideo={latestRenderBySlug[model.slug]?.isVideo}
            dataTour={model.slug === 'dalle' ? 'dalle-card' : undefined}
          />
        ))}

        {/* Coming soon without a family — at the end */}
        {soloComingSoon.map(model => (
          <ModelCard
            key={model.id}
            model={model}
            userTier={userTier}
            selected={false}
            onClick={() => onSelectModel(model)}
            comingSoon
          />
        ))}
      </div>
    </div>
  )
}
