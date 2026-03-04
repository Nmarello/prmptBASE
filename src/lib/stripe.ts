import { supabase } from './supabase'

const PRICE_IDS = {
  creator: import.meta.env.VITE_STRIPE_PRICE_CREATOR as string,
  studio: import.meta.env.VITE_STRIPE_PRICE_STUDIO as string,
  pro: import.meta.env.VITE_STRIPE_PRICE_PRO as string,
}

export async function createCheckoutSession(tier: 'creator' | 'studio' | 'pro') {
  const priceId = PRICE_IDS[tier]
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ priceId, tier }),
    }
  )

  const data = await res.json()
  if (data.error) throw new Error(data.error)

  window.location.href = data.url
}
