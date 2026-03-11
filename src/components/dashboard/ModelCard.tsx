import type { Model } from '../../types'
import { tierCanAccess } from '../../types'

interface Props {
  model: Model
  userTier: string
  selected: boolean
  onClick: () => void
  comingSoon?: boolean
}

const slugBrandLabels: Record<string, { label: string }> = {
  'kling':           { label: 'Kuaishou' },
  'luma':            { label: 'Luma AI' },
  'minimax-txt2vid': { label: 'MiniMax' },
  'nano-banana':     { label: 'Google' },
  'recraft-v4-pro':  { label: 'Recraft' },
  'sora2':           { label: 'OpenAI' },
}

const providerDisplayNames: Record<string, string> = {
  OpenAI: 'OpenAI', Google: 'Google', Midjourney: 'Midjourney',
  Adobe: 'Adobe', Runway: 'Runway', Pika: 'Pika', Ideogram: 'Ideogram',
}

export default function ModelCard({ model, userTier, selected, onClick, comingSoon: comingSoonProp }: Props) {
  const accessible = tierCanAccess(userTier, model.min_tier)
  const comingSoon = comingSoonProp || model.provider === 'Google'
  const slugBrand = slugBrandLabels[model.slug]
  const brandLabel = slugBrand?.label ?? providerDisplayNames[model.provider]

  return (
    <button
      onClick={!comingSoon ? onClick : undefined}
      className={`relative w-full text-left rounded-xl p-4 border transition-all ${
        comingSoon
          ? 'bg-[#f5f5f7] border-[#d2d2d7] opacity-40 cursor-not-allowed'
          : selected
          ? 'bg-[rgba(0,113,227,0.06)] border-[rgba(0,113,227,0.35)]'
          : 'bg-white border-[#d2d2d7] hover:border-[#aeaeb2] hover:shadow-sm cursor-pointer'
      }`}
    >
      {comingSoon && (
        <span className="absolute top-3 right-3 text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
          soon
        </span>
      )}
      {!comingSoon && !accessible && (
        <span className="absolute top-3 right-3 text-[10px] bg-[#f0f0f2] text-[#6e6e73] border border-[#d2d2d7] px-2 py-0.5 rounded-full font-medium capitalize">
          {model.min_tier}
        </span>
      )}

      {brandLabel && (
        <div className="text-[10px] font-700 uppercase tracking-wider mb-1 text-[#0071e3] font-bold">
          {brandLabel}
        </div>
      )}
      <div className="text-[#1d1d1f] font-semibold text-sm leading-tight">{model.name}</div>
      <div className="text-[#aeaeb2] text-xs mt-1 line-clamp-2 leading-relaxed">{model.description}</div>

      <div className="flex flex-wrap gap-1 mt-2.5">
        {model.supported_gen_types.map((gt) => (
          <span key={gt} className="text-[10px] bg-[#f0f0f2] text-[#6e6e73] px-2 py-0.5 rounded-full font-medium">
            {gt}
          </span>
        ))}
      </div>
    </button>
  )
}
