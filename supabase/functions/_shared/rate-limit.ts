import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

// Monthly image generation limits per tier (null = unlimited)
const TIER_LIMITS: Record<string, number | null> = {
  free:    15,
  creator: 500,
  studio:  2000,
  pro:     null,
}

export interface RateLimitResult {
  allowed: boolean
  tier: string
  used: number
  limit: number | null
}

/**
 * Check if a user is within their monthly image generation limit.
 * Only counts image gen_types (txt2img, img2img) — videos are tier-gated separately.
 * Returns allowed=true for unauthenticated users (upsell happens on the frontend).
 */
export async function checkImageRateLimit(
  adminClient: ReturnType<typeof createClient>,
  userId: string | null,
): Promise<RateLimitResult> {
  if (!userId) return { allowed: true, tier: 'free', used: 0, limit: TIER_LIMITS.free }

  // Get user tier
  const { data: profile } = await adminClient
    .from('profiles')
    .select('tier')
    .eq('id', userId)
    .single()

  const tier = (profile?.tier as string | undefined) ?? 'free'
  const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free ?? 15

  // Unlimited tier — skip count query
  if (limit === null) return { allowed: true, tier, used: 0, limit: null }

  // Count images generated this calendar month
  const startOfMonth = new Date()
  startOfMonth.setUTCDate(1)
  startOfMonth.setUTCHours(0, 0, 0, 0)

  const { count } = await adminClient
    .from('assets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .in('gen_type', ['txt2img', 'img2img'])
    .gte('created_at', startOfMonth.toISOString())

  const used = count ?? 0
  return { allowed: used < limit, tier, used, limit }
}
