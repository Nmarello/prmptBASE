import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, optionsResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req)

  try {
    const { category, message, user_token } = await req.json()

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let userId: string | null = null
    let email: string | null = null

    if (user_token) {
      const { data: { user } } = await adminClient.auth.getUser(user_token)
      if (user) {
        userId = user.id
        email = user.email ?? null
      }
    }

    const { error } = await adminClient.from('feedback').insert({
      user_id: userId,
      email,
      category: category ?? 'general',
      message: message.trim(),
    })

    if (error) throw new Error(error.message)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
