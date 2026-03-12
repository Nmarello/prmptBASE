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

    const { user_token } = await req.json()
    if (!user_token) throw new Error('Missing user_token')

    const { data: { user }, error: authError } = await adminClient.auth.getUser(user_token)
    if (authError || !user) throw new Error(authError?.message ?? 'Unauthorized')

    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, email, display_name, tier, created_at')
      .eq('id', user.id)
      .single()

    const { data: assets } = await adminClient
      .from('assets')
      .select('id, gen_type, cost_usd, model_id, created_at, models(name, slug, provider)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Gen type totals
    const gen_type_totals: Record<string, number> = {}
    assets?.forEach((a: any) => {
      const t = a.gen_type ?? 'unknown'
      gen_type_totals[t] = (gen_type_totals[t] ?? 0) + 1
    })

    // By model
    const modelMap: Record<string, { name: string; slug: string; provider: string; count: number; total_cost: number }> = {}
    assets?.forEach((a: any) => {
      if (!a.model_id) return
      if (!modelMap[a.model_id]) modelMap[a.model_id] = {
        name: a.models?.name ?? a.model_id,
        slug: a.models?.slug ?? '',
        provider: a.models?.provider ?? '',
        count: 0, total_cost: 0,
      }
      modelMap[a.model_id].count += 1
      if (a.cost_usd != null) modelMap[a.model_id].total_cost += Number(a.cost_usd)
    })
    const by_model = Object.values(modelMap).sort((a, b) => b.count - a.count)

    // Image breakdown by model (txt2img, img2img)
    const imageModelMap: Record<string, { name: string; slug: string; provider: string; txt2img: number; img2img: number }> = {}
    assets?.forEach((a: any) => {
      if (a.gen_type !== 'txt2img' && a.gen_type !== 'img2img') return
      const key = a.model_id ?? 'unknown'
      if (!imageModelMap[key]) imageModelMap[key] = { name: a.models?.name ?? key, slug: a.models?.slug ?? key, provider: a.models?.provider ?? '', txt2img: 0, img2img: 0 }
      imageModelMap[key][a.gen_type as 'txt2img' | 'img2img'] += 1
    })
    const image_by_model = Object.values(imageModelMap).sort((a, b) => (b.txt2img + b.img2img) - (a.txt2img + a.img2img))

    // Video breakdown by model (txt2vid, img2vid)
    const videoModelMap: Record<string, { name: string; slug: string; provider: string; txt2vid: number; img2vid: number }> = {}
    assets?.forEach((a: any) => {
      if (a.gen_type !== 'txt2vid' && a.gen_type !== 'img2vid') return
      const key = a.model_id ?? 'unknown'
      if (!videoModelMap[key]) videoModelMap[key] = { name: a.models?.name ?? key, slug: a.models?.slug ?? key, provider: a.models?.provider ?? '', txt2vid: 0, img2vid: 0 }
      videoModelMap[key][a.gen_type as 'txt2vid' | 'img2vid'] += 1
    })
    const video_by_model = Object.values(videoModelMap).sort((a, b) => (b.txt2vid + b.img2vid) - (a.txt2vid + a.img2vid))

    // Spend
    const total_spend = assets?.reduce((s: number, a: any) => s + (a.cost_usd != null ? Number(a.cost_usd) : 0), 0) ?? 0
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const period_spend = assets
      ?.filter((a: any) => a.created_at >= startOfMonth.toISOString())
      .reduce((s: number, a: any) => s + (a.cost_usd != null ? Number(a.cost_usd) : 0), 0) ?? 0

    const today = new Date().toISOString().slice(0, 10)
    const assets_today = assets?.filter((a: any) => a.created_at?.startsWith(today)).length ?? 0

    return new Response(JSON.stringify({
      profile,
      total_assets: assets?.length ?? 0,
      assets_today,
      gen_type_totals,
      by_model,
      image_by_model,
      video_by_model,
      total_spend,
      period_spend,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
