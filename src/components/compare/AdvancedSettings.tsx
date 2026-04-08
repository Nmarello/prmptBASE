import { useState } from 'react'
import type { Template, TemplateField } from '../../types'

const COMMON_FIELD_IDS = new Set([
  'aspect_ratio', 'negative_prompt', 'seed', 'output_format', 'num_images',
  // Prompt fields are handled at the top-level shared prompt — skip in advanced
  'prompt', 'subject', 'additional_details',
])

const SKIP_FIELD_TYPES = new Set(['note', 'image_upload', 'video_upload'])

interface AdvancedSettingsProps {
  template: Template
  values: Record<string, unknown>
  onChange: (fieldId: string, value: unknown) => void
}

function SimpleField({ field, value, onChange }: {
  field: TemplateField
  value: unknown
  onChange: (val: unknown) => void
}) {
  if (field.type === 'textarea' || field.type === 'text') {
    return (
      <textarea
        value={(value as string) ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={field.type === 'textarea' ? 3 : 1}
        className="w-full border rounded-xl px-3 py-2.5 text-sm pv-placeholder focus:outline-none resize-none"
        style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
      />
    )
  }

  if (field.type === 'number') {
    return (
      <input
        type="number"
        value={(value as string) ?? ''}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder={field.placeholder}
        className="w-full border rounded-xl px-3 py-2.5 text-sm pv-placeholder focus:outline-none"
        style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
      />
    )
  }

  if (field.type === 'range') {
    const opts = field.options ?? []
    const min = Number(opts.find(o => o.value === 'min')?.label ?? 1)
    const max = Number(opts.find(o => o.value === 'max')?.label ?? 10)
    const step = Number(opts.find(o => o.value === 'step')?.label ?? 0.5)
    const numVal = value != null && value !== '' ? Number(value) : (min + max) / 2
    return (
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min} max={max} step={step}
          value={numVal}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1"
        />
        <span className="text-sm font-semibold w-10 text-right" style={{ color: 'var(--pv-accent)' }}>{numVal}</span>
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <select
        value={(value as string) ?? ''}
        onChange={e => onChange(e.target.value)}
        className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none cursor-pointer"
        style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
      >
        <option value="">Auto</option>
        {(field.options ?? []).map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'pill_select') {
    const opts = field.options ?? []
    const selected = (value as string) ?? ''
    return (
      <div className="flex flex-wrap gap-1.5">
        {opts.map(opt => {
          const active = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(active ? '' : opt.value)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
              style={{
                background: active ? 'rgba(0,80,255,0.1)' : 'var(--pv-surface)',
                borderColor: active ? 'var(--pv-accent)' : 'var(--pv-border)',
                color: active ? 'var(--pv-accent)' : 'var(--pv-text2)',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (field.type === 'multi_select' || field.type === 'style_picker') {
    const opts = field.options ?? []
    const selected = (value as string[]) ?? []
    return (
      <div className="flex flex-wrap gap-1.5">
        {opts.map(opt => {
          const active = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(active ? selected.filter(v => v !== opt.value) : [...selected, opt.value])}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
              style={{
                background: active ? 'rgba(0,80,255,0.1)' : 'var(--pv-surface)',
                borderColor: active ? 'var(--pv-accent)' : 'var(--pv-border)',
                color: active ? 'var(--pv-accent)' : 'var(--pv-text2)',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  return null
}

export default function AdvancedSettings({ template, values, onChange }: AdvancedSettingsProps) {
  const [expanded, setExpanded] = useState(false)

  const advancedFields = template.fields.filter(
    f => !COMMON_FIELD_IDS.has(f.id) && !SKIP_FIELD_TYPES.has(f.type)
  )

  if (advancedFields.length === 0) return null

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--pv-border)' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ background: 'var(--pv-surface2)' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pv-text2)' }}>
          Advanced ({advancedFields.length})
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ color: 'var(--pv-text3)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {expanded && (
        <div className="p-4 space-y-4" style={{ borderTop: '1px solid var(--pv-border)' }}>
          {advancedFields.map(field => (
            <div key={field.id}>
              <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--pv-text3)' }}>
                {field.label}
              </div>
              <SimpleField
                field={field}
                value={values[field.id]}
                onChange={val => onChange(field.id, val)}
              />
              {field.hint && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--pv-text3)' }}>{field.hint}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
