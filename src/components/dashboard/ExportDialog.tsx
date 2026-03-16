import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useExport, type ImageFormat, type VideoFormat } from '../../hooks/useExport'
import { useAnalytics } from '../../hooks/useAnalytics'

interface Asset {
  id: string
  url: string
  gen_type: string | null
  width?: number | null
  height?: number | null
}

type SizePreset = 'original' | 'half' | 'quarter' | 'w_512' | 'w_1024' | 'w_1280' | 'w_1920' | 'w_854' | 'custom'
type UpscaleScale = 2 | 4

const IMAGE_FORMATS: { value: ImageFormat; label: string }[] = [
  { value: 'png', label: 'PNG' },
  { value: 'jpg', label: 'JPG' },
  { value: 'webp', label: 'WebP' },
]

const VIDEO_FORMATS: { value: VideoFormat; label: string }[] = [
  { value: 'mp4', label: 'MP4' },
  { value: 'gif', label: 'GIF' },
]

const IMAGE_PRESETS: { value: SizePreset; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'w_1920', label: '1920px' },
  { value: 'w_1280', label: '1280px' },
  { value: 'w_1024', label: '1024px' },
  { value: 'w_512', label: '512px' },
  { value: 'half', label: '50%' },
  { value: 'custom', label: 'Custom' },
]

const VIDEO_PRESETS: { value: SizePreset; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'w_1920', label: '1080p' },
  { value: 'w_1280', label: '720p' },
  { value: 'w_854', label: '480p' },
  { value: 'half', label: '50%' },
]

