import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'noreply@prmptvault.ai'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildEmailHtml(params: {
  postTitle: string
  postExcerpt: string
  postUrl: string
  featureImageUrl?: string
  tag?: string
  unsubscribeUrl: string
}): string {
  const { postTitle, postExcerpt, postUrl, featureImageUrl, tag = 'New post', unsubscribeUrl } = params

  const featureMediaHtml = featureImageUrl
    ? featureImageUrl.endsWith('.mp4')
      ? `<div style="margin:0 0 24px;"><video src="${featureImageUrl}" autoplay muted loop playsinline style="width:100%;border-radius:6px;display:block;"></video></div>`
      : `<div style="margin:0 0 24px;"><img src="${featureImageUrl}" alt="" style="width:100%;border-radius:6px;display:block;" /></div>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${postTitle}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; }
    .email-wrapper { background-color: #f4f4f4; padding: 32px 16px; }
    .email-body { background-color: #ffffff; max-width: 560px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 1px solid #e8e8e8; }
    .em-header { background-color: #0a0a0a; padding: 14px 28px; }
    .em-logo { font-size: 22px; font-weight: 900; color: #ffffff; text-decoration: none; letter-spacing: -0.03em; }
    .em-logo-accent { color: #2952E3; }
    .em-badge { background-color: #2952E3; color: #ffffff; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 3px; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }
    .em-hero { background-color: #2952E3; padding: 20px 28px; }
    .em-kicker { color: #0a0a0a; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px; }
    .em-title { color: #ffffff; font-size: 34px; font-weight: 900; line-height: 1.05; letter-spacing: -0.03em; text-transform: uppercase; margin: 0; }
    .em-content { padding: 28px 28px 24px; }
    .em-excerpt { font-size: 13px; color: #555555; line-height: 1.75; margin: 0 0 20px; }
    .em-cta-wrap { text-align: center; margin: 0 0 8px; }
    .em-cta-btn { display: inline-block; background-color: #2952E3; color: #ffffff !important; font-size: 12px; font-weight: 800; padding: 13px 32px; border-radius: 4px; text-decoration: none !important; letter-spacing: 0.06em; text-transform: uppercase; }
    .em-divider { border: none; border-top: 1px solid #f0f0f0; margin: 20px 0; }
    .em-footer { background-color: #0a0a0a; padding: 16px 28px; }
    .em-footer-logo { font-size: 12px; font-weight: 900; color: #ffffff !important; text-decoration: none !important; letter-spacing: -0.02em; }
    .em-footer-logo-accent { color: #2952E3 !important; }
    .em-footer-link { font-size: 10px; color: #555555; text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .em-header, .em-hero, .em-content, .em-footer { padding-left: 16px !important; padding-right: 16px !important; }
      .em-title { font-size: 26px !important; }
    }
  </style>
</head>
<body>
<div class="email-wrapper"><div class="email-body">
  <div class="em-header">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td><a href="https://prmptvault.ai" class="em-logo" style="color:#ffffff !important; text-decoration:none !important;">prmpt<span class="em-logo-accent" style="color:#2952E3 !important;">VAULT</span></a></td>
      <td align="right"><span class="em-badge">${tag}</span></td>
    </tr></table>
  </div>
  <div class="em-hero">
    <p class="em-kicker">From the blog</p>
    <h1 class="em-title">${postTitle}</h1>
  </div>
  <div class="em-content">
    <p class="em-excerpt">${postExcerpt}</p>
    ${featureMediaHtml}
    <div class="em-cta-wrap">
      <a href="${postUrl}" class="em-cta-btn" style="color:#ffffff !important; text-decoration:none !important;">Read the post &rarr;</a>
    </div>
    <hr class="em-divider" />
    <p style="font-size:11px; color:#aaaaaa; text-align:center; margin:0;">You're getting this because you have a prmptVAULT account.<br>New models and posts drop weekly.</p>
  </div>
  <div class="em-footer">
    <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
      <td><a href="https://prmptvault.ai" class="em-footer-logo" style="color:#ffffff !important; text-decoration:none !important;">prmpt<span class="em-footer-logo-accent" style="color:#2952E3 !important;">VAULT</span></a></td>
      <td align="right">
        <a href="https://twitter.com/prmptvault" class="em-footer-link" style="margin-right:14px;">Twitter</a>
        <a href="https://blog.prmptvault.ai" class="em-footer-link" style="margin-right:14px;">Blog</a>
        <a href="${unsubscribeUrl}" class="em-footer-link">Unsubscribe</a>
      </td>
    </tr></table>
  </div>
</div></div>
</body></html>`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const payload = await req.json()

    // Ghost webhook payload: { post: { current: { ... } } }
    const post = payload?.post?.current
    if (!post) {
      return new Response(JSON.stringify({ error: 'No post in payload' }), { status: 400 })
    }

    // Only fire on published posts
    if (post.status !== 'published') {
      return new Response(JSON.stringify({ skipped: 'post not published' }), { status: 200 })
    }

    const postTitle = post.title
    const postExcerpt = post.custom_excerpt || post.excerpt || ''
    const postUrl = post.url
    const featureImageUrl = post.feature_image || undefined
    const tag = post.primary_tag?.name || 'New post'

    // Fetch all user emails
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: users, error } = await db.auth.admin.listUsers({ perPage: 1000 })
    if (error) throw error

    const emails = users.users
      .map((u: { email?: string }) => u.email)
      .filter(Boolean) as string[]

    // Send in batches of 50
    const batchSize = 50
    let sent = 0

    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize)
      await Promise.all(batch.map(async (email) => {
        const unsubscribeUrl = `https://prmptvault.ai/unsubscribe?email=${encodeURIComponent(email)}`
        const html = buildEmailHtml({ postTitle, postExcerpt, postUrl, featureImageUrl, tag, unsubscribeUrl })
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: FROM_EMAIL, to: email, subject: postTitle, html }),
        })
        sent++
      }))
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
