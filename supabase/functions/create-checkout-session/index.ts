import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, optionsResponse, safeErrorMessage } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req)
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing auth header')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('Unauthorized')

    const { priceId, tier, billing } = await req.json()
    if (!priceId || !tier) throw new Error('Missing priceId or tier')

    const ALLOWED_ORIGINS = new Set([
      'https://prmptvault.ai',
      'https://www.prmptvault.ai',
      'https://prmptbase.ai',
      'https://www.prmptbase.ai',
      'https://prmptbase.pages.dev',
      'https://staging.prmptbase.pages.dev',
    ])
    const rawOrigin = req.headers.get('origin') ?? ''
    const origin = ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : 'https://prmptvault.ai'

    // Check if customer already exists
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success&tier=${tier}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      metadata: { supabase_user_id: user.id, tier, billing: billing || 'monthly' },
      subscription_data: {
        trial_period_days: 3,
        metadata: { supabase_user_id: user.id, tier, billing: billing || 'monthly' },
      },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: safeErrorMessage(err) }), {
      status: 400,
      headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})
