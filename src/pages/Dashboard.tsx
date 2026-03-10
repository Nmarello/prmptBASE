import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Asset, Model, Template, GenType, UserProject } from '../types'
import { GEN_TYPE_LABELS, tierCanAccess } from '../types'
import ModelCard from '../components/dashboard/ModelCard'
import TemplateForm from '../components/dashboard/TemplateForm'
import AssetGrid from '../components/dashboard/AssetGrid'
import Img2ImgPicker from '../components/dashboard/Img2ImgPicker'
import HomeGrid from '../components/dashboard/HomeGrid'

type View = 'models' | 'builder' | 'assets'

const COMING_SOON_IMAGE: Partial<Model>[] = [
  { slug: 'cs-midjourney', name: 'Midjourney', provider: 'Midjourney', description: 'The gold standard for artistic AI image generation. Unmatched aesthetic quality.', supported_gen_types: ['txt2img'] },
  { slug: 'cs-ideogram', name: 'Ideogram', provider: 'Ideogram', description: 'Best-in-class text rendering inside images. Typography that actually works.', supported_gen_types: ['txt2img'] },
  { slug: 'cs-firefly', name: 'Adobe Firefly', provider: 'Adobe', description: 'Commercially safe image generation built for creative professionals.', supported_gen_types: ['txt2img', 'img2img'] },
  { slug: 'cs-nano-banana', name: 'Nano Banana', provider: 'Google', description: 'Gemini 2.5 Flash Image — Google\'s advanced image generation and editing model. Precise edits, 4K output, strong subject consistency.', supported_gen_types: ['txt2img', 'img2img'] },
]

