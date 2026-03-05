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

  if (values.additional_details) parts.push(String(values.additional_details))

  return parts.join(', ')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing auth header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { values, model_id, prompt_id, size, quality } = await req.json()

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
    const imageUrl = openaiData.data[0].url
    const revisedPrompt = openaiData.data[0].revised_prompt

    const [w, h] = (size ?? '1024x1024').split('x').map(Number)

    const { data: asset, error: assetErr } = await supabase
      .from('assets')
      .insert({
        user_id: user.id,
        prompt_id: prompt_id ?? null,
        model_id: model_id ?? null,
        gen_type: 'txt2img',
        url: imageUrl,
        width: w,
        height: h,
        metadata: { prompt, revised_prompt: revisedPrompt, size, quality },
      })
      .select()
      .single()

    // Asset save is best-effort — don't block on it
    const assetData = assetErr ? null : asset

    return new Response(JSON.stringify({ asset: assetData, image_url: imageUrl, prompt, revised_prompt: revisedPrompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
