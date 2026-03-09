import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta'

async function storeAsset(
  adminClient: ReturnType<typeof createClient>,
  tempUrl: string,
  userId: string | null,
  ext: string,
  mimeType: string,
): Promise<string> {
  try {
    const res = await fetch(tempUrl)
    const buf = await res.arrayBuffer()
    const fileName = `${userId ?? 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await adminClient.storage
      .from('assets')
      .upload(fileName, buf, { contentType: mimeType, upsert: false })
    if (!error) {
      const { data: { publicUrl } } = adminClient.storage.from('assets').getPublicUrl(fileName)
      return publicUrl
    }
  } catch (_) { /* fall back to temp URL */ }
  return tempUrl
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.json()
    const { user_token, model_id, model_slug, prompt_id, gen_type } = body
    const prompt: string = body.prompt ?? ''
    if (!prompt.trim()) throw new Error('Prompt is required')

    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) throw new Error('GEMINI_API_KEY not configured')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let userId: string | null = null
    if (user_token) {
      const { data: { user } } = await adminClient.auth.getUser(user_token)
      userId = user?.id ?? null
    }

    const isVideo = gen_type === 'txt2vid' || gen_type === 'img2vid'

    // ── VIDEO: Veo 2 ──────────────────────────────────────────────────────────
    if (isVideo) {
      const slug = model_slug ?? 'veo-2.0-generate-001'
      const veoBody: Record<string, unknown> = {
        instances: [{ prompt }],
        parameters: {
          aspectRatio: body.aspect_ratio ?? '16:9',
          durationSeconds: Number(body.duration ?? 8),
          ...(body.source_image ? { image: { bytesBase64Encoded: body.source_image.split(',')[1], mimeType: 'image/jpeg' } } : {}),
        },
      }

      // Veo uses a long-running operation — kick it off
      const opRes = await fetch(
        `${GEMINI_BASE}/models/${slug}:predictLongRunning?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(veoBody),
        },
      )

      if (!opRes.ok) {
        const err = await opRes.text()
        throw new Error(`Veo error: ${err}`)
      }

      const opData = await opRes.json()
      const operationName: string = opData.name ?? opData.operationName ?? ''
      if (!operationName) throw new Error(`No operation name returned: ${JSON.stringify(opData)}`)

      // Insert a pending asset row — client will poll check-veo-job to get the final URL
      const { data: asset } = await adminClient.from('assets').insert({
        user_id: userId,
        prompt_id: prompt_id ?? null,
        model_id: model_id ?? null,
        gen_type,
        url: '',
        metadata: {
          prompt,
          model_slug: slug,
          operation_name: operationName,
          status: 'pending',
          aspect_ratio: body.aspect_ratio ?? '16:9',
          duration: Number(body.duration ?? 8),
        },
      }).select().single()

      return new Response(
        JSON.stringify({ asset, operation_name: operationName, status: 'pending', prompt }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── IMAGE: Imagen 3 ───────────────────────────────────────────────────────
    const slug = model_slug ?? 'imagen-3.0-generate-002'
    const numImages = Math.min(Math.max(Number(body.num_images ?? 1), 1), 4)
    const aspectRatio = body.aspect_ratio ?? '1:1'

    const imagenBody = {
      instances: [{ prompt }],
      parameters: {
        sampleCount: numImages,
        aspectRatio,
        ...(body.negative_prompt ? { negativePrompt: body.negative_prompt } : {}),
        ...(body.seed != null && body.seed !== '' ? { seed: Number(body.seed) } : {}),
      },
    }

    const imagenRes = await fetch(
      `${GEMINI_BASE}/models/${slug}:predict?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(imagenBody),
      },
    )

    if (!imagenRes.ok) {
      const err = await imagenRes.text()
      throw new Error(`Imagen error: ${err}`)
    }

    const imagenData = await imagenRes.json()
    const predictions: { bytesBase64Encoded: string; mimeType: string }[] = imagenData.predictions ?? []
    if (predictions.length === 0) throw new Error(`No images returned: ${JSON.stringify(imagenData)}`)

    const ASPECT_DIMS: Record<string, [number, number]> = {
      '1:1': [1024, 1024], '16:9': [1408, 768], '9:16': [768, 1408],
      '4:3': [1280, 960], '3:4': [960, 1280],
    }
    const [w, h] = ASPECT_DIMS[aspectRatio] ?? [1024, 1024]

    const insertedAssets = await Promise.all(
      predictions.map(async (pred) => {
        const mime = pred.mimeType ?? 'image/png'
        const ext = mime.includes('jpeg') ? 'jpg' : 'png'
        const dataUrl = `data:${mime};base64,${pred.bytesBase64Encoded}`

        // Upload base64 directly to storage
        const buf = Uint8Array.from(atob(pred.bytesBase64Encoded), (c) => c.charCodeAt(0))
        const fileName = `${userId ?? 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        let publicUrl = dataUrl
        const { error } = await adminClient.storage.from('assets').upload(fileName, buf, { contentType: mime, upsert: false })
        if (!error) {
          const { data: { publicUrl: url } } = adminClient.storage.from('assets').getPublicUrl(fileName)
          publicUrl = url
        }

        const { data } = await adminClient.from('assets').insert({
          user_id: userId,
          prompt_id: prompt_id ?? null,
          model_id: model_id ?? null,
          gen_type: gen_type ?? 'txt2img',
          url: publicUrl,
          width: w,
          height: h,
          metadata: { prompt, model_slug: slug, aspect_ratio: aspectRatio },
        }).select().single()
        return data
      }),
    )

    const firstAsset = insertedAssets[0]

    return new Response(
      JSON.stringify({ asset: firstAsset, image_url: firstAsset?.url, all_assets: insertedAssets, prompt }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
