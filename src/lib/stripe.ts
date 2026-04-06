import { supabase } from './supabase'

const PRICES = {
  creator: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_CREATOR as string,
    annual:  import.meta.env.VITE_STRIPE_PRICE_CREATOR_ANNUAL as string,
  },
  studio: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_STUDIO as string,
    annual:  import.meta.env.VITE_STRIPE_PRICE_STUDIO_ANNUAL as string,
  },
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRICE_PRO as string,
    annual:  import.meta.env.VITE_STRIPE_PRICE_PRO_ANNUAL as string,
  },
}

export async function createCheckoutSession(
  tier: 'creator' | 'studio' | 'pro',
  billing: 'monthly' | 'annual' = 'monthly',
) {
  const priceId = PRICES[tier][billing]
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ priceId, tier, billing, user_token: session.access_token }),
    }
  )

  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error || data.message || `Checkout failed (${res.status})`)
  if (!data.url) throw new Error('No checkout URL returned')

  window.location.href = data.url
}
