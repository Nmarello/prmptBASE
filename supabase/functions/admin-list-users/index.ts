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
      .select('user_id, cost_usd, model_id, models(name, slug)')

    const countMap: Record<string, number> = {}
    assetRows?.forEach(a => { countMap[a.user_id] = (countMap[a.user_id] ?? 0) + 1 })

    // Aggregate cost per model
    const modelMap: Record<string, { name: string; slug: string; total: number; count: number }> = {}
    assetRows?.forEach((a: any) => {
      if (a.cost_usd == null || !a.model_id) return
      const key = a.model_id
      if (!modelMap[key]) modelMap[key] = { name: a.models?.name ?? a.model_id, slug: a.models?.slug ?? '', total: 0, count: 0 }
      modelMap[key].total += Number(a.cost_usd)
      modelMap[key].count += 1
    })
    const cost_by_model = Object.values(modelMap)
      .map(m => ({ name: m.name, slug: m.slug, avg_cost: m.count > 0 ? m.total / m.count : 0, total_cost: m.total, count: m.count }))
      .sort((a, b) => b.total_cost - a.total_cost)

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

    const users = (profiles ?? []).map(p => ({ ...p, asset_count: countMap[p.id] ?? 0 }))

    return new Response(JSON.stringify({ users, cost_by_model, period_spend, total_spend }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
