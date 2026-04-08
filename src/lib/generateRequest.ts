import type { Model, GenType } from '../types'
import { friendlyFalError } from './errorMessages'

const DIRECT_API_SLUGS = new Set(['dalle', 'gpt-image-1', 'imagen-4.0-generate-001', 'veo-2.0-generate-001'])
const GOOGLE_DIRECT_SLUGS = new Set(['imagen-4.0-generate-001', 'veo-2.0-generate-001'])
const REPLICATE_SLUGS = new Set([
  // Image
  'sd35-large', 'sd35-large-turbo', 'sd35-medium',
  'flux-schnell', 'flux-dev', 'flux-pro', 'flux-pro-ultra', 'flux2-pro', 'flux2-max',
  'recraft-v3', 'recraft-v4', 'recraft-v4-pro',
  'ideogram-v2', 'ideogram-v3',
  'hidream-fast', 'hidream-full',
  'seedream-45', 'seedream-4', 'seedream-5-lite',
  'nano-banana-pro',
  'imagen-4-ultra', 'imagen-4-fast',
  'gpt-image-1.5', 'flux2-klein', 'qwen-image-2-pro',
  // Img2img
  'flux-kontext-max',
  // Video
  'ltx-2.3-pro', 'ltx-2.3-fast',
  'sora2-pro', 'veo-3', 'veo-3-fast', 'veo-3.1',
  'kling-v2.5-turbo', 'wan-2.5-t2v', 'wan-2.2-animate', 'minimax-video', 'hailuo-2.3', 'gen-4.5',
  // Tools
  'flux-fill-pro', 'bria-eraser', 'bria-genfill', 'bria-expand',
  'recraft-crisp-upscale', 'recraft-creative-upscale',
])

export type GenerateResult =
  | { status: 'complete'; imageUrl: string; assetId?: string }
  | {
      status: 'pending'
      assetId: string
      provider: 'replicate' | 'fal.ai' | 'google'
      predictionUrl?: string
      operationName?: string
    }

export async function invokeGenerate(params: {
  model: Model
  genType: GenType
  values: Record<string, unknown>
  userToken: string | null
  promptId: string | null
}): Promise<GenerateResult> {
  const { model, genType, values, userToken, promptId } = params

  const isReplicate = REPLICATE_SLUGS.has(model.slug)
  const isFal = !isReplicate && !DIRECT_API_SLUGS.has(model.slug)
  const isGoogle = GOOGLE_DIRECT_SLUGS.has(model.slug)
  const isImg2Img = genType === 'img2img'

  const endpoint = isReplicate
    ? 'generate-replicate'
    : isFal
    ? 'generate-fal'
    : isGoogle
    ? 'generate-google'
    : isImg2Img ? 'edit-image' : 'generate-image'

  const body = isReplicate
    ? {
        user_token: userToken,
        ...values,
        model_id: model.id,
        model_slug: model.slug,
        gen_type: genType,
        prompt_id: promptId,
      }
    : isFal
    ? {
        user_token: userToken,
        ...values,
        model_id: model.id,
        model_slug: model.slug,
        gen_type: genType,
        prompt_id: promptId,
      }
    : isGoogle
    ? {
        user_token: userToken,
        ...values,
        model_id: model.id,
        model_slug: model.slug,
        prompt_id: promptId,
        gen_type: genType,
      }
    : isImg2Img
    ? {
        user_token: userToken,
        source_image_b64: values.source_image,
        prompt: values.prompt,
        model_id: model.id,
        prompt_id: promptId,
        size: values.size ?? '1024x1024',
        quality: values.quality ?? 'medium',
      }
    : {
        user_token: userToken,
        values,
        model_id: model.id,
        model_slug: model.slug,
        prompt_id: promptId,
        size: values.size ?? '1024x1024',
        quality: values.quality ?? (model.slug === 'gpt-image-1' ? 'auto' : 'standard'),
      }

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    }
  )

  const data = await res.json()

  if (data?.rate_limited) {
    throw new Error(`__RATE_LIMITED__:${data.used}:${data.limit}:${data.tier}`)
  }
  if (!res.ok || data?.error) {
    const raw = data?._raw ?? ''
    const friendly = friendlyFalError(data?.error ?? data?.message ?? `HTTP ${res.status}`)
    throw new Error(raw ? `${friendly}\n\n[RAW: ${raw}]` : friendly)
  }

  // Async model — return pending state for caller to poll
  if (data?.status === 'pending') {
    const provider: 'replicate' | 'fal.ai' | 'google' =
      data.provider === 'replicate' ? 'replicate' : data.provider === 'google' ? 'google' : 'fal.ai'
    return {
      status: 'pending',
      assetId: data.asset?.id ?? '',
      provider,
      predictionUrl: data.prediction_url,
      operationName: data.operation_name,
    }
  }

  const imageUrl = data?.asset?.url ?? data?.image_url
  if (!imageUrl) {
    throw new Error(`No image URL returned. Response: ${JSON.stringify(data)}`)
  }

  return { status: 'complete', imageUrl, assetId: data?.asset?.id as string | undefined }
}
