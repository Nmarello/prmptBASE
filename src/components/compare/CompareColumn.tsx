import type { Model, Template } from '../../types'
import { tierCanAccess } from '../../types'
import { downloadFile } from '../../lib/download'
import ProviderLogo from '../dashboard/ProviderLogo'
import AdvancedSettings from './AdvancedSettings'

export interface ColumnState {
  id: string
  model: Model | null
  template: Template | null
  templateLoading: boolean
  advancedValues: Record<string, unknown>
  result: { url: string; assetId?: string; genTimeMs?: number } | null
  error: string | null
  generating: boolean
}

interface CompareColumnProps {
  column: ColumnState
  models: Model[]
  userTier: string
  onModelChange: (slug: string) => void
  onAdvancedChange: (fieldId: string, value: unknown) => void
  onRemove: () => void
  canRemove: boolean
}

// Group models by provider
function groupByProvider(models: Model[]): Map<string, Model[]> {
  const map = new Map<string, Model[]>()
  for (const m of models) {
    const group = map.get(m.provider) ?? []
    group.push(m)
    map.set(m.provider, group)
  }
  return map
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="pv-spin"
        style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid var(--pv-border)',
          borderTopColor: 'var(--pv-accent)',
        }}
      />
      <span style={{ fontSize: 13, color: 'var(--pv-text3)' }}>Generating…</span>
    </div>
  )
}

export default function CompareColumn({
  column, models, userTier,
  onModelChange, onAdvancedChange, onRemove, canRemove,
}: CompareColumnProps) {
  const grouped = groupByProvider(
    models.filter(m => m.supported_gen_types.includes('txt2img') && !m.coming_soon)
  )

  const isRateLimit = column.error?.startsWith('__RATE_LIMITED__')
  const [used, limit] = isRateLimit
    ? column.error!.split(':').slice(1).map(Number)
    : [0, 0]

  async function handleDownload() {
    if (!column.result) return
    const slug = column.model?.slug ?? 'compare'
    await downloadFile(column.result.url, `prmptVAULT-compare-${slug}-${Date.now()}.jpg`)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header row: model picker + remove */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {column.model && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 flex items-center">
              <div
                className="rounded-md flex items-center justify-center flex-shrink-0"
                style={{ width: 22, height: 22, background: `hsl(${column.model.slug.length * 37 % 360}, 60%, 50%)` }}
              >
                <ProviderLogo slug={column.model.slug} size={12} />
              </div>
            </div>
          )}
          <select
            value={column.model?.slug ?? ''}
            onChange={e => onModelChange(e.target.value)}
            className="w-full border rounded-xl text-sm focus:outline-none cursor-pointer appearance-none"
            style={{
              background: 'var(--pv-surface2)',
              borderColor: 'var(--pv-border)',
              color: 'var(--pv-text)',
              paddingTop: 10, paddingBottom: 10,
              paddingLeft: column.model ? 36 : 14,
              paddingRight: 32,
            }}
          >
            <option value="">Select a model…</option>
            {Array.from(grouped.entries()).map(([provider, provModels]) => (
              <optgroup key={provider} label={provider.charAt(0).toUpperCase() + provider.slice(1)}>
                {provModels.map(m => {
                  const accessible = tierCanAccess(userTier, m.min_tier)
                  return (
                    <option key={m.slug} value={m.slug} disabled={!accessible}>
                      {m.name}{!accessible ? ` (${m.min_tier}+)` : ''}
                    </option>
                  )
                })}
              </optgroup>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pv-text3)' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Remove button */}
        <button
          onClick={onRemove}
          disabled={!canRemove}
          title="Remove column"
          className="flex items-center justify-center rounded-xl transition-all cursor-pointer flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ width: 38, height: 38, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text3)' }}
          onMouseEnter={e => { if (canRemove) (e.currentTarget as HTMLButtonElement).style.color = '#ef4444' }}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--pv-text3)'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Result area */}
      <div
        className="relative flex items-center justify-center rounded-2xl overflow-hidden flex-shrink-0"
        style={{
          minHeight: 340,
          background: 'var(--pv-surface2)',
          border: '1px solid var(--pv-border)',
        }}
      >
        {column.generating ? (
          <Spinner />
        ) : column.error ? (
          <div className="flex flex-col items-center gap-2 px-5 text-center">
            {isRateLimit ? (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#f59e0b' }}>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pv-text)' }}>Rate limit reached</div>
                <div style={{ fontSize: 12, color: 'var(--pv-text3)' }}>{used} / {limit} used this period</div>
              </>
            ) : (
              <>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ef4444' }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div style={{ fontSize: 12, color: 'var(--pv-text3)', maxWidth: 220, lineHeight: 1.5 }}>
                  {column.error}
                </div>
              </>
            )}
          </div>
        ) : column.result ? (
          <img
            src={column.result.url}
            alt="Generated result"
            className="w-full h-full object-contain"
            style={{ maxHeight: 480 }}
          />
        ) : column.templateLoading ? (
          <div style={{ fontSize: 13, color: 'var(--pv-text3)' }}>Loading model…</div>
        ) : !column.model ? (
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pv-text3)', opacity: 0.4 }}>
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <span style={{ fontSize: 13, color: 'var(--pv-text3)', opacity: 0.6 }}>Select a model to compare</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <div
              className="rounded-[12px] flex items-center justify-center"
              style={{
                width: 52, height: 52, opacity: 0.5,
                background: `hsl(${column.model.slug.length * 37 % 360}, 60%, 50%)`,
              }}
            >
              <ProviderLogo slug={column.model.slug} size={26} />
            </div>
            <span style={{ fontSize: 13, color: 'var(--pv-text3)' }}>
              Ready — hit Run All to generate
            </span>
          </div>
        )}
      </div>

      {/* Footer: timing + download */}
      {column.result && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pv-text3)' }}>
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span style={{ fontSize: 12, color: 'var(--pv-text3)', fontWeight: 500 }}>
              {column.result.genTimeMs != null ? formatMs(column.result.genTimeMs) : '—'}
            </span>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--pv-accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--pv-border)')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download
          </button>
        </div>
      )}

      {/* Advanced settings */}
      {column.template && (
        <AdvancedSettings
          template={column.template}
          values={column.advancedValues}
          onChange={onAdvancedChange}
        />
      )}
    </div>
  )
}
