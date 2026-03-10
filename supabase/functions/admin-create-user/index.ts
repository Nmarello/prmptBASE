import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const adminClient = createClient(supabaseUrl, serviceKey)

    const body = await req.json()
    const { email, password, tier = 'newbie', display_name, user_token } = body

    if (!user_token) throw new Error('Missing user_token')

    // Verify caller is admin using their JWT
    const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(user_token)
    if (authError || !caller) throw new Error(authError?.message ?? 'Unauthorized')

    const { data: callerProfile } = await adminClient
      .from('profiles').select('is_admin').eq('id', caller.id).single()
    if (!callerProfile?.is_admin) throw new Error('Forbidden')

    if (!email) throw new Error('Missing email')

    const VALID_TIERS = ['newbie', 'creator', 'studio', 'pro']
    if (!VALID_TIERS.includes(tier)) throw new Error('Invalid tier')

    // Create auth user via REST API
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password: password || undefined,
        email_confirm: true,
      }),
    })

    const userData = await createRes.json()
    if (!createRes.ok) throw new Error(userData.message ?? userData.msg ?? `Auth error ${createRes.status}`)

    const userId = userData.id

    // Profile is auto-created by trigger; update tier + display_name
    await adminClient.from('profiles').update({
      tier,
      ...(display_name ? { display_name } : {}),
    }).eq('id', userId)

    // Upsert subscription
    await adminClient.from('subscriptions').upsert(
      { user_id: userId, tier, status: 'active', updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

    return new Response(JSON.stringify({ ok: true, user_id: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
