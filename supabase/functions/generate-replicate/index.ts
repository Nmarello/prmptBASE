import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { checkImageRateLimit } from '../_shared/rate-limit.ts'
import { isSafeProviderUrl } from '../_shared/validate-url.ts'
import { corsHeaders, optionsResponse, safeErrorMessage } from '../_shared/cors.ts'

// ── Model registry ───────────────────────────────────────────────────────────
interface ModelConfig {
  path: string
  version?: string      // pin a version hash → uses /v1/predictions instead of /v1/models/.../predictions
  maxOutputs?: number   // default 4; set to 1 for models that don't support batch
  costUsd?: number      // per image/video
  isVideo?: boolean     // skip image storage, use gen_type 'txt2vid', extend polling deadline
  buildInput: (base: BaseInput) => Record<string, unknown>
}

interface BaseInput {
  prompt: string
  negPrompt: string
  aspectRatio: string
  numOutputs: number
  outputFormat: string
  seed?: number
  _style?: string    // raw style key, used by model-specific builders (e.g. Recraft)
  _steps?: number    // num_inference_steps
  _guidance?: number // guidance_scale
}

// Standard input for FLUX / SD-style models
function standardInput(b: BaseInput, maxOut = 4): Record<string, unknown> {
  const out: Record<string, unknown> = {
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio,
    num_outputs: Math.min(b.numOutputs, maxOut),
    output_format: b.outputFormat,
    output_quality: 90,
  }
  if (b.negPrompt) out.negative_prompt = b.negPrompt
  if (b.seed != null) out.seed = b.seed
  return out
}

// Recraft uses different param names and an explicit style
const RECRAFT_STYLE_MAP: Record<string, string> = {
  photorealistic: 'realistic_image',
  cinematic: 'realistic_image/hard_flash',
  digital_art: 'digital_illustration',
  oil_painting: 'digital_illustration/hand_drawn',
  watercolor: 'digital_illustration/watercolor',
  pencil_sketch: 'digital_illustration/sketch',
  '3d_render': 'render_3d',
  anime: 'digital_illustration/anime',
}
const RECRAFT_SIZE_MAP: Record<string, string> = {
  '1:1':  '1024x1024',
  '16:9': '1365x1024',
  '9:16': '1024x1365',
  '4:3':  '1365x1024',
  '3:4':  '1024x1365',
  '3:2':  '1365x910',
  '2:3':  '910x1365',
  '21:9': '1820x780',
}
// Recraft V4 (standard) valid sizes per Replicate enum
const RECRAFT_V4_SIZE_MAP: Record<string, string> = {
  '1:1':  '1024x1024',
  '16:9': '1344x768',
  '9:16': '768x1344',
  '4:3':  '1280x896',
  '3:4':  '896x1280',
  '3:2':  '1280x832',
  '2:3':  '832x1280',
  '21:9': '1536x768',
}
// Recraft V4 Pro requires higher-res sizes (different enum from V4 standard)
const RECRAFT_V4_PRO_SIZE_MAP: Record<string, string> = {
  '1:1':  '2048x2048',
  '16:9': '2688x1536',
  '9:16': '1536x2688',
  '4:3':  '2432x1792',
  '3:4':  '1792x2432',
  '3:2':  '2560x1664',
  '2:3':  '1664x2560',
  '21:9': '3072x1536',
}
function recraftInput(b: BaseInput, style?: string): Record<string, unknown> {
  return {
    prompt: b.prompt,
    style: style ?? 'realistic_image',
    n: Math.min(b.numOutputs, 4),
    size: RECRAFT_SIZE_MAP[b.aspectRatio] ?? '1024x1024',
    response_format: 'url',
  }
}

// Ideogram v3 uses number_of_images and resolution-based sizing
const IDEOGRAM_RESOLUTION_MAP: Record<string, string> = {
  '1:1':  '1024x1024',
  '16:9': '1344x768',
  '9:16': '768x1344',
  '4:3':  '1152x864',
  '3:4':  '864x1152',
  '3:2':  '1248x832',
  '2:3':  '832x1248',
  '21:9': '1536x640',
}
function ideogramInput(b: BaseInput): Record<string, unknown> {
  const out: Record<string, unknown> = {
    prompt: b.prompt,
    number_of_images: Math.min(b.numOutputs, 4),
    resolution: IDEOGRAM_RESOLUTION_MAP[b.aspectRatio] ?? 'RESOLUTION_1024_1024',
    magic_prompt_option: 'Auto',
  }
  if (b.negPrompt) out.negative_prompt = b.negPrompt
  if (b.seed != null) out.seed = b.seed
  return out
}

