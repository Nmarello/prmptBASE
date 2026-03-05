import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FAL_SIZE_DIMS: Record<string, [number, number]> = {
  square_hd: [1024, 1024],
  square: [512, 512],
  portrait_4_3: [768, 1024],
  portrait_16_9: [576, 1024],
  landscape_4_3: [1024, 768],
  landscape_16_9: [1024, 576],
}

const STYLE_MAP: Record<string, string> = {
  photorealistic: 'photorealistic photography, hyperrealistic',
  cinematic: 'cinematic film still, anamorphic lens, movie lighting',
  digital_art: 'digital art, concept art, highly detailed illustration',
  oil_painting: 'oil painting, brush strokes, textured canvas',
  watercolor: 'watercolor painting, soft washes, paper texture',
  pencil_sketch: 'pencil sketch, graphite drawing, fine linework',
  '3d_render': '3D render, CGI, octane render, ray tracing',
  anime: 'anime style, cel shaded, vibrant colors',
}

const LIGHTING_MAP: Record<string, string> = {
  golden_hour: 'golden hour lighting, warm sunlight, long shadows',
  blue_hour: 'blue hour, deep blue twilight, cool tones',
  studio: 'studio lighting, three-point lighting, clean and sharp',
  neon: 'neon lighting, cyberpunk glow, colorful reflections',
  dramatic: 'dramatic chiaroscuro lighting, high contrast shadows',
  soft: 'soft diffused lighting, even illumination, no harsh shadows',
  backlit: 'backlit, rim light, silhouette, glowing edges',
  volumetric: 'volumetric light, god rays, atmospheric haze',
  overcast: 'overcast sky, flat even lighting, muted shadows',
  night: 'nighttime, dark atmosphere, artificial light sources',
}

const MOOD_MAP: Record<string, string> = {
  epic: 'epic, grand scale, awe-inspiring',
  serene: 'serene, peaceful, tranquil',
  mysterious: 'mysterious, enigmatic, atmospheric',
  melancholic: 'melancholic, somber, contemplative',
  tense: 'tense, ominous, foreboding',
  whimsical: 'whimsical, playful, fantastical',
  dark: 'dark, moody, brooding',
  vibrant: 'vibrant, energetic, lively',
}

const QUALITY_MAP: Record<string, string> = {
  highly_detailed: 'highly detailed',
  '8k': '8K resolution',
  sharp_focus: 'sharp focus, crisp',
  professional: 'professional photography',
  award_winning: 'award winning',
  intricate: 'intricate details, fine textures',
}

function buildPrompt(body: Record<string, unknown>): string {
  const parts: string[] = []

  if (body.prompt) parts.push(String(body.prompt).trim())

  const style = body.style as string | undefined
  if (style && STYLE_MAP[style]) parts.push(STYLE_MAP[style])
  else if (style?.trim()) parts.push(style.trim())

  const lighting = body.lighting as string | undefined
  if (lighting && LIGHTING_MAP[lighting]) parts.push(LIGHTING_MAP[lighting])

  const mood = body.mood as string[] | undefined
  if (Array.isArray(mood) && mood.length > 0) {
    parts.push(mood.map((m) => MOOD_MAP[m] ?? m).join(', '))
  }

  const quality = body.quality as string[] | undefined
  if (Array.isArray(quality) && quality.length > 0) {
    parts.push(quality.map((q) => QUALITY_MAP[q] ?? q).join(', '))
  }

  return parts.filter(Boolean).join(', ')
}

async function storeImage(adminClient: ReturnType<typeof createClient>, tempUrl: string, userId: string | null, fmt = 'jpeg'): Promise<string> {
  try {
    const imgRes = await fetch(tempUrl)
    const imgBlob = await imgRes.arrayBuffer()
    const ext = fmt === 'png' ? 'png' : 'jpg'
    const fileName = `${userId ?? 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error: uploadErr } = await adminClient.storage
      .from('assets')
      .upload(fileName, imgBlob, { contentType: `image/${fmt === 'png' ? 'png' : 'jpeg'}`, upsert: false })
    if (!uploadErr) {
      const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(fileName)
      return publicUrl
    }
  } catch (_) { /* fall back */ }
  return tempUrl
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { user_token, aspect_ratio, seed, steps, num_images, guidance_scale, output_format, acceleration, model_id, prompt_id, byok_key } = body

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

    const builtPrompt = buildPrompt(body)
    if (!builtPrompt.trim()) throw new Error('Prompt is empty')

    const falSize = (aspect_ratio && FAL_SIZE_DIMS[aspect_ratio]) ? aspect_ratio : 'square_hd'
    const [w, h] = FAL_SIZE_DIMS[falSize]
    const numImages = Math.min(Math.max(Number(num_images) || 1, 1), 4)
    const numSteps = Math.min(Math.max(Number(steps) || 4, 1), 12)

    const fmt = ['jpeg', 'png'].includes(output_format) ? output_format : 'jpeg'
    const accel = ['none', 'regular', 'high'].includes(acceleration) ? acceleration : 'none'
    const guidanceVal = guidance_scale != null ? Math.min(Math.max(Number(guidance_scale), 1), 20) : 3.5

    const falPayload: Record<string, unknown> = {
      prompt: builtPrompt,
      image_size: falSize,
      num_inference_steps: numSteps,
      num_images: numImages,
      guidance_scale: guidanceVal,
      output_format: fmt,
      acceleration: accel,
      enable_safety_checker: true,
    }
    if (seed != null && seed !== '') falPayload.seed = Number(seed)

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
    const images: { url: string }[] = falData.images ?? []
    if (images.length === 0) throw new Error(`No images in fal.ai response: ${JSON.stringify(falData)}`)

    // Store all images, collect assets
    const metadata = {
      prompt: builtPrompt,
      aspect_ratio: falSize,
      style: body.style ?? null,
      lighting: body.lighting ?? null,
      mood: body.mood ?? null,
      quality: body.quality ?? null,
      steps: numSteps,
      num_images: numImages,
      guidance_scale: guidanceVal,
      output_format: fmt,
      acceleration: accel,
      seed: falData.seed ?? seed ?? null,
    }

    const insertedAssets = await Promise.all(
      images.map(async (img) => {
        const permanentUrl = await storeImage(adminClient, img.url, userId, fmt)
        const { data } = await adminClient.from('assets').insert({
          user_id: userId,
          prompt_id: prompt_id ?? null,
          model_id: model_id ?? null,
          gen_type: 'txt2img',
          url: permanentUrl,
          width: w,
          height: h,
          metadata,
        }).select().single()
        return data
      })
    )

    const firstAsset = insertedAssets[0]
    const firstUrl = firstAsset?.url ?? images[0].url

    return new Response(
      JSON.stringify({
        asset: firstAsset,
        image_url: firstUrl,
        all_assets: insertedAssets,
        prompt: builtPrompt,
        seed: falData.seed ?? null,
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
