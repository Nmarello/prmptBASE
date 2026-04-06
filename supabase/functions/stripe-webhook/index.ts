import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
)

// Authoritative price → tier mapping. Hardcoded as fallback; override via Supabase secrets.
const PRICE_TIER_MAP: Record<string, string> = {
  [Deno.env.get('STRIPE_PRICE_CREATOR') ?? 'price_1TAJ4GBXwf8zwzkPMkOs2lLm']:         'creator',
  [Deno.env.get('STRIPE_PRICE_CREATOR_ANNUAL') ?? 'price_1TAJ4GBXwf8zwzkP5CxM81Rg']:  'creator',
  [Deno.env.get('STRIPE_PRICE_STUDIO') ?? 'price_1TAJ4pBXwf8zwzkPXbbyDsxd']:           'studio',
  [Deno.env.get('STRIPE_PRICE_STUDIO_ANNUAL') ?? 'price_1TAJ4pBXwf8zwzkPBSxrykTq']:   'studio',
  [Deno.env.get('STRIPE_PRICE_PRO') ?? 'price_1TAJ4pBXwf8zwzkPNEmMTrpG']:             'pro',
  [Deno.env.get('STRIPE_PRICE_PRO_ANNUAL') ?? 'price_1TAJ4qBXwf8zwzkP17xvoZSr']:      'pro',
}

const VALID_TIERS = new Set(['creator', 'studio', 'pro'])
const VALID_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Resolve tier from price IDs on the session, falling back to metadata. */
async function resolvedTier(s: Stripe.Checkout.Session): Promise<string | null> {
  try {
    const items = await stripe.checkout.sessions.listLineItems(s.id, { limit: 5 })
    for (const item of items.data) {
      const priceId = item.price?.id
      if (priceId && PRICE_TIER_MAP[priceId]) return PRICE_TIER_MAP[priceId]
    }
  } catch { /* fall through */ }
  // Fallback: trust metadata tier only if it maps to a known price
  const metaTier = s.metadata?.tier
  if (metaTier && VALID_TIERS.has(metaTier)) return metaTier
  return null
}

function validUserId(id: string | undefined | null): id is string {
  return typeof id === 'string' && VALID_UUID.test(id)
}

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret)
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session | Stripe.Subscription

  switch (event.type) {
    case 'checkout.session.completed': {
      const s = session as Stripe.Checkout.Session
      const userId = s.metadata?.supabase_user_id
      const customerId = s.customer as string
      const subscriptionId = s.subscription as string

      if (!validUserId(userId)) break

      const tier = await resolvedTier(s)
      if (!tier) { console.error('[stripe-webhook] Could not resolve tier for session', s.id); break }

      // Cancel previous subscription if upgrading/changing plan
      const { data: existing } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (existing?.stripe_subscription_id && existing.stripe_subscription_id !== subscriptionId) {
        try {
          // cancel_at_period_end avoids triggering customer.subscription.deleted immediately
          await stripe.subscriptions.update(existing.stripe_subscription_id, { cancel_at_period_end: true })
        } catch (e) {
          console.error('[stripe-webhook] Failed to cancel old subscription', e)
        }
      }

      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        tier,
        status: 'active',
      }, { onConflict: 'user_id' })

      await supabase.from('profiles').update({ tier }).eq('id', userId)
      break
    }

    case 'customer.subscription.updated': {
      const s = session as Stripe.Subscription
      const userId = s.metadata?.supabase_user_id

      if (!validUserId(userId)) break

      // Resolve tier from subscription's price IDs
      let tier: string | null = null
      const priceId = s.items?.data?.[0]?.price?.id
      if (priceId && PRICE_TIER_MAP[priceId]) {
        tier = PRICE_TIER_MAP[priceId]
      } else {
        const metaTier = s.metadata?.tier
        if (metaTier && VALID_TIERS.has(metaTier)) tier = metaTier
      }

      await supabase.from('subscriptions').update({
        status: s.status,
        tier: tier ?? undefined,
        current_period_end: new Date(s.current_period_end * 1000).toISOString(),
      }).eq('stripe_subscription_id', s.id)

      if (tier) {
        await supabase.from('profiles').update({ tier }).eq('id', userId)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const s = session as Stripe.Subscription
      const userId = s.metadata?.supabase_user_id

      if (!validUserId(userId)) break

      await supabase.from('subscriptions').update({ status: 'canceled', tier: 'newbie' })
        .eq('stripe_subscription_id', s.id)

      // Only downgrade profile if this is still the user's active subscription
      // (if they've already upgraded, their DB record points to the new sub)
      const { data: current } = await supabase
        .from('subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', userId)
        .maybeSingle()

      if (current?.stripe_subscription_id === s.id) {
        await supabase.from('profiles').update({ tier: 'newbie' }).eq('id', userId)
      }
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
