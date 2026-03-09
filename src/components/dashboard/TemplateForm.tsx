import { useEffect, useRef, useState } from 'react'
import type { Model, Template, TemplateField, GenType, FieldOption } from '../../types'
import { GEN_TYPE_LABELS, tierCanAccess } from '../../types'
import { supabase } from '../../lib/supabase'

interface CustomOption {
  id: string
  field_id: string
  label: string
  prompt_text: string
}

interface Props {
  template: Template
  genType: GenType
  model: Model
  onSubmit: (values: Record<string, unknown>) => void
  submitting: boolean
  initialValues?: Record<string, unknown>
  onByokKeyChange?: (key: string | null) => void
  userTier?: string
  modelMinTier?: string
}

const CUSTOM_SUPPORTED = ['select', 'multi_select', 'style_picker']
const CUSTOM_EXCLUDED_FIELDS = ['size', 'quality']

// Inline form for adding a custom option
function AddCustomForm({ fieldId, onSave, onCancel }: {
  fieldId: string
  onSave: (opt: CustomOption) => void
  onCancel: () => void
}) {
  const [label, setLabel] = useState('')
  const [promptText, setPromptText] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!label.trim() || !promptText.trim()) return
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { data, error } = await supabase
      .from('user_custom_options')
      .insert({ user_id: user.id, field_id: fieldId, label: label.trim(), prompt_text: promptText.trim() })
      .select()
      .single()
    setSaving(false)
    if (!error && data) onSave(data as CustomOption)
  }

  return (
    <div className="mt-3 p-3 bg-white/3 border border-white/10 rounded-xl space-y-2">
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Name (e.g. Cyberpunk Neon)"
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
      />
      <textarea
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="Describe it for the AI (e.g. cyberpunk neon aesthetic with rain-slicked streets and holographic signs)"
        rows={2}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none"
      />
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs text-slate-500 hover:text-white transition-colors">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !label.trim() || !promptText.trim()}
          className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 rounded-lg text-xs font-medium transition-all"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

function FieldInput({ field, value, onChange, customOptions }: {
  field: TemplateField
  value: unknown
  onChange: (val: unknown) => void
  customOptions: FieldOption[]
}) {
  const allOptions = [...(field.options ?? []), ...customOptions]

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
        <option value="">Auto</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
        {customOptions.length > 0 && (
          <>
            <option disabled>── My custom ──</option>
            {customOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>★ {opt.label}</option>
            ))}
          </>
        )}
      </select>
    )
  }

  if (field.type === 'multi_select') {
    const selected = (value as string[]) ?? []
    return (
      <div className="flex flex-wrap gap-2">
        {allOptions.map((opt) => {
          const active = selected.includes(opt.value)
          const isCustom = customOptions.some((c) => c.value === opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(active ? selected.filter((v) => v !== opt.value) : [...selected, opt.value])}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                active
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                  : isCustom
                  ? 'bg-white/5 border-white/20 text-slate-300 hover:border-sky-500/30'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              {isCustom && <span className="mr-1 text-sky-500">★</span>}{opt.label}
            </button>
          )
        })}
      </div>
    )
  }

  if (field.type === 'style_picker') {
    const selected = (value as string) ?? ''
    return (
      <div className="grid grid-cols-8 gap-1.5">
        {allOptions.map((opt) => {
          const active = selected === opt.value
          const isCustom = customOptions.some((c) => c.value === opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-all ${
                active
                  ? 'bg-sky-500/20 border-sky-500/50 text-sky-300'
                  : isCustom
                  ? 'bg-white/5 border-white/20 text-slate-300 hover:border-sky-500/30'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <span className="text-sm">{isCustom ? '★' : '🎨'}</span>
              <span className="text-center leading-tight px-0.5">{opt.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (field.type === 'image_upload') {
    const preview = value as string | undefined
    return (
      <div>
        <label className="block cursor-pointer">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => onChange(reader.result as string)
              reader.readAsDataURL(file)
            }}
          />
          {preview ? (
            <div className="relative group">
              <img src={preview} alt="Source" className="rounded-xl w-full max-h-64 object-cover border border-white/10" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                <span className="text-sm text-white font-medium">Click to change</span>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-white/15 hover:border-sky-500/50 rounded-xl p-10 text-center transition-all">
              <div className="text-3xl mb-2">🖼️</div>
              <p className="text-slate-400 text-sm font-medium">Click to upload image</p>
              <p className="text-slate-600 text-xs mt-1">PNG, JPG, WEBP — max 20MB</p>
            </div>
          )}
        </label>
        {field.hint && <p className="text-xs text-slate-600 mt-1">{field.hint}</p>}
      </div>
    )
  }

  return null
}

export default function TemplateForm({ template, genType, model, onSubmit, submitting, initialValues, onByokKeyChange, userTier, modelMinTier }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(initialValues ?? {})
  const [customOptions, setCustomOptions] = useState<Record<string, FieldOption[]>>({})
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [assisting, setAssisting] = useState<string | null>(null)
  const [byokKey, setByokKey] = useState<string>('')
  const [byokOpen, setByokOpen] = useState(false)
  const [byokSaving, setByokSaving] = useState(false)
  const byokTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function handleAiAssist(fieldId: string) {
    setAssisting(fieldId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
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
            field_id: fieldId,
            field_label: template.fields.find((f) => f.id === fieldId)?.label ?? fieldId,
            current_value: values[fieldId] ?? '',
            form_values: values,
          }),
        }
      )
      const data = await res.json()
      if (data.suggestion) set(fieldId, data.suggestion)
    } finally {
      setAssisting(null)
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('user_custom_options')
        .select('*')
        .eq('user_id', user.id)
        .then(({ data }) => {
          if (!data) return
          const grouped: Record<string, FieldOption[]> = {}
          for (const row of data as CustomOption[]) {
            if (!grouped[row.field_id]) grouped[row.field_id] = []
            grouped[row.field_id].push({ label: row.label, value: row.prompt_text })
          }
          setCustomOptions(grouped)
        })
    })
  }, [])

  // Load BYOK key from profile on mount (fal.ai only)
  useEffect(() => {
    if (model.provider !== 'fal.ai') return
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('profiles').select('api_keys').eq('id', user.id).single()
        .then(({ data }) => {
          const key = (data?.api_keys as Record<string, string> | null)?.fal ?? ''
          setByokKey(key)
          onByokKeyChange?.(key || null)
        })
    })
  }, [model.provider])

  async function saveByokKey(key: string) {
    setByokSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('profiles').update({ api_keys: { fal: key } }).eq('id', user.id)
    }
    setByokSaving(false)
  }

  function handleByokChange(key: string) {
    setByokKey(key)
    onByokKeyChange?.(key || null)
    if (byokTimer.current) clearTimeout(byokTimer.current)
    byokTimer.current = setTimeout(() => saveByokKey(key), 800)
  }

  function clearByokKey() {
    setByokKey('')
    onByokKeyChange?.(null)
    saveByokKey('')
  }

  function set(id: string, val: unknown) {
    setValues((prev) => ({ ...prev, [id]: val }))
  }

  function handleCustomSaved(fieldId: string, opt: CustomOption) {
    setCustomOptions((prev) => ({
      ...prev,
      [fieldId]: [...(prev[fieldId] ?? []), { label: opt.label, value: opt.prompt_text }],
    }))
    setAddingTo(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(values)
  }

  function renderField(field: TemplateField) {
    const fieldCustomOpts = customOptions[field.id] ?? []
    const showAddButton = CUSTOM_SUPPORTED.includes(field.type) && !CUSTOM_EXCLUDED_FIELDS.includes(field.id)
    return (
      <div key={field.id}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">
            {field.label}
            {field.required && <span className="text-sky-400 ml-1">*</span>}
          </label>
          <div className="flex items-center gap-3">
            {field.ai_assist && (
              <button
                type="button"
                onClick={() => handleAiAssist(field.id)}
                disabled={assisting === field.id}
                className="text-xs text-sky-500 hover:text-sky-400 disabled:opacity-50 flex items-center gap-1 transition-colors"
              >
                {assisting === field.id ? '⏳ Thinking…' : '✨ AI assist'}
              </button>
            )}
            {showAddButton && (
              <button
                type="button"
                onClick={() => setAddingTo(addingTo === field.id ? null : field.id)}
                className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                + Add your own
              </button>
            )}
          </div>
        </div>
        <FieldInput
          field={field}
          value={values[field.id]}
          onChange={(v) => set(field.id, v)}
          customOptions={fieldCustomOpts}
        />
        {addingTo === field.id && (
          <AddCustomForm
            fieldId={field.id}
            onSave={(opt) => handleCustomSaved(field.id, opt)}
            onCancel={() => setAddingTo(null)}
          />
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-full font-medium">
          {GEN_TYPE_LABELS[genType]}
        </span>
        <span className="text-slate-500 text-sm">{template.description}</span>
      </div>

      {(() => {
        const fields = template.fields
        const rendered: React.ReactNode[] = []
        let i = 0
        while (i < fields.length) {
          const field = fields[i]
          const next = fields[i + 1]
          if (field.type === 'select' && next?.type === 'select') {
            rendered.push(
              <div key={`${field.id}-${next.id}`} className="grid grid-cols-2 gap-4">
                {[field, next].map((f) => (
                  <div key={f.id}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-300">
                        {f.label}{f.required && <span className="text-sky-400 ml-1">*</span>}
                      </label>
                      {!CUSTOM_EXCLUDED_FIELDS.includes(f.id) && (
                        <button
                          type="button"
                          onClick={() => setAddingTo(addingTo === f.id ? null : f.id)}
                          className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                          + Add
                        </button>
                      )}
                    </div>
                    <FieldInput field={f} value={values[f.id]} onChange={(v) => set(f.id, v)} customOptions={customOptions[f.id] ?? []} />
                    {addingTo === f.id && (
                      <AddCustomForm
                        fieldId={f.id}
                        onSave={(opt) => handleCustomSaved(f.id, opt)}
                        onCancel={() => setAddingTo(null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )
            i += 2
          } else {
            rendered.push(renderField(field))
            i += 1
          }
        }
        return rendered
      })()}

      {model.provider === 'fal.ai' && (
        <div className="border border-white/8 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setByokOpen((o) => !o)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm text-slate-400 hover:text-white hover:bg-white/3 transition-all"
          >
            <span className="flex items-center gap-2">
              <span>⚡</span>
              <span>Use your own fal.ai key</span>
              {byokKey && <span className="text-xs text-emerald-400 font-medium">Your key active ✓</span>}
            </span>
            <span className="text-xs text-slate-600">{byokOpen ? '▲' : '▼'}</span>
          </button>
          {byokOpen && (
            <div className="px-4 pb-4 space-y-2 bg-white/2">
              <p className="text-xs text-slate-600">Your key is stored in your profile. Generations use your key at cost — no platform credits consumed.</p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={byokKey}
                  onChange={(e) => handleByokChange(e.target.value)}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-sky-500/50 font-mono"
                />
                {byokKey && (
                  <button
                    type="button"
                    onClick={clearByokKey}
                    className="px-3 py-2 text-xs text-slate-500 hover:text-red-400 border border-white/10 rounded-lg transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              {byokSaving && <p className="text-xs text-slate-600">Saving…</p>}
            </div>
          )}
        </div>
      )}

      {(() => {
        const canGenerate = !userTier || !modelMinTier || tierCanAccess(userTier, modelMinTier)
        if (canGenerate) {
          return (
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-sm transition-all"
            >
              {submitting ? 'Generating…' : 'Generate →'}
            </button>
          )
        }
        return (
          <div className="space-y-2">
            <a
              href="/pricing"
              className="block w-full py-3.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl font-semibold text-sm text-center transition-all"
            >
              Upgrade to {modelMinTier} to generate →
            </a>
            <p className="text-center text-xs text-slate-600">You can still explore and fill out the template</p>
          </div>
        )
      })()}
    </form>
  )
}
