import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

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

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let userId: string | null = null
    if (user_token) {
      const { data: { user } } = await adminClient.auth.getUser(user_token)
      userId = user?.id ?? null
    }

    // operation_name is the fal status_url
    const statusRes = await fetch(operation_name, {
      headers: { 'Authorization': `Key ${falKey}` },
    })
    if (!statusRes.ok) {
      const err = await statusRes.text()
      throw new Error(`Status poll error: ${err}`)
    }
    const statusData = await statusRes.json()
    const status: string = statusData.status ?? ''

    if (status === 'FAILED') {
      throw new Error(`fal.ai job failed: ${JSON.stringify(statusData)}`)
    }

    if (status !== 'COMPLETED') {
      return new Response(
        JSON.stringify({ status: 'pending' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Fetch the result — response_url is status_url minus /status
    const responseUrl = operation_name.replace(/\/status$/, '')
    const resultRes = await fetch(responseUrl, {
      headers: { 'Authorization': `Key ${falKey}` },
    })
    if (!resultRes.ok) {
      const err = await resultRes.text()
      throw new Error(`Result fetch error: ${err}`)
    }
    const resultData = await resultRes.json()

    // fal video result shape: { video: { url, content_type } } or { videos: [...] }
    const videoUrl: string =
      resultData.video?.url ??
      resultData.videos?.[0]?.url ??
      resultData.output?.video?.url ??
      ''

    if (!videoUrl) throw new Error(`No video URL in result: ${JSON.stringify(resultData)}`)

    // Download and store in Supabase storage
    let permanentUrl = videoUrl
    try {
      const vidRes = await fetch(videoUrl)
      const buf = await vidRes.arrayBuffer()
      const fileName = `${userId ?? 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
      const { error } = await adminClient.storage
        .from('assets')
        .upload(fileName, buf, { contentType: 'video/mp4', upsert: false })
      if (!error) {
        const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(fileName)
        permanentUrl = publicUrl
      }
    } catch (_) { /* fall back to fal URL */ }

    // Update the asset row
    await adminClient.from('assets').update({ url: permanentUrl }).eq('id', asset_id)

    return new Response(
      JSON.stringify({ status: 'complete', video_url: permanentUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
