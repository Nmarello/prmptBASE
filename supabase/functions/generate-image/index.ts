import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildPrompt(values: Record<string, unknown>): string {
  const parts: string[] = []

  if (values.subject) parts.push(String(values.subject))

  if (values.style) {
    const styleMap: Record<string, string> = {
      photorealistic: 'photorealistic photography',
      cinematic: 'cinematic film still',
      digital_art: 'digital art',
      oil_painting: 'oil painting',
      watercolor: 'watercolor painting',
      pencil_sketch: 'pencil sketch',
      '3d_render': '3D render',
      anime: 'anime style',
    }
    parts.push(styleMap[String(values.style)] ?? String(values.style))
  }

  if (Array.isArray(values.mood) && values.mood.length > 0) {
    parts.push(`${values.mood.join(', ')} mood`)
  }

  if (values.lighting) {
    const lightMap: Record<string, string> = {
      natural: 'natural lighting',
      golden_hour: 'golden hour lighting',
      studio: 'studio lighting',
      neon: 'neon cyberpunk lighting',
      dramatic: 'dramatic high-contrast lighting',
      soft_diffused: 'soft diffused lighting',
      backlit: 'backlit silhouette',
      volumetric: 'volumetric god rays',
    }
    parts.push(lightMap[String(values.lighting)] ?? String(values.lighting))
  }

  if (values.composition) {
    const compMap: Record<string, string> = {
      close_up: 'close-up portrait',
      medium_shot: 'medium shot',
      wide_shot: 'wide shot',
      aerial: "aerial bird's eye view",
      macro: 'macro extreme close-up',
      worms_eye: "worm's eye view",
      rule_of_thirds: 'rule of thirds composition',
    }
    parts.push(compMap[String(values.composition)] ?? String(values.composition))
  }

  if (Array.isArray(values.color_palette) && values.color_palette.length > 0) {
    const paletteMap: Record<string, string> = {
      warm: 'warm tones',
      cool: 'cool tones',
      monochrome: 'monochrome',
      vibrant: 'vibrant saturated colors',
      muted: 'muted desaturated colors',
      pastel: 'pastel colors',
      dark: 'dark moody palette',
      neon: 'neon colors',
    }
    const palettes = values.color_palette.map((p: unknown) => paletteMap[String(p)] ?? String(p))
    parts.push(palettes.join(', '))
  }

  if (values.lens) {
    const lensMap: Record<string, string> = {
      '85mm': 'shot on 85mm f/1.4 lens',
      '50mm': 'shot on 50mm lens',
      '24mm': 'shot on 24mm wide angle lens',
      '14mm': 'shot on 14mm ultra wide lens',
      macro: 'shot with macro lens',
      fisheye: 'fisheye lens',
      anamorphic: 'anamorphic lens with lens flares',
      telephoto: 'shot on 200mm telephoto lens',
    }
    parts.push(lensMap[String(values.lens)] ?? String(values.lens))
  }

  if (values.depth_of_field) {
    const dofMap: Record<string, string> = {
      shallow: 'shallow depth of field, soft bokeh background',
      medium: 'subject in sharp focus, softly blurred background',
      deep: 'deep focus, everything sharp',
      tilt_shift: 'tilt-shift lens, miniature effect',
    }
    parts.push(dofMap[String(values.depth_of_field)] ?? String(values.depth_of_field))
  }

  if (values.camera_medium) {
    const mediumMap: Record<string, string> = {
      digital: 'shot on digital camera, clean and sharp',
      '35mm_film': 'shot on 35mm film, grain and warmth',
      medium_format: 'shot on medium format camera, rich detail',
      polaroid: 'Polaroid photo, faded nostalgic look',
      daguerreotype: 'daguerreotype, antique photographic process',
      vhs: 'VHS camcorder footage, lo-fi analog look',
    }
    parts.push(mediumMap[String(values.camera_medium)] ?? String(values.camera_medium))
  }

  if (values.time_of_day) {
    const timeMap: Record<string, string> = {
      dawn: 'at dawn, soft pink and purple light',
      morning: 'in the morning, fresh bright light',
      midday: 'at midday, harsh overhead sun',
      afternoon: 'in the afternoon, warm light',
      dusk: 'at dusk, orange and purple sky',
      blue_hour: 'during blue hour, deep blue twilight',
      night: 'at night, dark and moody',
    }
    parts.push(timeMap[String(values.time_of_day)] ?? String(values.time_of_day))
  }

  if (values.weather) {
    const weatherMap: Record<string, string> = {
      clear: 'clear sky, crisp and sunny',
      overcast: 'overcast sky, flat even lighting',
      foggy: 'foggy atmosphere, mysterious haze',
      rainy: 'raining, wet reflections on surfaces',
      stormy: 'stormy sky, dark and dramatic clouds',
      snowy: 'snowing, cold and serene',
      dusty: 'dusty hazy atmosphere, desert heat',
    }
    parts.push(weatherMap[String(values.weather)] ?? String(values.weather))
  }

  if (values.additional_details) parts.push(String(values.additional_details))

  return parts.join(', ')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { user_token, values, model_id, prompt_id, size, quality } = body

    // DALL-E 3 exact pricing per image
    const DALLE_PRICES: Record<string, Record<string, number>> = {
      standard: { '1024x1024': 0.040, '1024x1792': 0.080, '1792x1024': 0.080 },
      hd:       { '1024x1024': 0.080, '1024x1792': 0.120, '1792x1024': 0.120 },
    }
    const cost_usd = DALLE_PRICES[quality ?? 'standard']?.[size ?? '1024x1024'] ?? 0.040

    // Use service role to verify user token and do DB ops
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let userId: string | null = null
    if (user_token) {
      const { data: { user } } = await adminClient.auth.getUser(user_token)
      userId = user?.id ?? null
    }

    const prompt = buildPrompt(values)
    if (!prompt.trim()) throw new Error('Prompt is empty')

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OpenAI API key not configured')

    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: size ?? '1024x1024',
        quality: quality ?? 'standard',
        response_format: 'url',
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.json()
      throw new Error(err.error?.message ?? 'OpenAI request failed')
    }

    const openaiData = await openaiRes.json()
    const tempUrl = openaiData.data[0].url
    const revisedPrompt = openaiData.data[0].revised_prompt

    const [w, h] = (size ?? '1024x1024').split('x').map(Number)

    // Download image and upload to permanent Supabase Storage
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
        cost_usd,
        metadata: { prompt, revised_prompt: revisedPrompt, size, quality },
      })
      .select()
      .single()

    const assetData = assetErr ? null : asset

    return new Response(JSON.stringify({ asset: assetData, image_url: permanentUrl, prompt, revised_prompt: revisedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
