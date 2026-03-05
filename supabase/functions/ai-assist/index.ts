import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_token, field_id, field_label, current_value, form_values } = await req.json()

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    if (user_token) await adminClient.auth.getUser(user_token)

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
    const context = contextParts.length ? `\n\nOther selected settings:\n${contextParts.join('\n')}` : ''

    const isSubject = field_id === 'subject'
    const systemPrompt = isSubject
      ? `You are an expert at writing image generation prompts. When given a rough subject or scene description, expand it into a vivid, detailed prompt that will produce a stunning image. Be specific about subjects, environment, atmosphere, and interesting details. Keep it to 2-3 sentences max. Return only the improved prompt text, no explanation, no quotes.`
      : `You are an expert at writing image generation prompts. When given additional details for an image, refine and expand them to be more specific and evocative for an AI image generator. Keep it concise. Return only the improved text, no explanation, no quotes.`

    const userMessage = current_value?.trim()
      ? `Improve this ${field_label} for an image generation prompt:\n\n${current_value}${context}`
      : `Generate a compelling ${field_label} for an image generation prompt.${context}`

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error?.message ?? 'OpenAI request failed')
    }

    const data = await res.json()
    const suggestion = data.choices[0].message.content.trim()

    return new Response(JSON.stringify({ suggestion }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
