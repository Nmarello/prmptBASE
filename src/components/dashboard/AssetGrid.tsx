import { useState, useMemo } from 'react'
import type { Asset, Model, UserProject } from '../../types'

interface Props {
  assets: Asset[]
  models: Model[]
  projects: UserProject[]
  loading: boolean
  onDelete: (id: string) => void
  onGenerate: () => void
  onSendToImg2Img: (url: string) => void
  onSendToImg2Vid: (url: string) => void
}

type SortKey = 'newest' | 'oldest' | 'model'
type MediaFilter = 'all' | 'images' | 'videos'

const PROJECT_COLORS = [
  'bg-sky-500/20 text-sky-300 border-sky-500/30',
  'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'bg-rose-500/20 text-rose-300 border-rose-500/30',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
]

export default function AssetGrid({ assets, models, projects, loading, onDelete, onGenerate, onSendToImg2Img, onSendToImg2Vid }: Props) {
  const [lightbox, setLightbox] = useState<Asset | null>(null)
  const [sort, setSort] = useState<SortKey>('newest')
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')
  const [modelFilter, setModelFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')

  const modelMap = useMemo(() => Object.fromEntries(models.map((m) => [m.id, m])), [models])
  const projectMap = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p.name])), [projects])

  // Stable color assignment per project — ordered by first appearance in projects list
  const projectColorMap = useMemo(() => {
    const map: Record<string, string> = {}
    projects.forEach((p, i) => { map[p.id] = PROJECT_COLORS[i % PROJECT_COLORS.length] })
    return map
  }, [projects])

  // Models that actually appear in assets
  const usedModels = useMemo(() => {
    const ids = [...new Set(assets.map((a) => a.model_id).filter(Boolean))]
    return ids.map((id) => modelMap[id!]).filter(Boolean)
  }, [assets, modelMap])

  // Projects that actually appear in assets
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
        <p className="text-slate-600 text-sm animate-pulse">Loading assets…</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Assets</h2>
              <span className="text-slate-600 text-sm">
                {filtered.length}{filtered.length !== assets.length ? ` / ${assets.length}` : ''}
              </span>
            </div>
            <button
              onClick={onGenerate}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-medium transition-all"
            >
              + Generate
            </button>
          </div>

          {/* Filters + Sort */}
          {assets.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6 items-center">
              {/* Media type */}
              <div className="flex gap-1 bg-white/5 rounded-xl p-1">
                {(['all', 'images', 'videos'] as MediaFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setMediaFilter(f)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${mediaFilter === f ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Model filter chips */}
              {usedModels.length > 1 && (
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => setModelFilter('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-medium transition-all border ${modelFilter === 'all' ? 'bg-white/10 border-white/20 text-white' : 'border-white/8 text-slate-500 hover:text-slate-300'}`}
                  >
                    All models
                  </button>
                  {usedModels.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModelFilter(modelFilter === m.id ? 'all' : m.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium transition-all border ${modelFilter === m.id ? 'bg-white/10 border-white/20 text-white' : 'border-white/8 text-slate-500 hover:text-slate-300'}`}
                    >
                      {m.name.replace(/ [—–-]+ img2img$/i, '')}
                    </button>
                  ))}
                </div>
              )}

              {/* Project filter */}
              {usedProjects.length > 0 && (
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-3 py-1 rounded-xl text-xs font-medium bg-white/5 border border-white/8 text-slate-400 hover:text-slate-300 transition-all cursor-pointer outline-none"
                >
                  <option value="all">All projects</option>
                  <option value="__none__">No project</option>
                  {usedProjects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              {/* Sort — pushed right */}
              <div className="ml-auto flex gap-1 bg-white/5 rounded-xl p-1">
                {(['newest', 'oldest', 'model'] as SortKey[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${sort === s ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {assets.length === 0 && (
            <div className="bg-white/3 border border-dashed border-white/10 rounded-2xl p-8 sm:p-20 text-center">
              <div className="text-5xl mb-4">🎨</div>
              <p className="text-slate-400 font-medium mb-1">No images yet</p>
              <p className="text-slate-600 text-sm mb-6">Generate something to see it here</p>
              <button
                onClick={onGenerate}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-medium transition-all"
              >
                Generate your first image →
              </button>
            </div>
          )}

          {/* No results after filter */}
          {assets.length > 0 && filtered.length === 0 && (
            <div className="text-center py-16 text-slate-600 text-sm">
              No assets match the current filters.
            </div>
          )}

          {/* Grid */}
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

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          asset={lightbox}
          projectName={lightbox.project_id ? (projectMap[lightbox.project_id] ?? null) : null}
          projectColor={lightbox.project_id ? (projectColorMap[lightbox.project_id] ?? PROJECT_COLORS[0]) : null}
          modelName={lightbox.model_id ? (modelMap[lightbox.model_id]?.name ?? null) : null}
          onClose={() => setLightbox(null)}
          onDelete={(id) => { onDelete(id); setLightbox(null) }}
          onSendToImg2Img={onSendToImg2Img}
          onSendToImg2Vid={onSendToImg2Vid}
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
      className="break-inside-avoid rounded-2xl overflow-hidden border border-white/8 bg-white/3 cursor-pointer relative group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      {/* Media */}
      {isVideo ? (
        <video src={asset.url} className="w-full block" muted loop autoPlay playsInline />
      ) : imgError ? (
        <div className="w-full aspect-square flex flex-col items-center justify-center gap-2 text-slate-600 p-4">
          <span className="text-3xl">🖼️</span>
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

      {/* Always-visible badges — top left */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start pointer-events-none">
        {projectName && projectColor && (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border backdrop-blur-sm ${projectColor}`}>
            {projectName}
          </span>
        )}
        {modelName && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/50 border border-white/10 text-slate-300 backdrop-blur-sm">
            {modelName}
          </span>
        )}
      </div>

      {/* Hover overlay */}
      <div className={`absolute inset-0 bg-black/70 flex flex-col justify-between p-3 transition-opacity ${hover ? 'opacity-100' : 'opacity-0'}`}>
        {/* Top row: spacer + action buttons */}
        <div className="flex justify-end gap-2">
          <a
            href={asset.url}
            download
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs transition-all"
            title="Download"
          >
            ↓
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(asset.id) }}
            className="p-1.5 bg-white/10 hover:bg-red-500/40 rounded-lg text-white text-xs transition-all"
            title="Delete"
          >
            ✕
          </button>
        </div>

        {/* Bottom: send-to + prompt */}
        <div className="flex flex-col gap-1.5">
          {!isVideo && (
            <button
              onClick={(e) => { e.stopPropagation(); onSendToImg2Vid(asset.url) }}
              className="w-full py-1.5 bg-violet-500/20 hover:bg-violet-500/40 border border-violet-500/40 rounded-lg text-violet-300 text-xs font-medium transition-all"
            >
              img2vid →
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onSendToImg2Img(asset.url) }}
            className="w-full py-1.5 bg-sky-500/20 hover:bg-sky-500/40 border border-sky-500/40 rounded-lg text-sky-300 text-xs font-medium transition-all"
          >
            img2img →
          </button>
          {prompt && (
            <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{prompt}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Lightbox({ asset, projectName, projectColor, modelName, onClose, onDelete, onSendToImg2Img, onSendToImg2Vid }: {
  asset: Asset
  projectName: string | null
  projectColor: string | null
  modelName: string | null
  onClose: () => void
  onDelete: (id: string) => void
  onSendToImg2Img: (url: string) => void
  onSendToImg2Vid: (url: string) => void
}) {
  const prompt = (asset.metadata as Record<string, unknown>)?.prompt as string | undefined
  const revisedPrompt = (asset.metadata as Record<string, unknown>)?.revised_prompt as string | undefined

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#161b22] border border-white/10 rounded-2xl overflow-hidden max-w-4xl w-full flex flex-col lg:flex-row shadow-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image / Video */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-48 max-h-[50vh] lg:max-h-none">
          {asset.gen_type === 'txt2vid' || asset.gen_type === 'img2vid' ? (
            <video src={asset.url} controls autoPlay loop className="max-w-full max-h-[50vh] lg:max-h-[80vh]" />
          ) : (
            <img src={asset.url} alt={prompt ?? ''} className="max-w-full max-h-[50vh] lg:max-h-[80vh] object-contain" />
          )}
        </div>

        {/* Info panel */}
        <div className="w-full lg:w-72 flex-shrink-0 p-4 sm:p-5 overflow-y-auto flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{new Date(asset.created_at).toLocaleString()}</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
          </div>

          {/* Project badge */}
          {projectName && projectColor && (
            <span className={`self-start px-2.5 py-1 rounded-lg text-xs font-semibold border ${projectColor}`}>
              {projectName}
            </span>
          )}

          {modelName && (
            <span className="text-xs text-slate-400 font-medium">{modelName} · {asset.gen_type}</span>
          )}

          {prompt && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Prompt</div>
              <p className="text-sm text-slate-300">{prompt}</p>
            </div>
          )}

          {revisedPrompt && revisedPrompt !== prompt && (
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Revised by DALL-E</div>
              <p className="text-xs text-slate-500">{revisedPrompt}</p>
            </div>
          )}

          {asset.width && asset.height && (
            <div className="text-xs text-slate-600">{asset.width} × {asset.height}px</div>
          )}

          <div className="flex flex-col gap-2 mt-auto pt-2">
            {asset.gen_type !== 'txt2vid' && asset.gen_type !== 'img2vid' && (
              <button
                onClick={() => { onSendToImg2Vid(asset.url); onClose() }}
                className="w-full py-2.5 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/40 rounded-xl text-sm font-medium text-violet-300 transition-all"
              >
                Send to img2vid →
              </button>
            )}
            <button
              onClick={() => { onSendToImg2Img(asset.url); onClose() }}
              className="w-full py-2.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 rounded-xl text-sm font-medium text-sky-300 transition-all"
            >
              Send to img2img →
            </button>
            <div className="flex gap-2">
              <a
                href={asset.url}
                download
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-medium text-center transition-all"
              >
                Download
              </a>
              <button
                onClick={() => onDelete(asset.id)}
                className="px-3 py-2.5 bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 rounded-xl text-sm text-slate-400 hover:text-red-400 transition-all"
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