const MODELS: Record<string, ModelConfig> = {
  // ── Stability AI ────────────────────────────────────────────────────────────
  'sd35-large':       { path: 'stability-ai/stable-diffusion-3.5-large',       costUsd: 0.065,  buildInput: (b) => standardInput(b) },
  'sd35-large-turbo': { path: 'stability-ai/stable-diffusion-3.5-large-turbo', costUsd: 0.035,  buildInput: (b) => standardInput(b) },
  'sd35-medium':      { path: 'stability-ai/stable-diffusion-3.5-medium',       costUsd: 0.035,  buildInput: (b) => standardInput(b) },

  // ── FLUX ────────────────────────────────────────────────────────────────────
  'flux-schnell':     { path: 'black-forest-labs/flux-schnell',     costUsd: 0.003, buildInput: (b) => standardInput(b) },
  'flux-dev':         { path: 'black-forest-labs/flux-dev',         costUsd: 0.025, buildInput: (b) => standardInput(b) },
  'flux-pro':         { path: 'black-forest-labs/flux-pro',         costUsd: 0.055, maxOutputs: 1, buildInput: (b) => standardInput(b, 1) },
  'flux-pro-ultra':   { path: 'black-forest-labs/flux-1.1-pro-ultra', costUsd: 0.12, maxOutputs: 1, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio,
    output_format: b.outputFormat === 'webp' ? 'jpg' : b.outputFormat,
    safety_tolerance: 2,
    ...(b.seed != null ? { seed: b.seed } : {}),
  })},
  'flux2-pro':        { path: 'black-forest-labs/flux-2-pro',       costUsd: 0.04, buildInput: (b) => standardInput(b) },

  // ── Recraft ─────────────────────────────────────────────────────────────────
  'recraft-v3':       { path: 'recraft-ai/recraft-v3',     costUsd: 0.04, buildInput: (b) => recraftInput(b, RECRAFT_STYLE_MAP[b._style as string] ?? 'realistic_image') },
  'recraft-v4':       { path: 'recraft-ai/recraft-v4',     costUsd: 0.04, buildInput: (b) => ({
    prompt: b.prompt,
    style: RECRAFT_STYLE_MAP[b._style as string] ?? 'realistic_image',
    n: Math.min(b.numOutputs, 4),
    size: RECRAFT_V4_SIZE_MAP[b.aspectRatio] ?? '1024x1024',
    response_format: 'url',
  }) },
  'recraft-v4-pro':   { path: 'recraft-ai/recraft-v4-pro', costUsd: 0.08, buildInput: (b) => ({
    prompt: b.prompt,
    style: RECRAFT_STYLE_MAP[b._style as string] ?? 'realistic_image',
    n: Math.min(b.numOutputs, 4),
    size: RECRAFT_V4_PRO_SIZE_MAP[b.aspectRatio] ?? '2048x2048',
    response_format: 'url',
  }) },

  // ── Ideogram ────────────────────────────────────────────────────────────────
  'ideogram-v3':      { path: 'ideogram-ai/ideogram-v3-balanced', costUsd: 0.06, buildInput: ideogramInput },

  // ── HiDream (via PrunaAI) ───────────────────────────────────────────────────
  'hidream-fast':     { path: 'prunaai/hidream-l1-fast', costUsd: 0.03, buildInput: (b) => standardInput(b) },
  'hidream-full':     { path: 'prunaai/hidream-l1-full', version: '4ac54871d9e2152baf74c89729f9c17a1b770e1ca2c10989b69e8ebea480ca40', costUsd: 0.05, buildInput: (b) => standardInput(b) },

  // ── ByteDance Seedream ───────────────────────────────────────────────────────
  'seedream-45':      { path: 'bytedance/seedream-4.5',   costUsd: 0.025, buildInput: (b) => standardInput(b) },

  // ── Google Nano Banana Pro ───────────────────────────────────────────────────
  'nano-banana-pro':  { path: 'google/nano-banana-pro',   costUsd: 0.15,  buildInput: (b) => standardInput(b) },

  // ── Lightricks LTX-2.3 Video ─────────────────────────────────────────────────
  'ltx-2.3-pro':  { path: 'lightricks/ltx-2.3-pro',  isVideo: true, maxOutputs: 1, costUsd: 0.10, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: ['16:9', '9:16'].includes(b.aspectRatio) ? b.aspectRatio : '16:9',
    ...(b.negPrompt ? { negative_prompt: b.negPrompt } : {}),
    ...(b._steps != null ? { num_inference_steps: b._steps } : {}),
    ...(b._guidance != null ? { guidance_scale: b._guidance } : {}),
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },
  'ltx-2.3-fast': { path: 'lightricks/ltx-2.3-fast', isVideo: true, maxOutputs: 1, costUsd: 0.05, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: ['16:9', '9:16'].includes(b.aspectRatio) ? b.aspectRatio : '16:9',
    ...(b.negPrompt ? { negative_prompt: b.negPrompt } : {}),
    ...(b._steps != null ? { num_inference_steps: b._steps } : {}),
    ...(b._guidance != null ? { guidance_scale: b._guidance } : {}),
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },
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

  if (body.additional_details) parts.push(String(body.additional_details).trim())
  return parts.filter(Boolean).join(', ')
}

