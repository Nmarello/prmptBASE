import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type React from 'react'
import { useNavigate } from 'react-router-dom'

function friendlyFalError(raw: unknown): string {
  // Coerce non-strings to something useful
  const rawStr: string = typeof raw === 'string'
    ? raw
    : (raw ? JSON.stringify(raw) : '')
  // Strip "fal.ai job failed: " prefix so inner content can be checked/parsed
  const stripped = rawStr.replace(/^fal\.ai job failed:\s*/, '')
  try {
    const parsed = JSON.parse(stripped)
    const detail = parsed?.detail?.[0] ?? parsed?.detail ?? parsed
    const type = detail?.type ?? parsed?.type ?? ''
    const msg  = detail?.msg  ?? parsed?.msg  ?? detail?.message ?? parsed?.message ?? ''
    if (type === 'downstream_service_error' || msg.toLowerCase().includes('overloaded') || msg.toLowerCase().includes('try again')) {
      return "The model's servers are under heavy load right now — not ours. We'll keep retrying for you — hit Generate again and we'll try a few more times automatically."
    }
    if (type === 'rate_limit' || msg.toLowerCase().includes('rate limit')) {
      return 'Rate limit reached. Please wait a moment before generating again.'
    }
    if (msg) return msg
  } catch {
    // not JSON — fall through
  }
  const s = stripped || rawStr
  if (s.toLowerCase().includes('overload') || s.toLowerCase().includes('try again later')) {
    return "The model's servers are under heavy load right now — not ours. We'll keep retrying for you — hit Generate again and we'll try a few more times automatically."
  }
  if (s.toLowerCase().includes('compute resources') || s.toLowerCase().includes('not enough compute') || s.toLowerCase().includes('runner_scheduling_failure') || s.toLowerCase().includes('failed after retries')) {
    return "The model ran out of resources on their end, not ours. We'll keep retrying for you — hit Generate again and we'll try a few more times automatically."
  }
  if (s) return s
  return 'Generation failed. Please try again.'
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
import SettingsDrawer from '../components/dashboard/SettingsDrawer'
import GuidedTour, { markTourSeen } from '../components/dashboard/GuidedTour'
import FirstRunTour, { hasSeenFirstRun, markFirstRunSeen, clearFirstRun } from '../components/dashboard/FirstRunTour'
import OnboardingModal from '../components/dashboard/OnboardingModal'
import { useLearningMode } from '../contexts/LearningModeContext'
import { useTheme } from '../contexts/ThemeContext'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import ModelDrawer from '../components/dashboard/ModelDrawer'
import ProviderLogo from '../components/dashboard/ProviderLogo'

type View = 'models' | 'builder' | 'assets' | 'projects'

const COMING_SOON_IMAGE: Partial<Model>[] = [
  { slug: 'cs-midjourney', name: 'Midjourney', provider: 'Midjourney', description: 'The gold standard for artistic AI image generation. Unmatched aesthetic quality.', supported_gen_types: ['txt2img'] },
  { slug: 'cs-firefly', name: 'Adobe Firefly', provider: 'Adobe', description: 'Commercially safe image generation built for creative professionals.', supported_gen_types: ['txt2img', 'img2img'] },
]

const COMING_SOON_VIDEO: Partial<Model>[] = [
  { slug: 'cs-veo3', name: 'Veo 3', provider: 'Google', description: "Google's flagship video model. State-of-the-art motion quality and prompt adherence.", supported_gen_types: ['txt2vid'] },
  { slug: 'cs-runway', name: 'Runway Gen-4', provider: 'Runway', description: 'The leading creative video AI. Gen-4 sets the bar for motion and cinematic quality.', supported_gen_types: ['txt2vid', 'img2vid'] },
  { slug: 'cs-pika', name: 'Pika', provider: 'Pika', description: 'Fast, expressive video generation built for social-first creators.', supported_gen_types: ['txt2vid', 'img2vid'] },
]

function PullIndicator({ distance, refreshing }: { distance: number; refreshing: boolean }) {
  if (distance === 0 && !refreshing) return null
  return (
    <div className="flex items-center justify-center flex-shrink-0 overflow-hidden" style={{
      height: refreshing ? 48 : distance,
      transition: (!refreshing && distance === 0) ? 'height 0.25s ease' : 'none',
    }}>
      <div className={refreshing ? 'pv-spin' : ''} style={{
        width: 20, height: 20, borderRadius: '50%',
        border: '2.5px solid var(--pv-accent)',
        borderTopColor: refreshing ? 'transparent' : 'var(--pv-accent)',
        opacity: refreshing ? 1 : Math.min(distance / 72, 1),
        transform: refreshing ? undefined : `rotate(${distance * 3}deg)`,
      }} />
    </div>
  )
}

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

const TIER_ORDER = ['newbie', 'creator', 'studio', 'pro']
const PRO_ONLY_SLUGS = ['sora2', 'sora2-txt2vid', 'sora2-img2vid', 'kling', 'kling-txt2vid', 'kling-img2vid']
const CREATOR_LIMIT = 10
const STUDIO_VIDEO_LIMIT = 5

type ModelStatus = 'active' | 'add' | 'next-month' | 'upgrade' | 'coming-soon'

function getModelStatus(
  model: Model,
  userTier: string,
  selectedIds: Set<string>,
): { status: ModelStatus; upgradeTier?: string } {
  if (model.coming_soon) return { status: 'coming-soon' }

  const tierIdx = TIER_ORDER.indexOf(userTier)

  // Pro-only models (sora2, kling) require pro even for studio
  if (PRO_ONLY_SLUGS.includes(model.slug)) {
    if (userTier !== 'pro') return { status: 'upgrade', upgradeTier: 'pro' }
    return { status: 'active' }
  }

  const isVideo = model.supported_gen_types.some(g => ['txt2vid', 'img2vid', 'vid2vid'].includes(g))
  const modelMinTierIdx = TIER_ORDER.indexOf(model.min_tier ?? 'newbie')

  // Pro: everything active
  if (userTier === 'pro') return { status: 'active' }

  // Studio
  if (userTier === 'studio') {
    if (!isVideo) return { status: 'active' } // all image models always active
    if (modelMinTierIdx > tierIdx) return { status: 'upgrade', upgradeTier: model.min_tier }
    if (selectedIds.has(model.id)) return { status: 'active' }
    // Count only selected video models for quota check
    // (selectedIds may include image models from before; video check is approximate here)
    if (selectedIds.size < STUDIO_VIDEO_LIMIT) return { status: 'add' }
    return { status: 'next-month' }
  }

  // Creator
  if (userTier === 'creator') {
    if (isVideo) return { status: 'upgrade', upgradeTier: 'studio' }
    if (modelMinTierIdx > tierIdx) return { status: 'upgrade', upgradeTier: model.min_tier }
    if (selectedIds.has(model.id)) return { status: 'active' }
    if (selectedIds.size < CREATOR_LIMIT) return { status: 'add' }
    return { status: 'next-month' }
  }

  // Free (newbie)
  if (modelMinTierIdx > tierIdx) {
    const upgradeTier = isVideo ? 'studio' : 'creator'
    return { status: 'upgrade', upgradeTier }
  }
  return { status: 'active' }
}

export default function Dashboard() {
  const { user } = useAuth()
  const { mode: learningMode } = useLearningMode()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const userInitial = (user?.user_metadata?.full_name ?? user?.email ?? '?')[0].toUpperCase()
  const [view, setView] = useState<View>('models')
  const [tourActive, setTourActive] = useState(false)
  const [firstRunStep, setFirstRunStep] = useState<number>(-1)
  const [userTier, setUserTier] = useState('newbie')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)

  const [models, setModels] = useState<Model[]>([])
  const [selectedModelIds, setSelectedModelIds] = useState<Set<string>>(new Set())
  const [pickerLockedUntil, setPickerLockedUntil] = useState<Date | null>(null)
  const [modelFilter, setModelFilter] = useState<'all' | 'images' | 'videos'>('all')
  const [modelSearch, setModelSearch] = useState('')
  const [_mediaTab, _setMediaTab] = useState<'image' | 'video'>('image')
  const [_selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [selectedGenType, setSelectedGenType] = useState<GenType | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ url: string; prompt: string; revised_prompt?: string; isVideo?: boolean } | null>(null)
  const [lightboxAsset, setLightboxAsset] = useState<Asset | null>(null)
  const PENDING_VIDEO_KEY = 'prmptVAULT_pendingVideo'
  const [pendingVideo, setPendingVideoRaw] = useState<{ assetId: string; operationName: string; provider: 'google' | 'fal.ai'; startedAt: number; isImage?: boolean } | null>(() => {
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
  function setPendingVideo(val: { assetId: string; operationName: string; provider: 'google' | 'fal.ai'; startedAt: number; isImage?: boolean } | null) {
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
  const [renderingModelSlug, setRenderingModelSlug] = useState<string | null>(null)
  const [renderToast, setRenderToast] = useState<string | null>(null)
  const [, setNotifTick] = useState(0) // forces bell re-render after addNotification

  const [projects, setProjects] = useState<UserProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [addingProject, setAddingProject] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [assetsLoading, setAssetsLoading] = useState(false)
  const [showcase, setShowcase] = useState<{ url: string; gen_type: string | null }[]>([])

  const [img2imgPickerUrl, setImg2imgPickerUrl] = useState<string | null>(null)
  const [img2imgInitialValues, setImg2imgInitialValues] = useState<Record<string, unknown> | undefined>(undefined)
  const [img2vidPickerUrl, setImg2vidPickerUrl] = useState<string | null>(null)
  const [_sidebarOpen, setSidebarOpen] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [drawerModel, setDrawerModel] = useState<Model | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const MODEL_ART_MAP = {
    'dalle':              { gradient: 'linear-gradient(145deg,#c0392b,#e8570a,#f5a623)', initial: 'D3' },
    'flux-schnell':       { gradient: 'linear-gradient(145deg,#003566,#0096c7,#48cae4)', initial: 'FS' },
    'flux-dev':           { gradient: 'linear-gradient(145deg,#3d0066,#7b2ff7,#c084fc)', initial: 'FD' },
    'flux-pro':           { gradient: 'linear-gradient(145deg,#00004d,#0050ff,#60a5fa)', initial: 'FP' },
    'flux-pro-ultra':     { gradient: 'linear-gradient(145deg,#050505,#0f0f1a,#1a1a3e)', initial: 'FU' },
    'flux-dev-img2img':   { gradient: 'linear-gradient(145deg,#004d26,#00a550,#57cc99)', initial: 'F2' },
    'flux-kontext-pro':   { gradient: 'linear-gradient(145deg,#1a0033,#4400aa,#8855ff)', initial: 'FK' },
    'recraft-v4-pro':     { gradient: 'linear-gradient(145deg,#3d1a00,#a05000,#e8a020)', initial: 'RV' },
    'nano-banana':        { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', initial: 'NB' },
    'nano-banana-edit':   { gradient: 'linear-gradient(145deg,#003322,#007755,#00cc88)', initial: 'NE' },
    'kling':              { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
    'kling-txt2vid':      { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
    'kling-img2vid':      { gradient: 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)', initial: 'KL' },
    'luma':               { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
    'luma-txt2vid':       { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
    'luma-img2vid':       { gradient: 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)', initial: 'LR' },
    'minimax-txt2vid':    { gradient: 'linear-gradient(145deg,#002b36,#007070,#00c9a7)', initial: 'MM' },
    'sora':               { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#3d3d7a)', initial: 'SR' },
    'sora2':              { gradient: 'linear-gradient(145deg,#0a0a14,#1a1a3e,#3d3d7a)', initial: 'SR' },
  } as const

  const SLUG_BRAND_MAP: Record<string, string> = {
    'dalle':                    'OpenAI',
    'gpt-image-1':              'OpenAI',
    'sora':                     'OpenAI',
    'sora2':                    'OpenAI',
    'sora2-img2vid':            'OpenAI',
    'flux-schnell':             'Black Forest Labs',
    'flux-dev':                 'Black Forest Labs',
    'flux-pro':                 'Black Forest Labs',
    'flux-pro-ultra':           'Black Forest Labs',
    'flux-dev-img2img':         'Black Forest Labs',
    'flux-kontext-pro':         'Black Forest Labs',
    'flux-kontext-dev':         'Black Forest Labs',
    'flux2-pro':                'Black Forest Labs',
    'recraft-v4-pro':           'Recraft',
    'recraft-v3':               'Recraft',
    'nano-banana':              'Google',
    'nano-banana-edit':         'Google',
    'imagen-4.0-generate-001':  'Google',
    'veo-2.0-generate-001':     'Google',
    'kling':                    'Kuaishou',
    'kling-txt2vid':            'Kuaishou',
    'kling-img2vid':            'Kuaishou',
    'luma':                     'Luma AI',
    'luma-txt2vid':             'Luma AI',
    'luma-img2vid':             'Luma AI',
    'minimax-txt2vid':          'MiniMax',
    'ideogram-v3':              'Ideogram',
    'hidream-fast':             'HiDream',
    'hidream-full':             'HiDream',
    'seedream-45':              'ByteDance',
    'seedance-1-pro':           'ByteDance',
    'sd35-medium':              'Stability AI',
  }

  // Latest render per model slug (includes videos; showcase fallback for unused models)
  const latestRenderBySlug = useMemo(() => {
    const slugById = Object.fromEntries(models.map(m => [m.id, m.slug]))
    const map: Record<string, { url: string; isVideo: boolean }> = {}
    for (const asset of assets) {
      if (!asset.model_id) continue
      const slug = slugById[asset.model_id]
      if (slug && !map[slug]) {
        const isVideo = asset.gen_type === 'txt2vid' || asset.gen_type === 'img2vid'
        map[slug] = { url: asset.url, isVideo }
      }
    }
    return map
  }, [assets, models, showcase])

  const refreshModels = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('models').select('*').or('is_active.eq.true,coming_soon.eq.true').order('sort_order')
    if (data) setModels(data as Model[])
  }, [user])

  async function handleAddModel(modelId: string) {
    if (!user) return
    const isLocked = pickerLockedUntil !== null && pickerLockedUntil > new Date()
    if (isLocked) {
      setSettingsOpen(true)
      return
    }
    await supabase.from('user_model_selections').upsert({ user_id: user.id, model_id: modelId })
    setSelectedModelIds(prev => new Set([...prev, modelId]))
  }

  // Pull-to-refresh for generate view (declared after refreshModels)
  const { scrollRef: generateScrollRef, distance: generatePullDist, refreshing: generateRefreshing } = usePullToRefresh(refreshModels)

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
    supabase.from('profiles').select('tier, model_picker_locked_until').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setUserTier(data.tier)
          if (data.model_picker_locked_until) setPickerLockedUntil(new Date(data.model_picker_locked_until))
          if (data.tier === 'creator' || data.tier === 'studio') {
            supabase.from('user_model_selections').select('model_id').eq('user_id', user.id)
              .then(({ data: sels }) => {
                if (sels) setSelectedModelIds(new Set(sels.map(s => s.model_id)))
              })
          }
        }
      })
    supabase.from('models').select('*').or('is_active.eq.true,coming_soon.eq.true').order('sort_order')
      .then(({ data }) => { if (data) setModels(data as Model[]) })
    supabase.from('showcase_assets').select('url,gen_type').order('created_at', { ascending: false }).limit(80)
      .then(({ data }) => { if (data) setShowcase(data as { url: string; gen_type: string | null }[]) })
    supabase.from('user_projects').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setProjects(data as UserProject[]) })
    loadAssets()
  }, [user, loadAssets])

  useEffect(() => {
    if (!user) return
    supabase.from('profiles').select('display_name').eq('id', user.id).single()
      .then(({ data }) => {
        const needs = !data?.display_name || !localStorage.getItem('prmptVAULT_tos_accepted')
        setShowOnboarding(needs)
        setOnboardingChecked(true)
      })
  }, [user?.id])

  useEffect(() => {
    if (learningMode === 'guided') {
      setTourActive(true)
    }
  }, [learningMode])

  // ── First-run tour auto-trigger — only after onboarding check resolves ───
  useEffect(() => {
    if (!onboardingChecked || showOnboarding) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('tour') === 'restart') {
      clearFirstRun()
      window.history.replaceState({}, '', '/dashboard')
    }
    if (!hasSeenFirstRun()) setFirstRunStep(0)
  }, [onboardingChecked, showOnboarding])

  // Step 1 → 2: DALL-E drawer opened
  useEffect(() => {
    if (firstRunStep === 1 && drawerModel?.slug === 'dalle') setFirstRunStep(2)
  }, [drawerModel, firstRunStep])

  // Step 2 → 3: workspace opened (Generate clicked in drawer)
  useEffect(() => {
    if (firstRunStep === 2 && workspaceOpen) setFirstRunStep(3)
  }, [workspaceOpen, firstRunStep])

  // Step 3 → 4: gen type selected (txt2img chosen)
  useEffect(() => {
    if (firstRunStep === 3 && selectedGenType) setFirstRunStep(4)
  }, [selectedGenType, firstRunStep])

  // Step 9 → 10: generation started
  useEffect(() => {
    if (firstRunStep === 9 && submitting) setFirstRunStep(10)
  }, [submitting, firstRunStep])

  // Step 10 → 11: result arrived
  useEffect(() => {
    if (firstRunStep === 10 && result) setFirstRunStep(11)
  }, [result, firstRunStep])

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
    // When flux-dev card is used for img2img, swap to the flux-dev-img2img model
    let modelId = selectedModel!.id
    if (selectedModel!.slug === 'flux-dev' && gt === 'img2img') {
      const img2imgModel = models.find(m => m.slug === 'flux-dev-img2img')
      if (img2imgModel) {
        setSelectedModel(img2imgModel)
        modelId = img2imgModel.id
      }
    }
    const { data } = await supabase
      .from('templates')
      .select('*')
      .eq('model_id', modelId)
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
    setRenderingModelSlug(selectedModel.slug)
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
            model_slug: selectedModel.slug,
            prompt_id: promptRecord?.id ?? null,
            size: values.size ?? '1024x1024',
            quality: values.quality ?? (selectedModel.slug === 'gpt-image-1' ? 'auto' : 'standard'),
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

      // Async pending (video or slow image model like hidream-full) — start polling
      if (data.status === 'pending') {
        const provider = data.provider === 'fal.ai' ? 'fal.ai' : 'google'
        setPendingVideo({ assetId: data.asset?.id, operationName: data.operation_name, provider, startedAt: Date.now(), isImage: !!data.is_image })
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
      setRenderingModelSlug(null)
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
      setRenderingModelSlug(null)
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
        setRenderingModelSlug(null)
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
          setRenderingModelSlug(null)
          setGenerateError(`Video generation failed: ${friendlyFalError(data.error)}`)
          return
        }
        const completedUrl = data.video_url || data.image_url
        const isImageResult = !!data.image_url && !data.video_url
        if (data.status === 'complete' && completedUrl) {
          const pendingAssetId = pendingVideo?.assetId
          if (activeProjectId && pendingAssetId) {
            await supabase.from('assets').update({ project_id: activeProjectId }).eq('id', pendingAssetId)
          }
          setPendingVideo(null)
          setRenderingModelSlug(null)
          setResult({ url: completedUrl, prompt: '', isVideo: !isImageResult })
          loadAssets()
          const readyMsg = isImageResult ? 'Your image is ready!' : 'Your video is ready!'
          const notifType = isImageResult ? 'image_ready' : 'video_ready'
          pushNotification({ type: notifType, message: readyMsg, modelName: selectedModel?.name ?? 'Model', assetUrl: completedUrl, assetId: pendingAssetId })
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(readyMsg, { body: `${selectedModel?.name ?? 'Model'} · prmptVAULT`, icon: '/favicon.ico' })
          }
          setRenderToast(readyMsg)
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

  async function createProject(name: string, description: string): Promise<UserProject | null> {
    if (!user) return null
    const { data } = await supabase
      .from('user_projects')
      .insert({ user_id: user.id, name, description: description || null })
      .select()
      .single()
    if (data) setProjects((prev) => [data as UserProject, ...prev])
    return (data as UserProject) ?? null
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
    setView('models')
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') setWorkspaceOpen(false) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--pv-bg)', color: 'var(--pv-text)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Icon Sidebar ── */}
      <aside className="hidden sm:flex flex-col items-center py-4 gap-1 flex-shrink-0 relative z-10" style={{ width: '60px', background: 'var(--pv-surface)', borderRight: '1px solid var(--pv-border)' }}>
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

        {/* Bottom actions */}
        <div className="mt-auto flex flex-col items-center gap-1">
          {/* Theme toggle */}
          <SbBtn tip={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
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
          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
            data-tour="settings-btn"
            className="flex items-center justify-center rounded-full cursor-pointer transition-opacity hover:opacity-80 flex-shrink-0"
            style={{ width: 30, height: 30, background: 'var(--pv-accent)', color: '#fff', fontSize: 12, fontWeight: 700, userSelect: 'none', border: 'none' }}
          >
            {userInitial}
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* GENERATE VIEW */}
        {view === 'models' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-7 pt-4 sm:pt-6 pb-4 flex-shrink-0">
              <div className="flex items-end justify-between mb-4">
                <div>
                  <h1 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.05em' }}>
                    Generate
                  </h1>
                  <p style={{ fontSize: 13, color: 'var(--pv-text3)', marginTop: 2 }}>Pick a model and start creating</p>
                </div>
              </div>
              {/* Filter pills + search */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {(['all', 'images', 'videos'] as const).map(f => {
                    const counts = {
                      all: models.length,
                      images: models.filter(m => m.supported_gen_types.some(g => ['txt2img','img2img','multi_img2img'].includes(g))).length,
                      videos: models.filter(m => m.supported_gen_types.some(g => g === 'txt2vid' || g === 'img2vid')).length,
                    }
                    const active = modelFilter === f
                    return (
                      <button
                        key={f}
                        onClick={() => setModelFilter(f)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer"
                        style={active
                          ? { background: 'var(--pv-accent)', color: '#fff' }
                          : { background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)' }
                        }
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span className="text-xs opacity-70">{counts[f]}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="relative flex items-center">
                  <svg className="absolute left-2.5 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--pv-text3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
                  </svg>
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={e => setModelSearch(e.target.value)}
                    placeholder="Search…"
                    className="text-sm pl-7 pr-3 py-1.5 rounded-full pv-placeholder outline-none w-24 sm:w-36"
                    style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', color: 'var(--pv-text)' }}
                  />
                </div>
              </div>
            </div>

            {/* Scrollable model rows */}
            <div ref={generateScrollRef} className="flex-1 overflow-y-auto px-4 sm:px-7 pb-28 sm:pb-10 space-y-8">
              <PullIndicator distance={generatePullDist} refreshing={generateRefreshing} />
              {/* Your Models row (active selections) */}
              {(() => {
                if (modelSearch) return null
                // Pro/newbie: no picker, so this row is N/A. Creator/studio: show selected models.
                if (!['creator', 'studio'].includes(userTier)) return null
                const yourModels = models.filter(m =>
                  selectedModelIds.has(m.id) && !m.coming_soon && m.slug !== 'flux-dev-img2img'
                )
                if (yourModels.length === 0) return null
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
                        Your Models
                      </h2>
                      <button
                        onClick={() => setSettingsOpen(true)}
                        style={{ fontSize: 12, color: 'var(--pv-text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                      >
                        Manage →
                      </button>
                    </div>
                    <div className="flex gap-3.5 overflow-x-auto pb-3">
                      {yourModels.map((m) => (
                        <ModelCard
                          key={m.id}
                          model={m}
                          userTier={userTier}
                          selected={selectedModel?.id === m.id}
                          onClick={() => setDrawerModel(m)}
                          rendering={renderingModelSlug === m.slug}
                          latestRenderUrl={latestRenderBySlug[m.slug]?.url}
                          latestRenderIsVideo={latestRenderBySlug[m.slug]?.isVideo}
                          modelStatus="active"
                        />
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Image Models row */}
              {(() => {
                if (modelFilter === 'videos') return null
                // Merge flux-dev-img2img into flux-dev as a single card
                let imgModels: any[] = models
                  .filter(m => m.supported_gen_types.some(g => ['txt2img','img2img','multi_img2img'].includes(g)))
                  .filter(m => m.slug !== 'flux-dev-img2img')
                  .map(m => m.slug === 'flux-dev'
                    ? { ...m, supported_gen_types: [...new Set([...m.supported_gen_types, 'img2img'])] }
                    : m
                  )
                imgModels = imgModels.map(m => m.coming_soon ? { ...m, _comingSoon: true } : m)
                imgModels.push(...COMING_SOON_IMAGE.map(m => ({ ...m, _comingSoon: true })))
                // active first, then add, then next-month, then upgrade, then coming-soon
                const statusOrder = { active: 0, add: 1, 'next-month': 2, upgrade: 3, 'coming-soon': 4 }
                imgModels.sort((a: any, b: any) => {
                  const sa = getModelStatus(a, userTier, selectedModelIds).status
                  const sb = getModelStatus(b, userTier, selectedModelIds).status
                  return (statusOrder[sa] ?? 5) - (statusOrder[sb] ?? 5)
                })
                if (modelSearch) imgModels = imgModels.filter((m: any) => m.name?.toLowerCase().includes(modelSearch.toLowerCase()) || m.provider?.toLowerCase().includes(modelSearch.toLowerCase()))
                if (imgModels.length === 0) return null
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
                        Image Models
                      </h2>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pv-text3)', background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', padding: '2px 8px', borderRadius: 20 }}>
                        {imgModels.filter((m: any) => !m._comingSoon).length} available
                      </span>
                    </div>
                    <div className="flex gap-3.5 overflow-x-auto pb-3">
                      {imgModels.map((m: any) => {
                        const { status, upgradeTier } = m._comingSoon ? { status: 'coming-soon' as const, upgradeTier: undefined } : getModelStatus(m as Model, userTier, selectedModelIds)
                        return (
                          <ModelCard
                            key={m.id ?? m.slug}
                            model={m as Model}
                            userTier={userTier}
                            selected={selectedModel?.id === m.id}
                            onClick={() => setDrawerModel(m as Model)}
                            comingSoon={m._comingSoon || m.comingSoon}
                            rendering={renderingModelSlug === m.slug}
                            latestRenderUrl={latestRenderBySlug[m.slug]?.url}
                            latestRenderIsVideo={latestRenderBySlug[m.slug]?.isVideo}
                            dataTour={m.slug === 'dalle' ? 'dalle-card' : undefined}
                            modelStatus={status}
                            upgradeTier={upgradeTier}
                            onAdd={() => handleAddModel(m.id)}
                            onUpgrade={() => navigate(`/pricing?highlight=${upgradeTier ?? 'creator'}`)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Video Models row */}
              {(() => {
                if (modelFilter === 'images') return null
                let vidModels: any[] = models.filter(m => m.supported_gen_types.some(g => g === 'txt2vid' || g === 'img2vid' || g === 'vid2vid'))
                vidModels = vidModels.map(m => m.coming_soon ? { ...m, _comingSoon: true } : m)
                vidModels.push(...COMING_SOON_VIDEO.map(m => ({ ...m, _comingSoon: true })))
                const statusOrder = { active: 0, add: 1, 'next-month': 2, upgrade: 3, 'coming-soon': 4 }
                vidModels.sort((a: any, b: any) => {
                  const sa = getModelStatus(a, userTier, selectedModelIds).status
                  const sb = getModelStatus(b, userTier, selectedModelIds).status
                  return (statusOrder[sa] ?? 5) - (statusOrder[sb] ?? 5)
                })
                if (modelSearch) vidModels = vidModels.filter((m: any) => m.name?.toLowerCase().includes(modelSearch.toLowerCase()) || m.provider?.toLowerCase().includes(modelSearch.toLowerCase()))
                if (vidModels.length === 0) return null
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
                        Video Models
                      </h2>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pv-text3)', background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', padding: '2px 8px', borderRadius: 20 }}>
                        {vidModels.filter((m: any) => !m._comingSoon).length} available
                      </span>
                    </div>
                    <div className="flex gap-3.5 overflow-x-auto pb-3">
                      {vidModels.map((m: any) => {
                        const { status, upgradeTier } = m._comingSoon ? { status: 'coming-soon' as const, upgradeTier: undefined } : getModelStatus(m as Model, userTier, selectedModelIds)
                        return (
                          <ModelCard
                            key={m.id ?? m.slug}
                            model={m as Model}
                            userTier={userTier}
                            selected={selectedModel?.id === m.id}
                            onClick={() => setDrawerModel(m as Model)}
                            comingSoon={m._comingSoon || m.comingSoon}
                            rendering={renderingModelSlug === m.slug}
                            latestRenderUrl={latestRenderBySlug[m.slug]?.url}
                            latestRenderIsVideo={latestRenderBySlug[m.slug]?.isVideo}
                            modelStatus={status}
                            upgradeTier={upgradeTier}
                            onAdd={() => handleAddModel(m.id)}
                            onUpgrade={() => navigate(`/pricing?highlight=${upgradeTier ?? 'studio'}`)}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

              {/* Featured row */}
              {!modelSearch && (() => {
                const FEATURED_SLUGS = ['flux-pro-ultra', 'recraft-v4-pro', 'luma-txt2vid', 'flux-kontext-pro']
                const featuredModels = FEATURED_SLUGS
                  .map(slug => models.find(m => m.slug === slug))
                  .filter(Boolean) as Model[]
                if (featuredModels.length === 0) return null
                return (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
                        Featured
                      </h2>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: 'linear-gradient(90deg,#0050ff18,#7b2ff718)', border: '1px solid #0050ff30', color: 'var(--pv-accent)' }}>
                        Staff picks
                      </span>
                    </div>
                    <div className="flex gap-3.5 overflow-x-auto pb-3">
                      {featuredModels.map((m) => {
                        const { status, upgradeTier } = getModelStatus(m, userTier, selectedModelIds)
                        return (
                          <ModelCard
                            key={m.id}
                            model={m}
                            userTier={userTier}
                            selected={selectedModel?.id === m.id}
                            onClick={() => setDrawerModel(m)}
                            rendering={renderingModelSlug === m.slug}
                            latestRenderUrl={latestRenderBySlug[m.slug]?.url}
                            latestRenderIsVideo={latestRenderBySlug[m.slug]?.isVideo}
                            modelStatus={status}
                            upgradeTier={upgradeTier}
                            onAdd={() => handleAddModel(m.id)}
                            onUpgrade={() => navigate(`/pricing?highlight=${upgradeTier ?? 'creator'}`)}
                          />
                        )
                      })}
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
            showcaseAssets={showcase}
            onDelete={deleteAsset}
            onGenerate={() => setView('models')}
            onRefresh={loadAssets}
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
            onRefresh={loadAssets}
            onSendToImg2Img={sendToImg2Img}
            onSendToImg2Vid={sendToImg2Vid}
          />
        )}
      </div>

      {/* ── Model Drawer ── */}
      {drawerModel && (() => {
        const art = (MODEL_ART_MAP as Record<string, { gradient: string; initial: string }>)[drawerModel.slug]
          ?? { gradient: 'linear-gradient(145deg,#222,#3a3a3a)', initial: drawerModel.name.slice(0,2).toUpperCase() }
        const brand = SLUG_BRAND_MAP[drawerModel.slug] ?? drawerModel.provider
        const drawerAssets = assets.filter(a => a.model_id === drawerModel.id)
        return (
          <ModelDrawer
            model={drawerModel}
            assets={drawerAssets}
            modelArt={art}
            brandName={brand}
            onClose={() => setDrawerModel(null)}
            onGenerate={() => { setDrawerModel(null); openWorkspace(drawerModel) }}
            onViewAsset={(asset) => setLightboxAsset(asset)}
            onDeleteAsset={deleteAsset}
            onSendToImg2Img={(url) => { setDrawerModel(null); sendToImg2Img(url) }}
            onSendToImg2Vid={(url) => { setDrawerModel(null); sendToImg2Vid(url) }}
          />
        )
      })()}

      {/* ── Settings Drawer ── */}
      {settingsOpen && <SettingsDrawer onClose={() => setSettingsOpen(false)} />}

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around flex-shrink-0"
        style={{ background: 'var(--pv-surface)', borderTop: '1px solid var(--pv-border)', height: 'calc(56px + env(safe-area-inset-bottom))', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {([
          { id: 'models', tip: 'Generate', icon: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/> },
          { id: 'assets', tip: 'Assets', icon: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></> },
          { id: 'projects', tip: 'Projects', icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/> },
        ] as { id: View; tip: string; icon: React.ReactNode }[]).map(({ id, tip, icon }) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className="flex flex-col items-center gap-0.5 py-1 px-4 cursor-pointer transition-opacity"
            style={{ color: view === id ? 'var(--pv-accent)' : 'var(--pv-text3)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
            <span className="text-[10px] font-medium">{tip}</span>
          </button>
        ))}
        <NotificationBell
          inBottomNav
          onViewAsset={(assetId, _assetUrl, _isVideo) => {
            const asset = assets.find((a) => a.id === assetId)
            if (asset) { setLightboxAsset(asset) } else { setView('assets'); loadAssets() }
          }}
        />
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          data-tour="settings-btn"
          className="flex flex-col items-center gap-0.5 py-1 px-4 cursor-pointer transition-opacity"
          style={{ color: settingsOpen ? 'var(--pv-accent)' : 'var(--pv-text3)', background: 'none', border: 'none', fontFamily: 'inherit' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <span className="text-[10px] font-medium">Account</span>
        </button>
      </nav>

      {/* ── WORKSPACE OVERLAY ── */}
      {workspaceOpen && selectedModel && (
        <div
          className="fixed inset-0 z-40 flex"
          style={{ background: 'rgba(8,7,6,0.78)', backdropFilter: 'blur(14px)' }}
        >
          {/* Close on scrim click */}
          <div className="absolute inset-0" onClick={closeWorkspace} />

          <div
            className="relative z-10 flex flex-col sm:flex-row w-full animate-fade-in overflow-y-auto sm:overflow-hidden"
            style={{ transform: 'none' }}
          >
            {/* Left: canvas / output */}
            <div className="flex-1 flex flex-col p-4 sm:p-8 min-h-[45vw] sm:min-h-0">
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
                {!result && !(selectedModel?.slug === renderingModelSlug && (pendingImage || pendingVideo)) && (
                  <div className="relative z-10 flex flex-col items-center gap-3 text-center">
                    <div className="w-14 h-14 rounded-[14px] flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <ProviderLogo slug={selectedModel.slug} size={32} />
                    </div>
                    <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>
                      {selectedModel.name}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, maxWidth: 240 }}>
                      Fill in the template and hit Generate
                    </div>
                  </div>
                )}

                {/* Generating spinner — only for the model that is actually rendering */}
                {(pendingImage || pendingVideo) && !result && selectedModel?.slug === renderingModelSlug && (
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full pv-spin" style={{ border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.8)' }} />
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500 }}>
                      {pendingVideo && !pendingVideo.isImage ? 'Rendering video…' : 'Generating…'}
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
                  className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-[8px] transition-all hover:opacity-90"
                  style={{ width: 32, height: 32, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.85)' }}
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
              className="flex flex-col overflow-hidden flex-shrink-0 w-full sm:w-[420px] border-t sm:border-t-0 sm:border-l"
              style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }}
            >
              {/* Model header */}
              <div className="px-4 sm:px-7 pt-4 sm:pt-6 pb-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--pv-border)' }}>
                <div className="flex items-center gap-3.5">
                  <div className="rounded-[12px] overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ width: 48, height: 48, background: (MODEL_ART_MAP as any)[selectedModel.slug]?.gradient ?? 'linear-gradient(145deg,#222,#3a3a3a)' }}>
                    <ProviderLogo slug={selectedModel.slug} size={28} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
                      {selectedModel.name}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--pv-text2)', marginTop: 2 }}>
                      {SLUG_BRAND_MAP[selectedModel.slug] ?? selectedModel.provider} · {selectedModel.supported_gen_types.join(' + ')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form body */}
              <div key={selectedModel.slug} className="flex-1 overflow-y-auto px-4 sm:px-7 py-5">
                {/* Gen type picker (multi-type models) */}
                {!selectedGenType && selectedModel.supported_gen_types.length > 1 && (
                  <div data-tour="gentype-picker">
                    <p className="text-xs font-medium mb-3" style={{ color: 'var(--pv-text3)' }}>
                      Choose generation type
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.supported_gen_types.map(gt => (
                        <button
                          key={gt}
                          onClick={() => selectGenType(gt)}
                          className="px-4 py-2 rounded-[8px] text-sm font-medium transition-all cursor-pointer hover:opacity-90"
                          style={{ border: '1px solid var(--pv-border)', background: 'var(--pv-surface2)', color: 'var(--pv-text)' }}
                        >
                          {GEN_TYPE_LABELS[gt as GenType] ?? gt}
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
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--pv-text3)' }}>Save to</span>
                      {addingProject ? (
                        <>
                          <input
                            autoFocus
                            type="text"
                            value={newProjectName}
                            onChange={e => setNewProjectName(e.target.value)}
                            onKeyDown={async e => {
                              if (e.key === 'Enter' && newProjectName.trim()) {
                                const created = await createProject(newProjectName.trim(), '')
                                if (created) setActiveProjectId(created.id)
                                setNewProjectName('')
                                setAddingProject(false)
                              } else if (e.key === 'Escape') {
                                setNewProjectName(''); setAddingProject(false)
                              }
                            }}
                            placeholder="Project name…"
                            className="text-xs px-3 py-1.5 rounded-[10px] outline-none flex-1 pv-placeholder"
                            style={{ border: '1px solid var(--pv-accent)', background: 'var(--pv-surface2)', color: 'var(--pv-text)' }}
                          />
                          <button
                            onClick={async () => {
                              if (!newProjectName.trim()) { setAddingProject(false); return }
                              const created = await createProject(newProjectName.trim(), '')
                              if (created) setActiveProjectId(created.id)
                              setNewProjectName('')
                              setAddingProject(false)
                            }}
                            className="text-xs px-2.5 py-1.5 rounded-[8px] font-semibold transition-all cursor-pointer"
                            style={{ background: 'var(--pv-accent)', color: '#fff' }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => { setNewProjectName(''); setAddingProject(false) }}
                            className="text-xs px-2 py-1.5 rounded-[8px] transition-all cursor-pointer"
                            style={{ color: 'var(--pv-text3)' }}
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <select
                            value={activeProjectId ?? ''}
                            onChange={e => setActiveProjectId(e.target.value || null)}
                            className="text-xs px-3 py-1.5 rounded-[10px] outline-none cursor-pointer transition-all flex-1"
                            style={{ border: '1px solid var(--pv-border)', background: 'var(--pv-surface2)', color: 'var(--pv-text)' }}
                          >
                            <option value="">No project</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <button
                            onClick={() => setAddingProject(true)}
                            title="New project"
                            className="flex-shrink-0 flex items-center justify-center rounded-[8px] transition-all cursor-pointer text-xs font-bold"
                            style={{ width: 28, height: 28, border: '1px solid var(--pv-border)', background: 'var(--pv-surface2)', color: 'var(--pv-text2)' }}
                          >
                            +
                          </button>
                        </>
                      )}
                    </div>
                    {template.description && (
                      <p className="mb-5 text-sm leading-relaxed" style={{ color: 'var(--pv-text2)' }}>
                        {template.description}
                      </p>
                    )}
                    <TemplateForm
                      template={template}
                      genType={selectedGenType}
                      onSubmit={handleGenerate}
                      submitting={submitting}
                      initialValues={img2imgInitialValues}
                      userTier={userTier}
                      modelMinTier={selectedModel?.min_tier}
                      onTourSubjectTyped={() => {}}
                      onTourAiAssistClicked={() => { setFirstRunStep(s => s === 5 ? 6 : s) }}
                      onTourAiSuggestionReceived={() => { setFirstRunStep(s => (s === 5 || s === 6) ? 7 : s) }}
                      onTourAiSuggestionAccepted={() => { setFirstRunStep(s => s === 7 ? 8 : s) }}
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setLightboxAsset(null)}>
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
      {showOnboarding && (
        <OnboardingModal onDone={() => setShowOnboarding(false)} />
      )}
      {firstRunStep >= 0 && (
        <FirstRunTour
          step={firstRunStep}
          onNext={() => setFirstRunStep(s => s + 1)}
          onSkip={() => { markFirstRunSeen(); setFirstRunStep(-1) }}
          onDone={() => { markFirstRunSeen(); setFirstRunStep(-1) }}
        />
      )}
      {renderToast && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium animate-fade-in" style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', color: 'var(--pv-text)' }}>
          <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--pv-accent)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
          <span>{renderToast}</span>
          <button onClick={() => setRenderToast(null)} className="ml-2 text-base leading-none cursor-pointer" style={{ color: 'var(--pv-text3)' }}>✕</button>
        </div>
      )}
    </div>
  )
}
