import { useRef, useState } from 'react'
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

export default function AssetGrid({ assets, models, projects, loading, onDelete, onGenerate, onSendToImg2Img, onSendToImg2Vid }: Props) {
  const [lightbox, setLightbox] = useState<Asset | null>(null)

  const modelMap = Object.fromEntries(models.map((m) => [m.id, m]))
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]))

  // Group assets by model_id, unknown model last
  const grouped = assets.reduce<Record<string, Asset[]>>((acc, asset) => {
    const key = asset.model_id ?? '__unknown__'
    if (!acc[key]) acc[key] = []
    acc[key].push(asset)
    return acc
  }, {})

  // Sort: known models in sort_order, unknown last
  const groupKeys = Object.keys(grouped).sort((a, b) => {
    if (a === '__unknown__') return 1
    if (b === '__unknown__') return -1
    return (modelMap[a]?.sort_order ?? 99) - (modelMap[b]?.sort_order ?? 99)
  })

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

          {/* Accordion groups */}
          <div className="space-y-2">
            {groupKeys.map((key) => {
              const groupAssets = grouped[key]
              const model = key !== '__unknown__' ? modelMap[key] : null
              const label = model?.name ?? 'Unknown Model'
              const provider = model?.provider ?? ''
              return (
                <AccordionGroup
                  key={key}
                  label={label}
                  provider={provider}
                  count={groupAssets.length}
                  defaultOpen={true}
                >
                  <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-4 pb-6">
                    {groupAssets.map((asset) => (
                      <AssetCard
                        key={asset.id}
                        asset={asset}
                        projectName={asset.project_id ? projectMap[asset.project_id] : null}
                        onClick={() => setLightbox(asset)}
                        onDelete={onDelete}
                        onSendToImg2Img={onSendToImg2Img}
                        onSendToImg2Vid={onSendToImg2Vid}
                      />
                    ))}
                  </div>
                </AccordionGroup>
              )
            })}
          </div>

        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          asset={lightbox}
          projectName={lightbox.project_id ? projectMap[lightbox.project_id] : null}
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

function AccordionGroup({ label, provider, count, defaultOpen, children }: {
  label: string
  provider: string
  count: number
  defaultOpen: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyRef = useRef<HTMLDivElement>(null)

  function toggle() {
    const body = bodyRef.current
    if (!body) return
    if (!open) {
      body.style.maxHeight = body.scrollHeight + 'px'
    } else {
      body.style.maxHeight = body.scrollHeight + 'px'
      requestAnimationFrame(() => { body.style.maxHeight = '0px' })
    }
    setOpen(!open)
  }

  // Set initial max-height after mount
  const initRef = useRef(false)
  const contentRef = (el: HTMLDivElement | null) => {
    if (el && !initRef.current) {
      initRef.current = true
      el.style.maxHeight = defaultOpen ? el.scrollHeight + 'px' : '0px'
    }
    // @ts-ignore
    bodyRef.current = el
  }

  return (
    <div className="border border-white/8 rounded-2xl overflow-hidden bg-white/2">
      {/* Header */}
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors"
      >
        <svg
          className="w-4 h-4 text-slate-500 transition-transform duration-300 flex-shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <span className="font-semibold text-white">{label}</span>
        {provider && (
          <span className="text-xs text-slate-500">{provider}</span>
        )}
        <span className="ml-auto text-xs text-slate-600 font-mono">{count}</span>
      </button>

      {/* Body */}
      <div
        ref={contentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: defaultOpen ? '9999px' : '0px' }}
      >
        <div className="px-5">
          {children}
        </div>
      </div>
    </div>
  )
}

function AssetCard({ asset, projectName, onClick, onDelete, onSendToImg2Img, onSendToImg2Vid }: {
  asset: Asset
  projectName: string | null
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
      className="break-inside-avoid rounded-2xl overflow-hidden border border-white/8 bg-white/3 cursor-pointer group relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
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
        <div className="mb-1 flex flex-col gap-1">
          {!isVideo && (
            <button
              onClick={(e) => { e.stopPropagation(); onSendToImg2Vid(asset.url) }}
              className="w-full py-1.5 bg-violet-500/20 hover:bg-violet-500/40 border border-violet-500/40 rounded-lg text-violet-300 text-xs font-medium transition-all"
            >
              Send to img2vid →
            </button>
          )}
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

function Lightbox({ asset, projectName, modelName, onClose, onDelete, onSendToImg2Img, onSendToImg2Vid }: {
  asset: Asset
  projectName: string | null
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

          {modelName && (
            <span className="text-xs text-slate-400 font-medium">{modelName} · {asset.gen_type}</span>
          )}

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
