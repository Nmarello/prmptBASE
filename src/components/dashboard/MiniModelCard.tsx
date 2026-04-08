import { useEffect, useRef, useState } from 'react'
import type { Model } from '../../types'
import { MODEL_ART } from './ModelCard'

const DEFAULT_ART = { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: '??' }

const slugBrand: Record<string, string> = {
  'dalle': 'OpenAI', 'gpt-image-1': 'OpenAI', 'gpt-image-1.5': 'OpenAI', 'sora2': 'OpenAI',
  'flux-schnell': 'BFL', 'flux-dev': 'BFL', 'flux-pro': 'BFL', 'flux-pro-ultra': 'BFL',
  'flux-kontext-pro': 'BFL', 'flux-kontext-max': 'BFL', 'flux2-pro': 'BFL', 'flux2-max': 'BFL',
  'recraft-v4-pro': 'Recraft', 'recraft-v3': 'Recraft', 'recraft-v4': 'Recraft',
  'nano-banana': 'Google', 'nano-banana-edit': 'Google', 'nano-banana-pro': 'Google',
  'ideogram-v3': 'Ideogram', 'ideogram-v2': 'Ideogram',
  'hidream-fast': 'HiDream', 'hidream-full': 'HiDream',
  'kling': 'Kuaishou', 'kling-txt2vid': 'Kuaishou', 'kling-v3': 'Kuaishou',
  'luma': 'Luma AI', 'luma-txt2vid': 'Luma AI',
  'minimax-txt2vid': 'MiniMax', 'minimax-video': 'MiniMax',
  'runway': 'Runway', 'gen-4.5': 'Runway',
  'ltx-video': 'LightTricks', 'ltx-2.3-pro': 'LightTricks',
  'hunyuan-video': 'Tencent', 'wan-21-txt2vid': 'Alibaba', 'pika': 'Pika',
  'seedance-1-pro': 'ByteDance', 'seedance-1-pro-txt2vid': 'ByteDance',
  'imagen-4-ultra': 'Google', 'imagen-4-fast': 'Google',
}

function thumbUrl(url: string): string {
  if (url.includes('/storage/v1/object/public/')) {
    return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + '?width=240&quality=60&resize=contain'
  }
  return url
}

interface Props {
  model: Model
  onClick: () => void
  latestRenderUrl?: string
  latestRenderIsVideo?: boolean
  rendering?: boolean
  isFavorite?: boolean
  onFavoriteToggle?: (slug: string) => void
}

export default function MiniModelCard({ model, onClick, latestRenderUrl, latestRenderIsVideo, rendering, isFavorite, onFavoriteToggle }: Props) {
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const art = MODEL_ART[model.slug] ?? DEFAULT_ART
  const brand = slugBrand[model.slug] ?? model.provider
  const isVideo = model.supported_gen_types.some(g => ['txt2vid', 'img2vid', 'vid2vid'].includes(g))

  useEffect(() => {
    setMediaLoaded(false)
    if (!latestRenderUrl) return
    if (latestRenderIsVideo) { setMediaLoaded(true); return }
    const img = imgRef.current
    if (img?.complete && img.naturalWidth > 0) setMediaLoaded(true)
  }, [latestRenderUrl, latestRenderIsVideo])

  return (
    <button
      onClick={onClick}
      style={{ width: 156, flexShrink: 0, background: 'var(--pv-surface)' }}
      className="group relative text-left rounded-[14px] border border-[var(--pv-border)] overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-transparent cursor-pointer"
    >
      {/* Art area */}
      <div
        className="relative overflow-hidden"
        style={{ height: 76 }}
        onMouseEnter={e => { const v = e.currentTarget.querySelector('video'); if (v) v.play() }}
        onMouseLeave={e => { const v = e.currentTarget.querySelector('video'); if (v) { v.pause(); v.currentTime = 0 } }}
      >
        <div className="absolute inset-0" style={{ background: art.gradient }} />

        {latestRenderUrl && (
          latestRenderIsVideo ? (
            <video
              src={latestRenderUrl}
              muted loop playsInline preload="metadata"
              onLoadedData={() => setMediaLoaded(true)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <img
              ref={imgRef}
              src={thumbUrl(latestRenderUrl)}
              alt=""
              loading="lazy"
              onLoad={() => setMediaLoaded(true)}
              onError={e => { (e.currentTarget as HTMLImageElement).src = latestRenderUrl!; setMediaLoaded(true) }}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${mediaLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          )
        )}

        {/* Spinner while rendering */}
        {rendering && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="pv-spin" style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
          </div>
        )}

        {/* Video badge */}
        {isVideo && (
          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', backdropFilter: 'blur(4px)' }}>
            <svg width="7" height="7" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            VIDEO
          </div>
        )}

        {/* Favorite star */}
        {onFavoriteToggle && (
          <button
            onClick={e => { e.stopPropagation(); onFavoriteToggle(model.slug) }}
            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill={isFavorite ? '#f59e0b' : 'none'} stroke={isFavorite ? '#f59e0b' : '#fff'} strokeWidth="2.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col px-2.5 py-2" style={{ flex: 1 }}>
        <span className="text-[11px] font-semibold leading-tight truncate" style={{ color: 'var(--pv-text)' }}>
          {model.name}
        </span>
        <span className="text-[9px] mt-0.5 truncate" style={{ color: 'var(--pv-text3)' }}>
          {brand}
        </span>
      </div>
    </button>
  )
}
