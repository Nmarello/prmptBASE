import { useState, useMemo, useEffect } from 'react'
import type { Asset, Model, UserProject } from '../../types'
import { usePullToRefresh } from '../../hooks/usePullToRefresh'
import { useVideoToGif } from '../../hooks/useVideoToGif'

async function downloadAsset(url: string, filename: string) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    a.click()
    URL.revokeObjectURL(blobUrl)
  } catch {
    window.open(url, '_blank')
  }
}

interface Props {
  assets: Asset[]
  models: Model[]
  projects: UserProject[]
  loading: boolean
  title?: string
  showcaseAssets?: { url: string; gen_type: string | null }[]
  onDelete: (id: string) => void
  onGenerate: () => void
  onRefresh?: () => Promise<void> | void
  onSendToImg2Img: (url: string) => void
  onSendToImg2Vid: (url: string) => void
  onMoveToProject?: (assetId: string, projectId: string | null) => void
}

type SortKey = 'newest' | 'oldest' | 'model'
type MediaFilter = 'all' | 'images' | 'videos'

const PROJECT_COLORS = [
  'bg-blue-50 text-blue-600 border-blue-200',
  'bg-violet-50 text-violet-600 border-violet-200',
  'bg-emerald-50 text-emerald-600 border-emerald-200',
  'bg-amber-50 text-amber-600 border-amber-200',
  'bg-rose-50 text-rose-600 border-rose-200',
  'bg-cyan-50 text-cyan-600 border-cyan-200',
  'bg-pink-50 text-pink-600 border-pink-200',
  'bg-indigo-50 text-indigo-600 border-indigo-200',
]

const GALLERY_FORMATS: [number, number][] = [
  [1, 1],
  [16, 9],
  [9, 16],
  [2, 1],
  [32, 9],
  [9, 8],
]

function pickFormat(): [number, number] {
  return GALLERY_FORMATS[Math.floor(Math.random() * GALLERY_FORMATS.length)]
}

function useNumCols() {
  const get = () => {
    if (typeof window === 'undefined') return 4
    if (window.innerWidth < 480) return 2
    if (window.innerWidth < 768) return 3
    if (window.innerWidth < 1100) return 4
    if (window.innerWidth < 1400) return 5
    return 6
  }
  const [n, setN] = useState(get)
  useEffect(() => {
    const h = () => setN(get())
    window.addEventListener('resize', h)
    return () => window.removeEventListener('resize', h)
  }, [])
  return n
}

