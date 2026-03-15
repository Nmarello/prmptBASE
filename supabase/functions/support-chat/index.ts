import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are the prmptVAULT support assistant. prmptVAULT is an AI image and video generation platform.

**Platform Overview:**
- Users generate images and videos using AI models: DALL-E 3, GPT Image 1, Flux Schnell, Flux Dev, Flux Kontext Pro, Recraft V3/V4, Google Imagen 3, Sora 2, Kling, Luma Ray, Runway Gen-3, HunyuanVideo, WAN 2.1, Seedance, and more.
- Pricing tiers: Newbie (free, 25 generations/month), Creator ($12/mo, 500/mo), Studio ($29/mo, 2000/mo), Pro ($59/mo, unlimited).
- All generation types (images AND videos) count against the monthly limit.
- Subscriptions managed via Stripe. Users can upgrade/downgrade in Settings > Billing.

**Common Issues & Fixes:**
- "Rate limit reached" / 429 error: User hit their monthly generation limit. Explain their tier limit and suggest upgrading.
- 422 error: Invalid parameters. Usually incompatible settings (wrong aspect ratio, unsupported option). Suggest trying default settings or a different model.
- Video generation pending/spinning: Normal — videos take 1–5 minutes. The page auto-updates. Tell them to wait or refresh.
- Image not saving / missing from gallery: Try regenerating. If persistent, could be a storage issue worth escalating.
- Login / auth issues: Sign out and back in, try a different browser, or use magic link.
- Billing / charge questions: Direct to Settings > Billing to manage subscription. For disputes, escalate.

**Available Actions:**
When you need to take action, put the action on its own line BEFORE your reply text, like this:
ACTION: lookup_account
ACTION: refund
ACTION: escalate

Only include an action line when you actually intend to perform it. You can only take ONE action per response.

**When to use lookup_account:** User asks about their usage, remaining credits, tier, or account details, AND they appear to be logged in.

**When to refund:** Generation clearly failed (blank/corrupt image, visible error, service outage). Do NOT refund for "I don't like the result" or user error. Max 5 refunds/day total — if the limit is reached, escalate instead.

**When to escalate:** Payment disputes, account security issues, bugs needing developer attention, user is very frustrated after multiple failed attempts to resolve.

**Tone:** Friendly, helpful, concise. Skip lengthy apologies — jump to solutions. If you don't know something, say so clearly.`

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string | Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }>
}

