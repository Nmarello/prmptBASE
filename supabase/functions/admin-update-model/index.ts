import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Actions:
//   mark_tested   → model_status.tested=true only (no status change)
//   set_live      → models.is_active=true, coming_soon=false, released_at=now() + blog post
//   set_coming_soon → models.coming_soon=true, is_active=false

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_token, action, model_slug } = await req.json()
    if (!model_slug || !action) throw new Error('model_slug and action are required')

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify caller is admin
    const { data: { user } } = await adminClient.auth.getUser(user_token)
    if (!user) throw new Error('Unauthorized')
    const { data: profile } = await adminClient.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Not admin')

    if (action === 'mark_tested') {
      await adminClient.from('model_status')
        .upsert({ model_slug, tested: true, updated_at: new Date().toISOString() }, { onConflict: 'model_slug' })

    } else if (action === 'set_live') {
      await adminClient.from('models')
        .update({ is_active: true, coming_soon: false, released_at: new Date().toISOString() })
        .eq('slug', model_slug)

      // Trigger blog post
      const { data: model } = await adminClient.from('models').select('name').eq('slug', model_slug).single()
      const blogRes = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-blog-post`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ model_slug, model_name: model?.name ?? model_slug }),
        },
      )
      const blogData = await blogRes.json().catch(() => null)
      return new Response(
        JSON.stringify({ success: true, blog_post: blogData }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )

    } else if (action === 'set_coming_soon') {
      await adminClient.from('models')
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
