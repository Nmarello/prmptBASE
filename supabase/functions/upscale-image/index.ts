import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { checkImageRateLimit } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { image_url, scale, user_token } = await req.json()

    if (!image_url) {
      return new Response(JSON.stringify({ error: 'image_url is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const upscaleScale = scale === 2 ? 2 : 4

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Resolve user
    let userId: string | null = null
    if (user_token) {
      const { data: { user } } = await adminClient.auth.getUser(user_token)
      if (user) userId = user.id
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required to upscale' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check rate limit (1 credit)
    const rateLimit = await checkImageRateLimit(adminClient, userId)
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: `Monthly limit reached. You've used ${rateLimit.used} of ${rateLimit.limit} generations on the ${rateLimit.tier} plan.`,
        rate_limited: true,
      }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const falKey = Deno.env.get('FAL_KEY')
    if (!falKey) throw new Error('FAL_KEY not configured')

    // Call FAL Real-ESRGAN with a 120s timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 120000)

    let falRes: Response
    try {
      falRes = await fetch('https://fal.run/fal-ai/esrgan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify({ image_url, scale: upscaleScale }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!falRes.ok) {
      const err = await falRes.json().catch(() => ({}))
      throw new Error(err.detail ?? err.message ?? `FAL error ${falRes.status}`)
    }

    const falData = await falRes.json()
    // FAL ESRGAN returns { image: { url } }
    const upscaledUrl: string = falData.image?.url ?? falData.output?.image?.url ?? falData.images?.[0]?.url
    if (!upscaledUrl) throw new Error(`FAL returned no image URL. Response: ${JSON.stringify(falData).slice(0, 200)}`)

    // Save FAL URL directly to assets table (same as generate-fal) — no re-download needed
    const { data: asset } = await adminClient.from('assets').insert({
      user_id: userId,
      url: upscaledUrl,
      gen_type: 'upscale',
      model_id: null,
      metadata: { upscale_scale: upscaleScale, source_url: image_url },
    }).select('id').single()

    return new Response(JSON.stringify({
      upscaled_url: upscaledUrl,
      asset_id: asset?.id ?? null,
      scale: upscaleScale,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('upscale-image error:', msg)
    return new Response(JSON.stringify({ error: msg }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
