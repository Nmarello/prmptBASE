const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_WELCOME_TEMPLATE_ID = Deno.env.get('RESEND_WELCOME_TEMPLATE_ID')!
const FROM_EMAIL = 'noreply@prmptvault.ai'

Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const user = payload.record

    const fullName: string = user.raw_user_meta_data?.full_name ?? ''
    const firstName = fullName.split(' ')[0].trim() || 'there'
    const email: string = user.email

    if (!email) {
      return new Response(JSON.stringify({ error: 'No email in payload' }), { status: 400 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: "you're in. let's build something.",
        template_id: RESEND_WELCOME_TEMPLATE_ID,
        variables: {
          first_name: firstName,
          unsubscribe_url: `https://prmptvault.ai/unsubscribe?email=${encodeURIComponent(email)}`,
        },
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify({ ok: res.ok, resend: data }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
