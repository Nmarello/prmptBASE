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

    // Verify caller is an admin
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

    const { target_user_id, tier } = await req.json()
    if (!target_user_id || !tier) throw new Error('Missing target_user_id or tier')

    const VALID_TIERS = ['newbie', 'creator', 'studio', 'pro']
    if (!VALID_TIERS.includes(tier)) throw new Error('Invalid tier')

    // Update profiles + subscriptions
    await adminClient.from('profiles').update({ tier }).eq('id', target_user_id)
    await adminClient.from('subscriptions').upsert(
      { user_id: target_user_id, tier, status: 'active', updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
