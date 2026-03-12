import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { user_token, target_user_id } = await req.json()
    if (!user_token || !target_user_id) throw new Error('Missing required fields')

    const { data: { user }, error: authError } = await adminClient.auth.getUser(user_token)
    if (authError || !user) throw new Error(authError?.message ?? 'Unauthorized')

    const { data: profile } = await adminClient.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Not authorized')

    const { error } = await adminClient.auth.admin.deleteUser(target_user_id)
    if (error) throw new Error(error.message)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
