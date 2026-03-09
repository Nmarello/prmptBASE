import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_token, asset_id, operation_name } = await req.json()
    if (!operation_name) throw new Error('operation_name required')
    if (!asset_id) throw new Error('asset_id required')

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let userId: string | null = null
    if (user_token) {
      const { data: { user } } = await adminClient.auth.getUser(user_token)
      userId = user?.id ?? null
    }

    // Poll Veo operation status
    const pollRes = await fetch(
      `${GEMINI_BASE}/${operation_name}?key=${geminiKey}`,
      { headers: { 'Content-Type': 'application/json' } },
    )

    if (!pollRes.ok) {
      const err = await pollRes.text()
      throw new Error(`Poll error: ${err}`)
    }

    const pollData = await pollRes.json()
    const done: boolean = pollData.done ?? false

    if (!done) {
      return new Response(
        JSON.stringify({ status: 'pending' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Extract video URL from completed operation
    const videos: { uri?: string; bytesBase64Encoded?: string; mimeType?: string }[] =
      pollData.response?.predictions ?? pollData.response?.videos ?? []

    if (videos.length === 0) {
      throw new Error(`No videos in response: ${JSON.stringify(pollData)}`)
    }

    const video = videos[0]
    let videoUrl = video.uri ?? ''

    // If base64, upload to storage
    if (!videoUrl && video.bytesBase64Encoded) {
      const buf = Uint8Array.from(atob(video.bytesBase64Encoded), (c) => c.charCodeAt(0))
      const fileName = `${userId ?? 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
      const { error } = await adminClient.storage.from('assets').upload(fileName, buf, { contentType: 'video/mp4', upsert: false })
      if (!error) {
        const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(fileName)
        videoUrl = publicUrl
      }
    }

    if (!videoUrl) throw new Error('Could not extract video URL from completed operation')

    // Update the asset row with the final URL
    const { data: asset } = await adminClient
      .from('assets')
      .update({
        url: videoUrl,
        metadata: adminClient.rpc ? undefined : undefined, // updated below via raw update
      })
      .eq('id', asset_id)
      .select()
      .single()

    // Update metadata status to complete
    await adminClient.from('assets').update({
      url: videoUrl,
    }).eq('id', asset_id)

    return new Response(
      JSON.stringify({ status: 'complete', video_url: videoUrl, asset }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
