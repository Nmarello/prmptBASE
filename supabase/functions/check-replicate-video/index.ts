import { isSafeProviderUrl } from '../_shared/validate-url.ts'
import { corsHeaders, optionsResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req)

  try {
    const { user_token, asset_id, prediction_url } = await req.json()
    if (!prediction_url) throw new Error('prediction_url required')
    if (!asset_id) throw new Error('asset_id required')

    const replicateKey = Deno.env.get('REPLICATE_API_KEY')
    if (!replicateKey) throw new Error('REPLICATE_API_KEY not configured')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Resolve user ID from token
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

    // Poll Replicate prediction status
    const pollRes = await fetch(prediction_url, {
      headers: { 'Authorization': `Bearer ${replicateKey}` },
    })
    if (!pollRes.ok) {
      const err = await pollRes.text()
      throw new Error(`Replicate poll error ${pollRes.status}: ${err}`)
    }
    const repData = await pollRes.json()

    if (repData.status === 'failed' || repData.error) {
      return new Response(
        JSON.stringify({ error: `Generation failed: ${repData.error ?? 'unknown error'}` }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    if (repData.status === 'starting' || repData.status === 'processing') {
      return new Response(
        JSON.stringify({ status: 'pending' }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    // Completed — get output URL
    const outputUrls: string[] = Array.isArray(repData.output)
      ? repData.output
      : typeof repData.output === 'string'
        ? [repData.output]
        : []

    if (outputUrls.length === 0) throw new Error('No output from Replicate')

    const sourceUrl = outputUrls[0]

    // Download and re-upload to Supabase Storage
    let permanentUrl = sourceUrl
    try {
      if (!isSafeProviderUrl(sourceUrl)) throw new Error('Blocked unsafe URL')
      const mediaRes = await fetch(sourceUrl)
      const buf = await mediaRes.arrayBuffer()
      const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
      const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'video/mp4',
          'x-upsert': 'false',
        },
        body: buf,
      })
      if (uploadRes.ok) {
        permanentUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`
      }
    } catch (_) { /* fall back to temp URL */ }

    // Update asset row
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
        body: JSON.stringify({
          url: permanentUrl,
          cost_usd: repData.metrics?.predict_time ? null : null, // cost tracked on creation
        }),
      },
    )

    return new Response(
      JSON.stringify({ status: 'complete', video_url: permanentUrl }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err)
    console.error('[check-replicate-video] catch:', rawMsg)
    return new Response(JSON.stringify({ error: rawMsg }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
