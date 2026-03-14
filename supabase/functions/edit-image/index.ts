import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { checkImageRateLimit } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_token, source_image_b64, prompt, model_id, prompt_id, size, quality } = await req.json()

    if (!source_image_b64) throw new Error('Source image is required')
    if (!prompt?.trim()) throw new Error('Edit instructions are required')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let userId: string | null = null
    if (user_token) {
      const { data: { user } } = await adminClient.auth.getUser(user_token)
      userId = user?.id ?? null
    }

    const rateLimit = await checkImageRateLimit(adminClient, userId)
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        error: `Monthly limit reached. You've used ${rateLimit.used} of ${rateLimit.limit} generations on the ${rateLimit.tier} plan.`,
        rate_limited: true,
        used: rateLimit.used,
        limit: rateLimit.limit,
        tier: rateLimit.tier,
      }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OpenAI API key not configured')

    // Decode base64 data URL → binary
    const base64Data = source_image_b64.replace(/^data:image\/\w+;base64,/, '')
    const binaryStr = atob(base64Data)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    // Determine mime type from data URL
    const mimeMatch = source_image_b64.match(/^data:(image\/\w+);base64,/)
    const mimeType = mimeMatch?.[1] ?? 'image/png'
    const ext = mimeType.split('/')[1] ?? 'png'

    // Build multipart form for OpenAI
    const formData = new FormData()
    formData.append('model', 'gpt-image-1')
    formData.append('prompt', prompt)
    formData.append('n', '1')
    formData.append('size', size ?? '1024x1024')
    formData.append('quality', quality ?? 'medium')
    formData.append('image', new Blob([bytes], { type: mimeType }), `source.${ext}`)

    const openaiRes = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.json()
      throw new Error(err.error?.message ?? 'OpenAI request failed')
    }

    const openaiData = await openaiRes.json()

    // gpt-image-1 returns base64 by default
    let permanentUrl: string
    const resultB64 = openaiData.data[0].b64_json
    const resultUrl = openaiData.data[0].url

    if (resultB64) {
      // Upload base64 result to storage
      const resultBytes = Uint8Array.from(atob(resultB64), (c) => c.charCodeAt(0))
      const fileName = `${userId ?? 'anon'}/${Date.now()}.png`
      const { error: uploadErr } = await adminClient.storage
        .from('assets')
        .upload(fileName, resultBytes, { contentType: 'image/png', upsert: false })
      if (uploadErr) throw new Error(`Storage upload failed: ${uploadErr.message}`)
      const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(fileName)
      permanentUrl = publicUrl
    } else if (resultUrl) {
      // Download URL and upload to storage
      const imgRes = await fetch(resultUrl)
      const imgBytes = await imgRes.arrayBuffer()
      const fileName = `${userId ?? 'anon'}/${Date.now()}.png`
      const { error: uploadErr } = await adminClient.storage
        .from('assets')
        .upload(fileName, imgBytes, { contentType: 'image/png', upsert: false })
      const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(fileName)
      permanentUrl = uploadErr ? resultUrl : publicUrl
    } else {
      throw new Error('No image in OpenAI response')
    }

    const [w, h] = (size ?? '1024x1024').split('x').map(Number)

    const { data: asset, error: assetErr } = await adminClient
      .from('assets')
      .insert({
        user_id: userId,
        prompt_id: prompt_id ?? null,
        model_id: model_id ?? null,
        gen_type: 'img2img',
        url: permanentUrl,
        width: w,
        height: h,
        metadata: { prompt, size, quality },
      })
      .select()
      .single()

    return new Response(
      JSON.stringify({ asset: assetErr ? null : asset, image_url: permanentUrl, prompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
