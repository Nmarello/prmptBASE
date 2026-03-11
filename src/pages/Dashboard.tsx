import { useCallback, useEffect, useRef, useState } from 'react'
import type React from 'react'

function friendlyFalError(raw: string): string {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const detail = parsed?.detail?.[0] ?? parsed?.detail ?? parsed
    const type = detail?.type ?? parsed?.type ?? ''
    const msg  = detail?.msg  ?? parsed?.msg  ?? ''
    if (type === 'downstream_service_error' || msg.toLowerCase().includes('overloaded') || msg.toLowerCase().includes('try again')) {
      return 'The model is temporarily overloaded. Please try again in a moment.'
    }
    if (type === 'rate_limit' || msg.toLowerCase().includes('rate limit')) {
      return 'Rate limit reached. Please wait a moment before generating again.'
    }
    if (msg) return msg
  } catch {
    // raw isn't JSON — fall through
  }
  if (typeof raw === 'string') {
    if (raw.toLowerCase().includes('overload') || raw.toLowerCase().includes('try again later')) {
      return 'The model is temporarily overloaded. Please try again in a moment.'
    }
    if (raw.length > 200) return 'Generation failed. Please try again.'
  }
  return typeof raw === 'string' ? raw : 'Generation failed. Please try again.'
}

async function downloadFile(url: string, isVideo?: boolean) {
  const res = await fetch(url)
  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const ext = isVideo ? 'mp4' : (blob.type.includes('png') ? 'png' : 'jpg')
  const filename = `prmptVAULT-${Date.now()}.${ext}`
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.click()
  URL.revokeObjectURL(objectUrl)
}
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import type { Asset, Model, Template, GenType, UserProject } from '../types'
import { GEN_TYPE_LABELS } from '../types'
import ModelCard from '../components/dashboard/ModelCard'
import TemplateForm from '../components/dashboard/TemplateForm'
import AssetGrid from '../components/dashboard/AssetGrid'
import ProjectsView from '../components/dashboard/ProjectsView'
import Img2ImgPicker from '../components/dashboard/Img2ImgPicker'
import NotificationBell, { addNotification } from '../components/dashboard/NotificationBell'
import SettingsPopover from '../components/dashboard/SettingsPopover'
import GuidedTour, { markTourSeen } from '../components/dashboard/GuidedTour'
import { useLearningMode } from '../contexts/LearningModeContext'

type View = 'models' | 'builder' | 'assets' | 'projects'

const COMING_SOON_IMAGE: Partial<Model>[] = [
  { slug: 'cs-midjourney', name: 'Midjourney', provider: 'Midjourney', description: 'The gold standard for artistic AI image generation. Unmatched aesthetic quality.', supported_gen_types: ['txt2img'] },
  { slug: 'cs-ideogram', name: 'Ideogram', provider: 'Ideogram', description: 'Best-in-class text rendering inside images. Typography that actually works.', supported_gen_types: ['txt2img'] },
  { slug: 'cs-firefly', name: 'Adobe Firefly', provider: 'Adobe', description: 'Commercially safe image generation built for creative professionals.', supported_gen_types: ['txt2img', 'img2img'] },
]

const COMING_SOON_VIDEO: Partial<Model>[] = [
  { slug: 'cs-runway', name: 'Runway Gen-4', provider: 'Runway', description: 'The leading creative video AI. Gen-4 sets the bar for motion and cinematic quality.', supported_gen_types: ['txt2vid', 'img2vid'] },
  { slug: 'cs-pika', name: 'Pika', provider: 'Pika', description: 'Fast, expressive video generation built for social-first creators.', supported_gen_types: ['txt2vid', 'img2vid'] },
]

