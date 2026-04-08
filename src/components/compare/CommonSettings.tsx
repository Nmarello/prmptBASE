import { useState } from 'react'
import { supabase } from '../../lib/supabase'

const RATIO_SHAPES: Record<string, { w: number; h: number }> = {
  '1:1':  { w: 28, h: 28 },
  '16:9': { w: 36, h: 20 },
  '9:16': { w: 20, h: 36 },
  '4:3':  { w: 32, h: 24 },
  '3:4':  { w: 24, h: 32 },
  '3:2':  { w: 33, h: 22 },
  '2:3':  { w: 22, h: 33 },
  '21:9': { w: 40, h: 17 },
}

const ASPECT_RATIOS = Object.keys(RATIO_SHAPES)
const OUTPUT_FORMATS = ['jpeg', 'png', 'webp']

interface CommonSettingsProps {
  values: Record<string, unknown>
  onChange: (field: string, value: unknown) => void
  seedLocked: boolean
  onToggleSeedLock: () => void
  sharedPrompt: string
  activeModelNames: string[]
}

function FieldLabel({ label }: { label: string }) {
  return (
    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--pv-text2)' }}>
      {label}
    </div>
  )
}

export default function CommonSettings({
  values, onChange, seedLocked, onToggleSeedLock, sharedPrompt, activeModelNames,
}: CommonSettingsProps) {
  const [expanded, setExpanded] = useState(true)
  const [negAiAssisting, setNegAiAssisting] = useState(false)
  const [negAiSuggestion, setNegAiSuggestion] = useState<string | null>(null)

  const aspectRatio = (values.aspect_ratio as string) ?? ''
  const negativePrompt = (values.negative_prompt as string) ?? ''
  const seed = (values.seed as string) ?? ''
  const outputFormat = (values.output_format as string) ?? 'jpeg'
  const numImages = (values.num_images as number) ?? 1

  async function handleNegAiAssist() {
    if (negAiAssisting || !sharedPrompt.trim()) return
    setNegAiAssisting(true)
    setNegAiSuggestion(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const modelContext = activeModelNames.length > 0
        ? `Models being compared: ${activeModelNames.join(', ')}.`
        : ''
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assist`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            user_token: session?.access_token ?? null,
            field_id: 'negative_prompt',
            field_label: 'Negative Prompt',
            current_value: negativePrompt,
            form_values: {
              prompt: sharedPrompt,
              additional_context: modelContext,
            },
            is_negative_prompt: true,
            gen_type: 'txt2img',
          }),
        }
      )
      const data = await res.json()
      if (data.suggestion) setNegAiSuggestion(data.suggestion)
    } catch {
      // silently fail
    } finally {
      setNegAiAssisting(false)
    }
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: '1px solid var(--pv-border)', background: 'var(--pv-surface)' }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-4 cursor-pointer transition-all"
        style={{ background: 'var(--pv-surface2)', borderBottom: expanded ? '1px solid var(--pv-border)' : 'none' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <div className="flex items-center gap-2">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pv-text3)' }}>
            <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--pv-text)', letterSpacing: '-0.01em' }}>
            Common Settings
          </span>
          <span style={{ fontSize: 11, color: 'var(--pv-text3)' }}>shared across all models</span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--pv-text3)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <div className="p-5 flex flex-col gap-5">

          {/* Row 1: Aspect Ratio + Negative Prompt side by side */}
          <div className="grid gap-5" style={{ gridTemplateColumns: 'auto 1fr' }}>

          <div>
            <FieldLabel label="Aspect Ratio" />
            <div className="flex flex-wrap gap-2">
              {ASPECT_RATIOS.map(ratio => {
                const active = aspectRatio === ratio
                const shape = RATIO_SHAPES[ratio]!
                return (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => onChange('aspect_ratio', active ? '' : ratio)}
                    className="flex flex-col items-center gap-1.5 cursor-pointer"
                  >
                    <div
                      className={`rounded-[4px] transition-all ${active ? 'border-2' : 'border'}`}
                      style={{
                        width: shape.w + 6, height: shape.h + 6,
                        borderColor: active ? 'var(--pv-accent)' : 'var(--pv-border)',
                        background: active ? 'rgba(0,80,255,0.08)' : 'var(--pv-surface2)',
                      }}
                    />
                    <span className="text-[10px] font-medium" style={{ color: active ? 'var(--pv-accent)' : 'var(--pv-text3)' }}>
                      {ratio}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Negative Prompt */}
          <div>
            <FieldLabel label="Negative Prompt" />
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--pv-border)' }}
            >
              <textarea
                value={negativePrompt}
                onChange={e => onChange('negative_prompt', e.target.value)}
                placeholder="Things to exclude from the output…"
                rows={2}
                className="w-full border-0 px-4 py-3 text-sm pv-placeholder focus:outline-none resize-none"
                style={{ background: 'var(--pv-surface2)', color: 'var(--pv-text)' }}
              />
              {/* AI Assist bar */}
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{ borderTop: '1px solid var(--pv-border)', background: 'var(--pv-surface)' }}
              >
                <button
                  type="button"
                  onClick={handleNegAiAssist}
                  disabled={negAiAssisting || !sharedPrompt.trim()}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)' }}
                >
                  {negAiAssisting ? (
                    <>
                      <div className="pv-spin" style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid var(--pv-border)', borderTopColor: 'var(--pv-accent)' }} />
                      Thinking…
                    </>
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pv-accent)' }}>
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                      </svg>
                      AI Suggest
                    </>
                  )}
                </button>
                {!sharedPrompt.trim() && (
                  <span style={{ fontSize: 11, color: 'var(--pv-text3)' }}>Enter a prompt first</span>
                )}
              </div>
            </div>

            {/* AI suggestion banner */}
            {negAiSuggestion && (
              <div
                className="mt-2 p-3 rounded-xl"
                style={{ background: 'rgba(0,80,255,0.06)', border: '1px solid rgba(0,80,255,0.2)' }}
              >
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--pv-accent)' }}>Suggested negatives</div>
                <p className="text-xs mb-2" style={{ color: 'var(--pv-text)', lineHeight: 1.6 }}>{negAiSuggestion}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { onChange('negative_prompt', negAiSuggestion); setNegAiSuggestion(null) }}
                    className="px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{ background: 'var(--pv-accent)', color: '#fff' }}
                  >
                    Use this
                  </button>
                  <button
                    onClick={() => setNegAiSuggestion(null)}
                    className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer"
                    style={{ background: 'var(--pv-surface2)', color: 'var(--pv-text3)' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          </div>{/* end side-by-side grid */}

          {/* Row 2: Seed | Output Format | Images per model — explicit 3-col grid */}
          <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>

            {/* Seed */}
            <div>
              <FieldLabel label="Seed" />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={seed}
                  onChange={e => onChange('seed', e.target.value)}
                  placeholder="Random"
                  className="min-w-0 flex-1 border rounded-xl px-3 py-2.5 text-sm pv-placeholder focus:outline-none"
                  style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
                />
                <button
                  type="button"
                  onClick={onToggleSeedLock}
                  title={seedLocked ? 'Seed synced across all models' : 'Seed not synced'}
                  className="flex items-center justify-center rounded-xl transition-all cursor-pointer flex-shrink-0"
                  style={{
                    width: 38, height: 38,
                    background: seedLocked ? 'rgba(0,80,255,0.1)' : 'var(--pv-surface2)',
                    border: `1px solid ${seedLocked ? 'var(--pv-accent)' : 'var(--pv-border)'}`,
                    color: seedLocked ? 'var(--pv-accent)' : 'var(--pv-text3)',
                  }}
                >
                  {seedLocked ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-[11px] mt-1.5" style={{ color: 'var(--pv-text3)' }}>
                {seedLocked ? 'Same seed for all models' : 'Independent per model'}
              </p>
            </div>

            {/* Output Format */}
            <div>
              <FieldLabel label="Output Format" />
              <div className="flex gap-2">
                {OUTPUT_FORMATS.map(fmt => {
                  const active = outputFormat === fmt
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => onChange('output_format', fmt)}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
                      style={{
                        background: active ? 'var(--pv-accent)' : 'var(--pv-surface2)',
                        borderColor: active ? 'var(--pv-accent)' : 'var(--pv-border)',
                        color: active ? '#fff' : 'var(--pv-text2)',
                      }}
                    >
                      {fmt.toUpperCase()}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Num Images */}
            <div>
              <FieldLabel label={`Images per model: ${numImages}`} />
              <input
                type="range"
                min={1}
                max={4}
                step={1}
                value={numImages}
                onChange={e => onChange('num_images', Number(e.target.value))}
                className="w-full mt-1"
              />
              <div className="flex justify-between mt-1">
                {[1, 2, 3, 4].map(n => (
                  <span key={n} className="text-[10px]" style={{ color: n === numImages ? 'var(--pv-accent)' : 'var(--pv-text3)' }}>{n}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
