import type { Model } from '../../types'

interface Props {
  models: Model[]
  onPick: (model: Model) => void
  onClose: () => void
  title?: string
  subtitle?: string
  genLabel?: string
}

export default function Img2ImgPicker({ models, onPick, onClose, title, subtitle }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-[#161b22] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-white font-semibold">{title ?? 'Send to img2img'}</h3>
            <p className="text-slate-500 text-xs mt-0.5">{subtitle ?? 'Choose a model to edit this image'}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg">✕</button>
        </div>

        <div className="space-y-2">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => onPick(model)}
              className="w-full flex items-center gap-3 p-3 bg-white/3 hover:bg-white/8 border border-white/8 hover:border-sky-500/40 rounded-xl text-left transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-sm flex-shrink-0">
                {model.name[0]}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{model.name}</div>
                <div className="text-xs text-slate-500">{model.provider}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
