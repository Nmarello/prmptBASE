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

    const { user_token } = await req.json()
    if (!user_token) throw new Error('Missing user_token')

    const { data: { user: caller }, error: authError } = await adminClient.auth.getUser(user_token)
    if (authError || !caller) throw new Error(authError?.message ?? 'Unauthorized')

    const { data: callerProfile } = await adminClient
      .from('profiles').select('is_admin').eq('id', caller.id).single()
    if (!callerProfile?.is_admin) throw new Error('Forbidden')

    // Fetch all profiles + asset counts using service role (bypasses RLS)
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, email, display_name, tier, created_at, is_admin')
      .order('created_at', { ascending: false })

    const { data: assetRows } = await adminClient
      .from('assets')
      .select('user_id')

    const countMap: Record<string, number> = {}
    assetRows?.forEach(a => { countMap[a.user_id] = (countMap[a.user_id] ?? 0) + 1 })

    const users = (profiles ?? []).map(p => ({ ...p, asset_count: countMap[p.id] ?? 0 }))

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
