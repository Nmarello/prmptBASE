import { useState, useMemo } from 'react'
import type { Asset, Model, UserProject } from '../../types'

interface Props {
  assets: Asset[]
  models: Model[]
  projects: UserProject[]
  loading: boolean
  title?: string
  onDelete: (id: string) => void
  onGenerate: () => void
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

export default function AssetGrid({ assets, models, projects, loading, title, onDelete, onGenerate, onSendToImg2Img, onSendToImg2Vid, onMoveToProject }: Props) {
  const [lightbox, setLightbox] = useState<Asset | null>(null)
  const [sort, setSort] = useState<SortKey>('newest')
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')

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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#aeaeb2] text-sm animate-pulse">Loading assets…</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8" style={{ background: 'var(--pv-bg)' }}>
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--pv-text)' }}>{title ?? 'Gallery'}</h2>
              <span className="text-[#aeaeb2] text-sm">
                {filtered.length}{filtered.length !== assets.length ? ` / ${assets.length}` : ''}
              </span>
            </div>
            <button
              onClick={onGenerate}
              className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
            >
              + Generate
            </button>
          </div>

          {/* Filters + Sort */}
          {assets.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 items-center">
              <div className="flex gap-1 rounded-xl p-1" style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)' }}>
                {(['all', 'images', 'videos'] as MediaFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setMediaFilter(f)}
                    style={mediaFilter === f ? { background: 'var(--pv-surface2)', color: 'var(--pv-text)' } : { color: 'var(--pv-text2)' }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {usedModels.length > 1 && (
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setModelFilter('all')}
                    style={modelFilter === 'all' ? { background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' } : { background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all border cursor-pointer`}
                  >
                    All models
                  </button>
                  {usedModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModelFilter(modelFilter === m.id ? 'all' : m.id)}
                      style={modelFilter === m.id ? { background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' } : { background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                      className={`px-3 py-1 rounded-xl text-xs font-medium transition-all border cursor-pointer`}
                    >
                      {m.name.replace(/ [—–-]+ img2img$/i, '')}
                    </button>
                  ))}
                </div>
              )}

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
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {assets.length === 0 && (
            <div className="border border-dashed rounded-2xl p-8 sm:p-20 text-center" style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }}>
              <svg className="w-12 h-12 text-[#d2d2d7] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.5}/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 21"/></svg>
              <p className="font-medium mb-1" style={{ color: 'var(--pv-text)' }}>No images yet</p>
              <p className="text-sm mb-6" style={{ color: 'var(--pv-text2)' }}>Generate something to see it here</p>
              <button
                onClick={onGenerate}
                className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
              >
                Generate your first image →
              </button>
            </div>
          )}

          {assets.length > 0 && filtered.length === 0 && (
            <div className="text-center py-16 text-[#aeaeb2] text-sm">
              No assets match the current filters.
            </div>
          )}

          {filtered.length > 0 && (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
              {filtered.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  modelName={asset.model_id ? (modelMap[asset.model_id]?.name ?? null) : null}
                  projectName={asset.project_id ? (projectMap[asset.project_id] ?? null) : null}
                  projectColor={asset.project_id ? (projectColorMap[asset.project_id] ?? PROJECT_COLORS[0]) : null}
                  onClick={() => setLightbox(asset)}
                  onDelete={onDelete}
                  onSendToImg2Img={onSendToImg2Img}
                  onSendToImg2Vid={onSendToImg2Vid}
                />
              ))}
            </div>
          )}
        </div>
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
            // Keep lightbox snapshot in sync so selectedProjectId doesn't drift
            setLightbox((prev) => prev ? { ...prev, project_id: projectId } : prev)
          } : undefined}
        />
      )}
    </>
  )
}

