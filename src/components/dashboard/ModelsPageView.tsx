import React, { useRef } from 'react'
import type { Model } from '../../types'
import ModelCard from './ModelCard'

const IMAGE_GEN_TYPES = ['txt2img', 'img2img', 'multi_img2img']
const VIDEO_GEN_TYPES = ['txt2vid', 'img2vid', 'ref2vid', 'vid2vid']

interface Props {
  type: 'images' | 'video'
  models: Model[]
  recentModelSlugs: string[]
  latestRenderBySlug: Record<string, { url: string; isVideo: boolean }>
  userTier: string
  onSelectModel: (m: Model) => void
  renderingModelSlug?: string | null
}

function ModelRow({ title, models, latestRenderBySlug, userTier, onSelectModel, renderingModelSlug }: {
  title: string
  models: Model[]
  latestRenderBySlug: Record<string, { url: string; isVideo: boolean }>
  userTier: string
  onSelectModel: (m: Model) => void
  renderingModelSlug?: string | null
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  if (models.length === 0) return null
  return (
    <div className="flex flex-col gap-2.5">
      <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 15, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.02em' }}>
        {title}
      </h3>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {models.map(m => (
          <ModelCard
            key={m.id}
            model={m}
            userTier={userTier}
            selected={false}
            onClick={() => onSelectModel(m)}
            rendering={renderingModelSlug === m.slug}
            latestRenderUrl={latestRenderBySlug[m.slug]?.url}
            latestRenderIsVideo={latestRenderBySlug[m.slug]?.isVideo}
            comingSoon={m.coming_soon}
          />
        ))}
      </div>
    </div>
  )
}

export default function ModelsPageView({
  type, models, recentModelSlugs, latestRenderBySlug, userTier, onSelectModel, renderingModelSlug,
}: Props) {
  const genTypes = type === 'images' ? IMAGE_GEN_TYPES : VIDEO_GEN_TYPES

  const activeModels = models.filter(
    m => m.is_active && !m.coming_soon &&
    m.supported_gen_types.some(g => genTypes.includes(g))
  )

  // Featured: top 3 by released_at descending
  const featured = [...activeModels]
    .sort((a, b) => (b.released_at ?? '').localeCompare(a.released_at ?? ''))
    .slice(0, 3)

  // Recently used: from recentModelSlugs, filtered to this type, up to 3
  const recent = recentModelSlugs
    .map(slug => activeModels.find(m => m.slug === slug))
    .filter(Boolean)
    .slice(0, 3) as Model[]

  // Group active models by family
  const familyMap = new Map<string, Model[]>()
  const unfamilied: Model[] = []

  for (const m of activeModels) {
    if (m.family) {
      const arr = familyMap.get(m.family) ?? []
      arr.push(m)
      familyMap.set(m.family, arr)
    } else {
      unfamilied.push(m)
    }
  }

  // Families with only 1 member → treat as solo
  for (const [fam, arr] of familyMap) {
    if (arr.length === 1) {
      unfamilied.push(arr[0])
      familyMap.delete(fam)
    }
  }

  // Sort each family's members by family_order
  for (const [fam, arr] of familyMap) {
    familyMap.set(fam, arr.sort((a, b) => (a.family_order ?? 0) - (b.family_order ?? 0)))
  }

  // Sort families by newest member's released_at descending
  function familyDate(family: string): string {
    return (familyMap.get(family) ?? []).reduce<string>((acc, m) => {
      const d = m.released_at ?? '0000-00-00'
      return d > acc ? d : acc
    }, '0000-00-00')
  }

  const sortedFamilies = [...familyMap.keys()].sort((a, b) =>
    familyDate(b).localeCompare(familyDate(a))
  )

  // Sort solo models by released_at desc
  unfamilied.sort((a, b) => (b.released_at ?? '').localeCompare(a.released_at ?? ''))

  // Coming soon models
  const comingSoon = models.filter(
    m => m.coming_soon && m.supported_gen_types.some(g => genTypes.includes(g))
  )

  const hasTopRows = featured.length > 0 || recent.length > 0

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth: 'none' } as React.CSSProperties}
    >
      <div className="px-4 sm:px-7 pb-10 flex flex-col gap-8" style={{ paddingTop: '1.5rem' }}>

        <ModelRow
          title="✦  Featured"
          models={featured}
          latestRenderBySlug={latestRenderBySlug}
          userTier={userTier}
          onSelectModel={onSelectModel}
          renderingModelSlug={renderingModelSlug}
        />

        {recent.length > 0 && (
          <ModelRow
            title="🕐  Last Used"
            models={recent}
            latestRenderBySlug={latestRenderBySlug}
            userTier={userTier}
            onSelectModel={onSelectModel}
            renderingModelSlug={renderingModelSlug}
          />
        )}

        {hasTopRows && (sortedFamilies.length > 0 || unfamilied.length > 0) && (
          <div style={{ height: 1, background: 'var(--pv-border)', flexShrink: 0 }} />
        )}

        {sortedFamilies.map(family => (
          <ModelRow
            key={family}
            title={family}
            models={familyMap.get(family)!}
            latestRenderBySlug={latestRenderBySlug}
            userTier={userTier}
            onSelectModel={onSelectModel}
            renderingModelSlug={renderingModelSlug}
          />
        ))}

        {unfamilied.length > 0 && (
          <ModelRow
            title="More"
            models={unfamilied}
            latestRenderBySlug={latestRenderBySlug}
            userTier={userTier}
            onSelectModel={onSelectModel}
            renderingModelSlug={renderingModelSlug}
          />
        )}

        {comingSoon.length > 0 && (
          <ModelRow
            title="Coming Soon"
            models={comingSoon}
            latestRenderBySlug={latestRenderBySlug}
            userTier={userTier}
            onSelectModel={onSelectModel}
            renderingModelSlug={renderingModelSlug}
          />
        )}
      </div>
    </div>
  )
}
