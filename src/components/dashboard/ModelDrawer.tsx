import { useEffect, useRef } from 'react'
import type { Asset, Model } from '../../types'
import ProviderLogo from './ProviderLogo'

interface Props {
  model: Model
  assets: Asset[]          // already filtered to this model
  modelArt: { gradient: string; initial: string }
  brandName: string
  onClose: () => void
  onGenerate: () => void
  onViewAsset: (asset: Asset) => void
  onDeleteAsset: (id: string) => void
  onSendToImg2Img: (url: string) => void
  onSendToImg2Vid: (url: string) => void
}

export default function ModelDrawer({
  model, assets, modelArt, brandName,
  onClose, onGenerate, onViewAsset, onDeleteAsset, onSendToImg2Img, onSendToImg2Vid,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while drawer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isVideo = (asset: Asset) => asset.gen_type === 'txt2vid' || asset.gen_type === 'img2vid'
  const genTypeLabel = model.supported_gen_types.join(' · ')

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(8,7,6,0.6)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 'min(520px, 100vw)',
          background: 'var(--pv-surface)',
          borderLeft: '1px solid var(--pv-border)',
          boxShadow: '-24px 0 80px rgba(0,0,0,0.45)',
          animation: 'drawerIn 0.22s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <style>{`
          @keyframes drawerIn {
            from { transform: translateX(100%) }
            to   { transform: translateX(0) }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--pv-border)' }}>
          {/* Model icon */}
          <div className="rounded-[10px] flex-shrink-0 flex items-center justify-center"
            style={{ width: 40, height: 40, background: modelArt.gradient }}>
            <ProviderLogo slug={model.slug} size={22} />
          </div>

          {/* Name + type */}
          <div className="flex-1 min-w-0">
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 17, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              {model.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--pv-text3)', marginTop: 2 }}>
              {brandName} · {genTypeLabel}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={onGenerate}
            data-tour="model-drawer-generate"
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] text-sm font-semibold transition-all cursor-pointer flex-shrink-0"
            style={{ background: 'var(--pv-accent)', color: '#fff' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Generate
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-[8px] transition-all cursor-pointer flex-shrink-0"
            style={{ width: 32, height: 32, background: 'var(--pv-surface2)', color: 'var(--pv-text3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--pv-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--pv-text3)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Asset count subheader */}
        <div className="px-5 py-2.5 flex-shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid var(--pv-border)', background: 'var(--pv-bg)' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pv-text3)' }}>
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <span style={{ fontSize: 12, color: 'var(--pv-text3)', fontWeight: 500 }}>
            {assets.length === 0 ? 'No outputs yet' : `${assets.length} output${assets.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {/* Body */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {assets.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center" style={{ minHeight: 300 }}>
              <div className="rounded-[16px] flex items-center justify-center"
                style={{ width: 64, height: 64, background: modelArt.gradient, opacity: 0.7 }}>
                <ProviderLogo slug={model.slug} size={32} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pv-text)', marginBottom: 6 }}>
                  No outputs yet
                </div>
                <div style={{ fontSize: 13, color: 'var(--pv-text3)', lineHeight: 1.6, maxWidth: 240 }}>
                  Hit Generate to create your first image or video with {model.name}.
                </div>
              </div>
              <button
                onClick={onGenerate}
                className="px-5 py-2.5 rounded-[10px] text-sm font-semibold transition-all cursor-pointer"
                style={{ background: 'var(--pv-accent)', color: '#fff' }}
              >
                Generate now →
              </button>
            </div>
          ) : (
            /* Thumbnail grid */
            <div className="p-4 grid gap-2" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {assets.map(asset => (
                <AssetThumb
                  key={asset.id}
                  asset={asset}
                  isVideo={isVideo(asset)}
                  onView={() => onViewAsset(asset)}
                  onDelete={() => onDeleteAsset(asset.id)}
                  onSendToImg2Img={() => onSendToImg2Img(asset.url)}
                  onSendToImg2Vid={() => onSendToImg2Vid(asset.url)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function AssetThumb({ asset, isVideo, onView, onDelete, onSendToImg2Img, onSendToImg2Vid }: {
  asset: Asset
  isVideo: boolean
  onView: () => void
  onDelete: () => void
  onSendToImg2Img: () => void
  onSendToImg2Vid: () => void
}) {
  return (
    <div
      className="relative rounded-[10px] overflow-hidden cursor-pointer group"
      style={{ aspectRatio: '1', background: 'var(--pv-surface2)' }}
      onClick={onView}
    >
      {isVideo ? (
        <video
          src={asset.url}
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
          onMouseEnter={e => (e.currentTarget as HTMLVideoElement).play()}
          onMouseLeave={e => { const v = e.currentTarget as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
        />
      ) : (
        <img src={asset.url} alt="" className="w-full h-full object-cover" loading="lazy" />
      )}

      {/* Video badge */}
      {isVideo && (
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-md"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'white' }}>
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex flex-col justify-end p-1.5 gap-1"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex gap-1">
          {!isVideo && (
            <button
              onClick={onSendToImg2Img}
              className="flex-1 py-1 rounded-[6px] text-white text-[9px] font-semibold cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}
            >
              img2img
            </button>
          )}
          {isVideo && (
            <button
              onClick={onSendToImg2Vid}
              className="flex-1 py-1 rounded-[6px] text-white text-[9px] font-semibold cursor-pointer transition-all"
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}
            >
              img2vid
            </button>
          )}
          <button
            onClick={onDelete}
            className="py-1 px-2 rounded-[6px] text-white text-[9px] font-semibold cursor-pointer transition-all hover:bg-red-500/60"
            style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(4px)' }}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
