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

    const { user_token, file_base64, content_type } = await req.json()
    if (!user_token || !file_base64) throw new Error('Missing required fields')

    const { data: { user }, error: authError } = await adminClient.auth.getUser(user_token)
    if (authError || !user) throw new Error(authError?.message ?? 'Unauthorized')

    const ct = content_type ?? 'image/jpeg'
    const ext = ct.split('/')[1]?.split('+')[0] ?? 'jpg'
    const fileName = `avatars/${user.id}/${Date.now()}.${ext}`

    // decode base64
    const binary = atob(file_base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)

    const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/assets/${fileName}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': ct,
        'x-upsert': 'true',
      },
      body: bytes,
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      throw new Error(`Storage upload failed: ${err}`)
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/assets/${fileName}`

    // Update profile avatar_url
    await adminClient.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', user.id)

    return new Response(JSON.stringify({ url: publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
