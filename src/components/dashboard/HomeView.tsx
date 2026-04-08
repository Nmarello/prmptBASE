import React, { useRef, useState } from 'react'
import type { Model } from '../../types'
import ModelCard from './ModelCard'

export type CategoryKey = 'images' | 'video'

interface Props {
  models: Model[]
  favoriteModelSlugs: string[]
  recentModelSlugs: string[]
  latestRenderBySlug: Record<string, { url: string; isVideo: boolean }>
  userTier: string
  onSelectModel: (m: Model) => void
  onCategorySelect: (cat: CategoryKey) => void
  onToolsSelect: () => void
  onAdvisorQuery: (query: string) => void
}

const IMAGE_GEN = ['txt2img', 'img2img', 'multi_img2img']
const VIDEO_GEN = ['txt2vid', 'img2vid', 'ref2vid', 'vid2vid']

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
    countFn: (ms) => ms.filter(m => m.is_active && !m.coming_soon && m.supported_gen_types.some(g => IMAGE_GEN.includes(g))).length,
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
    countFn: (ms) => ms.filter(m => m.is_active && !m.coming_soon && m.supported_gen_types.some(g => VIDEO_GEN.includes(g))).length,
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

function BrowseRow({ title, models, latestRenderBySlug, userTier, onSelectModel }: {
  title: string
  models: Model[]
  latestRenderBySlug: Record<string, { url: string; isVideo: boolean }>
  userTier: string
  onSelectModel: (m: Model) => void
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
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {models.map(m => (
          <ModelCard
            key={m.id}
            model={m}
            userTier={userTier}
            selected={false}
            onClick={() => onSelectModel(m)}
            latestRenderUrl={latestRenderBySlug[m.slug]?.url}
            latestRenderIsVideo={latestRenderBySlug[m.slug]?.isVideo}
          />
        ))}
      </div>
    </div>
  )
}

export default function HomeView({
  models, favoriteModelSlugs, recentModelSlugs,
  latestRenderBySlug, userTier, onSelectModel, onCategorySelect, onToolsSelect,
  onAdvisorQuery,
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

  // Featured: top 3 newest image + top 3 newest video by released_at
  const imageModels = activeModels.filter(m => m.supported_gen_types.some(g => IMAGE_GEN.includes(g)))
  const videoModels = activeModels.filter(m => m.supported_gen_types.some(g => VIDEO_GEN.includes(g)))
  const top3Image = [...imageModels].sort((a, b) => (b.released_at ?? '').localeCompare(a.released_at ?? '')).slice(0, 3)
  const top3Video = [...videoModels].sort((a, b) => (b.released_at ?? '').localeCompare(a.released_at ?? '')).slice(0, 3)
  const featuredModels = [...top3Image, ...top3Video]

  // Recently used: last 3 image + last 3 video from recentModelSlugs
  const recentImageSlugs = recentModelSlugs.filter(slug => imageModels.some(m => m.slug === slug)).slice(0, 3)
  const recentVideoSlugs = recentModelSlugs.filter(slug => videoModels.some(m => m.slug === slug)).slice(0, 3)
  const recentSlugs = [...new Set([...recentImageSlugs, ...recentVideoSlugs])]
  const recentModels = recentSlugs.map(slug => activeModels.find(m => m.slug === slug)).filter(Boolean) as Model[]

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
          <div className="grid gap-2.5 grid-cols-3">
            {CATEGORIES.map(cat => {
              const count = cat.countFn(models)
              const isTools = cat.key === 'tools'
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
                    {isTools ? '8 tools' : `${count} models`}
                  </div>
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
              userTier={userTier}
              onSelectModel={onSelectModel}
            />
          )}

          <BrowseRow
            title="✦  Featured"
            models={featuredModels}
            latestRenderBySlug={latestRenderBySlug}
            userTier={userTier}
            onSelectModel={onSelectModel}
          />

          {showRecent && (
            <BrowseRow
              title="🕐  Last Used"
              models={recentModels}
              latestRenderBySlug={latestRenderBySlug}
              userTier={userTier}
              onSelectModel={onSelectModel}
            />
          )}
        </div>
      </div>
    </div>
  )
}
