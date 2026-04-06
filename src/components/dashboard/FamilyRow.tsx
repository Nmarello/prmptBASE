import { useRef, useState } from 'react'
import React from 'react'
import type { Model } from '../../types'
import FamilyCard from './FamilyCard'
import ModelCard from './ModelCard'

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

// Returns a comparable date string for sorting (nulls sort last)
function effectiveDate(released_at: string | null): string {
  return released_at ?? '0000-00-00'
}

// Sort comparator: newest first, nulls last
function byDateDesc(a: string, b: string): number {
  if (a === b) return 0
  return a > b ? -1 : 1
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

  // Families with only 1 member → treat as solo cards
  for (const [fam, arr] of familyMap) {
    if (arr.length === 1) {
      unfamilied.push(arr[0])
      familyMap.delete(fam)
    }
  }

  // Each family's effective date = latest released_at among its members
  function familyDate(family: string): string {
    const members = familyMap.get(family) ?? []
    const best = members.reduce<string>((acc, m) => {
      const d = effectiveDate(m.released_at)
      return d > acc ? d : acc
    }, '0000-00-00')
    return best
  }

  // Sort families by effective date descending
  const sortedFamilies = [...familyMap.keys()].sort((a, b) =>
    byDateDesc(familyDate(a), familyDate(b))
  )

  // Split solos into active and coming-soon, each sorted by released_at desc
  const soloActive = unfamilied
    .filter(m => !m.coming_soon)
    .sort((a, b) => byDateDesc(effectiveDate(a.released_at), effectiveDate(b.released_at)))

  const soloComingSoon = unfamilied
    .filter(m => m.coming_soon)
    .sort((a, b) => byDateDesc(effectiveDate(a.released_at), effectiveDate(b.released_at)))

  // Interleave families and solo actives by effective date
  type Card = { type: 'family'; name: string; date: string } | { type: 'solo'; model: Model; date: string }
  const activeCards: Card[] = [
    ...sortedFamilies.map(name => ({ type: 'family' as const, name, date: familyDate(name) })),
    ...soloActive.map(model => ({ type: 'solo' as const, model, date: effectiveDate(model.released_at) })),
  ].sort((a, b) => byDateDesc(a.date, b.date))

  if (activeCards.length === 0 && soloComingSoon.length === 0) {
    return null
  }

  function handleToggle(family: string) {
    setOpenFamily(prev => prev === family ? null : family)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Row label */}
      <div className="flex items-center gap-3">
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
        {/* Active families + solo models interleaved by release date */}
        {activeCards.map(card =>
          card.type === 'family' ? (
            <div key={card.name} data-family={card.name}>
              <FamilyCard
                family={card.name}
                models={familyMap.get(card.name)!}
                userTier={userTier}
                isOpen={openFamily === card.name}
                onToggle={() => handleToggle(card.name)}
                onSelectModel={m => { onSelectModel(m); setOpenFamily(null) }}
                latestRenderBySlug={latestRenderBySlug}
              />
            </div>
          ) : (
            <ModelCard
              key={card.model.id}
              model={card.model}
              userTier={userTier}
              selected={false}
              onClick={() => onSelectModel(card.model)}
              latestRenderUrl={latestRenderBySlug[card.model.slug]?.url}
              latestRenderIsVideo={latestRenderBySlug[card.model.slug]?.isVideo}
              dataTour={card.model.slug === 'dalle' ? 'dalle-card' : undefined}
            />
          )
        )}

        {/* Coming soon — at the end */}
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
