import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-04-10',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SERVICE_ROLE_KEY')!
)

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
      const tier = s.metadata?.tier
      const customerId = s.customer as string
      const subscriptionId = s.subscription as string

      if (!userId || !tier) break

      // Upsert subscription row
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        tier,
        status: 'active',
      }, { onConflict: 'user_id' })

      // Update profile tier
      await supabase.from('profiles').update({ tier }).eq('id', userId)
      break
    }

    case 'customer.subscription.updated': {
      const s = session as Stripe.Subscription
      const userId = s.metadata?.supabase_user_id
      const tier = s.metadata?.tier

      if (!userId) break

      await supabase.from('subscriptions').update({
        status: s.status,
        tier: tier || undefined,
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

      if (!userId) break

      await supabase.from('subscriptions').update({ status: 'canceled', tier: 'newbie' })
        .eq('stripe_subscription_id', s.id)

      await supabase.from('profiles').update({ tier: 'newbie' }).eq('id', userId)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
