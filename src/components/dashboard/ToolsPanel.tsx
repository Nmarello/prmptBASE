import { useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useAnalytics } from '../../hooks/useAnalytics'
import { usePullToRefresh } from '../../hooks/usePullToRefresh'

type UpscaleScale = 2 | 4

const TOOLS = [
  { id: 'upscale', label: 'Upscale', available: true },
  { id: 'inpaint', label: 'Inpaint', available: false },
  { id: 'remove-bg', label: 'Remove BG', available: false },
  { id: 'expand', label: 'Expand', available: false },
]

export default function ToolsPanel({ onGenerate }: { onGenerate: () => void }) {
  const { session } = useAuth()
  const [activeTool, setActiveTool] = useState('upscale')
  const { scrollRef: toolsScrollRef, distance: pullDist, refreshing: pullRefreshing } = usePullToRefresh(() => {})

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 sm:px-7 pt-4 sm:pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1
            style={{ color: 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif" }}
            className="text-xl font-bold flex items-baseline gap-2"
          >
            Tools
            <span style={{ color: 'var(--pv-text3)', fontFamily: "'DM Sans', sans-serif" }} className="text-xs font-medium">beta</span>
          </h1>
          <span style={{ color: 'var(--pv-text3)' }} className="text-xs">
            Image editing &amp; enhancement
          </span>
        </div>

        {/* Tool tabs */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {TOOLS.map(t => (
            <button
              key={t.id}
              onClick={() => t.available && setActiveTool(t.id)}
              disabled={!t.available}
              style={{
                background: activeTool === t.id
                  ? 'var(--pv-accent)'
                  : 'var(--pv-surface2)',
                borderColor: activeTool === t.id
                  ? 'var(--pv-accent)'
                  : 'var(--pv-border)',
                color: activeTool === t.id
                  ? '#fff'
                  : t.available ? 'var(--pv-text2)' : 'var(--pv-text3)',
                fontFamily: "'DM Sans', sans-serif",
              }}
              className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer disabled:cursor-not-allowed hover:border-[var(--pv-accent)] disabled:hover:border-[var(--pv-border)] relative"
            >
              {t.label}
              {!t.available && (
                <span
                  style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text3)' }}
                  className="absolute -top-2 -right-1 text-[9px] px-1 py-0 rounded border leading-4"
                >
                  soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ background: 'var(--pv-border)' }} className="h-px mx-4 sm:mx-7 flex-shrink-0" />

      {/* Tool content */}
      <div ref={toolsScrollRef} className="flex-1 overflow-y-auto px-4 sm:px-7 py-6">
        {(pullDist > 0 || pullRefreshing) && (
          <div style={{ height: pullRefreshing ? 48 : pullDist, transition: (!pullRefreshing && pullDist === 0) ? 'height 0.25s ease' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <div className={pullRefreshing ? 'pv-spin' : ''} style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid var(--pv-border)', borderTopColor: pullRefreshing ? 'transparent' : 'var(--pv-accent)', opacity: pullRefreshing ? 1 : Math.min(pullDist / 72, 1), transform: pullRefreshing ? undefined : `rotate(${pullDist * 3}deg)` }} />
          </div>
        )}
        {activeTool === 'upscale' && (
          <UpscaleTool
            userToken={session?.access_token ?? null}
            supabaseUrl={import.meta.env.VITE_SUPABASE_URL}
            anonKey={import.meta.env.VITE_SUPABASE_ANON_KEY}
            onDone={onGenerate}
          />
        )}
      </div>
    </div>
  )
}

function UpscaleTool({
  userToken,
  supabaseUrl,
  anonKey,
  onDone,
}: {
  userToken: string | null
  supabaseUrl: string
  anonKey: string
  onDone: () => void
}) {
  const analytics = useAnalytics()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [scale, setScale] = useState<UpscaleScale>(2)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(f: File) {
    if (!f.type.startsWith('image/')) return
    setFile(f)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleUpscale() {
    if (!file || !userToken) return
    setProcessing(true)
    setError(null)
    setResult(null)

    try {
      // Upload file directly to storage from browser — avoids base64 in edge fn body
      const { data: { user } } = await supabase.auth.getUser()
      const ext = file.name.split('.').pop() ?? 'jpg'
      const uploadPath = `uploads/${user?.id ?? 'anon'}/upscale_src_${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('assets').upload(uploadPath, file, { contentType: file.type, upsert: false })
      if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`)
      const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(uploadPath)

      const res = await fetch(`${supabaseUrl}/functions/v1/upscale-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${anonKey}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({ image_url: publicUrl, scale, user_token: userToken }),
      }).catch(err => { throw new Error(`Network error: ${err.message}`) })

      const text = await res.text()
      let data: Record<string, unknown>
      try { data = JSON.parse(text) } catch { throw new Error(`Bad response (${res.status}): ${text.slice(0, 200)}`) }
      if (!res.ok || data.error) throw new Error(String(data.error ?? `HTTP ${res.status}`))
      analytics.upscaleUsed({ scale, source: 'tools' })
      setResult(data.upscaled_url as string)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upscale failed')
    } finally {
      setProcessing(false)
    }
  }

  function handleDownload() {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `upscaled-${scale}x-${file?.name ?? 'image.png'}`
    a.click()
  }

  function reset() {
    setPreview(null)
    setFile(null)
    setResult(null)
    setError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="max-w-xl" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="mb-5">
        <h2 style={{ color: 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif" }} className="text-base font-bold mb-1">
          AI Upscale
        </h2>
        <p style={{ color: 'var(--pv-text3)' }} className="text-xs leading-relaxed">
          Enhance any image with Real-ESRGAN. Upload a photo and select a scale — the result is saved to your gallery. Costs 1 credit.
        </p>
      </div>

      {/* Upload zone */}
      {!preview && (
        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileRef.current?.click()}
          style={{
            borderColor: dragging ? 'var(--pv-accent)' : 'var(--pv-border)',
            background: dragging ? 'color-mix(in srgb, var(--pv-accent) 6%, var(--pv-surface2))' : 'var(--pv-surface2)',
          }}
          className="border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:border-[var(--pv-accent)] hover:bg-[color-mix(in_srgb,var(--pv-accent)_4%,var(--pv-surface2))]"
        >
          <div
            style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text3)' }}
            className="w-12 h-12 rounded-xl border flex items-center justify-center"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <div className="text-center">
            <div style={{ color: 'var(--pv-text2)' }} className="text-sm font-medium">Drop an image or click to upload</div>
            <div style={{ color: 'var(--pv-text3)' }} className="text-xs mt-0.5">PNG, JPG, WebP</div>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {/* Preview + options */}
      {preview && !result && (
        <div className="flex flex-col gap-4">
          <div
            style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)' }}
            className="rounded-2xl border overflow-hidden relative"
          >
            <img src={preview} alt="preview" className="w-full max-h-72 object-contain" />
            <button
              onClick={reset}
              style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}
              className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center text-sm hover:opacity-80 transition-opacity cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Scale */}
          <div>
            <div style={{ color: 'var(--pv-text3)' }} className="text-xs font-semibold uppercase tracking-wider mb-2">Scale</div>
            <div className="flex gap-2">
              {([2, 4] as UpscaleScale[]).map(s => (
                <button
                  key={s}
                  onClick={() => setScale(s)}
                  style={{
                    background: scale === s ? 'var(--pv-accent)' : 'var(--pv-surface2)',
                    borderColor: scale === s ? 'var(--pv-accent)' : 'var(--pv-border)',
                    color: scale === s ? '#fff' : 'var(--pv-text2)',
                  }}
                  className="px-5 py-2 rounded-xl border text-sm font-semibold transition-all cursor-pointer hover:border-[var(--pv-accent)]"
                >
                  {s}×
                </button>
              ))}
              <div style={{ color: 'var(--pv-text3)' }} className="flex items-center text-xs ml-1">
                1 credit
              </div>
            </div>
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          <button
            onClick={handleUpscale}
            disabled={processing || !userToken}
            style={{ background: 'var(--pv-accent)' }}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Upscaling…
              </span>
            ) : !userToken ? 'Sign in to upscale' : `Upscale ${scale}×`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-4">
          <div style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)' }} className="rounded-2xl border overflow-hidden">
            <img src={result} alt="upscaled" className="w-full max-h-80 object-contain" />
          </div>
          <div
            style={{ background: 'color-mix(in srgb, #50c878 8%, transparent)', borderColor: 'rgba(80,200,120,0.25)', color: '#50c878' }}
            className="text-xs px-3 py-2 rounded-lg border flex items-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Saved to your gallery · {scale}× upscale complete
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              style={{ background: 'var(--pv-accent)' }}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition-opacity"
            >
              Download
            </button>
            <button
              onClick={() => { reset(); onDone() }}
              style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
              className="px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer hover:border-[var(--pv-accent)] transition-colors"
            >
              View in Gallery
            </button>
            <button
              onClick={reset}
              style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
              className="px-4 py-2.5 rounded-xl border text-sm font-medium cursor-pointer hover:border-[var(--pv-accent)] transition-colors"
            >
              Upscale another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