async function storeImage(
  adminClient: ReturnType<typeof createClient>,
  tempUrl: string,
  userId: string | null,
  fmt = 'webp',
): Promise<string> {
  try {
    if (!isSafeProviderUrl(tempUrl)) {
      console.error('[storeImage] Blocked unsafe URL:', tempUrl)
      return tempUrl
    }
    const imgRes = await fetch(tempUrl)
    if (!imgRes.ok) throw new Error(`Fetch failed: ${imgRes.status}`)
    const actualContentType = imgRes.headers.get('content-type')?.split(';')[0].trim() ?? `image/${fmt}`
    const extMap: Record<string, string> = { 'image/png': 'png', 'image/webp': 'webp', 'image/jpeg': 'jpg' }
    const ext = extMap[actualContentType] ?? (fmt === 'png' ? 'png' : fmt === 'webp' ? 'webp' : 'jpg')
    const fileName = `${userId ?? 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const imgBlob = await imgRes.arrayBuffer()
    const { error: uploadErr } = await adminClient.storage
      .from('assets')
      .upload(fileName, imgBlob, { contentType: actualContentType, upsert: false })
    if (uploadErr) {
      console.error('[storeImage] upload error:', uploadErr.message)
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
  if (req.method === 'OPTIONS') return optionsResponse(req)

  try {
    const body = await req.json()
    const { user_token, model_id, model_slug, prompt_id, aspect_ratio, seed, num_images, output_format } = body

    const replicateKey = Deno.env.get('REPLICATE_API_KEY')
    if (!replicateKey) throw new Error('REPLICATE_API_KEY not configured')

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
      const isUnauthed = rateLimit.tier === 'unauthenticated'
      return new Response(JSON.stringify({
        error: isUnauthed ? 'Authentication required' : `Monthly limit reached. You've used ${rateLimit.used} of ${rateLimit.limit} generations on the ${rateLimit.tier} plan.`,
        rate_limited: !isUnauthed,
        used: rateLimit.used,
        limit: rateLimit.limit,
        tier: rateLimit.tier,
      }), { status: isUnauthed ? 401 : 429, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } })
    }

    const slug = (model_slug as string) ?? 'sd35-large'
    const config = MODELS[slug]
    if (!config) throw new Error(`Unknown Replicate model slug: ${slug}`)

    const builtPrompt = buildPrompt(body)
    if (!builtPrompt.trim()) throw new Error('Prompt is required')

    const fmt = ['png', 'jpg', 'webp'].includes(output_format) ? output_format : 'webp'
    const seedVal = (seed != null && seed !== '') ? Number(seed) : undefined
    const numOutputs = Math.min(Math.max(Number(num_images) || 1, 1), config.maxOutputs ?? 4)
    const ar = aspect_ratio ?? '1:1'
    const negPrompt = (body.negative_prompt as string | undefined)?.trim() ?? ''

    // Build model-specific input — pass _style as a hint for models that need it
    const baseInput: BaseInput = {
      prompt: builtPrompt,
      negPrompt,
      aspectRatio: ar,
      numOutputs,
      outputFormat: fmt,
      seed: seedVal,
      _style: body.style as string | undefined,
      _steps: body.num_inference_steps ? Number(body.num_inference_steps) : undefined,
      _guidance: body.guidance_scale ? Number(body.guidance_scale) : undefined,
    }
    const replicateInput = config.buildInput(baseInput)

    const repUrl = config.version
      ? 'https://api.replicate.com/v1/predictions'
      : `https://api.replicate.com/v1/models/${config.path}/predictions`
    const repBody = config.version
      ? { version: config.version, input: replicateInput }
      : { input: replicateInput }

    const repHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${replicateKey}`,
    }
    // Prefer:wait only works reliably on the /v1/models/ endpoint; versioned predictions poll manually
    if (!config.version) repHeaders['Prefer'] = 'wait'

    const repRes = await fetch(repUrl, {
      method: 'POST',
      headers: repHeaders,
      body: JSON.stringify(repBody),
    })

    if (!repRes.ok) {
      const err = await repRes.text()
      throw new Error(`Replicate error: ${err}`)
    }

    let repData = await repRes.json()

    // Poll if the prediction hasn't completed yet (versioned endpoint ignores Prefer: wait)
    if (repData.status === 'starting' || repData.status === 'processing') {
      const pollUrl = repData.urls?.get
      if (!pollUrl) throw new Error(`Replicate prediction stuck in ${repData.status} with no poll URL`)
      const deadline = Date.now() + (config.isVideo ? 300_000 : 130_000)
      while ((repData.status === 'starting' || repData.status === 'processing') && Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 2000))
        const pollRes = await fetch(pollUrl, { headers: { 'Authorization': `Bearer ${replicateKey}` } })
        if (!pollRes.ok) throw new Error(`Replicate poll error: ${pollRes.status}`)
        repData = await pollRes.json()
      }
      if (repData.status === 'starting' || repData.status === 'processing') {
        throw new Error('Replicate prediction timed out after 120s')
      }
    }

    if (repData.status === 'failed' || repData.error) {
      throw new Error(`Replicate generation failed: ${repData.error ?? repData.status}`)
    }

    const outputUrls: string[] = Array.isArray(repData.output)
      ? repData.output
      : typeof repData.output === 'string'
        ? [repData.output]
        : []
    if (outputUrls.length === 0) throw new Error(`No output from Replicate: ${JSON.stringify(repData)}`)

    const predictTime = repData.metrics?.predict_time ?? null

    // ── Video output: upload to Supabase storage for permanence ─────────────
    if (config.isVideo) {
      let videoUrl = outputUrls[0]
      try {
        const vidRes = await fetch(videoUrl)
        if (vidRes.ok) {
          const vidBuf = await vidRes.arrayBuffer()
          const fileName = `${userId ?? 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`
          const { error: uploadErr } = await adminClient.storage.from('assets').upload(fileName, vidBuf, { contentType: 'video/mp4', upsert: false })
          if (!uploadErr) {
            const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(fileName)
            videoUrl = publicUrl
          }
        }
      } catch (e) {
        console.error('[storeVideo] error, using temp URL:', e)
      }
      const { data: asset, error: assetErr } = await adminClient.from('assets').insert({
        user_id: userId,
        prompt_id: prompt_id ?? null,
        model_id: model_id ?? null,
        gen_type: 'txt2vid',
        url: videoUrl,
        cost_usd: config.costUsd ?? null,
        metadata: {
          prompt: builtPrompt,
          model_slug: slug,
          aspect_ratio: ar,
          seed: repData.input?.seed ?? seedVal ?? null,
          predict_time: predictTime,
        },
      }).select().single()
      if (assetErr || !asset) console.error('[generate-replicate] video asset insert failed:', assetErr?.message)
      return new Response(
        JSON.stringify({
          asset,
          image_url: videoUrl,
          prompt: builtPrompt,
          seed: repData.input?.seed ?? seedVal ?? null,
        }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    // ── Image output: download + re-upload to Supabase storage ───────────────
    const insertedAssets = await Promise.all(
      outputUrls.map(async (url) => {
        const permanentUrl = await storeImage(adminClient, url, userId, fmt)
        const { data, error: insertErr } = await adminClient.from('assets').insert({
          user_id: userId,
          prompt_id: prompt_id ?? null,
          model_id: model_id ?? null,
          gen_type: 'txt2img',
          url: permanentUrl,
          cost_usd: config.costUsd ?? null,
          metadata: {
            prompt: builtPrompt,
            model_slug: slug,
            aspect_ratio: ar,
            output_format: fmt,
            seed: repData.input?.seed ?? seedVal ?? null,
            predict_time: predictTime,
          },
        }).select().single()
        if (insertErr || !data) console.error('[generate-replicate] image asset insert failed:', insertErr?.message)
        return data
      }),
    )

    const firstAsset = insertedAssets[0]
    return new Response(
      JSON.stringify({
        asset: firstAsset,
        image_url: firstAsset?.url ?? outputUrls[0],
        all_assets: insertedAssets,
        prompt: builtPrompt,
        seed: repData.input?.seed ?? seedVal ?? null,
      }),
      { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[generate-replicate]', err)
    return new Response(
      JSON.stringify({ error: safeErrorMessage(err) }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    )
  }
})
