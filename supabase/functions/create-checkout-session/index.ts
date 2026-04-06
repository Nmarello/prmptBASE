import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { corsHeaders, optionsResponse, safeErrorMessage } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
})

/** Decode a JWT payload without verifying signature (gateway already verified the anon key) */
function decodeJwtPayload(token: string): { sub: string; email?: string } {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('Invalid token format')
  const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
  if (!payload.sub) throw new Error('Token missing sub claim')
  return payload
}

const ALLOWED_ORIGINS = new Set([
  'https://prmptvault.ai',
  'https://www.prmptvault.ai',
  'https://prmptbase.ai',
  'https://www.prmptbase.ai',
  'https://prmptbase.pages.dev',
  'https://staging.prmptbase.pages.dev',
])

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return optionsResponse(req)
  }

  try {
    const { priceId, tier, billing, user_token } = await req.json()
    if (!priceId || !tier) throw new Error('Missing priceId or tier')
    if (!user_token) throw new Error('Missing user_token')

    // Decode user identity from JWT (anon key already verified by gateway)
    const { sub: userId, email } = decodeJwtPayload(user_token)

    const rawOrigin = req.headers.get('origin') ?? ''
    const origin = ALLOWED_ORIGINS.has(rawOrigin) ? rawOrigin : 'https://prmptvault.ai'

    // Look up existing Stripe customer in parallel with nothing else yet
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: `Bearer ${user_token}` } } }
    )

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle()

    let customerId = sub?.stripe_customer_id

    // If no customer, use customer_email in checkout session instead of pre-creating
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success&tier=${tier}`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      metadata: { supabase_user_id: userId, tier, billing: billing || 'monthly' },
      subscription_data: {
        trial_period_days: 3,
        metadata: { supabase_user_id: userId, tier, billing: billing || 'monthly' },
      },
    }

    if (customerId) {
      sessionParams.customer = customerId
    } else {
      sessionParams.customer_email = email
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

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
