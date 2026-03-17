import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { checkImageRateLimit } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Replicate model owner/name pairs
const REPLICATE_MODELS: Record<string, string> = {
  'sd35-large':       'stability-ai/stable-diffusion-3.5-large',
  'sd35-large-turbo': 'stability-ai/stable-diffusion-3.5-large-turbo',
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
    const modelPath = REPLICATE_MODELS[slug]
    if (!modelPath) throw new Error(`Unknown Replicate model slug: ${slug}`)

    const builtPrompt = buildPrompt(body)
    if (!builtPrompt.trim()) throw new Error('Prompt is required')

    const fmt = ['png', 'jpg', 'webp'].includes(output_format) ? output_format : 'webp'
    const seedVal = (seed != null && seed !== '') ? Number(seed) : undefined
    const numOutputs = Math.min(Math.max(Number(num_images) || 1, 1), 4)
    const ar = aspect_ratio ?? '1:1'

    const negPrompt = (body.negative_prompt as string | undefined)?.trim() ?? ''

    const replicateInput: Record<string, unknown> = {
      prompt: builtPrompt,
      aspect_ratio: ar,
      num_outputs: numOutputs,
      output_format: fmt,
      output_quality: 90,
      ...(negPrompt ? { negative_prompt: negPrompt } : {}),
      ...(seedVal !== undefined ? { seed: seedVal } : {}),
    }

    const repRes = await fetch(
      `https://api.replicate.com/v1/models/${modelPath}/predictions`,
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

    const outputUrls: string[] = Array.isArray(repData.output) ? repData.output : []
    if (outputUrls.length === 0) throw new Error(`No output from Replicate: ${JSON.stringify(repData)}`)

    // Estimate cost — SD 3.5 Large ~$0.065/image, Turbo ~$0.035/image
    const COST_MAP: Record<string, number> = {
      'sd35-large':       0.065,
      'sd35-large-turbo': 0.035,
    }
    const costPerAsset = COST_MAP[slug] ?? null

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
          cost_usd: costPerAsset,
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