async function callGPT4o(messages: Message[], openaiKey: string): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
    body: JSON.stringify({ model: 'gpt-4o', messages, max_tokens: 800 }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? 'OpenAI request failed')
  }
  const data = await res.json()
  return data.choices[0].message.content ?? ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { conversation_id, message, image_url, user_token } = await req.json()

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiKey) throw new Error('OpenAI API key not configured')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Resolve user
    let userId: string | null = null
    let userEmail: string | null = null
    if (user_token) {
      const { data: { user } } = await adminClient.auth.getUser(user_token)
      if (user) { userId = user.id; userEmail = user.email ?? null }
    }

    // Load existing conversation
    let convId: string | null = conversation_id ?? null
    let existingMessages: Message[] = []
    let currentStatus = 'open'

    if (convId) {
      const { data: conv } = await adminClient
        .from('support_conversations')
        .select('messages, status')
        .eq('id', convId)
        .single()
      if (conv) {
        existingMessages = conv.messages as Message[]
        currentStatus = conv.status
      }
    }

    // Don't allow messages on escalated conversations (UI should block this, but guard here too)
    if (currentStatus === 'escalated') {
      return new Response(JSON.stringify({
        reply: "This conversation has been escalated. Nick will follow up with you within 24 hours.",
        conversation_id: convId,
        action_taken: null,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Build user message content (with vision if image attached)
    const userContent: Message['content'] = image_url
      ? [
          { type: 'text', text: message.trim() },
          { type: 'image_url', image_url: { url: image_url, detail: 'auto' } },
        ]
      : message.trim()

    const newUserMessage: Message = { role: 'user', content: userContent }

    // Build messages array for GPT
    const gptMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...existingMessages,
      newUserMessage,
    ]

    // First GPT call
    let rawReply = await callGPT4o(gptMessages, openaiKey)

    // Parse action tag
    const actionMatch = rawReply.match(/^ACTION:\s*(\w+)/m)
    const actionTag = actionMatch ? actionMatch[1].toLowerCase() : null
    let actionTaken: string | null = null
    let actionContext = ''
    let newStatus = currentStatus

    if (actionTag === 'lookup_account' && userId) {
      // Fetch account info
      const { data: profile } = await adminClient.from('profiles').select('tier').eq('id', userId).single()
      const tier = profile?.tier ?? 'free'

      const startOfMonth = new Date()
      startOfMonth.setUTCDate(1); startOfMonth.setUTCHours(0, 0, 0, 0)
      const { count: assetCount } = await adminClient
        .from('assets').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).gte('created_at', startOfMonth.toISOString())

      const { data: recentFailed } = await adminClient
        .from('assets').select('id, created_at, gen_type, metadata')
        .eq('user_id', userId).order('created_at', { ascending: false }).limit(5)

      actionContext = `[SYSTEM: Account info — Tier: ${tier}, Generations this month: ${assetCount ?? 0}, Recent assets: ${JSON.stringify(recentFailed ?? [])}]`
      actionTaken = 'lookup_account'

    } else if (actionTag === 'refund' && userId) {
      // Check daily refund cap (5/day across all users)
      const today = new Date().toISOString().slice(0, 10)
      const { count: todayRefunds } = await adminClient
        .from('support_refunds').select('id', { count: 'exact', head: true })
        .gte('refunded_at', today)

      if ((todayRefunds ?? 0) >= 5) {
        // Cap hit — escalate instead
        actionContext = '[SYSTEM: Daily refund limit (5) reached. Auto-escalating.]'
        actionTag === 'refund' // overwrite to escalate flow below
        // fall through to escalate
        const { data: conv } = await adminClient
          .from('support_conversations').select('id, messages').eq('id', convId ?? 'none').single()
        const summary = `Support escalation (refund cap hit):\nUser: ${userEmail ?? 'anonymous'}\nLast message: ${message}`
        await sendTelegramAlert(summary)
        newStatus = 'escalated'
        actionContext = '[SYSTEM: Refund cap reached. Escalated to Nick. User notified.]'
        actionTaken = 'escalate'
      } else {
        // Issue refund
        await adminClient.from('support_refunds').insert({ user_id: userId })
        actionContext = `[SYSTEM: Refund issued. Daily refund count: ${(todayRefunds ?? 0) + 1}/5]`
        actionTaken = 'refund'
      }

    } else if (actionTag === 'escalate') {
      const summary = `Support escalation request:\nUser: ${userEmail ?? 'anonymous'} (${userId ?? 'not logged in'})\nLast message: ${message}`
      await sendTelegramAlert(summary)
      newStatus = 'escalated'
      actionContext = '[SYSTEM: Escalated. Nick notified via Telegram. Conversation marked escalated.]'
      actionTaken = 'escalate'
    }

    // If an action was taken, re-call GPT with the context
    let finalReply = rawReply.replace(/^ACTION:\s*\w+\n?/m, '').trim()

    if (actionTaken && actionContext) {
      const followUpMessages: Message[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...existingMessages,
        newUserMessage,
        { role: 'assistant', content: rawReply },
        { role: 'system', content: actionContext },
      ]
      const reReply = await callGPT4o(followUpMessages, openaiKey)
      finalReply = reReply.replace(/^ACTION:\s*\w+\n?/m, '').trim()
    }

    if (actionTaken === 'escalate') {
      finalReply = `${finalReply}\n\nNick has been notified and will follow up within 24 hours.`
    }

    // Build updated messages list for storage
    // Store user message as text-only for readability (strip image from stored history)
    const storedUserMessage: Message = { role: 'user', content: message.trim() }
    const storedBotMessage: Message = { role: 'assistant', content: finalReply }
    const updatedMessages = [...existingMessages, storedUserMessage, storedBotMessage]

    // Upsert conversation
    if (convId) {
      await adminClient.from('support_conversations').update({
        messages: updatedMessages,
        status: newStatus,
        updated_at: new Date().toISOString(),
      }).eq('id', convId)
    } else {
      const { data: newConv } = await adminClient.from('support_conversations').insert({
        user_id: userId,
        email: userEmail,
        messages: updatedMessages,
        status: newStatus,
      }).select('id').single()
      convId = newConv?.id ?? null
    }

    return new Response(JSON.stringify({
      reply: finalReply,
      conversation_id: convId,
      action_taken: actionTaken,
      escalated: newStatus === 'escalated',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function sendTelegramAlert(message: string) {
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const chatId = Deno.env.get('TELEGRAM_CHAT_ID') ?? '821271234'
  if (!botToken) return
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `🆘 prmptVAULT Support\n\n${message}`, parse_mode: 'HTML' }),
    })
  } catch (_) { /* non-fatal */ }
}
