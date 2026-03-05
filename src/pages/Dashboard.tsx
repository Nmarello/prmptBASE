import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Asset, Model, Template, GenType, UserProject } from '../types'
import { GEN_TYPE_LABELS } from '../types'
import ModelCard from '../components/dashboard/ModelCard'
import TemplateForm from '../components/dashboard/TemplateForm'
import AssetGrid from '../components/dashboard/AssetGrid'

type View = 'models' | 'builder' | 'assets'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [view, setView] = useState<View>('models')
  const [userTier, setUserTier] = useState('newbie')

  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [selectedGenType, setSelectedGenType] = useState<GenType | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ url: string; prompt: string; revised_prompt?: string } | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const [projects, setProjects] = useState<UserProject[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)

  const loadAssets = useCallback(async () => {
    if (!user) return
    setAssetsLoading(true)
    const { data } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setAssets(data as Asset[])
    setAssetsLoading(false)
  }, [user])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('tier').eq('id', user.id).single()
      .then(({ data }) => { if (data) setUserTier(data.tier) })
    supabase.from('models').select('*').eq('is_active', true).order('sort_order')
      .then(({ data }) => { if (data) setModels(data as Model[]) })
    supabase.from('user_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setProjects(data as UserProject[]) })
    loadAssets()
  }, [user, loadAssets])

  async function selectModel(model: Model) {
    setSelectedModel(model)
    setSelectedGenType(null)
    setTemplate(null)
    setResult(null)
    setView('builder')
  }

  async function selectGenType(gt: GenType) {
    setSelectedGenType(gt)
    setResult(null)
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('model_id', selectedModel!.id)
      .eq('gen_type', gt)
      .single()
    if (data) setTemplate(data as Template)
  }

  async function handleGenerate(values: Record<string, unknown>) {
    if (!selectedModel || !selectedGenType || !template) return
    setSubmitting(true)
    setResult(null)
    setGenerateError(null)
    try {
      const { data: promptRecord } = await supabase.from('prompts').insert({
        user_id: user!.id,
        title: `${selectedModel.name} — ${GEN_TYPE_LABELS[selectedGenType]}`,
        content: JSON.stringify(values),
        tags: [selectedModel.slug, selectedGenType],
      }).select().single()

      const { data: { session } } = await supabase.auth.getSession()
      const isImg2Img = selectedGenType === 'img2img'

      const endpoint = isImg2Img ? 'edit-image' : 'generate-image'
      const body = isImg2Img
        ? {
            user_token: session?.access_token ?? null,
            source_image_b64: values.source_image,
            prompt: values.prompt,
            model_id: selectedModel.id,
            prompt_id: promptRecord?.id ?? null,
            size: values.size ?? '1024x1024',
            quality: values.quality ?? 'medium',
          }
        : {
            user_token: session?.access_token ?? null,
            values,
            model_id: selectedModel.id,
            prompt_id: promptRecord?.id ?? null,
            size: values.size ?? '1024x1024',
            quality: values.quality ?? 'standard',
          }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(body),
        }
      )

      const data = await res.json()
      if (!res.ok || data?.error) throw new Error(data?.error ?? data?.message ?? `HTTP ${res.status}: ${JSON.stringify(data)}`)

      const imageUrl = data?.asset?.url ?? data?.image_url
      if (!imageUrl) throw new Error(`No image URL. Response: ${JSON.stringify(data)}`)

      setResult({ url: imageUrl, prompt: data.prompt, revised_prompt: data.revised_prompt })
      loadAssets() // refresh assets grid in background
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteAsset(id: string) {
    await supabase.from('assets').delete().eq('id', id)
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* Top nav */}
      <header className="border-b border-white/8 px-6 py-4 flex items-center justify-between flex-shrink-0 relative">
        <div className="flex items-center gap-6">
          <span className="text-xl font-black tracking-tight">
            prmpt<span className="text-sky-400">BASE</span>
          </span>
          <span className="absolute left-1/2 -translate-x-1/2 text-[10px] text-slate-600 font-mono">
            {/* @ts-ignore */}
            v-0.0.{__BUILD__} · {__COMMIT__}
          </span>
          <nav className="flex gap-1">
            {(['models', 'assets'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => { setView(v); if (v === 'assets') loadAssets() }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === v || (v === 'models' && view === 'builder')
                    ? 'bg-white/10 text-white'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {v === 'models' ? 'Models' : `Assets${assets.length > 0 ? ` (${assets.length})` : ''}`}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-full font-medium capitalize">
            {userTier}
          </span>
          <span className="text-sm text-slate-400">{user?.email}</span>
          <button onClick={signOut} className="text-xs text-slate-600 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Models / Builder view */}
        {(view === 'models' || view === 'builder') && (
          <>
            {/* Left panel — model list */}
            <aside className="w-72 border-r border-white/8 p-4 overflow-y-auto space-y-3 flex-shrink-0">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-3">
                AI Models
              </div>
              {models.length === 0 && (
                <p className="text-slate-600 text-sm px-1">Loading…</p>
              )}
              {models.map((model) => (
                <ModelCard
                  key={model.id}
                  model={model}
                  userTier={userTier}
                  selected={selectedModel?.id === model.id}
                  onClick={() => selectModel(model)}
                />
              ))}
            </aside>

            {/* Main panel */}
            <main className="flex-1 overflow-y-auto p-8">
              {!selectedModel && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-4">⚡</div>
                    <p className="text-slate-400 font-medium">Select a model to get started</p>
                    <p className="text-slate-600 text-sm mt-1">Choose an AI model from the left to open the prompt builder</p>
                  </div>
                </div>
              )}

              {selectedModel && !selectedGenType && (
                <div className="max-w-xl">
                  <h2 className="text-2xl font-bold mb-1">{selectedModel.name}</h2>
                  <p className="text-slate-400 text-sm mb-8">{selectedModel.description}</p>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Choose generation type
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedModel.supported_gen_types.map((gt) => (
                      <button
                        key={gt}
                        onClick={() => selectGenType(gt)}
                        className="p-5 bg-white/3 hover:bg-white/6 border border-white/8 hover:border-white/20 rounded-2xl text-left transition-all"
                      >
                        <div className="text-white font-semibold mb-1">{GEN_TYPE_LABELS[gt]}</div>
                        <div className="text-slate-500 text-xs">Generate using {selectedModel.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedModel && selectedGenType && template && (
                <div className="max-w-2xl">
                  <button
                    onClick={() => { setSelectedGenType(null); setTemplate(null); setResult(null); setGenerateError(null) }}
                    className="text-slate-500 hover:text-white text-sm mb-8 flex items-center gap-1"
                  >
                    ← {selectedModel.name}
                  </button>

                  {result ? (
                    <div className="space-y-5">
                      <img
                        src={result.url}
                        alt={result.prompt}
                        className="rounded-2xl w-full max-w-lg border border-white/10"
                      />
                      {result.revised_prompt && (
                        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Revised prompt</div>
                          <p className="text-slate-400 text-sm">{result.revised_prompt}</p>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <a
                          href={result.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-medium transition-all"
                        >
                          Download
                        </a>
                        <button
                          onClick={() => { setView('assets'); loadAssets() }}
                          className="px-5 py-2.5 bg-white/8 hover:bg-white/12 border border-white/10 rounded-xl text-sm font-medium"
                        >
                          View in Assets →
                        </button>
                        <button
                          onClick={() => { setResult(null); setGenerateError(null) }}
                          className="px-5 py-2.5 bg-white/5 hover:bg-white/8 border border-white/8 rounded-xl text-sm font-medium text-slate-400"
                        >
                          ← New prompt
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {generateError && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                          {generateError}
                        </div>
                      )}
                      <TemplateForm
                        template={template}
                        genType={selectedGenType}
                        onSubmit={handleGenerate}
                        submitting={submitting}
                      />
                    </>
                  )}
                </div>
              )}
            </main>
          </>
        )}

        {/* Assets view */}
        {view === 'assets' && (
          <AssetGrid
            assets={assets}
            projects={projects}
            loading={assetsLoading}
            onDelete={deleteAsset}
            onGenerate={() => setView('models')}
          />
        )}
      </div>
    </div>
  )
}
