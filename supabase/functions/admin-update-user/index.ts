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
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: callerErr } = await adminClient.auth.getUser(token)
    if (callerErr || !caller) throw new Error('Unauthorized')

    const { data: callerProfile } = await adminClient
      .from('profiles').select('is_admin').eq('id', caller.id).single()
    if (!callerProfile?.is_admin) throw new Error('Forbidden')

    const { target_user_id, tier, email, display_name, password } = await req.json()
    if (!target_user_id) throw new Error('Missing target_user_id')

    // Update auth (email and/or password) via admin API
    if (email || password) {
      const authUpdate: Record<string, string> = {}
      if (email) authUpdate.email = email
      if (password) authUpdate.password = password
      const { error: authErr } = await adminClient.auth.admin.updateUserById(target_user_id, authUpdate)
      if (authErr) throw new Error(`Auth update failed: ${authErr.message}`)
    }

    // Update profile
    const profileUpdate: Record<string, unknown> = {}
    if (display_name !== undefined) profileUpdate.display_name = display_name
    if (tier) {
      const VALID_TIERS = ['newbie', 'creator', 'studio', 'pro']
      if (!VALID_TIERS.includes(tier)) throw new Error('Invalid tier')
      profileUpdate.tier = tier
    }
    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileErr } = await adminClient
        .from('profiles')
        .update(profileUpdate)
        .eq('id', target_user_id)
      if (profileErr) throw new Error(`Profile update failed: ${profileErr.message}`)
    }

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