function SbBtn({ tip, active, onClick, children }: { tip?: string; active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={tip}
      className="relative flex items-center justify-center rounded-[11px] transition-all cursor-pointer group"
      style={{ width: 40, height: 40, color: active ? 'var(--pv-accent)' : 'var(--pv-text3)', background: active ? 'var(--pv-surface2)' : 'transparent' }}
    >
      {children}
    </button>
  )
}

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const { mode: learningMode } = useLearningMode()
  const [view, setView] = useState<View>('models')
  const [tourActive, setTourActive] = useState(false)
  const [userTier, setUserTier] = useState('newbie')

  const [models, setModels] = useState<Model[]>([])
  const [_mediaTab, _setMediaTab] = useState<'image' | 'video'>('image')
  const [_selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [selectedGenType, setSelectedGenType] = useState<GenType | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ url: string; prompt: string; revised_prompt?: string; isVideo?: boolean } | null>(null)
  const [lightboxAsset, setLightboxAsset] = useState<Asset | null>(null)
  const PENDING_VIDEO_KEY = 'prmptVAULT_pendingVideo'
  const [pendingVideo, setPendingVideoRaw] = useState<{ assetId: string; operationName: string; provider: 'google' | 'fal.ai'; startedAt: number } | null>(() => {
    try {
      const stored = localStorage.getItem('prmptVAULT_pendingVideo')
      if (!stored) return null
      const parsed = JSON.parse(stored)
      // Discard if already expired (30-min window)
      if (Date.now() - parsed.startedAt > 30 * 60 * 1000) {
        localStorage.removeItem('prmptVAULT_pendingVideo')
        return null
      }
      return parsed
    } catch { return null }
  })
  function setPendingVideo(val: { assetId: string; operationName: string; provider: 'google' | 'fal.ai'; startedAt: number } | null) {
    setPendingVideoRaw(val)
    if (val) localStorage.setItem(PENDING_VIDEO_KEY, JSON.stringify(val))
    else localStorage.removeItem(PENDING_VIDEO_KEY)
  }
  const videoPollerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  function pushNotification(n: Parameters<typeof addNotification>[0]) {
    addNotification(n)
    setNotifTick((t) => t + 1)
  }
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<{ modelName: string } | null>(null)
  const [renderToast, setRenderToast] = useState<string | null>(null)
  const [, setNotifTick] = useState(0) // forces bell re-render after addNotification

  const [projects, setProjects] = useState<UserProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)

  const [img2imgPickerUrl, setImg2imgPickerUrl] = useState<string | null>(null)
  const [img2imgInitialValues, setImg2imgInitialValues] = useState<Record<string, unknown> | undefined>(undefined)
  const [img2vidPickerUrl, setImg2vidPickerUrl] = useState<string | null>(null)
  const [_sidebarOpen, setSidebarOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)

  const MODEL_ART_MAP = {
    'dalle-3':            { gradient: 'linear-gradient(145deg,#c0392b,#e8570a,#f5a623)', initial: 'D3' },
    'flux-schnell':       { gradient: 'linear-gradient(145deg,#003566,#0096c7,#48cae4)', initial: 'FS' },
    'flux-dev':           { gradient: 'linear-gradient(145deg,#3d0066,#7b2ff7,#c084fc)', initial: 'FD' },
    'flux-pro':           { gradient: 'linear-gradient(145deg,#00004d,#0050ff,#60a5fa)', initial: 'FP' },
    'flux-pro-ultra':     { gradient: 'linear-gradient(145deg,#050505,#0f0f1a,#1a1a3e)', initial: 'FU' },
    'flux-dev-img2img':   { gradient: 'linear-gradient(145deg,#004d26,#00a550,#57cc99)', initial: 'F2' },
    'flux-kontext-pro':   { gradient: 'linear-gradient(145deg,#1a0033,#4400aa,#8855ff)', initial: 'FK' },
    'recraft-v4-pro':     { gradient: 'linear-gradient(145deg,#3d1a00,#a05000,#e8a020)', initial: 'RV' },
    'nano-banana':        { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', initial: 'NB' },
    'kling':              { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
    'luma':               { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
    'minimax-txt2vid':    { gradient: 'linear-gradient(145deg,#002b36,#007070,#00c9a7)', initial: 'MM' },
    'sora2':              { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#3d3d7a)', initial: 'SR' },
  } as const

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

  useEffect(() => {
    if (learningMode === 'guided') {
      setTourActive(true)
    }
  }, [learningMode])

  async function selectModel(model: Model) {
    setSidebarOpen(false)
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
    const isImageGen = selectedGenType !== 'txt2vid' && selectedGenType !== 'img2vid'
    if (isImageGen) setPendingImage({ modelName: selectedModel.name })
    // Request notification permission for all generation types
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
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
      if (!res.ok || data?.error) throw new Error(friendlyFalError(data?.error ?? data?.message ?? `HTTP ${res.status}`))

      // Async video pending — start polling
      if (isVideo && data.status === 'pending') {
        const provider = data.provider === 'fal.ai' ? 'fal.ai' : 'google'
        setPendingVideo({ assetId: data.asset?.id, operationName: data.operation_name, provider, startedAt: Date.now() })
        setSubmitting(false)
        return
      }

      const imageUrl = data?.asset?.url ?? data?.image_url
      if (!imageUrl) throw new Error(`No image URL. Response: ${JSON.stringify(data)}`)

      const assetId = data?.asset?.id as string | undefined

      // Assign to active project if set
      if (activeProjectId && assetId) {
        await supabase.from('assets').update({ project_id: activeProjectId }).eq('id', assetId)
      }

      setPendingImage(null)
      setResult({ url: imageUrl, prompt: data.prompt, revised_prompt: data.revised_prompt, isVideo })
      loadAssets()
      pushNotification({ type: 'image_ready', message: 'Your image is ready!', modelName: selectedModel.name, assetUrl: imageUrl, assetId })
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Your image is ready!', { body: `${selectedModel.name} · prmptVAULT`, icon: '/favicon.ico' })
      }
      setRenderToast('Your image is ready!')
      setTimeout(() => setRenderToast(null), 6000)
    } catch (err) {
      setPendingImage(null)
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
      // 30-minute timeout
      if (Date.now() - pendingVideo.startedAt > 30 * 60 * 1000) {
        if (videoPollerRef.current) clearInterval(videoPollerRef.current)
        setPendingVideo(null)
        setGenerateError('Video generation timed out after 30 minutes. Please try again.')
        return
      }
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
        if (data.error) {
          if (videoPollerRef.current) clearInterval(videoPollerRef.current)
          setPendingVideo(null)
          setGenerateError(`Video generation failed: ${friendlyFalError(data.error)}`)
          return
        }
        if (data.status === 'complete' && data.video_url) {
          const vidAssetId = pendingVideo?.assetId
          if (activeProjectId && vidAssetId) {
            await supabase.from('assets').update({ project_id: activeProjectId }).eq('id', vidAssetId)
          }
          setPendingVideo(null)
          setResult({ url: data.video_url, prompt: '', isVideo: true })
          loadAssets()
          pushNotification({ type: 'video_ready', message: 'Your video is ready!', modelName: selectedModel?.name ?? 'Video', assetUrl: data.video_url, assetId: vidAssetId })
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Your video is ready!', { body: `${selectedModel?.name ?? 'Video'} · prmptVAULT`, icon: '/favicon.ico' })
          }
          setRenderToast('Your video is ready!')
          setTimeout(() => setRenderToast(null), 6000)
        }
      } catch (_) { /* network hiccup — keep polling */ }
    }
    videoPollerRef.current = setInterval(poll, 5000)
    return () => { if (videoPollerRef.current) clearInterval(videoPollerRef.current) }
  }, [pendingVideo])

  async function deleteAsset(id: string) {
    await supabase.from('assets').delete().eq('id', id)
    setAssets((prev) => prev.filter((a) => a.id !== id))
  }

  async function createProject(name: string, description: string) {
    if (!user) return
    const { data } = await supabase
      .from('user_projects')
      .insert({ user_id: user.id, name, description: description || null })
      .select()
      .single()
    if (data) setProjects((prev) => [data as UserProject, ...prev])
  }

  async function updateProject(id: string, name: string, description: string) {
    const { data } = await supabase
      .from('user_projects')
      .update({ name, description: description || null })
      .eq('id', id)
      .select()
      .single()
    if (data) setProjects((prev) => prev.map((p) => (p.id === id ? (data as UserProject) : p)))
  }

  async function moveAssetToProject(assetId: string, projectId: string | null) {
    await supabase.from('assets').update({ project_id: projectId }).eq('id', assetId)
    setAssets((prev) => prev.map((a) => a.id === assetId ? { ...a, project_id: projectId } : a))
  }

  async function deleteProject(id: string) {
    await supabase.from('user_projects').delete().eq('id', id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
    if (activeProjectId === id) setActiveProjectId(null)
    // Un-assign assets from the deleted project in local state
    setAssets((prev) => prev.map((a) => a.project_id === id ? { ...a, project_id: null } : a))
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

  function sendToImg2Vid(imageUrl: string) {
    setImg2vidPickerUrl(imageUrl)
  }

  async function handleImg2VidPick(model: Model) {
    setImg2vidPickerUrl(null)
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('model_id', model.id)
      .eq('gen_type', 'img2vid')
      .single()
    if (data) {
      setSelectedModel(model)
      setSelectedGenType('img2vid')
      setTemplate(data as Template)
      setImg2imgInitialValues({ source_image: img2vidPickerUrl })
      setResult(null)
      setGenerateError(null)
      setView('builder')
    }
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

  async function openWorkspace(model: Model) {
    setResult(null)
    setGenerateError(null)
    setImg2imgInitialValues(undefined)
    await selectModel(model)
    setWorkspaceOpen(true)
  }

  function closeWorkspace() {
    setWorkspaceOpen(false)
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setWorkspaceOpen(false) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--pv-bg)', color: 'var(--pv-text)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Icon Sidebar ── */}
      <aside className="flex flex-col items-center py-4 gap-1 flex-shrink-0 relative z-10" style={{ width: '60px', background: 'var(--pv-surface)', borderRight: '1px solid var(--pv-border)' }}>
        {/* Logo */}
        <div className="mb-3 flex-shrink-0 rounded-[10px] flex items-center justify-center cursor-pointer" style={{ width: 36, height: 36, background: '#18140e' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        {/* Nav buttons */}
        {([
          { id: 'models', tip: 'Generate', icon: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/> },
          { id: 'assets', tip: 'Assets', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
          { id: 'projects', tip: 'Projects', icon: <><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></> },
        ] as { id: View; tip: string; icon: React.ReactNode }[]).map(({ id, tip, icon }) => (
          <SbBtn key={id} tip={tip} active={view === id} onClick={() => setView(id as View)}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
          </SbBtn>
        ))}

        <div style={{ width: 24, height: 1, background: 'var(--pv-border)', margin: '4px 0' }} />

        <SbBtn tip="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </SbBtn>

        {/* Bottom actions */}
        <div className="mt-auto flex flex-col items-center gap-1">
          <div className="relative">
            <SbBtn tip="Notifications">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </SbBtn>
            <NotificationBell
              onViewAsset={(assetId, _assetUrl, _isVideo) => {
                const asset = assets.find((a) => a.id === assetId)
                if (asset) {
                  setLightboxAsset(asset)
                } else {
                  setView('assets')
                  loadAssets()
                }
              }}
            />
          </div>
          <SettingsPopover onSignOut={signOut} />
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* GENERATE VIEW */}
        {view === 'models' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex items-end justify-between px-7 pt-6 pb-4 flex-shrink-0">
              <div>
                <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.05em' }}>
                  Generate
                </h1>
                <p style={{ fontSize: 13, color: 'var(--pv-text3)', marginTop: 2 }}>Pick a model and start creating</p>
              </div>
            </div>

            {/* Scrollable model rows */}
            <div className="flex-1 overflow-y-auto px-7 pb-10 space-y-8">
              {/* Image Models row */}
              {(() => {
                const STANDALONE = ['nano-banana', 'recraft-v4-pro']
                const imgModels = [
                  ...models.filter(m => m.provider === 'OpenAI' && m.supported_gen_types.some(g => ['txt2img','img2img','multi_img2img'].includes(g))),
                  ...models.filter(m => m.provider === 'fal.ai' && m.supported_gen_types.some(g => ['txt2img','img2img','multi_img2img'].includes(g))),
                  ...models.filter(m => STANDALONE.includes(m.slug)),
                  ...COMING_SOON_IMAGE.map(m => ({ ...m, _comingSoon: true })),
                ]
                if (imgModels.length === 0) return null
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
                        Image Models
                      </h2>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pv-text3)', background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', padding: '2px 8px', borderRadius: 20 }}>
                        {imgModels.filter(m => !(m as any)._comingSoon).length} available
                      </span>
                    </div>
                    <div className="flex gap-3.5 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                      {imgModels.map((m: any) => (
                        <ModelCard
                          key={m.id ?? m.slug}
                          model={m as Model}
                          userTier={userTier}
                          selected={selectedModel?.id === m.id}
                          onClick={() => openWorkspace(m as Model)}
                          comingSoon={m._comingSoon || m.comingSoon}
                        />
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Video Models row */}
              {(() => {
                const vidModels = [
                  ...models.filter(m => m.supported_gen_types.some(g => g === 'txt2vid' || g === 'img2vid')),
                  ...COMING_SOON_VIDEO.map(m => ({ ...m, _comingSoon: true })),
                ]
                if (vidModels.length === 0) return null
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
                        Video Models
                      </h2>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pv-text3)', background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', padding: '2px 8px', borderRadius: 20 }}>
                        {vidModels.filter(m => !(m as any)._comingSoon).length} available
                      </span>
                    </div>
                    <div className="flex gap-3.5 overflow-x-auto pb-2" style={{ scrollSnapType: 'x mandatory' }}>
                      {vidModels.map((m: any) => (
                        <ModelCard
                          key={m.id ?? m.slug}
                          model={m as Model}
                          userTier={userTier}
                          selected={selectedModel?.id === m.id}
                          onClick={() => openWorkspace(m as Model)}
                          comingSoon={m._comingSoon || m.comingSoon}
                        />
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* ASSETS VIEW */}
        {view === 'assets' && (
          <AssetGrid
            assets={assets}
            models={models}
            projects={projects}
            loading={assetsLoading}
            onDelete={deleteAsset}
            onGenerate={() => setView('models')}
            onSendToImg2Img={sendToImg2Img}
            onSendToImg2Vid={sendToImg2Vid}
            onMoveToProject={moveAssetToProject}
          />
        )}

        {/* PROJECTS VIEW */}
        {view === 'projects' && (
          <ProjectsView
            projects={projects}
            assets={assets}
            models={models}
            assetsLoading={assetsLoading}
            onCreateProject={createProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onDeleteAsset={deleteAsset}
            onMoveToProject={moveAssetToProject}
            onGenerate={() => setView('models')}
            onSendToImg2Img={sendToImg2Img}
            onSendToImg2Vid={sendToImg2Vid}
          />
        )}
      </div>

      {/* ── WORKSPACE OVERLAY ── */}
      {workspaceOpen && selectedModel && (
        <div
          className="fixed inset-0 z-40 flex"
          style={{ background: 'rgba(8,7,6,0.78)', backdropFilter: 'blur(14px)' }}
        >
          {/* Close on scrim click */}
          <div className="absolute inset-0" onClick={closeWorkspace} />

          <div
            className="relative z-10 flex w-full animate-fade-in"
            style={{ transform: 'none' }}
          >
            {/* Left: canvas / output */}
            <div className="flex-1 flex flex-col p-8">
              <div
                className="flex-1 rounded-[20px] overflow-hidden relative flex items-center justify-center"
                style={{ border: '1.5px solid rgba(255,255,255,0.08)' }}
              >
                {/* Model gradient bg */}
                {(() => {
                  const art = (MODEL_ART_MAP as Record<string, { gradient: string; initial: string }>)[selectedModel.slug] ?? { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: '??' }
                  return <div className="absolute inset-0" style={{ background: art.gradient, opacity: result ? 0.15 : 1, transition: 'opacity 0.5s' }} />
                })()}

                {/* Empty state */}
                {!result && !pendingImage && !pendingVideo && (
                  <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-[14px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', fontSize: 24 }}>
                      {(MODEL_ART_MAP as any)[selectedModel.slug]?.initial ?? '??'}
                    </div>
                    <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
                      {selectedModel.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, maxWidth: 240 }}>
                      Fill in the template and hit Generate
                    </div>
                  </div>
                )}

                {/* Generating spinner */}
                {(pendingImage || pendingVideo) && !result && (
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full pv-spin" style={{ border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.8)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500 }}>
                      {pendingVideo ? 'Rendering video…' : 'Generating…'}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>You can close this — we'll notify you when done</p>
                    {pendingVideo && (
                      <button onClick={() => { if (videoPollerRef.current) clearInterval(videoPollerRef.current); setPendingVideo(null); setGenerateError(null) }}
                        style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', cursor: 'pointer', marginTop: 4 }}>
                        Cancel render
                      </button>
                    )}
                  </div>
                )}

                {/* Result */}
                {result && (
                  <div className="absolute inset-0 flex flex-col">
                    {result.isVideo ? (
                      <video src={result.url} controls autoPlay loop className="w-full h-full object-contain rounded-[18px]" />
                    ) : (
                      <img src={result.url} alt={result.prompt} className="w-full h-full object-contain rounded-[18px]" />
                    )}
                  </div>
                )}

                {/* Close button */}
                <button
                  onClick={closeWorkspace}
                  className="absolute top-4 right-4 flex items-center justify-center rounded-[8px] transition-all"
                  style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* Post-result action buttons */}
              {result && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  <button onClick={() => downloadFile(result.url, result.isVideo)}
                    className="px-4 py-2 rounded-[10px] text-sm font-semibold transition-all"
                    style={{ background: '#18140e', color: '#f2ede4' }}>
                    Download
                  </button>
                  {!result.isVideo && (
                    <>
                      <button onClick={() => sendToImg2Img(result.url)}
                        className="px-4 py-2 rounded-[10px] text-sm font-semibold transition-all"
                        style={{ background: 'var(--pv-surface)', color: 'var(--pv-text2)', border: '1px solid var(--pv-border)' }}>
                        img2img →
                      </button>
                      <button onClick={() => sendToImg2Vid(result.url)}
                        className="px-4 py-2 rounded-[10px] text-sm font-semibold transition-all"
                        style={{ background: 'var(--pv-surface)', color: 'var(--pv-text2)', border: '1px solid var(--pv-border)' }}>
                        img2vid →
                      </button>
                    </>
                  )}
                  <button onClick={() => { setResult(null); setGenerateError(null) }}
                    className="px-4 py-2 rounded-[10px] text-sm font-semibold transition-all"
                    style={{ background: 'var(--pv-surface)', color: 'var(--pv-text2)', border: '1px solid var(--pv-border)' }}>
                    ← New prompt
                  </button>
                </div>
              )}
            </div>

            {/* Right: form panel */}
            <div
              className="flex flex-col overflow-hidden flex-shrink-0"
              style={{ width: 420, background: 'var(--pv-surface)', borderLeft: '1px solid var(--pv-border)' }}
            >
              {/* Model header */}
              <div className="px-7 pt-6 pb-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--pv-border)' }}>
                <div className="flex items-center gap-3.5">
                  <div className="rounded-[12px] overflow-hidden flex-shrink-0" style={{ width: 48, height: 48 }}>
                    <div className="w-full h-full flex items-center justify-center text-xl" style={{ background: (MODEL_ART_MAP as any)[selectedModel.slug]?.gradient ?? 'linear-gradient(145deg,#222,#3a3a3a)' }}>
                      {(MODEL_ART_MAP as any)[selectedModel.slug]?.initial ?? ''}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
                      {selectedModel.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--pv-text2)', marginTop: 2 }}>
                      {selectedModel.provider} · {selectedModel.supported_gen_types.join(' + ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form body */}
              <div className="flex-1 overflow-y-auto px-7 py-5">
                {/* Gen type picker (multi-type models) */}
                {!selectedGenType && selectedModel.supported_gen_types.length > 1 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--pv-text3)' }}>
                      Choose generation type
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedModel.supported_gen_types.map(gt => (
                        <button
                          key={gt}
                          onClick={() => selectGenType(gt)}
                          className="p-4 rounded-[10px] text-left transition-all cursor-pointer"
                          style={{ border: '1.5px solid var(--pv-border)', background: 'var(--pv-surface2)', color: 'var(--pv-text2)' }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pv-text)' }}>{gt}</div>
                          <div style={{ fontSize: 11.5, marginTop: 2 }}>Use {selectedModel.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Template loading */}
                {selectedGenType && !template && (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 rounded-full pv-spin" style={{ border: '2px solid var(--pv-border)', borderTopColor: 'var(--pv-accent)' }} />
                  </div>
                )}

                {/* Template form */}
                {selectedGenType && template && (
                  <>
                    {generateError && (
                      <div className="mb-4 p-3 rounded-[10px] text-sm" style={{ background: '#fff1f0', border: '1px solid #ffc9c9', color: '#c0392b' }}>
                        {generateError}
                      </div>
                    )}
                    {projects.length > 0 && (
                      <div className="mb-4 flex items-center gap-2">
                        <span className="text-xs flex-shrink-0" style={{ color: 'var(--pv-text3)' }}>Save to</span>
                        <select
                          value={activeProjectId ?? ''}
                          onChange={e => setActiveProjectId(e.target.value || null)}
                          className="text-xs px-3 py-1.5 rounded-[10px] outline-none cursor-pointer transition-all flex-1"
                          style={{ border: '1px solid var(--pv-border)', background: 'var(--pv-surface2)', color: 'var(--pv-text)' }}
                        >
                          <option value="">No project</option>
                          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
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
            </div>
          </div>
        </div>
      )}

      {/* Existing overlays — keep exactly as-is */}
      {img2imgPickerUrl && (
        <Img2ImgPicker
          models={models.filter(m => m.supported_gen_types.includes('img2img'))}
          onPick={handleImg2ImgPick}
          onClose={() => setImg2imgPickerUrl(null)}
        />
      )}
      {img2vidPickerUrl && (
        <Img2ImgPicker
          title="Animate this image"
          subtitle="Choose a video model to animate your image"
          genLabel="img2vid"
          models={models.filter(m => m.supported_gen_types.includes('img2vid'))}
          onPick={handleImg2VidPick}
          onClose={() => setImg2vidPickerUrl(null)}
        />
      )}
      {lightboxAsset && (() => {
        const isVideo = lightboxAsset.gen_type === 'txt2vid' || lightboxAsset.gen_type === 'img2vid'
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setLightboxAsset(null)}>
            <div className="relative rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl" style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)' }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setLightboxAsset(null)} className="absolute top-4 right-4 text-xl leading-none cursor-pointer transition-colors" style={{ color: 'var(--pv-text3)' }}>×</button>
              <div className="mb-5">
                {isVideo
                  ? <video src={lightboxAsset.url} controls autoPlay loop className="rounded-xl w-full" />
                  : <img src={lightboxAsset.url} alt="" className="rounded-xl w-full" />
                }
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => downloadFile(lightboxAsset.url, isVideo)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer" style={{ background: '#18140e' }}>Download</button>
                {!isVideo && <button onClick={() => { setLightboxAsset(null); sendToImg2Img(lightboxAsset.url) }} className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)' }}>img2img →</button>}
                {!isVideo && <button onClick={() => { setLightboxAsset(null); sendToImg2Vid(lightboxAsset.url) }} className="px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)' }}>img2vid →</button>}
              </div>
            </div>
          </div>
        )
      })()}
      <GuidedTour active={tourActive} onFinish={() => { markTourSeen(); setTourActive(false) }} />
      {renderToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-fade-in" style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', color: 'var(--pv-text)' }}>
          <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--pv-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          <span>{renderToast}</span>
          <button onClick={() => setRenderToast(null)} className="ml-2 text-base leading-none cursor-pointer" style={{ color: 'var(--pv-text3)' }}>✕</button>
        </div>
      )}
    </div>
  )
}
