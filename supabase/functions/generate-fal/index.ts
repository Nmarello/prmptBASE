import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const ASPECT_TO_FAL_SIZE: Record<string, string> = {
  square_hd: 'square_hd',
  square: 'square',
  portrait_4_3: 'portrait_4_3',
  portrait_16_9: 'portrait_16_9',
  landscape_4_3: 'landscape_4_3',
  landscape_16_9: 'landscape_16_9',
}

const FAL_SIZE_DIMS: Record<string, [number, number]> = {
  square_hd: [1024, 1024],
  square: [512, 512],
  portrait_4_3: [768, 1024],
  portrait_16_9: [576, 1024],
  landscape_4_3: [1024, 768],
  landscape_16_9: [1024, 576],
}

const STYLE_SUFFIX: Record<string, string> = {
  photorealistic: 'photorealistic photography',
  cinematic: 'cinematic film still',
  digital_art: 'digital art',
  oil_painting: 'oil painting',
  watercolor: 'watercolor painting',
  pencil_sketch: 'pencil sketch',
  '3d_render': '3D render',
  anime: 'anime style',
}

function buildFalPrompt(prompt: string, style?: string, negative_prompt?: string): string {
  const parts = [prompt.trim()]
  if (style && STYLE_SUFFIX[style]) parts.push(STYLE_SUFFIX[style])
  else if (style && style.trim()) parts.push(style.trim())
  return parts.filter(Boolean).join(', ')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      user_token,
      prompt,
      aspect_ratio,
      style,
      negative_prompt,
      seed,
      model_id,
      prompt_id,
      byok_key,
    } = body

    const falKey = byok_key ?? Deno.env.get('FAL_KEY')
    if (!falKey) throw new Error('No fal.ai API key available')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let userId: string | null = null
    if (user_token) {
      const { data: { user } } = await adminClient.auth.getUser(user_token)
      userId = user?.id ?? null
    }

    const builtPrompt = buildFalPrompt(prompt ?? '', style, negative_prompt)
    if (!builtPrompt.trim()) throw new Error('Prompt is empty')

    const falSize = ASPECT_TO_FAL_SIZE[aspect_ratio ?? 'square_hd'] ?? 'square_hd'
    const [w, h] = FAL_SIZE_DIMS[falSize] ?? [1024, 1024]

    const falPayload: Record<string, unknown> = {
      prompt: builtPrompt,
      image_size: falSize,
      num_inference_steps: 4,
      num_images: 1,
    }
    if (negative_prompt?.trim()) falPayload.negative_prompt = negative_prompt.trim()
    if (seed != null) falPayload.seed = Number(seed)

    const falRes = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${falKey}`,
      },
      body: JSON.stringify(falPayload),
    })

    if (!falRes.ok) {
      const err = await falRes.text()
      throw new Error(`fal.ai error: ${err}`)
    }

    const falData = await falRes.json()
    const tempUrl: string = falData.images?.[0]?.url
    if (!tempUrl) throw new Error(`No image in fal.ai response: ${JSON.stringify(falData)}`)

    // Download and store permanently
    let permanentUrl = tempUrl
    try {
      const imgRes = await fetch(tempUrl)
      const imgBlob = await imgRes.arrayBuffer()
      const fileName = `${userId ?? 'anon'}/${Date.now()}.png`
      const { error: uploadErr } = await adminClient.storage
        .from('assets')
        .upload(fileName, imgBlob, { contentType: 'image/png', upsert: false })
      if (!uploadErr) {
        const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(fileName)
        permanentUrl = publicUrl
      }
    } catch (_) { /* fall back to temp URL */ }

    const { data: asset, error: assetErr } = await adminClient
      .from('assets')
      .insert({
        user_id: userId,
        prompt_id: prompt_id ?? null,
        model_id: model_id ?? null,
        gen_type: 'txt2img',
        url: permanentUrl,
        width: w,
        height: h,
        metadata: { prompt: builtPrompt, aspect_ratio: falSize, style: style ?? null, seed: seed ?? null },
      })
      .select()
      .single()

    return new Response(
      JSON.stringify({ asset: assetErr ? null : asset, image_url: permanentUrl, prompt: builtPrompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
