import { corsHeaders, optionsResponse, safeErrorMessage } from '../_shared/cors.ts'

const SYSTEM_PROMPT = `You are an AI model selection expert for prmptVAULT, an AI image and video generation platform.

When a user describes what they want to create, recommend the most suitable models from the available list.

Your response must be valid JSON in exactly this format:
{
  "message": "A concise, friendly 1-2 sentence response acknowledging what the user wants and introducing your recommendations",
  "recommendations": [
    {
      "slug": "exact-model-slug-from-list",
      "reason": "One sentence: what makes this model specifically suited for this use case"
    }
  ]
}

Rules:
- Recommend 2-4 models, ordered from best to good fit
- Only use slugs that appear in the provided model list
- For image creation tasks, only recommend image models (supported gen_types include txt2img, img2img, multi_img2img)
- For video creation tasks, only recommend video models (supported gen_types include txt2vid, img2vid, ref2vid, vid2vid)
- If the request involves editing or transforming an existing image, prioritize img2img models
- Be specific in reasons — mention technical strengths (photorealism, artistic style, speed, aspect ratios, prompt adherence)
- If the request is vague, recommend a range from fast/accessible to high-quality
- Keep each reason to one sentence, focused on what makes it uniquely suited`

interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ModelInput {
  slug: string
  name: string
  provider: string
  description: string
  supported_gen_types: string[]
  is_active: boolean
  coming_soon: boolean
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req)

  try {
    const { message, models, conversation_history } = await req.json()

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OpenAI API key not configured')

    // Filter and format model list for the prompt
    const activeModels: ModelInput[] = (models ?? []).filter(
      (m: ModelInput) => m.is_active && !m.coming_soon
    )

    const modelListText = activeModels
      .map((m: ModelInput) =>
        `- slug: "${m.slug}" | name: "${m.name}" | provider: ${m.provider} | gen_types: [${m.supported_gen_types.join(', ')}] | description: ${m.description || 'N/A'}`
      )
      .join('\n')

    const systemWithModels = `${SYSTEM_PROMPT}\n\nAvailable models:\n${modelListText}`

    type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemWithModels },
      ...((conversation_history ?? []) as ConversationMessage[]).map(m => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message.trim() },
    ]

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error?.message ?? 'OpenAI request failed')
    }

    const data = await res.json()
    const raw = data.choices[0].message.content ?? '{}'

    let parsed: { message: string; recommendations: Array<{ slug: string; reason: string }> }
    try {
      parsed = JSON.parse(raw)
    } catch {
      parsed = { message: raw, recommendations: [] }
    }

    return new Response(JSON.stringify({
      message: parsed.message ?? '',
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    }), { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: safeErrorMessage(err) }), {
      status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