export default function AssetGrid({ assets, models, projects, loading, title, onDelete, onGenerate, onRefresh, onSendToImg2Img, onSendToImg2Vid, onMoveToProject }: Props) {
  const [lightbox, setLightbox] = useState<Asset | null>(null)
  const [sort, setSort] = useState<SortKey>('newest')
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { scrollRef: gridScrollRef, distance: pullDist, refreshing: pullRefreshing } = usePullToRefresh(onRefresh ?? (() => {}))
  const numCols = useNumCols()

  const modelMap = useMemo(() => Object.fromEntries(models.map((m) => [m.id, m])), [models])
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name])), [projects])

  const projectColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    projects.forEach((p, i) => { map[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length] })
    return map
  }, [projects])

  const usedModels = useMemo(() => {
    const ids = [...new Set(assets.map((a) => a.model_id).filter(Boolean))]
    return ids.map((id) => modelMap[id!]).filter(Boolean)
  }, [assets, modelMap])

  const usedProjects = useMemo(() => {
    const ids = [...new Set(assets.map((a) => a.project_id).filter(Boolean))]
    return ids.map((id) => ({ id: id!, name: projectMap[id!] ?? 'Unknown' }))
  }, [assets, projectMap])

  const filtered = useMemo(() => {
    let out = [...assets]
    if (mediaFilter === 'images') out = out.filter((a) => a.gen_type !== 'txt2vid' && a.gen_type !== 'img2vid')
    if (mediaFilter === 'videos') out = out.filter((a) => a.gen_type === 'txt2vid' || a.gen_type === 'img2vid')
    if (modelFilter !== 'all') out = out.filter((a) => a.model_id === modelFilter)
    if (projectFilter !== 'all') {
      if (projectFilter === '__none__') out = out.filter((a) => !a.project_id)
      else out = out.filter((a) => a.project_id === projectFilter)
    }
    if (sort === 'newest') out.sort((a, b) => b.created_at.localeCompare(a.created_at))
    else if (sort === 'oldest') out.sort((a, b) => a.created_at.localeCompare(b.created_at))
    else if (sort === 'model') out.sort((a, b) => {
      const ma = modelMap[a.model_id ?? '']?.sort_order ?? 99
      const mb = modelMap[b.model_id ?? '']?.sort_order ?? 99
      return ma - mb
    })
    return out
  }, [assets, mediaFilter, modelFilter, projectFilter, sort, modelMap])

  // Distribute assets round-robin to columns with random aspect ratios
  const columns = useMemo(() => {
    const cols: { asset: Asset; aspectW: number; aspectH: number }[][] = Array.from({ length: numCols }, () => [])
    filtered.forEach((asset, i) => {
      const [aspectW, aspectH] = pickFormat()
      cols[i % numCols].push({ asset, aspectW, aspectH })
    })
    return cols
  }, [filtered, numCols])

  const activeFilterCount = [
    mediaFilter !== 'all',
    modelFilter !== 'all',
    projectFilter !== 'all',
  ].filter(Boolean).length

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm animate-pulse" style={{ color: 'var(--pv-text3)' }}>Loading assets…</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 flex flex-col min-h-0 relative" style={{ background: 'var(--pv-bg)' }}>
        {/* Pull-to-refresh indicator */}
        {(pullDist > 0 || pullRefreshing) && (
          <div className="absolute top-0 left-0 right-0 flex items-center justify-center z-10 pointer-events-none" style={{
            height: pullRefreshing ? 48 : pullDist,
            transition: (!pullRefreshing && pullDist === 0) ? 'height 0.25s ease' : 'none',
            background: 'var(--pv-bg)',
          }}>
            <div className={pullRefreshing ? 'pv-spin' : ''} style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '2.5px solid var(--pv-accent)',
              borderTopColor: pullRefreshing ? 'transparent' : 'var(--pv-accent)',
              opacity: pullRefreshing ? 1 : Math.min(pullDist / 72, 1),
              transform: pullRefreshing ? undefined : `rotate(${pullDist * 3}deg)`,
            }} />
          </div>
        )}

        {/* Header */}
        <div data-tour="assets-header" className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{title ?? 'Assets'}</h2>
            <span className="text-sm" style={{ color: 'var(--pv-text3)' }}>
              {filtered.length}{filtered.length !== assets.length ? ` / ${assets.length}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {assets.length > 0 && (
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                style={filtersOpen || activeFilterCount > 0
                  ? { background: 'var(--pv-accent)', color: '#fff', borderColor: 'var(--pv-accent)' }
                  : { background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2M9 16h6" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-white/30 text-[10px] font-bold flex items-center justify-center leading-none">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={onGenerate}
              className="px-4 py-1.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
              style={{ background: 'var(--pv-accent)' }}
            >
              + Generate
            </button>
          </div>
        </div>

        {/* Collapsible filters */}
        {filtersOpen && assets.length > 0 && (
          <div className="flex flex-col gap-0 flex-shrink-0 border-b" style={{ borderColor: 'var(--pv-border)' }}>
            {/* Row 2: media picker + all projects | sort */}
            <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-2">
              <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)' }}>
                {(['all', 'images', 'videos'] as MediaFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setMediaFilter(f)}
                    style={mediaFilter === f ? { background: 'var(--pv-surface2)', color: 'var(--pv-text)' } : { color: 'var(--pv-text2)' }}
                    className="px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer"
                  >
                    {f}
                  </button>
                ))}
              </div>

              {usedProjects.length > 0 && (
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                  className="px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer outline-none"
                >
                  <option value="all">All projects</option>
                  <option value="__none__">No project</option>
                  {usedProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              <div className="ml-auto flex gap-1 rounded-xl p-1" style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)' }}>
                {(['newest', 'oldest', 'model'] as SortKey[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    style={sort === s ? { background: 'var(--pv-surface2)', color: 'var(--pv-text)' } : { color: 'var(--pv-text2)' }}
                    className="px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: model pills */}
            {usedModels.length > 1 && (
              <div className="flex gap-1 flex-wrap px-4 sm:px-6 pb-2">
                <button
                  onClick={() => setModelFilter('all')}
                  style={modelFilter === 'all' ? { background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' } : { background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                  className="px-3 py-1 rounded-xl text-xs font-medium transition-all border cursor-pointer"
                >
                  All models
                </button>
                {usedModels.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setModelFilter(modelFilter === m.id ? 'all' : m.id)}
                    style={modelFilter === m.id ? { background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' } : { background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                    className="px-3 py-1 rounded-xl text-xs font-medium transition-all border cursor-pointer"
                  >
                    {m.name.replace(/ [—–-]+ img2img$/i, '')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {assets.length === 0 && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="border border-dashed rounded-2xl p-8 sm:p-20 text-center w-full max-w-md" style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }}>
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--pv-border)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.5}/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 21"/></svg>
              <p className="font-medium mb-1" style={{ color: 'var(--pv-text)' }}>No images yet</p>
              <p className="text-sm mb-6" style={{ color: 'var(--pv-text2)' }}>Generate something to see it here</p>
              <button
                onClick={onGenerate}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
                style={{ background: 'var(--pv-accent)' }}
              >
                Generate your first image →
              </button>
            </div>
          </div>
        )}

        {assets.length > 0 && filtered.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-sm" style={{ color: 'var(--pv-text3)' }}>
            No assets match the current filters.
          </div>
        )}

        {/* Column grid — scrollable, no animation */}
        {filtered.length > 0 && (
          <div ref={gridScrollRef} className="flex gap-2 flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-20 sm:pb-6 pt-3 items-start">
            {columns.map((colItems, ci) => (
              <div key={ci} className="flex-1 flex flex-col gap-2">
                {colItems.map(({ asset, aspectW, aspectH }) => {
                  const pct = (aspectH / aspectW) * 100
                  const isVideo = asset.gen_type === 'txt2vid' || asset.gen_type === 'img2vid'
                  const modelName = asset.model_id ? (modelMap[asset.model_id]?.name ?? null) : null
                  const projectName = asset.project_id ? (projectMap[asset.project_id] ?? null) : null
                  const projectColor = asset.project_id ? (projectColorMap[asset.project_id] ?? PROJECT_COLORS[0]) : null
                  return (
                    <div
                      key={asset.id}
                      onClick={() => setLightbox(asset)}
                      className="relative w-full flex-shrink-0 rounded-xl overflow-hidden cursor-pointer group"
                      style={{ paddingBottom: `${pct}%`, background: 'var(--pv-surface)', border: '1px solid var(--pv-border)' }}
                    >
                      {isVideo ? (
                        <video src={asset.url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <img src={asset.url} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start pointer-events-none">
                        {projectName && projectColor && (
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold border backdrop-blur-sm ${projectColor}`}>{projectName}</span>
                        )}
                        {modelName && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-black/40 backdrop-blur-sm text-white/80">
                            {modelName.replace(/ [—–-]+ img2img$/i, '')}
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-end p-2 gap-1.5">
                        <button onClick={(e) => { e.stopPropagation(); onSendToImg2Img(asset.url) }} className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-[10px] font-medium transition-all cursor-pointer backdrop-blur-sm">img2img</button>
                        <button onClick={(e) => { e.stopPropagation(); downloadAsset(asset.url, `asset-${asset.id}`) }} className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-[10px] font-medium transition-all cursor-pointer backdrop-blur-sm">↓</button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(asset.id) }} className="px-2 py-1 bg-white/20 hover:bg-red-500/60 rounded-lg text-white text-[10px] font-medium transition-all cursor-pointer backdrop-blur-sm">✕</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <Lightbox
          asset={lightbox}
          projects={projects}
          projectName={lightbox.project_id ? (projectMap[lightbox.project_id] ?? null) : null}
          projectColor={lightbox.project_id ? (projectColorMap[lightbox.project_id] ?? PROJECT_COLORS[0]) : null}
          modelName={lightbox.model_id ? (modelMap[lightbox.model_id]?.name ?? null) : null}
          onClose={() => setLightbox(null)}
          onDelete={(id) => { onDelete(id); setLightbox(null) }}
          onSendToImg2Img={onSendToImg2Img}
          onSendToImg2Vid={onSendToImg2Vid}
          onMoveToProject={onMoveToProject ? async (assetId, projectId) => {
            await onMoveToProject(assetId, projectId)
            setLightbox((prev) => prev ? { ...prev, project_id: projectId } : prev)
          } : undefined}
        />
      )}
    </>
  )
}

