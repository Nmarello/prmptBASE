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
      .select('user_id, cost_usd, model_id, gen_type, created_at, models(name, slug, provider)')

    const countMap: Record<string, number> = {}
    assetRows?.forEach(a => { countMap[a.user_id] = (countMap[a.user_id] ?? 0) + 1 })

    // Fetch predicted costs from models table
    const { data: modelRows } = await adminClient
      .from('models')
      .select('id, name, slug, provider, predicted_cost_usd, cost_notes')
      .order('sort_order')

    // Aggregate actual cost per model
    const modelMap: Record<string, { name: string; slug: string; provider: string; predicted: number | null; cost_notes: string | null; total: number; count: number }> = {}
    // Seed map from models table so all models appear (even with 0 runs)
    modelRows?.forEach((m: any) => {
      modelMap[m.id] = { name: m.name, slug: m.slug, provider: m.provider, predicted: m.predicted_cost_usd != null ? Number(m.predicted_cost_usd) : null, cost_notes: m.cost_notes, total: 0, count: 0 }
    })
    assetRows?.forEach((a: any) => {
      if (!a.model_id || !modelMap[a.model_id]) return
      if (a.cost_usd != null) {
        modelMap[a.model_id].total += Number(a.cost_usd)
        modelMap[a.model_id].count += 1
      }
    })
    const cost_by_model = Object.values(modelMap)
      .map(m => ({
        name: m.name, slug: m.slug, provider: m.provider,
        predicted_cost: m.predicted, cost_notes: m.cost_notes,
        avg_actual_cost: m.count > 0 ? m.total / m.count : null,
        total_cost: m.total, count: m.count,
      }))
      .sort((a, b) => (b.predicted_cost ?? 0) - (a.predicted_cost ?? 0))

    // Period spend (current calendar month)
    const startOfMonth = new Date()
    startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0)
    const { data: periodRows } = await adminClient
      .from('assets')
      .select('cost_usd')
      .not('cost_usd', 'is', null)
      .gte('created_at', startOfMonth.toISOString())
    const period_spend = periodRows?.reduce((s: number, a: any) => s + Number(a.cost_usd), 0) ?? 0
    const total_spend = assetRows?.reduce((s: number, a: any) => s + (a.cost_usd != null ? Number(a.cost_usd) : 0), 0) ?? 0

    // Gen type totals
    const genTypeTotals: Record<string, number> = {}
    assetRows?.forEach((a: any) => {
      const t = a.gen_type ?? 'unknown'
      genTypeTotals[t] = (genTypeTotals[t] ?? 0) + 1
    })

    // Video breakdown by model+type (txt2vid, img2vid)
    const videoModelMap: Record<string, { name: string; slug: string; provider: string; txt2vid: number; img2vid: number }> = {}
    assetRows?.forEach((a: any) => {
      if (a.gen_type !== 'txt2vid' && a.gen_type !== 'img2vid') return
      const key = a.model_id ?? 'unknown'
      if (!videoModelMap[key]) videoModelMap[key] = { name: a.models?.name ?? key, slug: a.models?.slug ?? '', provider: a.models?.provider ?? '', txt2vid: 0, img2vid: 0 }
      videoModelMap[key][a.gen_type as 'txt2vid' | 'img2vid'] += 1
    })
    const video_by_model = Object.values(videoModelMap)
      .sort((a, b) => (b.txt2vid + b.img2vid) - (a.txt2vid + a.img2vid))

    // Image breakdown by model+type (txt2img, img2img)
    const imageModelMap: Record<string, { name: string; slug: string; provider: string; txt2img: number; img2img: number }> = {}
    assetRows?.forEach((a: any) => {
      if (a.gen_type !== 'txt2img' && a.gen_type !== 'img2img') return
      const key = a.model_id ?? 'unknown'
      if (!imageModelMap[key]) imageModelMap[key] = { name: a.models?.name ?? key, slug: a.models?.slug ?? '', provider: a.models?.provider ?? '', txt2img: 0, img2img: 0 }
      imageModelMap[key][a.gen_type as 'txt2img' | 'img2img'] += 1
    })
    const image_by_model = Object.values(imageModelMap)
      .sort((a, b) => (b.txt2img + b.img2img) - (a.txt2img + a.img2img))

    // Assets created today
    const today = new Date().toISOString().slice(0, 10)
    const assets_today = assetRows?.filter((a: any) => a.created_at?.startsWith(today)).length ?? 0

    const users = (profiles ?? []).map(p => ({ ...p, asset_count: countMap[p.id] ?? 0 }))

    return new Response(JSON.stringify({ users, cost_by_model, period_spend, total_spend, gen_type_totals: genTypeTotals, video_by_model, image_by_model, assets_today }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
