import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, optionsResponse } from '../_shared/cors.ts'

/**
 * admin-api-usage — Pulls actual API spend from FAL + Replicate,
 * compares to internal assets table, flags mismatches.
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { user_token, days = 30 } = await req.json()
    if (!user_token) throw new Error('Missing user_token')

    // Auth: verify admin
    const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(user_token)
    if (authError || !caller) throw new Error(authError?.message ?? 'Unauthorized')
    const { data: callerProfile } = await adminClient
      .from('profiles').select('is_admin').eq('id', caller.id).single()
    if (!callerProfile?.is_admin) throw new Error('Forbidden')

    const now = new Date()
    const start = new Date(now.getTime() - days * 86400000)
    const startISO = start.toISOString()
    const endISO = now.toISOString()

    // ── 1. FAL usage (exact cost data) ─────────────────────────────────────────
    // Use FAL_ADMIN_KEY for billing endpoints; fall back to FAL_KEY
    const falAdminKey = Deno.env.get('FAL_ADMIN_KEY') ?? Deno.env.get('FAL_KEY')
    let falUsage: { endpoint_id: string; cost: number; quantity: number; currency: string }[] = []
    let falTotalCost = 0
    let falBalance: number | null = null
    let falError: string | null = null

    if (falAdminKey) {
      try {
        // Get usage breakdown by model
        const usageRes = await fetch(
          `https://api.fal.ai/v1/models/usage?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}&expand=summary&timeframe=day`,
          { headers: { 'Authorization': `Key ${falAdminKey}` } }
        )
        if (usageRes.ok) {
          const usageData = await usageRes.json()
          // Response has items array with endpoint_id, cost, quantity
          if (usageData.items) {
            // Aggregate by endpoint
            const byEndpoint: Record<string, { cost: number; quantity: number }> = {}
            for (const item of usageData.items) {
              const key = item.endpoint_id ?? 'unknown'
              if (!byEndpoint[key]) byEndpoint[key] = { cost: 0, quantity: 0 }
              byEndpoint[key].cost += item.cost ?? 0
              byEndpoint[key].quantity += item.quantity ?? 0
            }
            falUsage = Object.entries(byEndpoint).map(([endpoint_id, v]) => ({
              endpoint_id,
              cost: Math.round(v.cost * 1000000) / 1000000,
              quantity: v.quantity,
              currency: 'USD',
            }))
            falTotalCost = falUsage.reduce((s, i) => s + i.cost, 0)
          }
        } else {
          falError = `FAL usage API returned ${usageRes.status}`
        }

        // Get balance
        const balRes = await fetch(
          'https://api.fal.ai/v1/account/billing?expand=credits',
          { headers: { 'Authorization': `Key ${falAdminKey}` } }
        )
        if (balRes.ok) {
          const balData = await balRes.json()
          falBalance = balData.credits?.current_balance ?? null
        }
      } catch (e) {
        falError = e instanceof Error ? e.message : 'FAL API error'
      }
    } else {
      falError = 'FAL_ADMIN_KEY not configured'
    }

    // ── 2. Replicate usage (from predictions list) ─────────────────────────────
    const replicateKey = Deno.env.get('REPLICATE_API_KEY')
    // Known cost per prediction by Replicate model path (from generate-replicate registry)
    const REPLICATE_COST_MAP: Record<string, number> = {
      'stability-ai/stable-diffusion-3.5-large': 0.065,
      'stability-ai/stable-diffusion-3.5-large-turbo': 0.035,
      'stability-ai/stable-diffusion-3.5-medium': 0.035,
      'black-forest-labs/flux-schnell': 0.003,
      'black-forest-labs/flux-dev': 0.025,
      'black-forest-labs/flux-pro': 0.055,
      'black-forest-labs/flux-1.1-pro-ultra': 0.12,
      'black-forest-labs/flux-2-pro': 0.04,
      'black-forest-labs/flux-2-max': 0.08,
      'black-forest-labs/flux-2-klein-4b': 0.003,
      'black-forest-labs/flux-kontext-max': 0.08,
      'black-forest-labs/flux-fill-pro': 0.05,
      'recraft-ai/recraft-v3': 0.04,
      'recraft-ai/recraft-v4': 0.04,
      'recraft-ai/recraft-v4-pro': 0.08,
      'recraft-ai/recraft-crisp-upscale': 0.04,
      'recraft-ai/recraft-creative-upscale': 0.04,
      'ideogram-ai/ideogram-v2': 0.05,
      'ideogram-ai/ideogram-v3-balanced': 0.06,
      'prunaai/hidream-l1-fast': 0.03,
      'prunaai/hidream-l1-full': 0.05,
      'bytedance/seedream-4.5': 0.025,
      'bytedance/seedream-4': 0.02,
      'bytedance/seedream-5-lite': 0.015,
      'google/nano-banana-pro': 0.15,
      'google/imagen-4-ultra': 0.10,
      'google/imagen-4-fast': 0.04,
      'google/veo-3': 0.25,
      'google/veo-3-fast': 0.12,
      'google/veo-3.1': 0.25,
      'openai/gpt-image-1.5': 0.04,
      'openai/sora-2-pro': 0.20,
      'qwen/qwen-image-2-pro': 0.04,
      'lightricks/ltx-2.3-pro': 0.10,
      'lightricks/ltx-2.3-fast': 0.05,
      'minimax/hailuo-2.3': 0.12,
      'minimax/video-01': 0.10,
      'kwaivgi/kling-v2.5-turbo-pro': 0.10,
      'wan-video/wan-2.5-t2v': 0.08,
      'runwayml/gen-4.5': 0.15,
      'bria/eraser': 0.02,
      'bria/genfill': 0.02,
      'bria/expand-image': 0.02,
    }

    let replicateModels: { model: string; count: number; total_seconds: number; est_cost: number }[] = []
    let replicateTotalSeconds = 0
    let replicateTotalPredictions = 0
    let replicateTotalEstCost = 0
    let replicateError: string | null = null

    if (replicateKey) {
      try {
        const byModel: Record<string, { count: number; seconds: number }> = {}
        let url: string | null = `https://api.replicate.com/v1/predictions?created_after=${encodeURIComponent(startISO)}`
        let pages = 0
        const maxPages = 20 // Safety limit

        while (url && pages < maxPages) {
          const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${replicateKey}` },
          })
          if (!res.ok) {
            replicateError = `Replicate API returned ${res.status}`
            break
          }
          const data = await res.json()
          for (const pred of data.results ?? []) {
            // Only count completed predictions
            if (pred.status !== 'succeeded' && pred.status !== 'failed') continue
            const model = pred.model ?? pred.version?.split(':')[0] ?? 'unknown'
            if (!byModel[model]) byModel[model] = { count: 0, seconds: 0 }
            byModel[model].count++
            byModel[model].seconds += pred.metrics?.predict_time ?? 0
          }
          url = data.next ?? null
          pages++
        }

        replicateModels = Object.entries(byModel)
          .map(([model, v]) => {
            const costPer = REPLICATE_COST_MAP[model] ?? 0
            const estCost = Math.round(v.count * costPer * 1000000) / 1000000
            return {
              model,
              count: v.count,
              total_seconds: Math.round(v.seconds * 100) / 100,
              est_cost: estCost,
            }
          })
          .sort((a, b) => b.est_cost - a.est_cost || b.count - a.count)

        replicateTotalSeconds = replicateModels.reduce((s, m) => s + m.total_seconds, 0)
        replicateTotalPredictions = replicateModels.reduce((s, m) => s + m.count, 0)
        replicateTotalEstCost = replicateModels.reduce((s, m) => s + m.est_cost, 0)
      } catch (e) {
        replicateError = e instanceof Error ? e.message : 'Replicate API error'
      }
    } else {
      replicateError = 'REPLICATE_API_KEY not configured'
    }

    // ── 3. Internal usage from assets table ────────────────────────────────────
    const { data: internalAssets } = await adminClient
      .from('assets')
      .select('gen_type, cost_usd, created_at, models(slug, name, provider)')
      .gte('created_at', startISO)

    // Classify by ACTUAL routing, not brand name.
    // These slugs are routed through FAL (generate-fal edge function):
    const FAL_ROUTED = new Set([
      'flux-schnell', 'flux-dev', 'flux-pro', 'flux-pro-ultra', 'flux-dev-img2img',
      'flux-kontext-pro', 'recraft-v4-pro', 'nano-banana', 'nano-banana-edit',
      'ideogram-v3', 'hidream-fast', 'hidream-full', 'hidream-full-i2i',
      'flux2-pro', 'flux-kontext-dev', 'recraft-v3', 'seedream-45', 'sd35-medium',
      // FAL video models:
      'kling', 'kling-v3', 'pixverse-v5', 'luma', 'minimax-txt2vid', 'sora2',
      'sora2-pro', 'pika', 'ltx-video', 'wan-21-txt2vid', 'hunyuan-video',
      'hunyuan-video-1.5', 'seedance-1-pro-txt2vid',
    ])

    // Everything in generate-replicate's MODELS registry:
    const REPLICATE_ROUTED = new Set([
      'sd35-large', 'sd35-large-turbo', 'sd35-medium',
      'flux-schnell', 'flux-dev', 'flux-pro', 'flux-pro-ultra', 'flux2-pro', 'flux2-max', 'flux2-klein',
      'recraft-v3', 'recraft-v4', 'recraft-v4-pro',
      'ideogram-v2', 'ideogram-v3',
      'hidream-fast', 'hidream-full',
      'seedream-45', 'seedream-4', 'seedream-5-lite',
      'nano-banana-pro', 'flux-kontext-max', 'qwen-image-2-pro',
      'imagen-4-ultra', 'imagen-4-fast', 'gpt-image-1.5',
      'ltx-2.3-pro', 'ltx-2.3-fast', 'hailuo-2.3',
      'sora2-pro', 'veo-3', 'veo-3-fast', 'veo-3.1',
      'kling-v2.5-turbo', 'wan-2.5-t2v', 'minimax-video', 'gen-4.5',
      'flux-fill-pro', 'bria-eraser', 'bria-genfill', 'bria-expand',
      'recraft-crisp-upscale', 'recraft-creative-upscale',
    ])

    let internalFalCount = 0
    let internalFalCost = 0
    let internalReplicateCount = 0
    let internalReplicateCost = 0
    let internalOtherCount = 0
    let internalOtherCost = 0
    const internalByModel: Record<string, { count: number; cost: number; provider: string; route: string }> = {}

    for (const a of internalAssets ?? []) {
      const model = (a.models as any)
      const slug = model?.slug ?? 'unknown'
      const cost = a.cost_usd ?? 0

      // Determine actual API route
      let route = 'other'
      if (REPLICATE_ROUTED.has(slug)) route = 'replicate'
      else if (FAL_ROUTED.has(slug)) route = 'fal'

      if (!internalByModel[slug]) internalByModel[slug] = { count: 0, cost: 0, provider: model?.provider ?? 'unknown', route }
      internalByModel[slug].count++
      internalByModel[slug].cost += cost

      if (route === 'fal') { internalFalCount++; internalFalCost += cost }
      else if (route === 'replicate') { internalReplicateCount++; internalReplicateCost += cost }
      else { internalOtherCount++; internalOtherCost += cost }
    }

    const internalModels = Object.entries(internalByModel)
      .map(([slug, v]) => ({ slug, ...v }))
      .sort((a, b) => b.count - a.count)

    // ── 4. Mismatch detection ──────────────────────────────────────────────────
    const alerts: { severity: 'warning' | 'critical'; message: string }[] = []

    // Known non-production Replicate sources:
    // - testing-prmptvault app shares the same API key
    // - Failed/timed-out predictions get billed but no asset row
    // - Upscales via Replicate (recraft-crisp, recraft-creative, google)
    // We estimate ~15% overhead for these known sources before flagging
    const KNOWN_OVERHEAD_PCT = 15

    // Replicate: compare prediction count vs internal count
    if (!replicateError && replicateTotalPredictions > 0) {
      const adjustedThreshold = internalReplicateCount * (1 + (KNOWN_OVERHEAD_PCT + 20) / 100)
      const diff = replicateTotalPredictions - internalReplicateCount
      const pct = internalReplicateCount > 0 ? (diff / internalReplicateCount) * 100 : 100

      // Always show the raw numbers as info
      if (diff > 0) {
        const knownEstimate = Math.round(internalReplicateCount * KNOWN_OVERHEAD_PCT / 100)
        const unexplained = Math.max(0, diff - knownEstimate)

        if (replicateTotalPredictions > adjustedThreshold && unexplained > 5) {
          alerts.push({
            severity: unexplained > internalReplicateCount * 0.3 ? 'critical' : 'warning',
            message: `Replicate: ${replicateTotalPredictions} API predictions vs ${internalReplicateCount} site-tracked. ~${knownEstimate} est. from testing app/failures. ${unexplained} unexplained (${pct.toFixed(0)}% over, ${days}d)`,
          })
        } else {
          alerts.push({
            severity: 'warning' as const,
            message: `Replicate: ${diff} extra API predictions (${pct.toFixed(0)}% over) — likely from testing app + failed generations. Within expected range.`,
          })
        }
      }
    }

    // FAL: compare API cost vs internal tracked cost
    if (!falError && falTotalCost > 0) {
      const diff = falTotalCost - internalFalCost
      const pct = internalFalCost > 0 ? (diff / internalFalCost) * 100 : 100
      if (diff > 1 && pct > 20) {
        alerts.push({
          severity: pct > 50 ? 'critical' : 'warning',
          message: `FAL API spend ($${falTotalCost.toFixed(2)}) exceeds tracked site usage ($${internalFalCost.toFixed(2)}) by $${diff.toFixed(2)} (${pct.toFixed(0)}% over) in the last ${days} days`,
        })
      }
    }

    // Balance warning
    if (falBalance !== null && falBalance < 10) {
      alerts.push({
        severity: falBalance < 2 ? 'critical' : 'warning',
        message: `FAL credit balance is low: $${falBalance.toFixed(2)}`,
      })
    }

    return new Response(JSON.stringify({
      days,
      fal: {
        total_cost: Math.round(falTotalCost * 100) / 100,
        balance: falBalance,
        by_endpoint: falUsage,
        error: falError,
      },
      replicate: {
        total_predictions: replicateTotalPredictions,
        total_seconds: Math.round(replicateTotalSeconds * 100) / 100,
        total_est_cost: Math.round(replicateTotalEstCost * 100) / 100,
        by_model: replicateModels,
        error: replicateError,
      },
      internal: {
        total_count: (internalAssets ?? []).length,
        fal: { count: internalFalCount, cost: Math.round(internalFalCost * 100) / 100 },
        replicate: { count: internalReplicateCount, cost: Math.round(internalReplicateCost * 100) / 100 },
        other: { count: internalOtherCount, cost: Math.round(internalOtherCost * 100) / 100 },
        by_model: internalModels,
      },
      alerts,
    }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
