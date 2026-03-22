import type { Model } from '../../types'
import ModelCard from './ModelCard'

interface Props {
  title: string
  subtitle: string
  models: Model[]
  userTier: string
  upgradeTier: string
  onUpgrade: () => void
  latestRenderBySlug: Record<string, { url: string; isVideo: boolean }>
}

export default function UpgradeTeaser({ title, subtitle, models, userTier, upgradeTier, onUpgrade, latestRenderBySlug }: Props) {
  if (models.length === 0) return null

  const tierLabel = upgradeTier.charAt(0).toUpperCase() + upgradeTier.slice(1)

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <h2 style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 18, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
          {title}
        </h2>
        <button
          onClick={onUpgrade}
          className="text-xs font-semibold px-3 py-1 rounded-full transition-all hover:brightness-110 cursor-pointer"
          style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          Upgrade to {tierLabel} →
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: 'var(--pv-text3)', marginBottom: 10, lineHeight: 1.4 }}>
        {subtitle}
      </p>
      <div className="flex gap-3.5 overflow-x-auto pb-3">
        {models.map(m => (
          <ModelCard
            key={m.id}
            model={m}
            userTier={userTier}
            selected={false}
            onClick={onUpgrade}
            latestRenderUrl={latestRenderBySlug[m.slug]?.url}
            latestRenderIsVideo={latestRenderBySlug[m.slug]?.isVideo}
            modelStatus="upgrade"
            upgradeTier={upgradeTier}
            onUpgrade={onUpgrade}
          />
        ))}
      </div>
    </div>
  )
}
