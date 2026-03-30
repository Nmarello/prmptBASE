import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, optionsResponse } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req)

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceKey)

    const { user_token } = await req.json()
    if (!user_token) throw new Error('Missing user_token')

    const { data: { user }, error: authError } = await adminClient.auth.getUser(user_token)
    if (authError || !user) throw new Error(authError?.message ?? 'Unauthorized')

    const { error } = await adminClient.auth.admin.deleteUser(user.id)
    if (error) throw new Error(error.message)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
