import { useState } from 'react'
import type { Template, TemplateField, GenType } from '../../types'
import { GEN_TYPE_LABELS } from '../../types'

interface Props {
  template: Template
  genType: GenType
  onSubmit: (values: Record<string, unknown>) => void
  submitting: boolean
}

function FieldInput({ field, value, onChange }: {
  field: TemplateField
  value: unknown
  onChange: (val: unknown) => void
}) {
  if (field.type === 'textarea') {
    return (
      <div>
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={4}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none"
        />
        {field.hint && <p className="text-xs text-slate-600 mt-1">{field.hint}</p>}
      </div>
    )
  }

  if (field.type === 'select') {
    return (
      <select
        value={(value as string) ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#161b22] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50"
      >
        <option value="">Select…</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    )
  }

  if (field.type === 'multi_select') {
    const selected = (value as string[]) ?? []
    return (
      <div className="flex flex-wrap gap-2">
        {field.options?.map((opt) => {
          const active = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(
                  active ? selected.filter((v) => v !== opt.value) : [...selected, opt.value]
                )
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                active
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (field.type === 'style_picker') {
    const selected = (value as string) ?? ''
    return (
      <div className="grid grid-cols-4 gap-2">
        {field.options?.map((opt) => {
          const active = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-medium transition-all ${
                active
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <span className="text-lg">🎨</span>
              <span className="text-center leading-tight px-1">{opt.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  return null
}

export default function TemplateForm({ template, genType, onSubmit, submitting }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({})

  function set(id: string, val: unknown) {
    setValues((prev) => ({ ...prev, [id]: val }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-full font-medium">
          {GEN_TYPE_LABELS[genType]}
        </span>
        <span className="text-slate-500 text-sm">{template.description}</span>
      </div>

      {template.fields.map((field) => (
        <div key={field.id}>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-300">
              {field.label}
              {field.required && <span className="text-sky-400 ml-1">*</span>}
            </label>
            {field.ai_assist && (
              <button
                type="button"
                className="text-xs text-sky-500 hover:text-sky-400 flex items-center gap-1"
              >
                ✨ AI assist
              </button>
            )}
          </div>
          <FieldInput field={field} value={values[field.id]} onChange={(v) => set(field.id, v)} />
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all"
      >
        {submitting ? 'Generating…' : 'Generate →'}
      </button>
    </form>
  )
}
