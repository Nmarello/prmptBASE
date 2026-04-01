import { isSafeProviderUrl } from '../_shared/validate-url.ts'
import { corsHeaders, optionsResponse, safeErrorMessage } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req)

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
      console.error('[check-fal-video] FAILED statusData:', JSON.stringify(statusData))
      const falErr = statusData.error ?? statusData.detail ?? statusData.message ?? statusData.reason
      const errMsg = (typeof falErr === 'string' && falErr)
        ? falErr
        : (falErr ? JSON.stringify(falErr) : JSON.stringify(statusData))
      // Return error directly in response instead of throwing — avoids safeErrorMessage sanitization
      return new Response(
        JSON.stringify({ error: `fal.ai job failed: ${errMsg}` }),
        { status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    if (status !== 'COMPLETED') {
      return new Response(
        JSON.stringify({ status: 'pending' }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
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

    // Extract media URL — check video, then 3D/model, then image
    const videoUrl: string =
      resultData.video?.url ??
      resultData.videos?.[0]?.url ??
      resultData.output?.video?.url ??
      ''
    // 3D model outputs: GLB mesh URL or model viewer URL
    const modelUrl: string = !videoUrl
      ? (resultData.model_mesh?.url ?? resultData.glb?.url ?? resultData.mesh?.url ?? resultData.output?.model?.url ?? resultData.model?.url ?? '')
      : ''
    // Some 3D models return a preview/thumbnail image alongside the mesh
    const previewUrl: string = modelUrl
      ? (resultData.preview?.url ?? resultData.thumbnail?.url ?? resultData.rendered_image?.url ?? resultData.images?.[0]?.url ?? '')
      : ''
    const imageUrl: string = (!videoUrl && !modelUrl)
      ? (resultData.images?.[0]?.url ?? resultData.image?.url ?? '')
      : ''

    if (!videoUrl && !modelUrl && !imageUrl) throw new Error(`No media URL in result: ${JSON.stringify(resultData)}`)

    const sourceUrl = videoUrl || modelUrl || imageUrl
    const isImage = !videoUrl && !modelUrl
    const is3D = !!modelUrl

    // Download and upload to Supabase Storage via REST
    let permanentUrl = sourceUrl
    let permanentPreviewUrl = ''
    try {
      if (!isSafeProviderUrl(sourceUrl)) throw new Error('Blocked unsafe media URL')
      const mediaRes = await fetch(sourceUrl)
      const buf = await mediaRes.arrayBuffer()
      const contentType = is3D
        ? 'model/gltf-binary'
        : isImage
        ? (mediaRes.headers.get('content-type')?.split(';')[0].trim() ?? 'image/jpeg')
        : 'video/mp4'
      const ext = is3D ? 'glb' : isImage ? (contentType.includes('png') ? 'png' : 'jpg') : 'mp4'
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

    // Upload 3D preview image if available
    if (is3D && previewUrl) {
      try {
        if (isSafeProviderUrl(previewUrl)) {
          const prevRes = await fetch(previewUrl)
          const prevBuf = await prevRes.arrayBuffer()
          const prevFileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}-preview.png`
          const prevUploadRes = await fetch(`${supabaseUrl}/storage/v1/object/assets/${prevFileName}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceKey}`,
              'apikey': serviceKey,
              'Content-Type': 'image/png',
              'x-upsert': 'false',
            },
            body: prevBuf,
          })
          if (prevUploadRes.ok) {
            permanentPreviewUrl = `${supabaseUrl}/storage/v1/object/public/assets/${prevFileName}`
          }
        }
      } catch (_) { /* preview is optional */ }
    }

    // Update asset row via REST
    const patchBody: Record<string, unknown> = { url: permanentUrl }
    if (videoCost != null) patchBody.cost_usd = videoCost
    if (permanentPreviewUrl) patchBody.thumbnail_url = permanentPreviewUrl
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
        body: JSON.stringify(patchBody),
      },
    )

    return new Response(
      JSON.stringify({
        status: 'complete',
        ...(is3D ? { model_url: permanentUrl, preview_url: permanentPreviewUrl || undefined } : isImage ? { image_url: permanentUrl } : { video_url: permanentUrl }),
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    const rawMsg = err instanceof Error ? err.message : String(err)
    console.error('[check-fal-video] catch:', rawMsg)
    return new Response(JSON.stringify({ error: rawMsg }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
