import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Model, Template } from '../types'
import { invokeGenerate } from '../lib/generateRequest'
import { friendlyFalError } from '../lib/errorMessages'
import { downloadFile } from '../lib/download'
import Logo from '../components/Logo'
import CompareColumn from '../components/compare/CompareColumn'
import type { ColumnState } from '../components/compare/CompareColumn'
import GhostColumn from '../components/compare/GhostColumn'
import CommonSettings from '../components/compare/CommonSettings'

const MAX_COLUMNS = 4
const MIN_COLUMNS = 2
const LINEUP_KEY = 'pv_compare_lineups'

interface SavedLineup {
  name: string
  slugs: (string | null)[]
  savedAt: number
}

function makeColumn(): ColumnState {
  return {
    id: crypto.randomUUID(),
    model: null,
    template: null,
    templateLoading: false,
    advancedValues: {},
    result: null,
    error: null,
    generating: false,
    polling: null,
  }
}

function loadLineups(): SavedLineup[] {
  try {
    return JSON.parse(localStorage.getItem(LINEUP_KEY) ?? '[]')
  } catch {
    return []
  }
}

export default function Compare() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [models, setModels] = useState<Model[]>([])
  const [userTier, setUserTier] = useState('newbie')
  const [columns, setColumns] = useState<ColumnState[]>([makeColumn(), makeColumn()])
  // Ref holds the pending initial state from Model Advisor navigation — consumed once models load
  const pendingInitRef = useRef<{ models: string[]; prompt?: string } | null>(
    (location.state as { models?: string[]; prompt?: string } | null)?.models?.length
      ? (location.state as { models: string[]; prompt?: string })
      : null
  )
  const [sharedPrompt, setSharedPrompt] = useState('')
  const [commonValues, setCommonValues] = useState<Record<string, unknown>>({
    output_format: 'jpeg',
    num_images: 1,
  })
  const [seedLocked, setSeedLocked] = useState(true)
  const [aiAssisting, setAiAssisting] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [savedLineups, setSavedLineups] = useState<SavedLineup[]>(loadLineups)
  const [lineupName, setLineupName] = useState('')
  const [anyGenerating, setAnyGenerating] = useState(false)

  // Track anyGenerating derived from columns (includes polling)
  useEffect(() => {
    setAnyGenerating(columns.some(c => c.generating || c.polling !== null))
  }, [columns])

  // Fetch models + user tier on mount
  useEffect(() => {
    async function load() {
      const [modelsRes, profileRes] = await Promise.all([
        supabase.from('models').select('*').eq('is_active', true).order('sort_order'),
        user ? supabase.from('profiles').select('tier').eq('id', user.id).single() : Promise.resolve({ data: null }),
      ])
      if (modelsRes.data) setModels(modelsRes.data as Model[])
      if (profileRes.data) setUserTier((profileRes.data as { tier: string }).tier ?? 'newbie')
    }
    load()
  }, [user])

  // Apply initial state from Model Advisor once models are loaded
  useEffect(() => {
    const init = pendingInitRef.current
    if (!init || models.length === 0) return
    pendingInitRef.current = null

    const slugs = init.models.slice(0, MAX_COLUMNS)
    if (slugs.length < MIN_COLUMNS) return

    if (init.prompt) setSharedPrompt(init.prompt)

    const newCols: ColumnState[] = slugs.map(slug => ({
      ...makeColumn(),
      model: models.find(m => m.slug === slug) ?? null,
      templateLoading: true,
    }))
    setColumns(newCols)

    // Fetch templates async
    slugs.forEach((slug, i) => {
      const model = models.find(m => m.slug === slug)
      if (!model) return
      fetchTemplate(model).then(template => {
        setColumns(prev => {
          if (prev[i]?.model?.slug !== slug) return prev
          return prev.map((c, j) => j === i ? { ...c, template, templateLoading: false } : c)
        })
      })
    })
  }, [models])

  // Fetch template for a given model
  const fetchTemplate = useCallback(async (model: Model): Promise<Template | null> => {
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('model_id', model.id)
      .eq('gen_type', 'txt2img')
      .single()
    return data as Template | null
  }, [])

  // Polling interval — checks all columns with pending async generations every 5s
  const columnsRef = useRef(columns)
  useEffect(() => { columnsRef.current = columns }, [columns])

  useEffect(() => {
    const interval = setInterval(async () => {
      const cols = columnsRef.current
      if (!cols.some(c => c.polling)) return
      const { data: { session } } = await supabase.auth.getSession()
      await Promise.allSettled(cols.map(async (col, i) => {
        if (!col.polling) return
        const pv = col.polling
        if (Date.now() - pv.startedAt > 30 * 60 * 1000) {
          setColumns(prev => prev.map((c, j) => j === i ? { ...c, polling: null, error: 'Generation timed out after 30 minutes.' } : c))
          return
        }
        const endpoint = pv.provider === 'replicate' ? 'check-replicate-video' : pv.provider === 'fal.ai' ? 'check-fal-video' : 'check-veo-job'
        const pollBody = pv.provider === 'replicate'
          ? { user_token: session?.access_token ?? null, asset_id: pv.assetId, prediction_url: pv.predictionUrl }
          : { user_token: session?.access_token ?? null, asset_id: pv.assetId, operation_name: pv.operationName }
        try {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
            { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY }, body: JSON.stringify(pollBody) }
          )
          const data = await res.json()
          if (data.error) {
            setColumns(prev => prev.map((c, j) => j === i ? { ...c, polling: null, error: friendlyFalError(data.error) } : c))
            return
          }
          const completedUrl = data.image_url || data.video_url
          if (data.status === 'complete' && completedUrl) {
            const genTimeMs = Date.now() - pv.startedAt
            setColumns(prev => prev.map((c, j) => j === i ? { ...c, polling: null, result: { url: completedUrl, assetId: pv.assetId, genTimeMs } } : c))
          }
        } catch { /* network hiccup — keep polling */ }
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, []) // mount only — reads live state via columnsRef

  function handleModelChange(colIndex: number, slug: string) {
    if (!slug) {
      setColumns(prev => prev.map((c, i) =>
        i === colIndex ? { ...c, model: null, template: null, advancedValues: {} } : c
      ))
      return
    }
    const model = models.find(m => m.slug === slug)
    if (!model) return

    // Mark loading, clear old template
    setColumns(prev => prev.map((c, i) =>
      i === colIndex ? { ...c, model, template: null, templateLoading: true, result: null, error: null, advancedValues: {} } : c
    ))

    // Fetch template asynchronously, guard against stale updates
    fetchTemplate(model).then(template => {
      setColumns(prev => {
        // Only apply if this column still has the same model
        if (prev[colIndex]?.model?.slug !== slug) return prev
        return prev.map((c, i) =>
          i === colIndex ? { ...c, template, templateLoading: false } : c
        )
      })
    })
  }

  function handleAdvancedChange(colIndex: number, fieldId: string, value: unknown) {
    setColumns(prev => prev.map((c, i) =>
      i === colIndex
        ? { ...c, advancedValues: { ...c.advancedValues, [fieldId]: value } }
        : c
    ))
  }

  function handleAddColumn() {
    if (columns.length >= MAX_COLUMNS) return
    setColumns(prev => [...prev, makeColumn()])
  }

  function handleRemoveColumn(index: number) {
    if (columns.length <= MIN_COLUMNS) return
    setColumns(prev => prev.filter((_, i) => i !== index))
  }

  async function handleRunAll() {
    if (anyGenerating) return
    const { data: { session } } = await supabase.auth.getSession()
    const userToken = session?.access_token ?? null

    // Mark all ready columns as generating
    setColumns(prev => prev.map(col =>
      col.model && col.template
        ? { ...col, generating: true, error: null, result: null }
        : col
    ))

    // Run all in parallel
    await Promise.allSettled(
      columns.map(async (col, i) => {
        if (!col.model || !col.template) return

        const start = Date.now()
        try {
          // Insert prompt record
          const { data: promptRecord } = await supabase.from('prompts').insert({
            user_id: user!.id,
            title: `Compare — ${col.model.name}`,
            content: JSON.stringify({ prompt: sharedPrompt, ...commonValues, ...col.advancedValues }),
            tags: [col.model.slug, 'txt2img', 'compare'],
          }).select().single()

          const submitValues: Record<string, unknown> = {
            ...commonValues,
            ...col.advancedValues,
            prompt: sharedPrompt,
          }
          // If seed is locked and set, pass it through (already in commonValues)
          // If unlocked, we still pass whatever is in commonValues.seed
          if (!seedLocked) {
            delete submitValues.seed
          }

          const result = await invokeGenerate({
            model: col.model,
            genType: 'txt2img',
            values: submitValues,
            userToken,
            promptId: (promptRecord as { id: string } | null)?.id ?? null,
          })

          if (result.status === 'pending') {
            setColumns(prev => prev.map((c, j) =>
              j === i ? { ...c, generating: false, polling: { assetId: result.assetId, provider: result.provider, predictionUrl: result.predictionUrl, operationName: result.operationName, startedAt: Date.now() } } : c
            ))
          } else {
            const genTimeMs = Date.now() - start
            setColumns(prev => prev.map((c, j) =>
              j === i ? { ...c, generating: false, result: { url: result.imageUrl, assetId: result.assetId, genTimeMs } } : c
            ))
          }
        } catch (err) {
          setColumns(prev => prev.map((c, j) =>
            j === i
              ? { ...c, generating: false, error: err instanceof Error ? err.message : 'Generation failed' }
              : c
          ))
        }
      })
    )
  }

  // AI Assist on shared prompt
  async function handleAiAssist() {
    if (aiAssisting || !sharedPrompt.trim()) return
    setAiAssisting(true)
    setAiSuggestion(null)
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
            field_id: 'prompt',
            field_label: 'Prompt',
            current_value: sharedPrompt,
            form_values: { prompt: sharedPrompt },
            gen_type: 'txt2img',
            is_negative_prompt: false,
          }),
        }
      )
      const data = await res.json()
      if (data.suggestion) setAiSuggestion(data.suggestion)
    } catch {
      // silently fail — not blocking
    } finally {
      setAiAssisting(false)
    }
  }

  // Save current lineup
  function handleSaveLineup() {
    if (!lineupName.trim()) return
    const lineup: SavedLineup = {
      name: lineupName.trim(),
      slugs: columns.map(c => c.model?.slug ?? null),
      savedAt: Date.now(),
    }
    const updated = [lineup, ...savedLineups.filter(l => l.name !== lineup.name)].slice(0, 10)
    setSavedLineups(updated)
    try { localStorage.setItem(LINEUP_KEY, JSON.stringify(updated)) } catch {}
    setLineupName('')
  }

  // Load a saved lineup
  function handleLoadLineup(lineup: SavedLineup) {
    const newColumns: ColumnState[] = lineup.slugs.slice(0, MAX_COLUMNS).map(slug => {
      const model = slug ? models.find(m => m.slug === slug) ?? null : null
      return { ...makeColumn(), model }
    })
    // Ensure at least MIN_COLUMNS
    while (newColumns.length < MIN_COLUMNS) newColumns.push(makeColumn())
    setColumns(newColumns)

    // Fetch templates for each model
    newColumns.forEach((col, i) => {
      if (!col.model) return
      setColumns(prev => prev.map((c, j) => j === i ? { ...c, templateLoading: true } : c))
      fetchTemplate(col.model).then(template => {
        setColumns(prev => prev.map((c, j) =>
          j === i && c.model?.slug === (col.model?.slug ?? '') ? { ...c, template, templateLoading: false } : c
        ))
      })
    })
  }

  function handleDeleteLineup(name: string) {
    const updated = savedLineups.filter(l => l.name !== name)
    setSavedLineups(updated)
    try { localStorage.setItem(LINEUP_KEY, JSON.stringify(updated)) } catch {}
  }

  // Download all results sequentially
  const downloadingRef = useRef(false)
  async function handleDownloadAll() {
    if (downloadingRef.current) return
    downloadingRef.current = true
    const results = columns.filter(c => c.result && c.model)
    for (const col of results) {
      await downloadFile(col.result!.url, `prmptVAULT-compare-${col.model!.slug}-${Date.now()}.jpg`)
      await new Promise(r => setTimeout(r, 300))
    }
    downloadingRef.current = false
  }

  const hasAnyResult = columns.some(c => c.result)
  const readyColumns = columns.filter(c => c.model && c.template).length
  const ghostCount = MAX_COLUMNS - columns.length

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--pv-bg)', color: 'var(--pv-text)' }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--pv-border)', background: 'var(--pv-surface)' }}
      >
        <div className="flex items-center gap-3">
          <Logo height={34} />
          <div style={{ width: 1, height: 20, background: 'var(--pv-border)' }} />
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--pv-text)', letterSpacing: '-0.02em', fontFamily: "'Bricolage Grotesque', sans-serif" }}>
            Compare
          </span>
          {/* Gen type pills — Text→Image active, others ghosted (coming soon) */}
          <div className="flex items-center gap-1.5">
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: 'rgba(0,80,255,0.12)', color: 'var(--pv-accent)', border: '1px solid rgba(0,80,255,0.25)' }}
            >
              Text → Image
            </span>
            {(['Image → Image', 'Text → Video'] as const).map(label => (
              <span
                key={label}
                title="Coming soon"
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: 'var(--pv-surface2)', color: 'var(--pv-text3)', border: '1px solid var(--pv-border)', opacity: 0.45, cursor: 'not-allowed' }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasAnyResult && (
            <button
              onClick={handleDownloadAll}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--pv-accent)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--pv-border)')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download All
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text3)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--pv-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--pv-text3)')}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"/>
              <polyline points="9 21 9 13 15 13 15 21"/>
            </svg>
            Dashboard
          </button>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Shared Prompt */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--pv-border)', background: 'var(--pv-surface)' }}
          >
            <div className="px-5 pt-4 pb-2">
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--pv-text2)' }}>
                Shared Prompt
              </label>
              <textarea
                value={sharedPrompt}
                onChange={e => setSharedPrompt(e.target.value)}
                placeholder="Describe what you want to generate across all models…"
                rows={3}
                className="w-full border-0 bg-transparent text-sm pv-placeholder focus:outline-none resize-none"
                style={{ color: 'var(--pv-text)' }}
              />
            </div>

            {/* AI Suggest banner */}
            {aiSuggestion && (
              <div
                className="mx-4 mb-3 p-3 rounded-xl"
                style={{ background: 'rgba(0,80,255,0.06)', border: '1px solid rgba(0,80,255,0.2)' }}
              >
                <div className="text-xs font-semibold mb-1.5" style={{ color: 'var(--pv-accent)' }}>
                  AI Suggestion
                </div>
                <p className="text-sm mb-2.5" style={{ color: 'var(--pv-text)', lineHeight: 1.55 }}>{aiSuggestion}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSharedPrompt(aiSuggestion); setAiSuggestion(null) }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                    style={{ background: 'var(--pv-accent)', color: '#fff' }}
                  >
                    Use this
                  </button>
                  <button
                    onClick={() => setAiSuggestion(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
                    style={{ background: 'var(--pv-surface2)', color: 'var(--pv-text3)' }}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* AI Assist + Run All row */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderTop: '1px solid var(--pv-border)', background: 'var(--pv-surface2)' }}
            >
              <button
                onClick={handleAiAssist}
                disabled={aiAssisting || !sharedPrompt.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)' }}
              >
                {aiAssisting ? (
                  <>
                    <div className="pv-spin" style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--pv-border)', borderTopColor: 'var(--pv-accent)' }} />
                    Thinking…
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pv-accent)' }}>
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2z"/>
                    </svg>
                    AI Assist
                  </>
                )}
              </button>

              <button
                onClick={handleRunAll}
                disabled={anyGenerating || readyColumns === 0 || !sharedPrompt.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--pv-accent)', color: '#fff' }}
                onMouseEnter={e => { if (!anyGenerating) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
              >
                {anyGenerating ? (
                  <>
                    <div className="pv-spin" style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Run All
                    {readyColumns > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,255,255,0.2)' }}>
                        {readyColumns}
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Saved lineups */}
          {(savedLineups.length > 0 || true) && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  value={lineupName}
                  onChange={e => setLineupName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveLineup() }}
                  placeholder="Name this lineup…"
                  className="border rounded-xl px-3 py-2 text-xs pv-placeholder focus:outline-none"
                  style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)', width: 160 }}
                />
                <button
                  onClick={handleSaveLineup}
                  disabled={!lineupName.trim()}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-40"
                  style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)' }}
                >
                  Save
                </button>
              </div>

              {savedLineups.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span style={{ fontSize: 11, color: 'var(--pv-text3)' }}>Saved:</span>
                  {savedLineups.map(lineup => (
                    <div key={lineup.name} className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleLoadLineup(lineup)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                        style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)' }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--pv-accent)')}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--pv-border)')}
                      >
                        {lineup.name}
                        <span className="ml-1.5 opacity-50">
                          {lineup.slugs.filter(Boolean).length} models
                        </span>
                      </button>
                      <button
                        onClick={() => handleDeleteLineup(lineup.name)}
                        className="w-5 h-5 flex items-center justify-center rounded-md transition-all cursor-pointer"
                        style={{ color: 'var(--pv-text3)' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--pv-text3)')}
                      >
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Column grid */}
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${MAX_COLUMNS}, minmax(200px, 1fr))`,
              overflowX: 'auto',
            }}
          >
            {columns.map((col, i) => (
              <CompareColumn
                key={col.id}
                column={col}
                models={models}
                userTier={userTier}
                onModelChange={slug => handleModelChange(i, slug)}
                onAdvancedChange={(fieldId, value) => handleAdvancedChange(i, fieldId, value)}
                onRemove={() => handleRemoveColumn(i)}
                canRemove={columns.length > MIN_COLUMNS}
              />
            ))}
            {Array.from({ length: ghostCount }).map((_, i) => (
              <GhostColumn key={`ghost-${i}`} onAdd={handleAddColumn} />
            ))}
          </div>

          {/* Common Settings */}
          <CommonSettings
            values={commonValues}
            onChange={(field, value) => setCommonValues(prev => ({ ...prev, [field]: value }))}
            seedLocked={seedLocked}
            onToggleSeedLock={() => setSeedLocked(v => !v)}
            sharedPrompt={sharedPrompt}
            activeModelNames={columns.filter(c => c.model).map(c => c.model!.name)}
          />

          {/* Bottom Run All */}
          <div
            className="flex items-center justify-between rounded-2xl px-5 py-4"
            style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)' }}
          >
            <div style={{ fontSize: 13, color: 'var(--pv-text3)' }}>
              {readyColumns === 0
                ? 'Select models above to generate'
                : `${readyColumns} model${readyColumns === 1 ? '' : 's'} ready`}
            </div>
            <button
              onClick={handleRunAll}
              disabled={anyGenerating || readyColumns === 0 || !sharedPrompt.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'var(--pv-accent)', color: '#fff' }}
              onMouseEnter={e => { if (!anyGenerating) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88' }}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
            >
              {anyGenerating ? (
                <>
                  <div className="pv-spin" style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  Generating…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                  Run All
                  {readyColumns > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(255,255,255,0.2)' }}>
                      {readyColumns}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>

          <div style={{ height: 24 }} />
        </div>
      </div>
    </div>
  )
}
