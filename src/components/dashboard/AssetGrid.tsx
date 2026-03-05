import { useState } from 'react'
import type { Asset, UserProject } from '../../types'

interface Props {
  assets: Asset[]
  projects: UserProject[]
  loading: boolean
  onDelete: (id: string) => void
  onGenerate: () => void
  onSendToImg2Img: (url: string) => void
}

export default function AssetGrid({ assets, projects, loading, onDelete, onGenerate, onSendToImg2Img }: Props) {
  const [lightbox, setLightbox] = useState<Asset | null>(null)
  const [filter, setFilter] = useState<string>('all')

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]))

  const filtered = filter === 'all'
    ? assets
    : assets.filter((a) => a.project_id === filter)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-600 text-sm animate-pulse">Loading assets…</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Assets</h2>
              <span className="text-slate-600 text-sm">{assets.length} image{assets.length !== 1 ? 's' : ''}</span>
            </div>
            <button
              onClick={onGenerate}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-medium transition-all"
            >
              + Generate
            </button>
          </div>

          {/* Project filter */}
          {projects.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {[{ id: 'all', name: 'All' }, ...projects].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFilter(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === p.id
                      ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:border-white/20'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="bg-white/3 border border-dashed border-white/10 rounded-2xl p-20 text-center">
              <div className="text-5xl mb-4">🎨</div>
              <p className="text-slate-400 font-medium mb-1">No images yet</p>
              <p className="text-slate-600 text-sm mb-6">Generate something with DALL-E to see it here</p>
              <button
                onClick={onGenerate}
                className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-medium transition-all"
              >
                Generate your first image →
              </button>
            </div>
          )}

          {/* Grid */}
          {filtered.length > 0 && (
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4">
              {filtered.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  projectName={asset.project_id ? projectMap[asset.project_id] : null}
                  onClick={() => setLightbox(asset)}
                  onDelete={onDelete}
                  onSendToImg2Img={onSendToImg2Img}
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
          projectName={lightbox.project_id ? projectMap[lightbox.project_id] : null}
          onClose={() => setLightbox(null)}
          onDelete={(id) => { onDelete(id); setLightbox(null) }}
          onSendToImg2Img={onSendToImg2Img}
        />
      )}
    </>
  )
}

function AssetCard({ asset, projectName, onClick, onDelete, onSendToImg2Img }: {
  asset: Asset
  projectName: string | null
  onClick: () => void
  onDelete: (id: string) => void
  onSendToImg2Img: (url: string) => void
}) {
  const [hover, setHover] = useState(false)
  const prompt = (asset.metadata as Record<string, unknown>)?.prompt as string | undefined

  return (
    <div
      className="break-inside-avoid rounded-2xl overflow-hidden border border-white/8 bg-white/3 cursor-pointer group relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <img
        src={asset.url}
        alt={prompt ?? 'Generated image'}
        className="w-full block"
        loading="lazy"
      />

      {/* Hover overlay */}
      <div className={`absolute inset-0 bg-black/70 flex flex-col justify-between p-3 transition-opacity ${hover ? 'opacity-100' : 'opacity-0'}`}>
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
        <div className="mb-1">
          <button
            onClick={(e) => { e.stopPropagation(); onSendToImg2Img(asset.url) }}
            className="w-full py-1.5 bg-sky-500/20 hover:bg-sky-500/40 border border-sky-500/40 rounded-lg text-sky-300 text-xs font-medium transition-all"
          >
            Send to img2img →
          </button>
        </div>
        <div>
          {projectName && (
            <span className="text-[10px] text-sky-400 font-medium uppercase tracking-wider">{projectName}</span>
          )}
          {prompt && (
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-3">{prompt}</p>
          )}
          <p className="text-[10px] text-slate-500 mt-1">{new Date(asset.created_at).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}

function Lightbox({ asset, projectName, onClose, onDelete, onSendToImg2Img }: {
  asset: Asset
  projectName: string | null
  onClose: () => void
  onDelete: (id: string) => void
  onSendToImg2Img: (url: string) => void
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
        {/* Image */}
        <div className="flex-1 bg-black flex items-center justify-center min-h-64">
          <img src={asset.url} alt={prompt ?? ''} className="max-w-full max-h-[80vh] object-contain" />
        </div>

        {/* Info panel */}
        <div className="w-full lg:w-72 flex-shrink-0 p-5 overflow-y-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{new Date(asset.created_at).toLocaleString()}</span>
            <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
          </div>

          {projectName && (
            <span className="text-xs text-sky-400 font-medium uppercase tracking-wider">{projectName}</span>
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
