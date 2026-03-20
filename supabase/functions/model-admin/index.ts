import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Actions:
//   mark_tested     → model_status.tested=true
//   set_live        → models.is_active=true, coming_soon=false, released_at=now()
//   set_coming_soon → models.coming_soon=true, is_active=false

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_token, action, model_slug } = await req.json()
    if (!model_slug || !action) throw new Error('model_slug and action are required')

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify caller is admin
    const { data: { user } } = await db.auth.getUser(user_token)
    if (!user) throw new Error('Unauthorized')
    const { data: profile } = await db.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Not admin')

    if (action === 'mark_tested') {
      const { error: updateErr } = await db.from('model_status')
        .update({ tested: true, updated_at: new Date().toISOString() })
        .eq('model_slug', model_slug)
      if (updateErr) throw new Error(`model_status update failed: ${updateErr.message}`)

    } else if (action === 'set_live') {
      await db.from('models')
        .update({ is_active: true, coming_soon: false, released_at: new Date().toISOString() })
        .eq('slug', model_slug)

    } else if (action === 'set_coming_soon') {
      await db.from('models')
        .update({ coming_soon: true, is_active: false })
        .eq('slug', model_slug)

    } else {
      throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
