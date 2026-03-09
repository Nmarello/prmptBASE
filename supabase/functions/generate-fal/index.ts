import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FAL_ENDPOINTS: Record<string, string> = {
  'flux-schnell':      'https://fal.run/fal-ai/flux/schnell',
  'flux-dev':          'https://fal.run/fal-ai/flux/dev',
  'flux-pro':          'https://fal.run/fal-ai/flux-pro',
  'flux-pro-ultra':    'https://fal.run/fal-ai/flux-pro/v1.1-ultra',
  'flux-dev-img2img':  'https://fal.run/fal-ai/flux/dev/image-to-image',
}

const FAL_VIDEO_ENDPOINTS: Record<string, Record<string, string>> = {
  'kling': {
    'txt2vid': 'fal-ai/kling-video/v1.6/standard/text-to-video',
    'img2vid': 'fal-ai/kling-video/v1.6/standard/image-to-video',
  },
  'luma': {
    'txt2vid': 'fal-ai/luma-dream-machine/ray-2/text-to-video',
    'img2vid': 'fal-ai/luma-dream-machine/ray-2/image-to-video',
  },
  'minimax-txt2vid': {
    'txt2vid': 'fal-ai/minimax/video-01',
  },
}

const FAL_QUEUE_BASE = 'https://queue.fal.run'

const FAL_SIZE_DIMS: Record<string, [number, number]> = {
  square_hd:      [1024, 1024],
  square:         [512,  512],
  portrait_4_3:   [768,  1024],
  portrait_16_9:  [576,  1024],
  landscape_4_3:  [1024, 768],
  landscape_16_9: [1024, 576],
}