function AssetCard({ asset, modelName, projectName, projectColor, onClick, onDelete, onSendToImg2Img, onSendToImg2Vid }: {
  asset: Asset
  modelName: string | null
  projectName: string | null
  projectColor: string | null
  onClick: () => void
  onDelete: (id: string) => void
  onSendToImg2Img: (url: string) => void
  onSendToImg2Vid: (url: string) => void
}) {
  const [hover, setHover] = useState(false)
  const [imgError, setImgError] = useState(false)
  const prompt = (asset.metadata as Record<string, unknown>)?.prompt as string | undefined
  const isVideo = asset.gen_type === 'txt2vid' || asset.gen_type === 'img2vid'

  return (
    <div
      style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }}
      className="break-inside-avoid rounded-2xl overflow-hidden border cursor-pointer relative group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      {isVideo ? (
        <video src={asset.url} className="w-full block" muted loop autoPlay playsInline />
      ) : imgError ? (
        <div className="w-full aspect-square flex flex-col items-center justify-center gap-2 text-[#aeaeb2] p-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.5}/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 21"/></svg>
          <span className="text-xs text-center">Image expired</span>
        </div>
      ) : (
        <img
          src={asset.url}
          alt={prompt ?? 'Generated image'}
          className="w-full block"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}

      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
        {projectName && projectColor && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-sm ${projectColor}`}>
            {projectName}
          </span>
        )}
        {modelName && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/80 border border-[#d2d2d7] text-[#6e6e73] backdrop-blur-sm">
            {modelName}
          </span>
        )}
      </div>

      <div className={`absolute inset-0 bg-black/60 flex flex-col justify-between p-3 transition-opacity ${hover ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex justify-end gap-2">
          <a
            href={asset.url}
            download
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs transition-all"
            title="Download"
          >
            ↓
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(asset.id) }}
            className="p-1.5 bg-white/20 hover:bg-red-500/60 rounded-lg text-white text-xs transition-all cursor-pointer"
            title="Delete"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          {!isVideo && (
            <button
              onClick={(e) => { e.stopPropagation(); onSendToImg2Vid(asset.url) }}
              className="w-full py-1.5 bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg text-white text-xs font-medium transition-all cursor-pointer"
            >
              img2vid →
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onSendToImg2Img(asset.url) }}
            className="w-full py-1.5 bg-white/15 hover:bg-white/25 border border-white/30 rounded-lg text-white text-xs font-medium transition-all cursor-pointer"
          >
            img2img →
          </button>
          {prompt && (
            <p className="text-[10px] text-white/70 line-clamp-2 mt-0.5">{prompt}</p>
          )}
        </div>
      </div>
    </div>
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
  const prompt = (asset.metadata as Record<string, unknown>)?.prompt as string | undefined
  const revisedPrompt = (asset.metadata as Record<string, unknown>)?.revised_prompt as string | undefined
  const [selectedProjectId, setSelectedProjectId] = useState<string>(asset.project_id ?? '')
  const [savedToast, setSavedToast] = useState(false)

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
            <span className="text-xs text-[#aeaeb2]">{new Date(asset.created_at).toLocaleString()}</span>
            <button onClick={onClose} style={{ color: 'var(--pv-text3)' }} className="text-lg cursor-pointer transition-colors hover:opacity-70">✕</button>
          </div>

          {onMoveToProject && projects.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-[#aeaeb2] uppercase tracking-wider">Project</span>
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
              <div className="text-xs font-semibold text-[#aeaeb2] uppercase tracking-wider mb-1">Prompt</div>
              <p className="text-sm" style={{ color: 'var(--pv-text)' }}>{prompt}</p>
            </div>
          )}

          {revisedPrompt && revisedPrompt !== prompt && (
            <div>
              <div className="text-xs font-semibold text-[#aeaeb2] uppercase tracking-wider mb-1">Revised by DALL-E</div>
              <p className="text-xs" style={{ color: 'var(--pv-text2)' }}>{revisedPrompt}</p>
            </div>
          )}

          {asset.width && asset.height && (
            <div className="text-xs text-[#aeaeb2]">{asset.width} × {asset.height}px</div>
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
              <a
                href={asset.url}
                download
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] rounded-xl text-sm font-medium text-white text-center transition-all"
              >
                Download
              </a>
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
