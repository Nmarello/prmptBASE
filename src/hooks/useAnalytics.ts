import { usePostHog } from '@posthog/react'
import { useEffect } from 'react'

export function useIdentify(userId: string | null, traits?: { email?: string; tier?: string }) {
  const posthog = usePostHog()
  useEffect(() => {
    if (!userId) { posthog.reset(); return }
    posthog.identify(userId, traits)
  }, [userId, traits?.tier])
}

export function useAnalytics() {
  const posthog = usePostHog()

  return {
    generationStarted: (props: { model: string; gen_type: string; tier: string }) =>
      posthog.capture('generation_started', props),

    generationCompleted: (props: { model: string; gen_type: string; tier: string; success: boolean }) =>
      posthog.capture('generation_completed', props),

    rateLimitHit: (props: { tier: string; used: number; limit: number }) =>
      posthog.capture('rate_limit_hit', props),

    upgradeClicked: (props: { tier: string; source: string }) =>
      posthog.capture('upgrade_clicked', props),

    checkoutStarted: (props: { tier: string; billing: string }) =>
      posthog.capture('checkout_started', props),

    upscaleUsed: (props: { scale: number; source: 'tools' | 'lightbox' }) =>
      posthog.capture('upscale_used', props),

    exportUsed: (props: { format: string; size: string; is_video: boolean }) =>
      posthog.capture('export_used', props),
  }
}
