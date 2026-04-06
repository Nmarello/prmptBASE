import { useState, useMemo, useEffect, useRef } from 'react'

interface AssetRef {
  id: string
  url: string
  gen_type: string | null
  created_at: string
}

type MediaFilter = 'all' | 'images' | 'videos'

interface Props {
  assets: AssetRef[]
  onPick: (url: string) => void
  onClose: () => void
  /** Restrict to 'images' or 'videos' only */
  mediaType?: MediaFilter
  title?: string
}

export default function AssetPickerModal({ assets, onPick, onClose, mediaType, title }: Props) {
  const [filter, setFilter] = useState<MediaFilter>(mediaType ?? 'all')
  const [page, setPage] = useState(1)
  const gridRef = useRef<HTMLDivElement>(null)
  const PER_PAGE = 60

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const IMAGE_TYPES = new Set(['txt2img', 'img2img', 'multi_img2img'])
  const VIDEO_TYPES = new Set(['txt2vid', 'img2vid', 'ref2vid', 'vid2vid'])

  const filtered = useMemo(() => {
    let out = [...assets]
    // Only show completed assets (have a url)
    out = out.filter(a => a.url)
    if (filter === 'images') out = out.filter(a => !a.gen_type || IMAGE_TYPES.has(a.gen_type))
    if (filter === 'videos') out = out.filter(a => a.gen_type != null && VIDEO_TYPES.has(a.gen_type))
    return out
  }, [assets, filter])

  const paged = useMemo(() => filtered.slice(0, page * PER_PAGE), [filtered, page])
  const hasMore = paged.length < filtered.length

  // Infinite scroll
  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const h = () => {
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200 && hasMore) {
        setPage(p => p + 1)
      }
    }
    el.addEventListener('scroll', h)
    return () => el.removeEventListener('scroll', h)
  }, [hasMore])

  // Force filter when mediaType is locked
  const locked = mediaType != null && mediaType !== 'all'

  const heading = title
    ?? (filter === 'videos' ? 'Choose a video' : filter === 'images' ? 'Choose an image' : 'Choose an asset')

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col rounded-2xl overflow-hidden"
        style={{
          width: 'min(92vw, 900px)',
          height: 'min(85vh, 700px)',
          background: 'var(--pv-surface)',
          border: '1px solid var(--pv-border)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid var(--pv-border)' }}>
          <div>
            <h3 className="text-base font-semibold" style={{ color: 'var(--pv-text)' }}>{heading}</h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--pv-text3)' }}>
              {filtered.length} {filter === 'videos' ? 'videos' : filter === 'images' ? 'images' : 'assets'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filter pills — only show if not locked */}
            {!locked && (
              <div className="flex gap-1">
                {(['all', 'images', 'videos'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => { setFilter(f); setPage(1) }}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: filter === f ? 'var(--pv-accent)' : 'var(--pv-surface2)',
                      color: filter === f ? '#fff' : 'var(--pv-text2)',
                      border: `1px solid ${filter === f ? 'var(--pv-accent)' : 'var(--pv-border)'}`,
                    }}
                  >
                    {f === 'all' ? 'All' : f === 'images' ? 'Images' : 'Videos'}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
              style={{ background: 'var(--pv-surface2)', color: 'var(--pv-text2)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div ref={gridRef} className="flex-1 overflow-y-auto p-4">
          {paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <p className="text-sm" style={{ color: 'var(--pv-text3)' }}>
                No {filter === 'videos' ? 'videos' : filter === 'images' ? 'images' : 'assets'} found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {paged.map(a => {
                const isVideo = a.gen_type != null && VIDEO_TYPES.has(a.gen_type)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onPick(a.url)}
                    className="relative rounded-xl overflow-hidden aspect-square group transition-all hover:ring-2 focus:ring-2 focus:outline-none"
                    style={{ '--tw-ring-color': 'var(--pv-accent)' } as React.CSSProperties}
                  >
                    {isVideo ? (
                      <video
                        src={a.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                        onMouseEnter={e => (e.target as HTMLVideoElement).play().catch(() => {})}
                        onMouseLeave={e => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
                      />
                    ) : (
                      <img
                        src={a.url}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                    {/* Video badge */}
                    {isVideo && (
                      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
                        VIDEO
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">Use</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
          {hasMore && (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 rounded-full pv-spin" style={{ border: '2px solid var(--pv-border)', borderTopColor: 'var(--pv-accent)' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