// Ultra uses different aspect_ratio strings
const ULTRA_ASPECT_DIMS: Record<string, [number, number]> = {
  '21:9': [2048, 880],
  '16:9': [1920, 1080],
  '4:3':  [1344, 1024],
  '1:1':  [1024, 1024],
  '3:4':  [1024, 1344],
  '9:16': [1080, 1920],
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
    const {
      user_token, aspect_ratio, seed, steps, num_images,
      guidance_scale, output_format, acceleration,
      model_id, model_slug, prompt_id, byok_key,
      source_image, strength,
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

    const slug = (model_slug as string) ?? 'flux-schnell'
    const isImg2Img = slug === 'flux-dev-img2img'

    // --- img2img path ---
    if (isImg2Img) {
      const prompt = (body.prompt as string | undefined)?.trim()
      if (!prompt) throw new Error('Prompt is required')
      if (!source_image) throw new Error('Source image is required')

      // Upload base64 source image to storage to get a public URL for fal
      const base64Data = (source_image as string).replace(/^data:image\/\w+;base64,/, '')
      const mimeMatch = (source_image as string).match(/^data:(image\/\w+);base64,/)
      const mimeType = mimeMatch?.[1] ?? 'image/jpeg'
      const ext = mimeType.split('/')[1] ?? 'jpg'
      const srcBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
      const srcFileName = `${userId ?? 'anon'}/src-${Date.now()}.${ext}`
      const { error: srcUploadErr } = await adminClient.storage
        .from('assets')
        .upload(srcFileName, srcBytes, { contentType: mimeType, upsert: false })
      if (srcUploadErr) throw new Error(`Source upload failed: ${srcUploadErr.message}`)
      const { data: { publicUrl: sourceUrl } } = adminClient.storage.from('assets').getPublicUrl(srcFileName)

      const fmt = ['jpeg', 'png'].includes(output_format) ? output_format : 'jpeg'
      const seedVal = (seed != null && seed !== '') ? Number(seed) : undefined
      const numImages = Math.min(Math.max(Number(num_images) || 1, 1), 4)
      const strengthVal = Math.min(Math.max(Number(strength) || 0.85, 0.1), 1.0)
      const numSteps = Math.min(Math.max(Number(steps) || 28, 1), 50)
      const guidanceVal = guidance_scale != null ? Math.min(Math.max(Number(guidance_scale), 1), 20) : 3.5

      const falPayload: Record<string, unknown> = {
        image_url: sourceUrl,
        prompt,
        strength: strengthVal,
        num_inference_steps: numSteps,
        guidance_scale: guidanceVal,
        num_images: numImages,
        output_format: fmt,
        enable_safety_checker: true,
        ...(seedVal !== undefined ? { seed: seedVal } : {}),
      }

      const falRes = await fetch(FAL_ENDPOINTS['flux-dev-img2img'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify(falPayload),
      })
      if (!falRes.ok) {
        const err = await falRes.text()
        throw new Error(`fal.ai error: ${err}`)
      }

      const falData = await falRes.json()
      const images: { url: string; width?: number; height?: number }[] = falData.images ?? []
      if (images.length === 0) throw new Error(`No images in fal.ai response: ${JSON.stringify(falData)}`)

      const insertedAssets = await Promise.all(
        images.map(async (img) => {
          const permanentUrl = await storeImage(adminClient, img.url, userId, fmt)
          const { data } = await adminClient.from('assets').insert({
            user_id: userId,
            prompt_id: prompt_id ?? null,
            model_id: model_id ?? null,
            gen_type: 'img2img',
            url: permanentUrl,
            width: img.width ?? 1024,
            height: img.height ?? 1024,
            metadata: { prompt, strength: strengthVal, steps: numSteps, guidance_scale: guidanceVal, output_format: fmt, seed: falData.seed ?? seedVal ?? null },
          }).select().single()
          return data
        })
      )

      const firstAsset = insertedAssets[0]
      return new Response(
        JSON.stringify({ asset: firstAsset, image_url: firstAsset?.url ?? images[0].url, all_assets: insertedAssets, prompt, seed: falData.seed ?? null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- video path ---
    const isVideo = slug in FAL_VIDEO_ENDPOINTS
    if (isVideo) {
      const genType = (body.gen_type as string | undefined) ?? 'txt2vid'
      const isImgVid = genType === 'img2vid'
      const modelPath = FAL_VIDEO_ENDPOINTS[slug]?.[genType] ?? FAL_VIDEO_ENDPOINTS[slug]?.['txt2vid']
      if (!modelPath) throw new Error(`No fal endpoint for ${slug}/${genType}`)
      const prompt = (body.prompt as string | undefined)?.trim() ?? ''

      // Build fal payload
      const falPayload: Record<string, unknown> = {}

      // img2vid: upload source image to get a URL
      if (isImgVid) {
        if (!source_image) throw new Error('Source image is required for image-to-video')
        const base64Data = (source_image as string).replace(/^data:image\/\w+;base64,/, '')
        const mimeMatch = (source_image as string).match(/^data:(image\/\w+);base64,/)
        const mimeType = mimeMatch?.[1] ?? 'image/jpeg'
        const ext = mimeType.split('/')[1] ?? 'jpg'
        const srcBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
        const srcFileName = `${userId ?? 'anon'}/src-${Date.now()}.${ext}`
        const { error: srcErr } = await adminClient.storage
          .from('assets').upload(srcFileName, srcBytes, { contentType: mimeType, upsert: false })
        if (srcErr) throw new Error(`Source upload failed: ${srcErr.message}`)
        const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(srcFileName)
        falPayload.image_url = publicUrl
      }

      if (prompt) falPayload.prompt = prompt
      if (body.negative_prompt) falPayload.negative_prompt = body.negative_prompt

      // Model-specific params
      if (slug.startsWith('kling')) {
        falPayload.aspect_ratio = body.aspect_ratio ?? '16:9'
        falPayload.duration = body.duration ?? '5'
        if (body.cfg_scale) falPayload.cfg_scale = Number(body.cfg_scale)
      } else if (slug.startsWith('luma')) {
        falPayload.aspect_ratio = body.aspect_ratio ?? '16:9'
        if (body.loop) falPayload.loop = body.loop === 'true' || body.loop === true
      } else if (slug.startsWith('minimax')) {
        falPayload.prompt_optimizer = body.prompt_optimizer !== 'false'
      }

      // Submit to fal queue
      const queueRes = await fetch(`${FAL_QUEUE_BASE}/${modelPath}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify(falPayload),
      })
      if (!queueRes.ok) {
        const err = await queueRes.text()
        throw new Error(`fal.ai queue error: ${err}`)
      }
      const queueData = await queueRes.json()
      const statusUrl: string = queueData.status_url ?? ''
      if (!statusUrl) throw new Error(`No status_url in fal response: ${JSON.stringify(queueData)}`)

      // Insert pending asset
      const { data: asset } = await adminClient.from('assets').insert({
        user_id: userId,
        prompt_id: prompt_id ?? null,
        model_id: model_id ?? null,
        gen_type: isImgVid ? 'img2vid' : 'txt2vid',
        url: '',
        metadata: {
          prompt,
          model_slug: slug,
          status: 'pending',
          status_url: statusUrl,
          response_url: queueData.response_url ?? '',
          aspect_ratio: body.aspect_ratio ?? '16:9',
          duration: body.duration ?? null,
        },
      }).select().single()

      return new Response(
        JSON.stringify({ asset, operation_name: statusUrl, status: 'pending', prompt, provider: 'fal.ai' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- txt2img path ---
    const builtPrompt = buildPrompt(body)
    if (!builtPrompt.trim()) throw new Error('Prompt is empty')

    const endpoint = FAL_ENDPOINTS[slug] ?? FAL_ENDPOINTS['flux-schnell']
    const isUltra   = slug === 'flux-pro-ultra'
    const isPro     = slug === 'flux-pro'
    const isSchnell = slug === 'flux-schnell'

    const numImages = Math.min(Math.max(Number(num_images) || 1, 1), 4)
    const fmt = ['jpeg', 'png'].includes(output_format) ? output_format : 'jpeg'
    const seedVal = (seed != null && seed !== '') ? Number(seed) : undefined

    let falPayload: Record<string, unknown>
    let w: number, h: number

    if (isUltra) {
      const ultraAspect = (aspect_ratio && ULTRA_ASPECT_DIMS[aspect_ratio]) ? aspect_ratio : '1:1'
      ;[w, h] = ULTRA_ASPECT_DIMS[ultraAspect]
      falPayload = {
        prompt: builtPrompt,
        aspect_ratio: ultraAspect,
        num_images: numImages,
        output_format: fmt,
        enable_safety_checker: true,
        ...(body.raw === 'true' || body.raw === true ? { raw: true } : {}),
        ...(seedVal !== undefined ? { seed: seedVal } : {}),
      }
    } else if (isPro) {
      const falSize = (aspect_ratio && FAL_SIZE_DIMS[aspect_ratio]) ? aspect_ratio : 'square_hd'
      ;[w, h] = FAL_SIZE_DIMS[falSize]
      const numSteps = Math.min(Math.max(Number(steps) || 28, 1), 50)
      const guidanceVal = guidance_scale != null ? Math.min(Math.max(Number(guidance_scale), 1), 10) : 3.5
      falPayload = {
        prompt: builtPrompt,
        image_size: falSize,
        steps: numSteps,
        guidance: guidanceVal,
        num_images: numImages,
        output_format: fmt,
        safety_tolerance: '2',
        ...(seedVal !== undefined ? { seed: seedVal } : {}),
      }
    } else {
      // Schnell + Dev
      const falSize = (aspect_ratio && FAL_SIZE_DIMS[aspect_ratio]) ? aspect_ratio : 'square_hd'
      ;[w, h] = FAL_SIZE_DIMS[falSize]
      const maxSteps = isSchnell ? 12 : 50
      const defaultSteps = isSchnell ? 4 : 28
      const numSteps = Math.min(Math.max(Number(steps) || defaultSteps, 1), maxSteps)
      const guidanceVal = guidance_scale != null ? Math.min(Math.max(Number(guidance_scale), 1), 20) : 3.5
      const accel = ['none', 'regular', 'high'].includes(acceleration) ? acceleration : 'none'
      falPayload = {
        prompt: builtPrompt,
        image_size: falSize,
        num_inference_steps: numSteps,
        num_images: numImages,
        guidance_scale: guidanceVal,
        output_format: fmt,
        enable_safety_checker: true,
        ...(isSchnell ? { acceleration: accel } : {}),
        ...(seedVal !== undefined ? { seed: seedVal } : {}),
      }
    }

    const falRes = await fetch(endpoint, {
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

    const metadata = {
      prompt: builtPrompt,
      model_slug: slug,
      aspect_ratio: aspect_ratio ?? null,
      style: body.style ?? null,
      lighting: body.lighting ?? null,
      mood: body.mood ?? null,
      quality: body.quality ?? null,
      steps: falPayload.num_inference_steps ?? falPayload.steps ?? null,
      num_images: numImages,
      guidance: falPayload.guidance_scale ?? falPayload.guidance ?? null,
      output_format: fmt,
      seed: falData.seed ?? seedVal ?? null,
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