export default function ExportDialog({ asset, onClose }: { asset: Asset; onClose: () => void }) {
  const { session } = useAuth()
  const analytics = useAnalytics()
  const isVideo = asset.gen_type === 'txt2vid' || asset.gen_type === 'img2vid'
  const { exportAsset, processing, progress, phase } = useExport()

  const [format, setFormat] = useState<ImageFormat | VideoFormat>(isVideo ? 'mp4' : 'png')
  const [sizePreset, setSizePreset] = useState<SizePreset>('original')
  const [customWidth, setCustomWidth] = useState('')
  const [upscale, setUpscale] = useState<UpscaleScale | null>(null)
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(
    asset.width && asset.height ? { w: asset.width, h: asset.height } : null
  )
  const [error, setError] = useState<string | null>(null)

  // Load natural dims if not on asset
  useEffect(() => {
    if (naturalDims) return
    if (isVideo) return
    const img = new Image()
    img.onload = () => setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = asset.url
  }, [asset.url])

  // Upscale doubles/quadruples source before resize
  const outputDims = useMemo(() => {
    if (!naturalDims) return null
    let baseW = naturalDims.w * (upscale ?? 1)
    let baseH = naturalDims.h * (upscale ?? 1)

    if (sizePreset === 'half') {
      return { w: Math.round(baseW * 0.5), h: Math.round(baseH * 0.5) }
    }
    if (sizePreset === 'quarter') {
      return { w: Math.round(baseW * 0.25), h: Math.round(baseH * 0.25) }
    }
    const widthPresets: Record<string, number> = {
      w_512: 512, w_1024: 1024, w_1280: 1280, w_1920: 1920, w_854: 854,
    }
    if (widthPresets[sizePreset]) {
      const tw = widthPresets[sizePreset]
      return { w: tw, h: Math.round(baseH * tw / baseW) }
    }
    if (sizePreset === 'custom') {
      const cw = parseInt(customWidth)
      if (cw > 0) return { w: cw, h: Math.round(baseH * cw / baseW) }
    }
    return { w: Math.round(baseW), h: Math.round(baseH) }
  }, [naturalDims, upscale, sizePreset, customWidth])

  const presets = isVideo ? VIDEO_PRESETS : IMAGE_PRESETS
  const formats = isVideo ? VIDEO_FORMATS : IMAGE_FORMATS

  async function handleExport() {
    setError(null)
    const widthPresets: Record<string, number> = {
      w_512: 512, w_1024: 1024, w_1280: 1280, w_1920: 1920, w_854: 854,
    }
    const targetWidth = widthPresets[sizePreset] ?? (sizePreset === 'custom' ? parseInt(customWidth) || undefined : undefined)
    const scale = sizePreset === 'half' ? 0.5 : sizePreset === 'quarter' ? 0.25 : undefined

    try {
      await exportAsset(
        asset.url,
        asset.id,
        isVideo,
        { format, targetWidth, scale, upscale: upscale ?? undefined },
        session?.access_token ?? null,
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
      )
      analytics.exportUsed({ format: format as string, size: sizePreset, is_video: isVideo })
      if (upscale) analytics.upscaleUsed({ scale: upscale, source: 'lightbox' })
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Export failed')
    }
  }

  const phaseLabel: Record<string, string> = {
    upscaling: 'Upscaling with AI…',
    processing: 'Processing…',
    done: 'Done!',
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--pv-surface)',
          borderColor: 'var(--pv-border)',
          fontFamily: "'DM Sans', sans-serif",
        }}
        className="border rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div
          style={{ borderColor: 'var(--pv-border)' }}
          className="flex items-center justify-between px-5 py-4 border-b"
        >
          <div className="flex items-center gap-2.5">
            <div
              style={{ background: 'var(--pv-surface2)', color: 'var(--pv-accent)' }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <span style={{ color: 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif" }} className="font-bold text-sm">Export</span>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--pv-text3)' }}
            className="hover:opacity-70 transition-opacity text-lg cursor-pointer"
          >✕</button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto">
          {/* Preview */}
          <div
            style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)' }}
            className="rounded-xl border overflow-hidden flex items-center justify-center h-36"
          >
            {isVideo ? (
              <video src={asset.url} className="max-h-full max-w-full" muted />
            ) : (
              <img src={asset.url} className="max-h-full max-w-full object-contain" alt="" />
            )}
          </div>

          {/* Format */}
          <div>
            <div style={{ color: 'var(--pv-text3)' }} className="text-xs font-semibold uppercase tracking-wider mb-2">Format</div>
            <div className="flex gap-2">
              {formats.map(f => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  style={{
                    background: format === f.value ? 'var(--pv-accent)' : 'var(--pv-surface2)',
                    borderColor: format === f.value ? 'var(--pv-accent)' : 'var(--pv-border)',
                    color: format === f.value ? '#fff' : 'var(--pv-text2)',
                  }}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer hover:border-[var(--pv-accent)]"
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div style={{ color: 'var(--pv-text3)' }} className="text-xs font-semibold uppercase tracking-wider">Size</div>
              {outputDims && (
                <div style={{ color: 'var(--pv-text3)' }} className="text-xs tabular-nums">
                  {outputDims.w} × {outputDims.h}px
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {presets.map(p => (
                <button
                  key={p.value}
                  onClick={() => setSizePreset(p.value)}
                  style={{
                    background: sizePreset === p.value ? 'var(--pv-accent)' : 'var(--pv-surface2)',
                    borderColor: sizePreset === p.value ? 'var(--pv-accent)' : 'var(--pv-border)',
                    color: sizePreset === p.value ? '#fff' : 'var(--pv-text2)',
                  }}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer hover:border-[var(--pv-accent)]"
                >
                  {p.label}
                </button>
              ))}
            </div>
            {sizePreset === 'custom' && (
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Width (px)"
                  value={customWidth}
                  onChange={e => setCustomWidth(e.target.value)}
                  min={1}
                  max={8192}
                  style={{
                    background: 'var(--pv-surface2)',
                    borderColor: 'var(--pv-border)',
                    color: 'var(--pv-text)',
                  }}
                  className="w-32 text-xs px-3 py-2 border rounded-lg outline-none focus:border-[var(--pv-accent)] transition-colors"
                />
                <span style={{ color: 'var(--pv-text3)' }} className="text-xs">px · height auto</span>
              </div>
            )}
          </div>

          {/* AI Upscale (images only) */}
          {!isVideo && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <div style={{ color: 'var(--pv-text3)' }} className="text-xs font-semibold uppercase tracking-wider">AI Upscale</div>
                <div
                  style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text3)' }}
                  className="text-[10px] px-1.5 py-0.5 rounded border font-medium"
                >
                  1 credit
                </div>
              </div>
              <div className="flex gap-2">
                {([null, 2, 4] as (UpscaleScale | null)[]).map(s => (
                  <button
                    key={s ?? 'off'}
                    onClick={() => setUpscale(s)}
                    style={{
                      background: upscale === s ? 'var(--pv-accent)' : 'var(--pv-surface2)',
                      borderColor: upscale === s ? 'var(--pv-accent)' : 'var(--pv-border)',
                      color: upscale === s ? '#fff' : 'var(--pv-text2)',
                    }}
                    className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer hover:border-[var(--pv-accent)]"
                  >
                    {s === null ? 'Off' : `${s}×`}
                  </button>
                ))}
              </div>
              {upscale && (
                <div style={{ color: 'var(--pv-text3)' }} className="text-[11px] mt-1.5">
                  Uses Real-ESRGAN · result also saved to your gallery
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ borderColor: 'var(--pv-border)' }} className="px-5 py-4 border-t">
          <button
            onClick={handleExport}
            disabled={processing || (sizePreset === 'custom' && !customWidth)}
            style={{ background: 'var(--pv-accent)', opacity: processing ? 0.8 : 1 }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer disabled:cursor-not-allowed hover:opacity-90 disabled:hover:opacity-80"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                {phaseLabel[phase] ?? 'Processing…'} {progress > 0 && progress < 100 ? `${progress}%` : ''}
              </span>
            ) : 'Export & Download'}
          </button>
        </div>
      </div>
    </div>
  )
}
