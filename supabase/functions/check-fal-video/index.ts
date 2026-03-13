const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_token, asset_id, operation_name } = await req.json()
    if (!operation_name) throw new Error('operation_name required')
    if (!asset_id) throw new Error('asset_id required')

    const falKey = Deno.env.get('FAL_KEY')
    if (!falKey) throw new Error('FAL_KEY not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Resolve user ID from token (optional — for storage path)
    let userId = 'anon'
    if (user_token) {
      const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { 'Authorization': `Bearer ${user_token}`, 'apikey': serviceKey },
      })
      if (userRes.ok) {
        const u = await userRes.json()
        if (u?.id) userId = u.id
      }
    }

    // Poll fal status
    const statusRes = await fetch(operation_name, {
      headers: { 'Authorization': `Key ${falKey}` },
    })
    if (!statusRes.ok) {
      const err = await statusRes.text()
      throw new Error(`Status poll error ${statusRes.status}: ${err}`)
    }
    const statusData = await statusRes.json()
    const status: string = statusData.status ?? ''

    if (status === 'FAILED') {
      const falErr = statusData.error ?? statusData.detail ?? statusData.message ?? statusData.reason
      const errMsg = typeof falErr === 'string' ? falErr : (falErr ? JSON.stringify(falErr) : JSON.stringify(statusData))
      throw new Error(`fal.ai job failed: ${errMsg}`)
    }

    if (status !== 'COMPLETED') {
      return new Response(
        JSON.stringify({ status: 'pending' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch result
    const responseUrl = statusData.response_url ?? operation_name.replace(/\/status$/, '')
    const resultRes = await fetch(responseUrl, {
      headers: { 'Authorization': `Key ${falKey}` },
    })
    if (!resultRes.ok) {
      const err = await resultRes.text()
      throw new Error(`Result fetch error ${resultRes.status}: ${err}`)
    }
    const resultData = await resultRes.json()
    const videoCostRaw = resultRes.headers.get('x-fal-billing-cost')
    const videoCost = videoCostRaw ? parseFloat(videoCostRaw) : (resultData.billing?.cost ?? null)

    const videoUrl: string =
      resultData.video?.url ??
      resultData.videos?.[0]?.url ??
      resultData.output?.video?.url ??
      ''
    const imageUrl: string = !videoUrl
      ? (resultData.images?.[0]?.url ?? resultData.image?.url ?? '')
      : ''

    if (!videoUrl && !imageUrl) throw new Error(`No media URL in result: ${JSON.stringify(resultData)}`)

    const sourceUrl = videoUrl || imageUrl
    const isImage = !videoUrl

    // Download and upload to Supabase Storage via REST
    let permanentUrl = sourceUrl
    try {
      const mediaRes = await fetch(sourceUrl)
      const buf = await mediaRes.arrayBuffer()
      const contentType = isImage
        ? (mediaRes.headers.get('content-type')?.split(';')[0].trim() ?? 'image/jpeg')
        : 'video/mp4'
      const ext = isImage ? (contentType.includes('png') ? 'png' : 'jpg') : 'mp4'
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': contentType,
          'x-upsert': 'false',
        },
        body: buf,
      })
      if (uploadRes.ok) {
        permanentUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`
      }
    } catch (_) { /* fall back to fal URL */ }

    // Update asset row via REST
    await fetch(
      `${supabaseUrl}/rest/v1/assets?id=eq.${asset_id}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ url: permanentUrl, ...(videoCost != null ? { cost_usd: videoCost } : {}) }),
      },
    )

    return new Response(
      JSON.stringify({
        status: 'complete',
        ...(isImage ? { image_url: permanentUrl } : { video_url: permanentUrl }),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
