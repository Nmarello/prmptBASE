import React, { useRef, useState } from 'react'
import type { Model } from '../../types'
import MiniModelCard from './MiniModelCard'

export type CategoryKey = 'images' | 'video' | 'characters' | '3d'

interface Props {
  models: Model[]
  favoriteModelSlugs: string[]
  recentModelSlugs: string[]
  latestRenderBySlug: Record<string, { url: string; isVideo: boolean }>
  onSelectModel: (m: Model) => void
  onCategorySelect: (cat: CategoryKey) => void
  onToolsSelect: () => void
  onAdvisorQuery: (query: string) => void
  onFavoriteToggle: (slug: string) => void
}

const FEATURED_SLUGS = [
  'flux-kontext-pro', 'gpt-image-1', 'nano-banana-pro', 'ideogram-v3',
  'recraft-v4-pro', 'flux-pro-ultra', 'hidream-fast', 'kling-v3', 'luma-txt2vid',
]

const SUGGESTIONS = [
  'Photorealistic portrait',
  'Product photography',
  'Animated video clip',
  'Cinematic drone shot',
  'Edit an existing photo',
]

const CATEGORIES: { key: CategoryKey | 'tools'; label: string; color: string; icon: React.ReactNode; countFn: (models: Model[]) => number }[] = [
  {
    key: 'images',
    label: 'Images',
    color: '#7c3aed',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    countFn: (ms) => ms.filter(m => m.is_active && !m.coming_soon && m.supported_gen_types.some(g => ['txt2img','img2img','multi_img2img'].includes(g))).length,
  },
  {
    key: 'video',
    label: 'Video',
    color: '#059669',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
      </svg>
    ),
    countFn: (ms) => ms.filter(m => m.is_active && !m.coming_soon && m.supported_gen_types.some(g => ['txt2vid','img2vid','ref2vid','vid2vid'].includes(g))).length,
  },
  {
    key: 'characters',
    label: 'Characters',
    color: '#0ea5e9',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    countFn: (ms) => ms.filter(m => m.is_active && !m.coming_soon && m.family === 'Characters').length,
  },
  {
    key: '3d',
    label: '3D Worlds',
    color: '#f59e0b',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
    ),
    countFn: () => 0,
  },
  {
    key: 'tools',
    label: 'Tools',
    color: '#ec4899',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    ),
    countFn: () => 8,
  },
]

function BrowseRow({ title, models, latestRenderBySlug, favoriteModelSlugs, onSelectModel, onFavoriteToggle, showFavoriteToggle = false }: {
  title: string
  models: Model[]
  latestRenderBySlug: Record<string, { url: string; isVideo: boolean }>
  favoriteModelSlugs: string[]
  onSelectModel: (m: Model) => void
  onFavoriteToggle: (slug: string) => void
  showFavoriteToggle?: boolean
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
        className="flex gap-2.5 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {models.map(m => (
          <MiniModelCard
            key={m.id}
            model={m}
            onClick={() => onSelectModel(m)}
            latestRenderUrl={latestRenderBySlug[m.slug]?.url}
            latestRenderIsVideo={latestRenderBySlug[m.slug]?.isVideo}
            isFavorite={favoriteModelSlugs.includes(m.slug)}
            onFavoriteToggle={showFavoriteToggle ? onFavoriteToggle : undefined}
          />
        ))}
      </div>
    </div>
  )
}

