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
  isAsync?: boolean     // skip Prefer:wait, return pending immediately (for slow image models)
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
  _duration?: number // video duration in seconds
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

const VALID_VIDEO_AR = new Set(['16:9', '9:16'])
const videoAR = (ar: string) => VALID_VIDEO_AR.has(ar) ? ar : '16:9'

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
  'flux2-max':        { path: 'black-forest-labs/flux-2-max',       costUsd: 0.08, buildInput: (b) => standardInput(b) },

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
  'ideogram-v2':      { path: 'ideogram-ai/ideogram-v2', costUsd: 0.05, buildInput: ideogramInput },
  'ideogram-v3':      { path: 'ideogram-ai/ideogram-v3-balanced', costUsd: 0.06, buildInput: ideogramInput },

  // ── HiDream (via PrunaAI) ───────────────────────────────────────────────────
  'hidream-fast':     { path: 'prunaai/hidream-l1-fast', costUsd: 0.03, buildInput: (b) => standardInput(b) },
  'hidream-full':     { path: 'prunaai/hidream-l1-full', version: '4ac54871d9e2152baf74c89729f9c17a1b770e1ca2c10989b69e8ebea480ca40', costUsd: 0.05, isAsync: true, buildInput: (b) => standardInput(b) },

  // ── ByteDance Seedream ───────────────────────────────────────────────────────
  'seedream-45':      { path: 'bytedance/seedream-4.5',   costUsd: 0.025, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio,
    max_images: Math.min(b.numOutputs, 4),
    size: '2K',
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },

  // ── Google Nano Banana Pro ───────────────────────────────────────────────────
  'nano-banana-pro':  { path: 'google/nano-banana-pro',   costUsd: 0.15,  buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio,
    number_of_images: Math.min(b.numOutputs, 4),
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },

  // ── FLUX Kontext Max (img2img via Replicate — not on FAL) ────────────────────
  'flux-kontext-max': { path: 'black-forest-labs/flux-kontext-max', costUsd: 0.08, maxOutputs: 1, buildInput: (b) => ({
    prompt: b.prompt,
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },

  // ── Lightricks LTX-2.3 Video ─────────────────────────────────────────────────
  'ltx-2.3-pro':  { path: 'lightricks/ltx-2.3-pro',  isVideo: true, maxOutputs: 1, costUsd: 0.10, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: videoAR(b.aspectRatio),
    ...(b._duration ? { duration: [6, 8, 10].includes(b._duration) ? b._duration : 6 } : {}),
  }) },
  'ltx-2.3-fast': { path: 'lightricks/ltx-2.3-fast', isVideo: true, maxOutputs: 1, costUsd: 0.05, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: videoAR(b.aspectRatio),
    ...(b._duration ? { duration: [6, 8, 10, 12, 14, 16, 18, 20].includes(b._duration) ? b._duration : 6 } : {}),
  }) },

  // ── ByteDance Seedream 4 & 5 Lite (same API shape as 4.5) ─────────────────
  'seedream-4':       { path: 'bytedance/seedream-4',      costUsd: 0.02, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio,
    max_images: Math.min(b.numOutputs, 4),
    size: '2K',
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },
  'seedream-5-lite':  { path: 'bytedance/seedream-5-lite',  costUsd: 0.015, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio,
    max_images: Math.min(b.numOutputs, 4),
    size: '2K',
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },

  // ── FLUX.2 Klein ──────────────────────────────────────────────────────────
  'flux2-klein':      { path: 'black-forest-labs/flux-2-klein-4b', costUsd: 0.003, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio,
    num_outputs: Math.min(b.numOutputs, 4),
    output_format: b.outputFormat,
    num_inference_steps: 4,
    ...(b.negPrompt ? { negative_prompt: b.negPrompt } : {}),
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },

  // ── Qwen Image 2 Pro ─────────────────────────────────────────────────────
  'qwen-image-2-pro': { path: 'qwen/qwen-image-2-pro', costUsd: 0.04, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio,
    enable_prompt_expansion: true,
    ...(b.negPrompt ? { negative_prompt: b.negPrompt } : {}),
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },

  // ── ByteDance Seedance 2.0 ───────────────────────────────────────────────
  'seedance-2': { path: 'bytedance/seedance-2.0', isVideo: true, maxOutputs: 1, costUsd: 0.15, buildInput: (b) => {
    const VALID_AR = ['21:9', '16:9', '4:3', '1:1', '3:4', '9:16']
    const VALID_DUR = [4, 5, 6, 8, 10, 12, 15]
    return {
      prompt: b.prompt,
      aspect_ratio: VALID_AR.includes(b.aspectRatio) ? b.aspectRatio : '16:9',
      ...(b._duration && VALID_DUR.includes(b._duration) ? { duration: b._duration } : {}),
      ...(b.seed != null ? { seed: b.seed } : {}),
    }
  } },

  // ── MiniMax Hailuo 2.3 ───────────────────────────────────────────────────
  'hailuo-2.3':       { path: 'minimax/hailuo-2.3', isVideo: true, maxOutputs: 1, costUsd: 0.12, buildInput: (b) => ({
    prompt: b.prompt,
    ...(b.aspectRatio === '9:16' ? { aspect_ratio: '9:16' } : b.aspectRatio === '1:1' ? { aspect_ratio: '1:1' } : { aspect_ratio: '16:9' }),
    ...(b._duration ? { duration: [6, 10].includes(b._duration) ? b._duration : 6 } : {}),
  }) },

  // ── Google Imagen 4 ────────────────────────────────────────────────────────
  'imagen-4-ultra':   { path: 'google/imagen-4-ultra',  costUsd: 0.10, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio,
    number_of_images: Math.min(b.numOutputs, 4),
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },
  'imagen-4-fast':    { path: 'google/imagen-4-fast',   costUsd: 0.04, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio,
    number_of_images: Math.min(b.numOutputs, 4),
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },

  // ── OpenAI GPT Image 1.5 ──────────────────────────────────────────────────
  'gpt-image-1.5':    { path: 'openai/gpt-image-1.5',  costUsd: 0.04, isAsync: true, buildInput: (b) => {
    const GPT_AR = new Set(['1:1', '3:2', '2:3'])
    const ar = GPT_AR.has(b.aspectRatio) ? b.aspectRatio : '1:1'
    return {
      prompt: b.prompt,
      aspect_ratio: ar,
      num_outputs: Math.min(b.numOutputs, 4),
      ...(b.seed != null ? { seed: b.seed } : {}),
    }
  } },

  // ── Video — Replicate-only models ─────────────────────────────────────────
  'sora2-pro':        { path: 'openai/sora-2-pro',          isVideo: true, maxOutputs: 1, costUsd: 0.20, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: b.aspectRatio === '9:16' ? 'portrait' : 'landscape',
    ...(b._duration ? { duration: [4, 8, 12].includes(b._duration) ? b._duration : 8 } : {}),
  }) },
  'veo-3':            { path: 'google/veo-3',               isVideo: true, maxOutputs: 1, costUsd: 0.25, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: videoAR(b.aspectRatio),
    ...(b._duration ? { duration: [4, 6, 8].includes(b._duration) ? b._duration : 8 } : {}),
    ...(b.negPrompt ? { negative_prompt: b.negPrompt } : {}),
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },
  'veo-3-fast':       { path: 'google/veo-3-fast',          isVideo: true, maxOutputs: 1, costUsd: 0.12, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: videoAR(b.aspectRatio),
    ...(b._duration ? { duration: [4, 6, 8].includes(b._duration) ? b._duration : 6 } : {}),
    ...(b.negPrompt ? { negative_prompt: b.negPrompt } : {}),
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },
  'veo-3.1':          { path: 'google/veo-3.1',             isVideo: true, maxOutputs: 1, costUsd: 0.25, buildInput: (b) => ({
    prompt: b.prompt,
    aspect_ratio: videoAR(b.aspectRatio),
    ...(b._duration ? { duration: [4, 6, 8].includes(b._duration) ? b._duration : 8 } : {}),
    ...(b.negPrompt ? { negative_prompt: b.negPrompt } : {}),
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },
  'kling-v2.5-turbo': { path: 'kwaivgi/kling-v2.5-turbo-pro', isVideo: true, maxOutputs: 1, costUsd: 0.10, buildInput: (b) => {
    const klingAR = ['16:9', '9:16', '1:1'].includes(b.aspectRatio) ? b.aspectRatio : '16:9'
    return {
      prompt: b.prompt,
      aspect_ratio: klingAR,
      ...(b._duration ? { duration: [5, 10].includes(b._duration) ? b._duration : 5 } : {}),
      ...(b.negPrompt ? { negative_prompt: b.negPrompt } : {}),
    }
  } },
  'wan-2.5-t2v':      { path: 'wan-video/wan-2.5-t2v',      isVideo: true, maxOutputs: 1, costUsd: 0.08, buildInput: (b) => {
    const WAN_SIZE_MAP: Record<string, string> = { '16:9': '1280*720', '9:16': '720*1280' }
    return {
      prompt: b.prompt,
      size: WAN_SIZE_MAP[b.aspectRatio] ?? '1280x720',
      ...(b.negPrompt ? { negative_prompt: b.negPrompt } : {}),
      ...(b.seed != null ? { seed: b.seed } : {}),
    }
  } },
  'minimax-video':    { path: 'minimax/video-01',            isVideo: true, maxOutputs: 1, costUsd: 0.10, buildInput: (b) => ({
    prompt: b.prompt,
    prompt_optimizer: true,
  }) },
  'gen-4.5':          { path: 'runwayml/gen-4.5',            isVideo: true, maxOutputs: 1, costUsd: 0.15, buildInput: (b) => {
    const VALID = ['16:9', '9:16', '4:3', '3:4', '1:1', '21:9']
    return {
      prompt: b.prompt,
      aspect_ratio: VALID.includes(b.aspectRatio) ? b.aspectRatio : '16:9',
      ...(b._duration ? { duration: Math.min(Math.max(b._duration, 2), 10) } : {}),
      ...(b.seed != null ? { seed: b.seed } : {}),
    }
  } },

  // ── Motion / Animate ─────────────────────────────────────────────────────
  'wan-2.2-animate':  { path: 'wan-video/wan-2.2-animate-animation', isVideo: true, maxOutputs: 1, costUsd: 0.12, buildInput: (b) => ({
    ...(b.prompt ? { prompt: b.prompt } : {}),
  }) },

  // ── Tools — Editing & Upscaling (Replicate) ──────────────────────────────
  'flux-fill-pro':           { path: 'black-forest-labs/flux-fill-pro', costUsd: 0.05, maxOutputs: 1, buildInput: (b) => ({
    prompt: b.prompt,
    ...(b.seed != null ? { seed: b.seed } : {}),
  }) },
  'bria-eraser':             { path: 'bria/eraser',              costUsd: 0.02, maxOutputs: 1, buildInput: (_b) => ({}) },
  'bria-genfill':            { path: 'bria/genfill',             costUsd: 0.02, maxOutputs: 1, buildInput: (b) => ({ prompt: b.prompt }) },
  'bria-expand':             { path: 'bria/expand-image',        costUsd: 0.02, maxOutputs: 1, buildInput: (b) => ({ prompt: b.prompt }) },
  'recraft-crisp-upscale':   { path: 'recraft-ai/recraft-crisp-upscale',    costUsd: 0.04, maxOutputs: 1, buildInput: (_b) => ({}) },
  'recraft-creative-upscale':{ path: 'recraft-ai/recraft-creative-upscale', costUsd: 0.04, maxOutputs: 1, buildInput: (_b) => ({}) },
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
    const genType_ = body.gen_type as string | undefined
    if (!builtPrompt.trim() && genType_ !== 'vid2vid') throw new Error('Prompt is required')

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
      _duration: body.duration ? Number(body.duration) : undefined,
    }
    const replicateInput = config.buildInput(baseInput)

    // Inject source image for img2img models routed through Replicate (e.g. Kontext Max)
    if (slug === 'flux-kontext-max' && body.source_image) {
      const src = body.source_image as string
      if (src.startsWith('http')) {
        replicateInput.image_url = src
      } else {
        // base64 → upload to storage first
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
        const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(srcFileName)
        replicateInput.image_url = publicUrl
      }
    }

    // Inject source image for Seedance 2.0 img2vid
    if (slug === 'seedance-2') {
      if (body.generate_audio != null) {
        replicateInput.generate_audio = body.generate_audio === 'true' || body.generate_audio === true
      }
      if (genType_ === 'img2vid' && body.source_image) {
        const src = body.source_image as string
        if (src.startsWith('http')) {
          replicateInput.first_frame_url = src
        } else {
          const base64Data = src.replace(/^data:image\/\w+;base64,/, '')
          const mimeMatch = src.match(/^data:(image\/\w+);base64,/)
          const mimeType = mimeMatch?.[1] ?? 'image/jpeg'
          const ext = mimeType.split('/')[1] ?? 'jpg'
          const srcBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
          const srcFileName = `${userId ?? 'anon'}/src-${Date.now()}.${ext}`
          const { error: srcUploadErr } = await adminClient.storage
            .from('assets').upload(srcFileName, srcBytes, { contentType: mimeType, upsert: false })
          if (srcUploadErr) throw new Error(`Source upload failed: ${srcUploadErr.message}`)
          const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(srcFileName)
          replicateInput.first_frame_url = publicUrl
        }
      }
      if (genType_ === 'img2vid' && body.end_image_url) {
        replicateInput.last_frame_url = body.end_image_url as string
      }
    }

    // Inject source image + reference video for vid2vid models
    const genType = body.gen_type as string | undefined
    if (genType === 'vid2vid') {
      // Wan 2.2 Animate uses character_image + driving_video; other models may differ
      const imgKey = slug === 'wan-2.2-animate' ? 'character_image' : 'image'
      const vidKey = 'video'
      if (body.source_image) {
        const src = body.source_image as string
        if (src.startsWith('http')) {
          replicateInput[imgKey] = src
        } else {
          const base64Data = src.replace(/^data:image\/\w+;base64,/, '')
          const mimeMatch = src.match(/^data:(image\/\w+);base64,/)
          const mimeType = mimeMatch?.[1] ?? 'image/jpeg'
          const ext = mimeType.split('/')[1] ?? 'jpg'
          const srcBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))
          const srcFileName = `${userId ?? 'anon'}/src-${Date.now()}.${ext}`
          const { error: srcUploadErr } = await adminClient.storage
            .from('assets').upload(srcFileName, srcBytes, { contentType: mimeType, upsert: false })
          if (srcUploadErr) throw new Error(`Source upload failed: ${srcUploadErr.message}`)
          const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(srcFileName)
          replicateInput[imgKey] = publicUrl
        }
      }
      if (body.reference_video) {
        replicateInput[vidKey] = body.reference_video as string
      }
    }

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
    // Prefer:wait only for non-video, non-async models; video/async return pending immediately
    if (!config.version && !config.isVideo && !config.isAsync) repHeaders['Prefer'] = 'wait'

    const repRes = await fetch(repUrl, {
      method: 'POST',
      headers: repHeaders,
      body: JSON.stringify(repBody),
    })

    if (!repRes.ok) {
      const err = await repRes.text()
      console.error(`[generate-replicate] ${slug} FAILED (${repRes.status}):`, err, 'INPUT:', JSON.stringify(replicateInput))
      throw new Error(`Replicate error (${slug}): ${err}`)
    }

    const repData = await repRes.json()

    // ── Async (video or slow image): return pending immediately, let frontend poll
    if (config.isVideo || config.isAsync) {
      const pollUrl = repData.urls?.get ?? repData.url
      // If prediction already failed at creation time
      if (repData.status === 'failed' || repData.error) {
        console.error(`[generate-replicate] ${slug} prediction failed:`, repData.error, 'INPUT:', JSON.stringify(replicateInput))
        throw new Error(`Replicate generation failed (${slug}): ${repData.error ?? repData.status}`)
      }
      // Create placeholder asset row
      const isAsyncImage = config.isAsync && !config.isVideo
      const { data: asset, error: assetErr } = await adminClient.from('assets').insert({
        user_id: userId,
        prompt_id: prompt_id ?? null,
        model_id: model_id ?? null,
        gen_type: isAsyncImage ? 'txt2img' : 'txt2vid',
        url: '',  // updated when generation completes
        cost_usd: config.costUsd ?? null,
        metadata: {
          prompt: builtPrompt,
          model_slug: slug,
          aspect_ratio: ar,
          seed: seedVal ?? null,
          replicate_prediction_url: pollUrl,
        },
      }).select().single()
      if (assetErr || !asset) console.error('[generate-replicate] async asset insert failed:', assetErr?.message)
      return new Response(
        JSON.stringify({
          status: 'pending',
          asset,
          provider: 'replicate',
          prediction_url: pollUrl,
          prompt: builtPrompt,
          ...(isAsyncImage ? { is_image: true } : {}),
        }),
        { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
      )
    }

    // ── Image: poll until complete (images are fast) ─────────────────────────
    let imgData = repData
    if (imgData.status === 'starting' || imgData.status === 'processing') {
      const imgPollUrl = imgData.urls?.get
      if (!imgPollUrl) throw new Error(`Replicate prediction stuck in ${imgData.status} with no poll URL`)
      const deadline = Date.now() + 130_000
      while ((imgData.status === 'starting' || imgData.status === 'processing') && Date.now() < deadline) {
        await new Promise(r => setTimeout(r, 2000))
        const pollRes = await fetch(imgPollUrl, { headers: { 'Authorization': `Bearer ${replicateKey}` } })
        if (!pollRes.ok) throw new Error(`Replicate poll error: ${pollRes.status}`)
        imgData = await pollRes.json()
      }
      if (imgData.status === 'starting' || imgData.status === 'processing') {
        throw new Error('Replicate prediction timed out after 120s')
      }
    }

    if (imgData.status === 'failed' || imgData.error) {
      console.error(`[generate-replicate] ${slug} prediction failed:`, imgData.error, 'INPUT:', JSON.stringify(replicateInput))
      throw new Error(`Replicate generation failed (${slug}): ${imgData.error ?? imgData.status}`)
    }

    const outputUrls: string[] = Array.isArray(imgData.output)
      ? imgData.output
      : typeof imgData.output === 'string'
        ? [imgData.output]
        : []
    if (outputUrls.length === 0) throw new Error(`No output from Replicate: ${JSON.stringify(imgData)}`)

    const predictTime = imgData.metrics?.predict_time ?? null

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
    const rawMsg = err instanceof Error ? err.message : String(err)
    console.error('[generate-replicate]', rawMsg)
    return new Response(
      JSON.stringify({ error: safeErrorMessage(err), _raw: rawMsg }),
      { status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } },
    )
  }
})