function Lightbox({ asset, projects, projectName, projectColor, modelName, onClose, onDelete, onSendToImg2Img, onSendToImg2Vid, onMoveToProject }: {
  asset: Asset
  projects: UserProject[]
  projectName: string | null
  projectColor: string | null
  modelName: string | null
  onClose: () => void
  onDelete: (id: string) => void
  onSendToImg2Img: (url: string) => void
  onSendToImg2Vid: (url: string) => void
  onMoveToProject?: (assetId: string, projectId: string | null) => void
}) {
  const { convertToGif, converting: gifConverting, progress: gifProgress } = useVideoToGif()
  const prompt = (asset.metadata as Record<string, unknown>)?.prompt as string | undefined
  const revisedPrompt = (asset.metadata as Record<string, unknown>)?.revised_prompt as string | undefined
  const [selectedProjectId, setSelectedProjectId] = useState<string>(asset.project_id ?? '')
  const [savedToast, setSavedToast] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(asset.url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  async function handleProjectChange(newId: string) {
    setSelectedProjectId(newId)
    if (!onMoveToProject) return
    await onMoveToProject(asset.id, newId || null)
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 2000)
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }}
        className="border rounded-2xl overflow-hidden max-w-4xl w-full flex flex-col lg:flex-row shadow-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 flex items-center justify-center min-h-48 max-h-[50vh] lg:max-h-none" style={{ background: 'var(--pv-surface2)' }}>
          {asset.gen_type === 'txt2vid' || asset.gen_type === 'img2vid' ? (
            <video src={asset.url} controls autoPlay loop className="max-w-full max-h-[50vh] lg:max-h-[80vh]" />
          ) : (
            <img src={asset.url} alt={prompt ?? ''} className="max-w-full max-h-[50vh] lg:max-h-[80vh] object-contain" />
          )}
        </div>

        <div className="w-full lg:w-72 flex-shrink-0 p-4 sm:p-5 overflow-y-auto flex flex-col gap-3 sm:gap-4 border-t lg:border-t-0 lg:border-l" style={{ borderColor: 'var(--pv-border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--pv-text3)' }}>{new Date(asset.created_at).toLocaleString()}</span>
            <button onClick={onClose} style={{ color: 'var(--pv-text3)' }} className="text-lg cursor-pointer transition-colors hover:opacity-70">✕</button>
          </div>

          {onMoveToProject && projects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pv-text3)' }}>Project</span>
                {savedToast && (
                  <span className="text-xs font-semibold text-emerald-500 animate-fade-in">Saved!</span>
                )}
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
                className="w-full text-xs px-3 py-2 border rounded-xl outline-none focus:border-[#0071e3] cursor-pointer transition-colors"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {!onMoveToProject && projectName && projectColor && (
            <span className={`self-start px-2.5 py-1 rounded-lg text-xs font-semibold border ${projectColor}`}>
              {projectName}
            </span>
          )}

          {modelName && (
            <span className="text-xs font-medium" style={{ color: 'var(--pv-text2)' }}>{modelName} · {asset.gen_type}</span>
          )}

          {prompt && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--pv-text3)' }}>Prompt</div>
              <p className="text-sm" style={{ color: 'var(--pv-text)' }}>{prompt}</p>
            </div>
          )}

          {revisedPrompt && revisedPrompt !== prompt && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--pv-text3)' }}>Revised by DALL-E</div>
              <p className="text-xs" style={{ color: 'var(--pv-text2)' }}>{revisedPrompt}</p>
            </div>
          )}

          {asset.width && asset.height && (
            <div className="text-xs" style={{ color: 'var(--pv-text3)' }}>{asset.width} × {asset.height}px</div>
          )}

          <div className="flex flex-col gap-2 mt-auto pt-2">
            {asset.gen_type !== 'txt2vid' && asset.gen_type !== 'img2vid' && (
              <button
                onClick={() => { onSendToImg2Vid(asset.url); onClose() }}
                style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                className="w-full py-2.5 border rounded-xl text-sm font-medium transition-all cursor-pointer"
              >
                Send to img2vid →
              </button>
            )}
            <button
              onClick={() => { onSendToImg2Img(asset.url); onClose() }}
              style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
              className="w-full py-2.5 border rounded-xl text-sm font-medium transition-all cursor-pointer"
            >
              Send to img2img →
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => downloadAsset(asset.url, `asset-${asset.id}`)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white text-center transition-all cursor-pointer"
                style={{ background: 'var(--pv-accent)' }}
              >
                Download
              </button>
              <button
                onClick={handleCopyUrl}
                style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: copiedUrl ? 'var(--pv-accent)' : 'var(--pv-text2)' }}
                className="px-3 py-2.5 border rounded-xl text-sm font-medium transition-all cursor-pointer"
                title="Copy URL"
              >
                {copiedUrl ? 'Copied!' : 'Copy URL'}
              </button>
              {(asset.gen_type === 'txt2vid' || asset.gen_type === 'img2vid') && (
                <button
                  onClick={() => convertToGif(asset.url, `asset-${asset.id}`)}
                  disabled={gifConverting}
                  className="px-3 py-2.5 border rounded-xl text-sm font-medium transition-all cursor-pointer disabled:opacity-60"
                  style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                  title="Convert to GIF and download"
                >
                  {gifConverting ? `GIF ${gifProgress}%` : 'GIF'}
                </button>
              )}
              <button
                onClick={() => onDelete(asset.id)}
                style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                className="px-3 py-2.5 border rounded-xl text-sm hover:text-red-500 hover:border-red-200 transition-all cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
