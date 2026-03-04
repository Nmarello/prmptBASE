import type { Model } from '../../types'
import { tierCanAccess } from '../../types'

interface Props {
  model: Model
  userTier: string
  selected: boolean
  onClick: () => void
}

const providerColors: Record<string, string> = {
  OpenAI: 'text-emerald-400',
  Midjourney: 'text-purple-400',
  default: 'text-sky-400',
}

export default function ModelCard({ model, userTier, selected, onClick }: Props) {
  const accessible = tierCanAccess(userTier, model.min_tier)
  const color = providerColors[model.provider] ?? providerColors.default

  return (
    <button
      onClick={accessible ? onClick : undefined}
      className={`relative w-full text-left rounded-2xl p-5 border transition-all ${
        selected
          ? 'bg-sky-500/10 border-sky-500/50'
          : accessible
          ? 'bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/6'
          : 'bg-white/2 border-white/5 opacity-50 cursor-not-allowed'
      }`}
    >
      {!accessible && (
        <span className="absolute top-3 right-3 text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">
          {model.min_tier}
        </span>
      )}

      <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${color}`}>
        {model.provider}
      </div>
      <div className="text-white font-bold text-lg leading-tight">{model.name}</div>
      <div className="text-slate-500 text-xs mt-1.5 line-clamp-2">{model.description}</div>

      <div className="flex flex-wrap gap-1.5 mt-3">
        {model.supported_gen_types.map((gt) => (
          <span key={gt} className="text-xs bg-white/8 text-slate-400 px-2 py-0.5 rounded-full">
            {gt}
          </span>
        ))}
      </div>
    </button>
  )
}