export default function HomeView({
  models, favoriteModelSlugs, recentModelSlugs,
  latestRenderBySlug, onSelectModel, onCategorySelect, onToolsSelect,
  onAdvisorQuery, onFavoriteToggle,
}: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  function handleSubmit() {
    const q = query.trim()
    if (!q) return
    onAdvisorQuery(q)
    setQuery('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  const activeModels = models.filter(m => m.is_active && !m.coming_soon)

  const favoriteModels = favoriteModelSlugs
    .map(slug => activeModels.find(m => m.slug === slug))
    .filter(Boolean) as Model[]

  const featuredModels = FEATURED_SLUGS
    .map(slug => activeModels.find(m => m.slug === slug))
    .filter(Boolean) as Model[]

  const recentModels = recentModelSlugs
    .map(slug => activeModels.find(m => m.slug === slug))
    .filter(Boolean) as Model[]

  // If no favorites and no recent, show featured full-width as first row
  const showFavorites = favoriteModels.length > 0
  const showRecent = recentModels.length > 0

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollbarWidth: 'none' } as React.CSSProperties}
    >
      <div className="px-4 sm:px-7" style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center mb-6">
          <h1
            style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 'clamp(22px, 3vw, 32px)', fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 8 }}
          >
            What do you want to create?
          </h1>
          {/* Two-line subtitle with inline Model Advisor badge */}
          <div style={{ fontSize: 13, color: 'var(--pv-text3)', marginBottom: 16, lineHeight: 1.6 }}>
            <span>Describe your vision —</span>
            <br />
            <span>the </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#7c3aed', fontWeight: 600, verticalAlign: 'middle' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="#7c3aed" style={{ flexShrink: 0, display: 'inline' }}>
                <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/>
                <path d="M19 2l.9 2.7 2.6.9-2.6.9L19 9l-.9-2.7L15.5 5.6l2.6-.9z" opacity=".6"/>
              </svg>
              Model Advisor
            </span>
            <span> picks the right model for you</span>
          </div>

          {/* Prompt input */}
          <div className="w-full max-w-2xl relative">
            <textarea
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="photorealistic red house"
              rows={1}
              style={{
                width: '100%', resize: 'none', boxSizing: 'border-box',
                background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)',
                borderRadius: 16, padding: '14px 56px 14px 18px',
                fontSize: 14, color: 'var(--pv-text)', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 100,
                overflowY: 'auto', display: 'block',
              }}
              className="pv-placeholder focus:border-[#7c3aed] transition-colors"
            />
            <button
              onClick={handleSubmit}
              disabled={!query.trim()}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 36, height: 36, background: '#7c3aed', border: 'none',
                borderRadius: 10, cursor: 'pointer', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
              className="hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-1.5 justify-center mt-3 max-w-2xl">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => { setQuery(s); setTimeout(() => inputRef.current?.focus(), 0) }}
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 20,
                  border: '1px solid var(--pv-border)', background: 'var(--pv-surface2)',
                  color: 'var(--pv-text3)', cursor: 'pointer', fontFamily: 'inherit',
                }}
                className="hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Category cards ───────────────────────────────────────────────── */}
        <div className="mb-7">
          <p style={{ fontSize: 11, color: 'var(--pv-text3)', marginBottom: 10 }}>Browse by category</p>
          <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-5">
            {CATEGORIES.map(cat => {
              const count = cat.countFn(models)
              const isTools = cat.key === 'tools'
              const is3d = cat.key === '3d'
              return (
                <button
                  key={cat.key}
                  onClick={() => {
                    if (isTools) onToolsSelect()
                    else onCategorySelect(cat.key as CategoryKey)
                  }}
                  style={{
                    background: 'var(--pv-surface)',
                    border: '1px solid var(--pv-border)',
                    borderRadius: 14,
                    padding: '14px 14px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  className="hover:-translate-y-0.5 hover:shadow-md group"
                >
                  {/* Gradient tint */}
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cat.color}18 0%, transparent 60%)`, borderRadius: 14, pointerEvents: 'none' }} />

                  {/* Icon */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: cat.color + '22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: cat.color, marginBottom: 10,
                  }}>
                    {cat.icon}
                  </div>

                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 3 }}>
                    {cat.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--pv-text3)' }}>
                    {is3d ? 'Coming soon' : isTools ? '8 tools' : `${count} models`}
                  </div>

                  {is3d && (
                    <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 8, fontWeight: 700, letterSpacing: '0.05em', background: cat.color + '22', color: cat.color, padding: '2px 6px', borderRadius: 20 }}>
                      SOON
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Browse rows ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-6 pb-10">
          {showFavorites && (
            <BrowseRow
              title="⭐  Favorites"
              models={favoriteModels}
              latestRenderBySlug={latestRenderBySlug}
              favoriteModelSlugs={favoriteModelSlugs}
              onSelectModel={onSelectModel}
              onFavoriteToggle={onFavoriteToggle}
              showFavoriteToggle
            />
          )}

          <BrowseRow
            title="✦  Featured"
            models={featuredModels}
            latestRenderBySlug={latestRenderBySlug}
            favoriteModelSlugs={favoriteModelSlugs}
            onSelectModel={onSelectModel}
            onFavoriteToggle={onFavoriteToggle}
            showFavoriteToggle
          />

          {showRecent && (
            <BrowseRow
              title="🕐  Last Used"
              models={recentModels}
              latestRenderBySlug={latestRenderBySlug}
              favoriteModelSlugs={favoriteModelSlugs}
              onSelectModel={onSelectModel}
              onFavoriteToggle={onFavoriteToggle}
              showFavoriteToggle
            />
          )}
        </div>
      </div>
    </div>
  )
}
