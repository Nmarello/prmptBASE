import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing auth header')
    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) throw new Error('Unauthorized')

    const { data: callerProfile } = await adminClient
      .from('profiles').select('is_admin').eq('id', caller.id).single()
    if (!callerProfile?.is_admin) throw new Error('Forbidden')

    const { email, password, tier = 'newbie', display_name } = await req.json()
    if (!email) throw new Error('Missing email')

    const VALID_TIERS = ['newbie', 'creator', 'studio', 'pro']
    if (!VALID_TIERS.includes(tier)) throw new Error('Invalid tier')

    // Create the auth user (email confirmed immediately)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: password || undefined,
      email_confirm: true,
    })
    if (createError) throw new Error(createError.message)

    const userId = newUser.user.id

    // Update profile (trigger creates it, but set tier + display_name)
    await adminClient.from('profiles').upsert({
      id: userId,
      email,
      display_name: display_name || null,
      tier,
    }, { onConflict: 'id' })

    // Upsert subscription record
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