const COMING_SOON_VIDEO: Partial<Model>[] = [
  { slug: 'cs-sora', name: 'Sora', provider: 'OpenAI', description: 'OpenAI\'s flagship video model. Photorealistic scenes with deep world understanding.', supported_gen_types: ['txt2vid'] },
  { slug: 'cs-runway', name: 'Runway Gen-4', provider: 'Runway', description: 'The leading creative video AI. Gen-4 sets the bar for motion and cinematic quality.', supported_gen_types: ['txt2vid', 'img2vid'] },
  { slug: 'cs-pika', name: 'Pika', provider: 'Pika', description: 'Fast, expressive video generation built for social-first creators.', supported_gen_types: ['txt2vid', 'img2vid'] },
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [view, setView] = useState<View>('models')
  const [userTier, setUserTier] = useState('newbie')

  const [models, setModels] = useState<Model[]>([])
  const [mediaTab, setMediaTab] = useState<'image' | 'video'>('image')
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [selectedGenType, setSelectedGenType] = useState<GenType | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ url: string; prompt: string; revised_prompt?: string; isVideo?: boolean } | null>(null)
  const [pendingVideo, setPendingVideo] = useState<{ assetId: string; operationName: string; provider: 'google' | 'fal.ai' } | null>(null)
  const videoPollerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const [projects, setProjects] = useState<UserProject[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)

  const [img2imgPickerUrl, setImg2imgPickerUrl] = useState<string | null>(null)
  const [img2imgInitialValues, setImg2imgInitialValues] = useState<Record<string, unknown> | undefined>(undefined)

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

  function selectProviderTile(provider: string) {
    setSelectedProvider(provider)
    setSelectedModel(null)
    setSelectedGenType(null)
    setTemplate(null)
    setResult(null)
    setGenerateError(null)
    setImg2imgInitialValues(undefined)
    setView('builder')
  }

  async function selectModel(model: Model) {
    setSelectedProvider(model.provider)
    setSelectedModel(model)
    setTemplate(null)
    setResult(null)
    setImg2imgInitialValues(undefined)
    setView('builder')

    // Auto-select gen type if the model only supports one
    if (model.supported_gen_types.length === 1) {
      const gt = model.supported_gen_types[0] as GenType
      setSelectedGenType(gt)
      const { data } = await supabase
        .from('templates')
        .select('*')
        .eq('model_id', model.id)
        .eq('gen_type', gt)
        .single()
      if (data) setTemplate(data as Template)
    } else {
      setSelectedGenType(null)
    }
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
      const isFal = selectedModel.provider === 'fal.ai'
      const isGoogle = selectedModel.provider === 'Google'
      const isImg2Img = selectedGenType === 'img2img'
      const isVideo = selectedGenType === 'txt2vid' || selectedGenType === 'img2vid'

      const endpoint = isFal
        ? 'generate-fal'
        : isGoogle
        ? 'generate-google'
        : isImg2Img ? 'edit-image' : 'generate-image'

      const body = isFal
        ? {
            user_token: session?.access_token ?? null,
            ...values,
            model_id: selectedModel.id,
            model_slug: selectedModel.slug,
            gen_type: selectedGenType,
            prompt_id: promptRecord?.id ?? null,
          }
        : isGoogle
        ? {
            user_token: session?.access_token ?? null,
            ...values,
            model_id: selectedModel.id,
            model_slug: selectedModel.slug,
            prompt_id: promptRecord?.id ?? null,
            gen_type: selectedGenType,
          }
        : isImg2Img
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

      // Async video pending — start polling
      if (isVideo && data.status === 'pending') {
        const provider = data.provider === 'fal.ai' ? 'fal.ai' : 'google'
        setPendingVideo({ assetId: data.asset?.id, operationName: data.operation_name, provider })
        setSubmitting(false)
        return
      }

      const imageUrl = data?.asset?.url ?? data?.image_url
      if (!imageUrl) throw new Error(`No image URL. Response: ${JSON.stringify(data)}`)

      setResult({ url: imageUrl, prompt: data.prompt, revised_prompt: data.revised_prompt, isVideo })
      loadAssets()
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Video polling (Veo + fal.ai)
  useEffect(() => {
    if (!pendingVideo) {
      if (videoPollerRef.current) clearInterval(videoPollerRef.current)
      return
    }
    async function poll() {
      if (!pendingVideo) return
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const endpoint = pendingVideo.provider === 'fal.ai' ? 'check-fal-video' : 'check-veo-job'
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            },
            body: JSON.stringify({
              user_token: session?.access_token ?? null,
              asset_id: pendingVideo.assetId,
              operation_name: pendingVideo.operationName,
            }),
          },
        )
        const data = await res.json()
        if (data.status === 'complete' && data.video_url) {
          setPendingVideo(null)
          setResult({ url: data.video_url, prompt: '', isVideo: true })
          loadAssets()
        }
      } catch (_) { /* keep polling */ }
    }
    videoPollerRef.current = setInterval(poll, 5000)
    return () => { if (videoPollerRef.current) clearInterval(videoPollerRef.current) }
  }, [pendingVideo])

  async function deleteAsset(id: string) {
    await supabase.from('assets').delete().eq('id', id)
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }

  async function sendToImg2Img(imageUrl: string) {
    // Fetch image and convert to base64 data URL
    const res = await fetch(imageUrl)
    const blob = await res.blob()
    const reader = new FileReader()
    reader.onload = () => {
      setImg2imgInitialValues({ source_image: reader.result as string })
      setImg2imgPickerUrl(imageUrl)
    }
    reader.readAsDataURL(blob)
  }

  async function handleImg2ImgPick(model: Model) {
    setImg2imgPickerUrl(null)
    // Load the img2img template for this model
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('model_id', model.id)
      .eq('gen_type', 'img2img')
      .single()
    if (data) {
      setSelectedModel(model)
      setSelectedGenType('img2img')
      setTemplate(data as Template)
      setResult(null)
      setGenerateError(null)
      setView('builder')
    }
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
            <aside className="w-72 border-r border-white/8 flex flex-col flex-shrink-0">
              {/* Image / Video tabs */}
              <div className="flex border-b border-white/8 flex-shrink-0">
                {(['image', 'video'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setMediaTab(tab)
                      setSelectedProvider(null)
                      setSelectedModel(null)
                      setSelectedGenType(null)
                      setTemplate(null)
                      setResult(null)
                      setGenerateError(null)
                    }}
                    className={`flex-1 py-3 text-sm font-semibold tracking-wide transition-all ${
                      mediaTab === tab
                        ? 'text-white border-b-2 border-sky-400'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tab === 'image' ? 'Image' : 'Video'}
                  </button>
                ))}
              </div>

              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                {models.length === 0 && (
                  <p className="text-slate-600 text-sm px-1">Loading…</p>
                )}

                {mediaTab === 'image' && (() => {
                  const fluxImageModels = models.filter((m) =>
                    m.provider === 'fal.ai' &&
                    m.supported_gen_types.some((g) => g === 'txt2img' || g === 'img2img' || g === 'multi_img2img')
                  )
                  const openaiImageModels = models.filter((m) =>
                    m.provider === 'OpenAI' &&
                    m.supported_gen_types.some((g) => g === 'txt2img' || g === 'img2img' || g === 'multi_img2img')
                  )
                  const googleImageModels = models.filter((m) =>
                    m.provider === 'Google' &&
                    m.supported_gen_types.some((g) => g === 'txt2img' || g === 'img2img' || g === 'multi_img2img')
                  )
                  const hasFlux = fluxImageModels.length > 0
                  return (
                    <>
                      {openaiImageModels.map((model) => (
                        <ModelCard
                          key={model.id}
                          model={model}
                          userTier={userTier}
                          selected={selectedModel?.id === model.id}
                          onClick={() => selectModel(model)}
                        />
                      ))}
                      {hasFlux && (
                        <button
                          onClick={() => selectProviderTile('fal.ai')}
                          className={`relative w-full text-left rounded-2xl p-5 border transition-all ${
                            selectedProvider === 'fal.ai' && !selectedModel
                              ? 'bg-sky-500/10 border-sky-500/50'
                              : 'bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/6'
                          }`}
                        >
                          <div className="text-xs font-semibold uppercase tracking-wider mb-1 text-sky-400">Black Forest Labs</div>
                          <div className="text-white font-bold text-lg leading-tight">Flux</div>
                          <div className="text-slate-500 text-xs mt-1.5">
                            {fluxImageModels.length} models available
                          </div>
                          <div className="mt-3 text-xs text-slate-600">Select to choose model →</div>
                        </button>
                      )}
                      {googleImageModels.map((model) => (
                        <ModelCard
                          key={model.id}
                          model={model}
                          userTier={userTier}
                          selected={selectedModel?.id === model.id}
                          onClick={() => selectModel(model)}
                        />
                      ))}
                      {COMING_SOON_IMAGE.map((m) => (
                        <ModelCard
                          key={m.slug}
                          model={m as Model}
                          userTier={userTier}
                          selected={false}
                          onClick={() => {}}
                          comingSoon
                        />
                      ))}
                    </>
                  )
                })()}

                {mediaTab === 'video' && (() => {
                  const videoModels = models.filter((m) =>
                    m.supported_gen_types.some((g) => g === 'txt2vid' || g === 'img2vid')
                  )
                  return (
                    <>
                      {videoModels.map((model) => (
                        <ModelCard
                          key={model.id}
                          model={model}
                          userTier={userTier}
                          selected={selectedModel?.id === model.id}
                          onClick={() => selectModel(model)}
                        />
                      ))}
                      {COMING_SOON_VIDEO.map((m) => (
                        <ModelCard
                          key={m.slug}
                          model={m as Model}
                          userTier={userTier}
                          selected={false}
                          onClick={() => {}}
                          comingSoon
                        />
                      ))}
                    </>
                  )
                })()}
              </div>
            </aside>

            {/* Main panel */}
            <main className="flex-1 overflow-y-auto p-8">
              {!selectedModel && !selectedProvider && (
                <HomeGrid
                  assets={assets}
                  onSelectModel={() => setView('models')}
                />
              )}

              {/* Flux model picker */}
              {selectedProvider === 'fal.ai' && !selectedModel && (
                <div className="max-w-2xl">
                  <h2 className="text-2xl font-bold mb-1">Flux Models</h2>
                  <p className="text-slate-400 text-sm mb-8">Choose a Flux model to build your prompt</p>
                  <div className="grid grid-cols-2 gap-3">
                    {models.filter((m) => m.provider === 'fal.ai' && m.supported_gen_types.some((g) => g === 'txt2img' || g === 'img2img' || g === 'multi_img2img')).map((model) => {
                      const accessible = tierCanAccess(userTier, model.min_tier)
                      return (
                        <button
                          key={model.id}
                          onClick={accessible ? () => selectModel(model) : undefined}
                          className={`relative text-left rounded-2xl p-5 border transition-all ${
                            accessible
                              ? 'bg-white/3 border-white/8 hover:border-sky-500/50 hover:bg-sky-500/5'
                              : 'bg-white/2 border-white/5 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          {!accessible && (
                            <span className="absolute top-3 right-3 text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">
                              {model.min_tier}
                            </span>
                          )}
                          <div className="text-white font-bold text-base leading-tight mb-1">{model.name}</div>
                          <div className="text-slate-500 text-xs line-clamp-2 mb-3">{model.description}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {model.supported_gen_types.map((gt) => (
                              <span key={gt} className="text-xs bg-white/8 text-slate-400 px-2 py-0.5 rounded-full">
                                {gt}
                              </span>
                            ))}
                          </div>
                        </button>
                      )
                    })}
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
                    onClick={() => {
                      setSelectedGenType(null); setTemplate(null); setResult(null); setGenerateError(null)
                      if (selectedModel.provider === 'fal.ai') setSelectedModel(null)
                    }}
                    className="text-slate-500 hover:text-white text-sm mb-8 flex items-center gap-1"
                  >
                    ← {selectedModel.provider === 'fal.ai' ? 'Flux Models' : selectedModel.name}
                  </button>

                  {pendingVideo && !result && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-slate-400 font-medium">Rendering your video…</p>
                      <p className="text-slate-600 text-sm">This usually takes 2–5 minutes. Hang tight.</p>
                    </div>
                  )}

                  {result ? (
                    <div className="space-y-5">
                      {result.isVideo ? (
                        <video
                          src={result.url}
                          controls
                          autoPlay
                          loop
                          className="rounded-2xl w-full max-w-lg border border-white/10"
                        />
                      ) : (
                        <img
                          src={result.url}
                          alt={result.prompt}
                          className="rounded-2xl w-full max-w-lg border border-white/10"
                        />
                      )}
                      {result.revised_prompt && (
                        <div className="bg-white/3 border border-white/8 rounded-xl p-4">
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Revised prompt</div>
                          <p className="text-slate-400 text-sm">{result.revised_prompt}</p>
                        </div>
                      )}
                      <div className="flex gap-3 flex-wrap">
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
                          onClick={() => sendToImg2Img(result.url)}
                          className="px-5 py-2.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-xl text-sm font-medium text-sky-300 transition-all"
                        >
                          Send to img2img →
                        </button>
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
                        initialValues={img2imgInitialValues}
                        userTier={userTier}
                        modelMinTier={selectedModel?.min_tier}
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
            models={models}
            projects={projects}
            loading={assetsLoading}
            onDelete={deleteAsset}
            onGenerate={() => setView('models')}
            onSendToImg2Img={sendToImg2Img}
          />
        )}
      </div>

      {/* Img2Img model picker */}
      {img2imgPickerUrl && (
        <Img2ImgPicker
          models={models.filter((m) => m.supported_gen_types.includes('img2img'))}
          onPick={handleImg2ImgPick}
          onClose={() => setImg2imgPickerUrl(null)}
        />
      )}
    </div>
  )
}
