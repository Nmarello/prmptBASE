// Background worker: completes pending video assets even when browser is closed.
// Called by pg_cron every 2 minutes. Also safe to call from client as a one-shot.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL    = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const FAL_KEY         = Deno.env.get('FAL_KEY')!
const MAX_AGE_HOURS   = 2   // ignore assets older than this (likely abandoned)
const MAX_PER_RUN     = 20  // process at most N assets per invocation

async function sbRest(path: string, opts?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(opts?.headers ?? {}),
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    // Fetch all pending video assets created within the last MAX_AGE_HOURS
    const since = new Date(Date.now() - MAX_AGE_HOURS * 60 * 60 * 1000).toISOString()
    const listRes = await sbRest(
      `/assets?url=eq.&gen_type=in.(txt2vid,img2vid)&created_at=gte.${since}&order=created_at.asc&limit=${MAX_PER_RUN}`,
      { method: 'GET', headers: { 'Prefer': 'return=representation' } },
    )
    const pending: any[] = listRes.ok ? await listRes.json() : []

    if (pending.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let completed = 0
    let failed = 0

    await Promise.all(pending.map(async (asset) => {
      const statusUrl: string = asset.metadata?.status_url ?? ''
      if (!statusUrl) return

      try {
        // Poll fal status
        const statusRes = await fetch(statusUrl, {
          headers: { 'Authorization': `Key ${FAL_KEY}` },
        })
        if (!statusRes.ok) return
        const statusData = await statusRes.json()
        const status: string = statusData.status ?? ''

        if (status === 'FAILED') {
          // Mark failed in metadata so UI can show error
          await sbRest(`/assets?id=eq.${asset.id}`, {
            method: 'PATCH',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              url: 'error',
              metadata: { ...asset.metadata, status: 'failed', error: statusData.error ?? 'Generation failed' },
            }),
          })
          failed++
          return
        }

        if (status !== 'COMPLETED') return  // still in progress — skip this run

        // Fetch result
        const responseUrl = statusData.response_url ?? statusUrl.replace(/\/status$/, '')
        const resultRes = await fetch(responseUrl, {
          headers: { 'Authorization': `Key ${FAL_KEY}` },
        })
        if (!resultRes.ok) return
        const resultData = await resultRes.json()

        const videoUrl: string =
          resultData.video?.url ??
          resultData.videos?.[0]?.url ??
          resultData.output?.video?.url ??
          ''
        const imageUrl: string = !videoUrl
          ? (resultData.images?.[0]?.url ?? resultData.image?.url ?? '')
          : ''

        const sourceUrl = videoUrl || imageUrl
        if (!sourceUrl) return

        const isImage = !videoUrl
        const userId = asset.user_id ?? 'anon'

        // Download and store permanently
        let permanentUrl = sourceUrl
        try {
          const mediaRes = await fetch(sourceUrl)
          const buf = await mediaRes.arrayBuffer()
          const contentType = isImage
            ? (mediaRes.headers.get('content-type')?.split(';')[0].trim() ?? 'image/jpeg')
            : 'video/mp4'
          const ext = isImage ? (contentType.includes('png') ? 'png' : 'jpg') : 'mp4'
          const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
          const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/assets/${fileName}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${SERVICE_KEY}`,
              'apikey': SERVICE_KEY,
              'Content-Type': contentType,
              'x-upsert': 'false',
            },
            body: buf,
          })
          if (uploadRes.ok) {
            permanentUrl = `${SUPABASE_URL}/storage/v1/object/public/assets/${fileName}`
          }
        } catch (_) { /* use fal URL as fallback */ }

        // Update asset with final URL
        const videoCostRaw = resultRes.headers.get('x-fal-billing-cost')
        const videoCost = videoCostRaw ? parseFloat(videoCostRaw) : null
        await sbRest(`/assets?id=eq.${asset.id}`, {
          method: 'PATCH',
          headers: { 'Prefer': 'return=minimal' },
          body: JSON.stringify({
            url: permanentUrl,
            metadata: { ...asset.metadata, status: 'complete' },
            ...(videoCost != null ? { cost_usd: videoCost } : {}),
          }),
        })
        completed++
      } catch (_) { /* network error — will retry next run */ }
    }))

    return new Response(
      JSON.stringify({ processed: pending.length, completed, failed, skipped: pending.length - completed - failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
