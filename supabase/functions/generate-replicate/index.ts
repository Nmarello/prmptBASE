import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { checkImageRateLimit } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Model registry ───────────────────────────────────────────────────────────
interface ModelConfig {
  path: string
  maxOutputs?: number   // default 4; set to 1 for models that don't support batch
  costUsd?: number      // per image
  buildInput: (base: BaseInput) => Record<string, unknown>
}

interface BaseInput {
  prompt: string
  negPrompt: string
  aspectRatio: string
  numOutputs: number
  outputFormat: string
  seed?: number
  _style?: string   // raw style key, used by model-specific builders (e.g. Recraft)
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
  '1:1':  'RESOLUTION_1024_1024',
  '16:9': 'RESOLUTION_1344_768',
  '9:16': 'RESOLUTION_768_1344',
  '4:3':  'RESOLUTION_1232_928',
  '3:4':  'RESOLUTION_928_1232',
  '3:2':  'RESOLUTION_1344_896',
  '2:3':  'RESOLUTION_896_1344',
  '21:9': 'RESOLUTION_1568_672',
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
    output_format: b.outputFormat,
    safety_tolerance: 2,
    ...(b.seed != null ? { seed: b.seed } : {}),
  })},
  'flux2-pro':        { path: 'black-forest-labs/flux-2-pro',       costUsd: 0.04, buildInput: (b) => standardInput(b) },

  // ── Recraft ─────────────────────────────────────────────────────────────────
  'recraft-v3':       { path: 'recraft-ai/recraft-v3',     costUsd: 0.04, buildInput: (b) => recraftInput(b, RECRAFT_STYLE_MAP[b._style as string] ?? 'realistic_image') },
  'recraft-v4-pro':   { path: 'recraft-ai/recraft-v4-pro', costUsd: 0.08, buildInput: (b) => recraftInput(b, RECRAFT_STYLE_MAP[b._style as string] ?? 'realistic_image') },

  // ── Ideogram ────────────────────────────────────────────────────────────────
  'ideogram-v3':      { path: 'ideogram-ai/ideogram-v3-balanced', costUsd: 0.06, buildInput: ideogramInput },

  // ── HiDream (via PrunaAI) ───────────────────────────────────────────────────
  'hidream-fast':     { path: 'prunaai/hidream-l1-fast', costUsd: 0.03, buildInput: (b) => standardInput(b) },
  'hidream-full':     { path: 'prunaai/hidream-l1-full', costUsd: 0.05, buildInput: (b) => standardInput(b) },

  // ── ByteDance Seedream ───────────────────────────────────────────────────────
  'seedream-45':      { path: 'bytedance/seedream-4.5',   costUsd: 0.025, buildInput: (b) => standardInput(b) },
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

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
      return new Response(JSON.stringify({
        error: `Monthly limit reached. You've used ${rateLimit.used} of ${rateLimit.limit} generations on the ${rateLimit.tier} plan.`,
        rate_limited: true,
        used: rateLimit.used,
        limit: rateLimit.limit,
        tier: rateLimit.tier,
      }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
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
    }
    const replicateInput = config.buildInput(baseInput)

    const repRes = await fetch(
      `https://api.replicate.com/v1/models/${config.path}/predictions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${replicateKey}`,
          'Prefer': 'wait',
        },
        body: JSON.stringify({ input: replicateInput }),
      },
    )

    if (!repRes.ok) {
      const err = await repRes.text()
      throw new Error(`Replicate error: ${err}`)
    }

    const repData = await repRes.json()

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

    const insertedAssets = await Promise.all(
      outputUrls.map(async (url) => {
        const permanentUrl = await storeImage(adminClient, url, userId, fmt)
        const { data } = await adminClient.from('assets').insert({
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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('[generate-replicate]', err)
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
