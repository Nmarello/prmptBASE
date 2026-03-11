import type { Model } from '../../types'
import { tierCanAccess } from '../../types'

interface Props {
  model: Model
  userTier: string
  selected: boolean
  onClick: () => void
  comingSoon?: boolean
}

const providerColors: Record<string, string> = {
  OpenAI: 'text-emerald-400',
  Midjourney: 'text-purple-400',
  Adobe: 'text-red-400',
  Runway: 'text-pink-400',
  Pika: 'text-violet-400',
  Ideogram: 'text-orange-400',
  default: 'text-sky-400',
}

const providerDisplayNames: Record<string, string> = {
  OpenAI: 'OpenAI',
  Google: 'Google',
  Midjourney: 'Midjourney',
  Adobe: 'Adobe',
  Runway: 'Runway',
  Pika: 'Pika',
  Ideogram: 'Ideogram',
}

// Brand overrides for models where provider ≠ display brand (e.g. fal.ai-hosted models)
const slugBrandLabels: Record<string, { label: string; color: string }> = {
  'kling':           { label: 'Kuaishou',        color: 'text-cyan-400' },
  'luma':            { label: 'Luma AI',         color: 'text-lime-400' },
  'minimax-txt2vid': { label: 'MiniMax',         color: 'text-fuchsia-400' },
  'nano-banana':     { label: 'Google',          color: 'text-blue-400' },
  'recraft-v4-pro':  { label: 'Recraft',         color: 'text-orange-400' },
  'sora2-txt2vid':   { label: 'OpenAI',          color: 'text-emerald-400' },
  'sora2-img2vid':   { label: 'OpenAI',          color: 'text-emerald-400' },
}

export default function ModelCard({ model, userTier, selected, onClick, comingSoon: comingSoonProp }: Props) {
  const accessible = tierCanAccess(userTier, model.min_tier)
  const comingSoon = comingSoonProp || model.provider === 'Google'
  const slugBrand = slugBrandLabels[model.slug]
  const brandLabel = slugBrand?.label ?? providerDisplayNames[model.provider]
  const color = slugBrand?.color ?? providerColors[model.provider] ?? providerColors.default

  return (
    <button
      onClick={!comingSoon ? onClick : undefined}
      className={`relative w-full text-left rounded-2xl p-5 border transition-all ${
        comingSoon
          ? 'bg-white/2 border-white/5 opacity-50 cursor-not-allowed'
          : selected
          ? 'bg-sky-500/10 border-sky-500/50'
          : 'bg-white/3 border-white/8 hover:border-white/20 hover:bg-white/6'
      }`}
    >
      {comingSoon && (
        <span className="absolute top-3 right-3 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
          coming soon
        </span>
      )}
      {!comingSoon && !accessible && (
        <span className="absolute top-3 right-3 text-xs bg-white/10 text-slate-400 px-2 py-0.5 rounded-full">
          {model.min_tier}
        </span>
      )}

      {brandLabel && (
        <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${color}`}>
          {brandLabel}
        </div>
      )}
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
