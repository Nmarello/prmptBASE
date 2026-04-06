import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, optionsResponse, safeErrorMessage } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req)

  try {
    const { user_token, field_id, field_label, current_value, form_values, source_image_url, end_image_url, is_negative_prompt, gen_type } = await req.json()

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    if (user_token) await adminClient.auth.getUser(user_token)

    const supabaseStorageBase = Deno.env.get('SUPABASE_URL') + '/storage/v1/object/public/'
    // Validate that source_image_url is from our own Supabase storage (not an arbitrary external URL)
    if (source_image_url) {
      if (!source_image_url.startsWith(supabaseStorageBase)) throw new Error('Invalid source image URL')
    }
    if (end_image_url) {
      if (!end_image_url.startsWith(supabaseStorageBase)) throw new Error('Invalid end image URL')
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OpenAI API key not configured')

    // Build context from other form values so the assist is aware of style/mood/etc
    const contextParts: string[] = []
    if (form_values?.style) contextParts.push(`Style: ${form_values.style}`)
    if (form_values?.mood?.length) contextParts.push(`Mood: ${form_values.mood.join(', ')}`)
    if (form_values?.lighting) contextParts.push(`Lighting: ${form_values.lighting}`)
    if (form_values?.composition) contextParts.push(`Composition: ${form_values.composition}`)
    if (form_values?.lens) contextParts.push(`Lens: ${form_values.lens}`)
    if (form_values?.time_of_day) contextParts.push(`Time of day: ${form_values.time_of_day}`)
    if (form_values?.weather) contextParts.push(`Weather: ${form_values.weather}`)

    // Look up original prompts from asset DB for source image and reference video
    const assetUrlsToLookup: { url: string; label: string }[] = []
    if (source_image_url) assetUrlsToLookup.push({ url: source_image_url, label: 'Source image' })

    // vid2vid: reference_video is a generated asset — look up its original prompt for context
    const referenceVideoUrl = form_values?.reference_video as string | undefined
    if (referenceVideoUrl && typeof referenceVideoUrl === 'string' && referenceVideoUrl.startsWith(supabaseStorageBase)) {
      assetUrlsToLookup.push({ url: referenceVideoUrl, label: 'Reference video' })
    }

    for (const { url, label } of assetUrlsToLookup) {
      const { data: asset } = await adminClient
        .from('assets')
        .select('metadata')
        .eq('url', url)
        .maybeSingle()
      if (asset?.metadata?.prompt) {
        contextParts.push(`${label} was generated with this prompt: "${asset.metadata.prompt as string}"`)
      }
    }

    const context = contextParts.length ? `\n\nOther selected settings:\n${contextParts.join('\n')}` : ''

    const isSubject = field_id === 'subject'
    const isNegativePrompt = !!is_negative_prompt
    const hasSourceImage = !!source_image_url
    const genTypeStr = gen_type ?? 'image'
    const isVideo = genTypeStr.includes('vid')

    // For vid2vid the source asset is a video — skip vision (GPT-4o-mini can't analyze video)
    const useVision = hasSourceImage && !isNegativePrompt || (hasSourceImage && isNegativePrompt && !isVideo)

    let systemPrompt: string
    let textContent: string

    if (isNegativePrompt) {
      systemPrompt = hasSourceImage && !isVideo
        ? `You are an expert at writing negative prompts for AI image and video generation models. The user has uploaded a source image (shown). Based on the positive prompt, form settings, and visible content in the source image, generate a concise comma-separated list of terms that describe what to EXCLUDE from the output. Focus on: visible artifacts or quality issues in the source image, content that conflicts with the desired style or mood, and common model weak-spots (e.g. blurry, low quality, watermark, deformed, extra limbs). Return only comma-separated terms, no explanation, no quotes.`
        : `You are an expert at writing negative prompts for AI ${isVideo ? 'video' : 'image'} generation models. Based on the positive prompt and form settings provided, generate a concise comma-separated list of terms that describe what to EXCLUDE from the output. Focus on: common artifacts (blurry, noise, low quality, watermark), content that conflicts with the described style or mood, and model-specific weak-spots (deformed, extra limbs, bad anatomy). Return only comma-separated terms, no explanation, no quotes.`

      // Scan known prompt field names — 'prompt' covers all current templates; others future-proof
      const positivePrompt = (
        (form_values?.prompt as string) ||
        (form_values?.subject as string) ||
        (form_values?.motion_prompt as string) ||
        (form_values?.text as string) ||
        ''
      )
      textContent = `Generate negative prompt terms for this ${genTypeStr} generation.\nPositive prompt: "${positivePrompt}"${context}`
    } else if (isVideo) {
      const hasEndImage = !!end_image_url
      systemPrompt = hasEndImage
        ? `You are an expert at writing motion prompts for AI image-to-video models. The user has uploaded both a start frame and an end frame (both shown). Write a motion prompt that describes the transition between these two images — what changes, what moves, how the scene evolves from start to end. Be specific about motion, camera behavior, and any visual transformation. Keep it to 2-3 sentences max. Return only the motion prompt text, no explanation, no quotes.`
        : hasSourceImage
          ? `You are an expert at writing motion prompts for AI image-to-video models. The user has uploaded a source image (shown). Describe how the scene should come to life: what moves, how it moves, camera behavior, lighting changes, and atmosphere. Be specific about motion direction, speed, and style. Keep it to 2-3 sentences max. Return only the motion prompt text, no explanation, no quotes.`
          : `You are an expert at writing prompts for AI video generation models. When given a rough description, expand it into a vivid, cinematic motion prompt. Be specific about what moves, camera behavior (push in, pan, orbit), lighting, atmosphere, and visual style. Keep it to 2-3 sentences max. Return only the improved prompt text, no explanation, no quotes.`

      textContent = current_value?.trim()
        ? `Improve this motion prompt for a video generation model:\n\n${current_value}${context}`
        : `Generate a compelling motion prompt for a video generation model.${context}`
    } else {
      systemPrompt = isSubject
        ? hasSourceImage
          ? `You are an expert at writing image generation prompts. The user is working with a source image (shown). Your job is to write a vivid, detailed prompt that describes what to transform or extend from that image. Consider the visual content you can see. Keep it to 2-3 sentences max. Return only the improved prompt text, no explanation, no quotes.`
          : `You are an expert at writing image generation prompts. When given a rough subject or scene description, expand it into a vivid, detailed prompt that will produce a stunning image. Be specific about subjects, environment, atmosphere, and interesting details. Keep it to 2-3 sentences max. Return only the improved prompt text, no explanation, no quotes.`
        : hasSourceImage
          ? `You are an expert at writing image generation prompts. The user is working with a source image (shown). Refine the given details to be more specific and evocative, taking into account the visual content of the source image. Keep it concise. Return only the improved text, no explanation, no quotes.`
          : `You are an expert at writing image generation prompts. When given additional details for an image, refine and expand them to be more specific and evocative for an AI image generator. Keep it concise. Return only the improved text, no explanation, no quotes.`

      textContent = current_value?.trim()
        ? `Improve this ${field_label} for an image generation prompt:\n\n${current_value}${context}`
        : `Generate a compelling ${field_label} for an image generation prompt.${context}`
    }

    // Build the user message — use vision if source image is available and applicable
    type MessageContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>
    const userMessage: MessageContent = useVision
      ? [
          { type: 'image_url', image_url: { url: source_image_url } },
          ...(end_image_url ? [{ type: 'image_url', image_url: { url: end_image_url } }] : []),
          { type: 'text', text: textContent },
        ]
      : textContent

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: isNegativePrompt ? 150 : 300,
        temperature: isNegativePrompt ? 0.5 : 0.8,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error?.message ?? 'OpenAI request failed')
    }

    const data = await res.json()
    const suggestion = data.choices[0].message.content.trim()

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: safeErrorMessage(err) }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
