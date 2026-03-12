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
  'flux-kontext-pro':  'https://fal.run/fal-ai/flux-pro/kontext',
  'recraft-v4-pro':    'https://fal.run/fal-ai/recraft/v4/pro/text-to-image',
  'nano-banana':       'https://fal.run/fal-ai/nano-banana-2',
  'nano-banana-edit':  'https://fal.run/fal-ai/nano-banana-2/edit',
}

const NANO_BANANA_ASPECT_DIMS: Record<string, [number, number]> = {
  '1:1':  [1024, 1024],
  '16:9': [1920, 1080],
  '9:16': [1080, 1920],
  '4:3':  [1365, 1024],
  '3:4':  [1024, 1365],
  '3:2':  [1536, 1024],
  '2:3':  [1024, 1536],
  'auto': [1024, 1024],
}

const FAL_VIDEO_ENDPOINTS: Record<string, Record<string, string>> = {
  'kling': {
    'txt2vid': 'fal-ai/kling-video/v1.6/standard/text-to-video',
    'img2vid': 'fal-ai/kling-video/v1.6/standard/image-to-video',
  },
  'luma': {
    'txt2vid': 'fal-ai/luma-dream-machine/ray-2',
    'img2vid': 'fal-ai/luma-dream-machine/ray-2/image-to-video',
  },
  'minimax-txt2vid': {
    'txt2vid': 'fal-ai/minimax/video-01',
  },
  'sora2': {
    'txt2vid': 'fal-ai/sora-2/text-to-video',
    'img2vid': 'fal-ai/sora-2/image-to-video',
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

const LENS_MAP: Record<string, string> = {
  '85mm': '85mm portrait lens, shallow depth of field, subject separation',
  '50mm': '50mm standard lens, natural perspective',
  '24mm': '24mm wide angle lens, environmental context',
  '14mm': '14mm ultra-wide lens, dramatic perspective distortion',
  'macro': 'macro lens, extreme close-up, fine detail',
  'fisheye': 'fisheye lens, 180° field of view, curved distortion',
  'anamorphic': 'anamorphic lens, cinematic widescreen, oval bokeh, lens flares',
  'telephoto': '200mm telephoto lens, compressed perspective, distant subject',
  'tilt_shift': 'tilt-shift lens, selective focus, miniature effect',
}

const DOF_MAP: Record<string, string> = {
  'shallow': 'shallow depth of field, soft creamy bokeh background',
  'medium': 'medium depth of field, subject sharp, background softly blurred',
  'deep': 'deep depth of field, everything in sharp focus',
  'tilt_shift': 'tilt-shift focus, selective plane of focus',
}

const COMPOSITION_MAP: Record<string, string> = {
  'close_up': 'close-up shot, face or subject fills frame',
  'medium_shot': 'medium shot, waist up',
  'wide_shot': 'wide establishing shot, full environment visible',
  'aerial': 'aerial bird\'s eye view, looking straight down',
  'macro': 'extreme macro close-up, microscopic detail',
  'worms_eye': 'worm\'s eye view, looking sharply upward',
  'rule_of_thirds': 'rule of thirds composition, subject off-center',
  'symmetrical': 'perfectly symmetrical composition, centered',
  'dutch_angle': 'dutch angle, tilted camera, tension and unease',
  'over_shoulder': 'over-the-shoulder shot',
  'pov': 'first-person POV shot',
}

const COLOR_MAP: Record<string, string> = {
  'warm': 'warm color palette, amber and orange tones',
  'cool': 'cool color palette, blue and teal tones',
  'monochrome': 'monochromatic color scheme',
  'vibrant': 'vibrant saturated colors, high chroma',
  'muted': 'muted desaturated colors, faded palette',
  'pastel': 'soft pastel colors, gentle hues',
  'dark': 'dark moody palette, deep shadows',
  'neon': 'neon color palette, electric hues',
  'earthy': 'earthy natural tones, browns and greens',
  'golden': 'golden warm tones, amber and honey',
}

const TIME_MAP: Record<string, string> = {
  'dawn': 'just before sunrise, soft pink and purple sky',
  'morning': 'early morning, fresh light, long soft shadows',
  'midday': 'harsh midday sun, high contrast, bleached highlights',
  'afternoon': 'warm afternoon light, golden cast',
  'dusk': 'dusk, orange and purple sky, fading light',
  'blue_hour': 'blue hour, deep twilight, electric blue atmosphere',
  'night': 'night, dark sky, artificial light sources',
  'golden_hour': 'golden hour, warm glowing sun just above horizon',
}

const WEATHER_MAP: Record<string, string> = {
  'clear': 'clear blue sky, bright crisp light',
  'overcast': 'overcast sky, flat even diffused light',
  'foggy': 'heavy fog, mysterious haze, reduced visibility',
  'rainy': 'rain, wet reflective surfaces, dramatic atmosphere',
  'stormy': 'storm clouds, lightning, dramatic dark sky',
  'snowy': 'snowfall, cold white atmosphere, muted tones',
  'dusty': 'dusty hazy atmosphere, desert heat shimmer',
  'partly_cloudy': 'partly cloudy, dramatic cloud shadows',
}

const MEDIUM_MAP: Record<string, string> = {
  'digital': 'digital photography, clean sharp image',
  '35mm_film': '35mm film, natural grain, warm color rendition',
  'medium_format': 'medium format photography, rich tonal range, ultra detailed',
  'polaroid': 'polaroid instant film, faded colors, soft vignette',
  'daguerreotype': 'daguerreotype, antique silver, historical photographic process',
  'vhs': 'VHS analog video, scan lines, lo-fi aesthetic',
  'super8': 'Super 8 film, vintage grain, warm flickering look',
  'infrared': 'infrared photography, glowing foliage, dark skies, ethereal',
}

function buildPrompt(body: Record<string, unknown>): string {
  const parts: string[] = []

  if (body.prompt) parts.push(String(body.prompt).trim())
  // subject field (DALL-E style)
  if (body.subject) parts.push(String(body.subject).trim())

  const style = body.style as string | undefined
  if (style && STYLE_MAP[style]) parts.push(STYLE_MAP[style])
  else if (style?.trim()) parts.push(style.trim())

  const lighting = body.lighting as string | undefined
  if (lighting && LIGHTING_MAP[lighting]) parts.push(LIGHTING_MAP[lighting])

  const lens = body.lens as string | undefined
  if (lens && LENS_MAP[lens]) parts.push(LENS_MAP[lens])

  const dof = body.depth_of_field as string | undefined
  if (dof && DOF_MAP[dof]) parts.push(DOF_MAP[dof])

  const composition = body.composition as string | undefined
  if (composition && COMPOSITION_MAP[composition]) parts.push(COMPOSITION_MAP[composition])

  const timeOfDay = body.time_of_day as string | undefined
  if (timeOfDay && TIME_MAP[timeOfDay]) parts.push(TIME_MAP[timeOfDay])

  const weather = body.weather as string | undefined
  if (weather && WEATHER_MAP[weather]) parts.push(WEATHER_MAP[weather])

  const medium = body.camera_medium as string | undefined
  if (medium && MEDIUM_MAP[medium]) parts.push(MEDIUM_MAP[medium])

  const mood = body.mood as string[] | undefined
  if (Array.isArray(mood) && mood.length > 0) {
    parts.push(mood.map((m) => MOOD_MAP[m] ?? m).join(', '))
  }

  const colorPalette = body.color_palette as string[] | undefined
  if (Array.isArray(colorPalette) && colorPalette.length > 0) {
    parts.push(colorPalette.map((c) => COLOR_MAP[c] ?? c).join(', '))
  }

  const quality = body.quality as string[] | undefined
  if (Array.isArray(quality) && quality.length > 0) {
    parts.push(quality.map((q) => QUALITY_MAP[q] ?? q).join(', '))
  }

  if (body.additional_details) parts.push(String(body.additional_details).trim())

  return parts.filter(Boolean).join(', ')
}

async function storeImage(adminClient: ReturnType<typeof createClient>, tempUrl: string, userId: string | null, fmt = 'jpeg'): Promise<string> {
  try {
    const imgRes = await fetch(tempUrl)
    if (!imgRes.ok) throw new Error(`Fetch failed: ${imgRes.status}`)
    // Use actual content-type from response (handles WebP, PNG, etc.)
    const actualContentType = imgRes.headers.get('content-type')?.split(';')[0].trim() ?? `image/${fmt}`
    const extMap: Record<string, string> = { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/gif': 'gif' }
    const ext = extMap[actualContentType] ?? (fmt === 'png' ? 'png' : 'jpg')
    const fileName = `${userId ?? 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const imgBlob = await imgRes.arrayBuffer()
    const { error: uploadErr } = await adminClient.storage
      .from('assets')
      .upload(fileName, imgBlob, { contentType: actualContentType, upsert: false })
    if (uploadErr) {
      console.error('[storeImage] upload error:', uploadErr.message, '| file:', fileName, '| contentType:', actualContentType)
      return tempUrl
    }
    const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(fileName)
    return publicUrl
  } catch (err) {
    console.error('[storeImage] error:', err)
    return tempUrl
  }
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
    const genType = (body.gen_type as string | undefined) ?? ''
    const isImg2Img = slug === 'flux-dev-img2img'
    const isKontext = slug === 'flux-kontext-pro'
    const isRecraft = slug === 'recraft-v4-pro'

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
      const falCostRaw = falRes.headers.get('x-fal-billing-cost')
      const falCost = falCostRaw ? parseFloat(falCostRaw) : (falData.billing?.cost ?? null)
      const costPerAsset = (falCost != null && numImages > 0) ? falCost / numImages : null
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
            cost_usd: costPerAsset,
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

    // --- flux kontext pro path ---
    if (isKontext) {
      const prompt = (body.prompt as string | undefined)?.trim()
      if (!prompt) throw new Error('Prompt is required')
      if (!source_image) throw new Error('Source image is required')

      let imageUrl: string
      const src = source_image as string
      if (src.startsWith('http')) {
        imageUrl = src
      } else {
        const base64Data = src.replace(/^data:image\/\w+;base64,/, '')
        const mimeMatch = src.match(/^data:(image\/\w+);base64,/)
        const mimeType = mimeMatch?.[1] ?? 'image/jpeg'
        const ext = mimeType.split('/')[1] ?? 'jpg'
        const srcBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
        const srcFileName = `${userId ?? 'anon'}/src-${Date.now()}.${ext}`
        const { error: srcUploadErr } = await adminClient.storage
          .from('assets')
          .upload(srcFileName, srcBytes, { contentType: mimeType, upsert: false })
        if (srcUploadErr) throw new Error(`Source upload failed: ${srcUploadErr.message}`)
        const { data: { publicUrl: srcUrl } } = adminClient.storage.from('assets').getPublicUrl(srcFileName)
        imageUrl = srcUrl
      }

      const fmt = ['jpeg', 'png'].includes(output_format) ? output_format : 'jpeg'
      const seedVal = (seed != null && seed !== '') ? Number(seed) : undefined
      const numImages = Math.min(Math.max(Number(num_images) || 1, 1), 4)
      const guidanceVal = guidance_scale != null ? Math.min(Math.max(Number(guidance_scale), 1), 20) : 3.5
      const numSteps = steps != null ? Math.min(Math.max(Number(steps), 1), 50) : undefined
      const safetyTol = body.safety_tolerance ?? '2'

      const falPayload: Record<string, unknown> = {
        image_url: imageUrl,
        prompt,
        num_images: numImages,
        guidance_scale: guidanceVal,
        output_format: fmt,
        safety_tolerance: safetyTol,
        ...(numSteps !== undefined ? { num_inference_steps: numSteps } : {}),
        ...(seedVal !== undefined ? { seed: seedVal } : {}),
      }

      const falRes = await fetch(FAL_ENDPOINTS['flux-kontext-pro'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify(falPayload),
      })
      if (!falRes.ok) throw new Error(`fal.ai error: ${await falRes.text()}`)
      const falData = await falRes.json()
      const falCostRaw = falRes.headers.get('x-fal-billing-cost')
      const falCost = falCostRaw ? parseFloat(falCostRaw) : (falData.billing?.cost ?? null)
      const costPerAsset = (falCost != null && numImages > 0) ? falCost / numImages : null
      const images: { url: string; width?: number; height?: number }[] = falData.images ?? []
      if (images.length === 0) throw new Error(`No images in fal.ai response`)

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
            cost_usd: costPerAsset,
            metadata: { prompt, guidance_scale: guidanceVal, output_format: fmt, seed: falData.seed ?? seedVal ?? null },
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

      // img2vid: get a public URL for the source image
      if (isImgVid) {
        if (!source_image) throw new Error('Source image is required for image-to-video')
        const src = source_image as string
        if (src.startsWith('http')) {
          // Already a public URL (e.g. from Supabase storage) — use directly
          falPayload.image_url = src
        } else {
          // base64 data URL — upload to storage first
          const base64Data = src.replace(/^data:image\/\w+;base64,/, '')
          const mimeMatch = src.match(/^data:(image\/\w+);base64,/)
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
      }

      if (prompt) falPayload.prompt = prompt
      if (body.negative_prompt) falPayload.negative_prompt = body.negative_prompt

      // Model-specific params
      if (slug.startsWith('kling')) {
        falPayload.aspect_ratio = body.aspect_ratio ?? '16:9'
        falPayload.duration = body.duration ?? '5'
        if (body.cfg_scale) falPayload.cfg_scale = Number(body.cfg_scale)

        // Camera movement — map preset to camera_control object
        const camMove = body.camera_movement as string | undefined
        if (camMove && camMove !== 'none') {
          const CAM_CONTROL: Record<string, Record<string, number>> = {
            zoom_in:    { horizontal: 0, vertical: 0, zoom: 8,  pan: 0, tilt: 0, roll: 0 },
            zoom_out:   { horizontal: 0, vertical: 0, zoom: -8, pan: 0, tilt: 0, roll: 0 },
            pan_left:   { horizontal: 0, vertical: 0, zoom: 0,  pan: -8, tilt: 0, roll: 0 },
            pan_right:  { horizontal: 0, vertical: 0, zoom: 0,  pan: 8, tilt: 0, roll: 0 },
            tilt_up:    { horizontal: 0, vertical: 0, zoom: 0,  pan: 0, tilt: 8, roll: 0 },
            tilt_down:  { horizontal: 0, vertical: 0, zoom: 0,  pan: 0, tilt: -8, roll: 0 },
            move_left:  { horizontal: -8, vertical: 0, zoom: 0, pan: 0, tilt: 0, roll: 0 },
            move_right: { horizontal: 8,  vertical: 0, zoom: 0, pan: 0, tilt: 0, roll: 0 },
            move_up:    { horizontal: 0, vertical: 8,  zoom: 0, pan: 0, tilt: 0, roll: 0 },
            move_down:  { horizontal: 0, vertical: -8, zoom: 0, pan: 0, tilt: 0, roll: 0 },
          }
          if (CAM_CONTROL[camMove]) {
            falPayload.camera_control = { type: 'simple', config: CAM_CONTROL[camMove] }
          }
        }
      } else if (slug.startsWith('luma')) {
        falPayload.aspect_ratio = body.aspect_ratio ?? '16:9'
        if (body.loop) falPayload.loop = body.loop === 'true' || body.loop === true
        // resolution: "540p" | "720p" | "1080p"
        if (body.resolution) falPayload.resolution = body.resolution
        // duration: "5s" | "9s" — ensure "s" suffix
        if (body.duration) {
          const d = String(body.duration).replace(/s$/, '')
          falPayload.duration = `${d}s`
        }

        // Camera motion — append as prompt modifier for Luma
        const lumaCamera = body.camera_motion as string | undefined
        if (lumaCamera && lumaCamera !== 'none') {
          const LUMA_CAM: Record<string, string> = {
            static:      'static camera, no movement',
            zoom_in:     'slow zoom in',
            zoom_out:    'slow zoom out',
            pan_left:    'camera pans left',
            pan_right:   'camera pans right',
            push_in:     'camera pushes forward toward subject',
            pull_out:    'camera pulls back away from subject',
            orbit_left:  'camera orbits left around subject',
            orbit_right: 'camera orbits right around subject',
            crane_up:    'camera cranes upward',
            crane_down:  'camera cranes downward',
            handheld:    'handheld camera, slight natural shake',
            dolly:       'smooth dolly shot',
          }
          if (LUMA_CAM[lumaCamera]) {
            falPayload.prompt = `${falPayload.prompt ?? ''}, ${LUMA_CAM[lumaCamera]}`.replace(/^, /, '')
          }
        }
      } else if (slug.startsWith('minimax')) {
        falPayload.prompt_optimizer = body.prompt_optimizer !== 'false'
        if (body.negative_prompt) falPayload.negative_prompt = body.negative_prompt

        const MINIMAX_CAM: Record<string, string> = {
          static:      'static locked-off camera',
          zoom_in:     'slow zoom in',
          zoom_out:    'slow zoom out',
          pan_left:    'camera pans left',
          pan_right:   'camera pans right',
          push_in:     'camera pushes forward toward subject',
          pull_out:    'camera pulls back away from subject',
          orbit_left:  'camera orbits left around subject',
          orbit_right: 'camera orbits right around subject',
          crane_up:    'camera cranes upward',
          crane_down:  'camera cranes downward',
          handheld:    'handheld camera, slight natural shake',
        }
        const MINIMAX_STYLE: Record<string, string> = {
          cinematic:    'cinematic film quality, movie-grade lighting and color grading',
          documentary:  'documentary style, natural lighting, realistic handheld feel',
          slow_motion:  'slow motion, dramatic timing, fluid movement',
          commercial:   'commercial production quality, polished, clean and bright',
          noir:         'film noir, high contrast, dramatic shadows, moody atmosphere',
          hyperlapse:   'hyperlapse, time-accelerated motion, sweeping movement',
        }
        const camMove = body.camera_movement as string | undefined
        if (camMove && camMove !== 'none' && MINIMAX_CAM[camMove]) {
          falPayload.prompt = `${falPayload.prompt ?? ''}, ${MINIMAX_CAM[camMove]}`.replace(/^, /, '')
        }
        const style = body.video_style as string | undefined
        if (style && style !== 'none' && MINIMAX_STYLE[style]) {
          falPayload.prompt = `${falPayload.prompt ?? ''}, ${MINIMAX_STYLE[style]}`.replace(/^, /, '')
        }
      } else if (slug.startsWith('sora2')) {
        falPayload.aspect_ratio = body.aspect_ratio ?? '16:9'
        if (body.resolution) falPayload.resolution = body.resolution
        if (body.duration) falPayload.duration = Number(body.duration)
        if (body.model) falPayload.model = body.model
        // Always keep the video — API default is delete_video=true (auto-deletes after generation)
        falPayload.delete_video = false
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

    // --- nano-banana path ---
    const isNanoBanana = slug === 'nano-banana'
    if (isNanoBanana) {
      const builtPrompt = buildPrompt(body)
      if (!builtPrompt.trim()) throw new Error('Prompt is empty')

      const numImages = Math.min(Math.max(Number(num_images) || 1, 1), 4)
      const fmt = ['jpeg', 'png', 'webp'].includes(output_format) ? output_format : 'jpeg'
      const seedVal = (seed != null && seed !== '') ? Number(seed) : undefined
      const aspectRatio = (aspect_ratio && NANO_BANANA_ASPECT_DIMS[aspect_ratio]) ? aspect_ratio : '1:1'
      const [nbW, nbH] = NANO_BANANA_ASPECT_DIMS[aspectRatio]

      if ((genType === 'img2img') && source_image) {
        // Edit path — upload source image first
        let imageUrl: string
        const src = source_image as string
        if (src.startsWith('http')) {
          imageUrl = src
        } else {
          const base64Data = src.replace(/^data:image\/\w+;base64,/, '')
          const mimeMatch = src.match(/^data:(image\/\w+);base64,/)
          const mimeType = mimeMatch?.[1] ?? 'image/jpeg'
          const ext = mimeType.split('/')[1] ?? 'jpg'
          const srcBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
          const srcFileName = `${userId ?? 'anon'}/src-${Date.now()}.${ext}`
          const { error: srcErr } = await adminClient.storage.from('assets').upload(srcFileName, srcBytes, { contentType: mimeType, upsert: false })
          if (srcErr) throw new Error(`Source upload failed: ${srcErr.message}`)
          const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(srcFileName)
          imageUrl = publicUrl
        }

        const falPayload: Record<string, unknown> = {
          prompt: builtPrompt,
          image_urls: [imageUrl],
          num_images: numImages,
          // limit_generations=true (default) caps output to 1 regardless of num_images
          limit_generations: false,
          output_format: fmt,
          aspect_ratio: aspectRatio,
          ...(body.resolution ? { resolution: body.resolution } : { resolution: '1K' }),
          ...(body.thinking_level ? { thinking_level: body.thinking_level } : {}),
          ...(body.enable_web_search === 'true' ? { enable_web_search: true } : {}),
          ...(body.safety_tolerance ? { safety_tolerance: body.safety_tolerance } : {}),
          ...(seedVal !== undefined ? { seed: seedVal } : {}),
        }

        const falRes = await fetch(FAL_ENDPOINTS['nano-banana-edit'], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
          body: JSON.stringify(falPayload),
        })
        if (!falRes.ok) throw new Error(`fal.ai error: ${await falRes.text()}`)
        const falData = await falRes.json()
        const falCostRaw = falRes.headers.get('x-fal-billing-cost')
        const falCost = falCostRaw ? parseFloat(falCostRaw) : (falData.billing?.cost ?? null)
        const costPerAsset = (falCost != null && numImages > 0) ? falCost / numImages : null
        const images: { url: string; width?: number; height?: number }[] = falData.images ?? []
        if (images.length === 0) throw new Error(`No images in fal.ai response`)

        const insertedAssets = await Promise.all(images.map(async (img) => {
          const permanentUrl = await storeImage(adminClient, img.url, userId, fmt)
          const { data } = await adminClient.from('assets').insert({
            user_id: userId, prompt_id: prompt_id ?? null, model_id: model_id ?? null,
            gen_type: 'img2img', url: permanentUrl,
            width: img.width ?? nbW, height: img.height ?? nbH,
            cost_usd: costPerAsset,
            metadata: { prompt: builtPrompt, model_slug: slug, aspect_ratio: aspectRatio, output_format: fmt, seed: falData.seed ?? seedVal ?? null },
          }).select().single()
          return data
        }))

        const firstAsset = insertedAssets[0]
        return new Response(
          JSON.stringify({ asset: firstAsset, image_url: firstAsset?.url ?? images[0].url, all_assets: insertedAssets, prompt: builtPrompt, seed: falData.seed ?? null }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // txt2img path
      const falPayload: Record<string, unknown> = {
        prompt: builtPrompt,
        num_images: numImages,
        // limit_generations=true (default) caps output to 1 regardless of num_images
        limit_generations: false,
        output_format: fmt,
        aspect_ratio: aspectRatio,
        ...(body.resolution ? { resolution: body.resolution } : { resolution: '1K' }),
        ...(body.thinking_level ? { thinking_level: body.thinking_level } : {}),
        ...(body.enable_web_search === 'true' ? { enable_web_search: true } : {}),
        ...(body.safety_tolerance ? { safety_tolerance: body.safety_tolerance } : {}),
        ...(seedVal !== undefined ? { seed: seedVal } : {}),
      }

      const falRes = await fetch(FAL_ENDPOINTS['nano-banana'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify(falPayload),
      })
      if (!falRes.ok) throw new Error(`fal.ai error: ${await falRes.text()}`)
      const falData = await falRes.json()
      const falCostRaw = falRes.headers.get('x-fal-billing-cost')
      const falCost = falCostRaw ? parseFloat(falCostRaw) : (falData.billing?.cost ?? null)
      const costPerAsset = (falCost != null && numImages > 0) ? falCost / numImages : null
      const images: { url: string; width?: number; height?: number }[] = falData.images ?? []
      if (images.length === 0) throw new Error(`No images in fal.ai response`)

      const insertedAssets = await Promise.all(images.map(async (img) => {
        const permanentUrl = await storeImage(adminClient, img.url, userId, fmt)
        const { data } = await adminClient.from('assets').insert({
          user_id: userId, prompt_id: prompt_id ?? null, model_id: model_id ?? null,
          gen_type: 'txt2img', url: permanentUrl,
          width: img.width ?? nbW, height: img.height ?? nbH,
          cost_usd: costPerAsset,
          metadata: { prompt: builtPrompt, model_slug: slug, aspect_ratio: aspectRatio, output_format: fmt, seed: falData.seed ?? seedVal ?? null },
        }).select().single()
        return data
      }))

      const firstAsset = insertedAssets[0]
      return new Response(
        JSON.stringify({ asset: firstAsset, image_url: firstAsset?.url ?? images[0].url, all_assets: insertedAssets, prompt: builtPrompt, seed: falData.seed ?? null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // --- recraft path ---
    if (isRecraft) {
      const builtPrompt = buildPrompt(body)
      if (!builtPrompt.trim()) throw new Error('Prompt is empty')

      const fmt = ['jpeg', 'png'].includes(output_format) ? output_format : 'jpeg'
      const seedVal = (seed != null && seed !== '') ? Number(seed) : undefined
      const numImages = Math.min(Math.max(Number(num_images) || 1, 1), 4)
      const falSize = (aspect_ratio && FAL_SIZE_DIMS[aspect_ratio]) ? aspect_ratio : 'square_hd'
      const [w, h] = FAL_SIZE_DIMS[falSize]

      const falPayload: Record<string, unknown> = {
        prompt: builtPrompt,
        image_size: falSize,
        n: numImages,
        output_format: fmt,
        ...(body.style ? { style: body.style } : {}),
        ...(seedVal !== undefined ? { seed: seedVal } : {}),
      }

      const falRes = await fetch(FAL_ENDPOINTS['recraft-v4-pro'], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Key ${falKey}` },
        body: JSON.stringify(falPayload),
      })
      if (!falRes.ok) throw new Error(`fal.ai error: ${await falRes.text()}`)
      const falData = await falRes.json()
      const falCostRaw = falRes.headers.get('x-fal-billing-cost')
      const falCost = falCostRaw ? parseFloat(falCostRaw) : (falData.billing?.cost ?? null)
      const costPerAsset = (falCost != null && numImages > 0) ? falCost / numImages : null
      const images: { url: string; width?: number; height?: number }[] = falData.images ?? []
      if (images.length === 0) throw new Error(`No images in fal.ai response`)

      const insertedAssets = await Promise.all(
        images.map(async (img) => {
          const permanentUrl = await storeImage(adminClient, img.url, userId, fmt)
          const { data } = await adminClient.from('assets').insert({
            user_id: userId,
            prompt_id: prompt_id ?? null,
            model_id: model_id ?? null,
            gen_type: 'txt2img',
            url: permanentUrl,
            width: img.width ?? w,
            height: img.height ?? h,
            cost_usd: costPerAsset,
            metadata: { prompt: builtPrompt, style: body.style ?? null, output_format: fmt, seed: falData.seed ?? seedVal ?? null },
          }).select().single()
          return data
        })
      )

      const firstAsset = insertedAssets[0]
      return new Response(
        JSON.stringify({ asset: firstAsset, image_url: firstAsset?.url ?? images[0].url, all_assets: insertedAssets, prompt: builtPrompt, seed: falData.seed ?? null }),
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
    const falCostRaw = falRes.headers.get('x-fal-billing-cost')
    const falTotalCost = falCostRaw ? parseFloat(falCostRaw) : (falData.billing?.cost ?? null)
    const costPerAsset = (falTotalCost != null && numImages > 0) ? falTotalCost / numImages : null
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
          cost_usd: costPerAsset,
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
