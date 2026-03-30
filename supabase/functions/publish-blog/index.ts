import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const GHOST_KEY = Deno.env.get('GHOST_ADMIN_KEY') ?? ''
const GHOST_URL = 'https://prmptvault-ai-news.ghost.io'
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const TELEGRAM_CHAT_ID = '821271234'

import { corsHeaders, optionsResponse } from '../_shared/cors.ts'

// ── Base64url ───────────────────────────────────────────────────────────────
function b64url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}
function b64urlStr(s: string): string {
  return b64url(new TextEncoder().encode(s))
}

// ── Ghost Admin JWT ─────────────────────────────────────────────────────────
async function ghostJwt(): Promise<string> {
  const [id, secret] = GHOST_KEY.split(':')
  const secretBytes = new Uint8Array((secret.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)))
  const now = Math.floor(Date.now() / 1000)
  const header = b64urlStr(JSON.stringify({ alg: 'HS256', kid: id, typ: 'JWT' }))
  const payload = b64urlStr(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }))
  const data = `${header}.${payload}`
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${b64url(new Uint8Array(sig))}`
}

// ── Ghost helpers ───────────────────────────────────────────────────────────
async function ghostFetch(path: string, opts: RequestInit = {}) {
  const jwt = await ghostJwt()
  return fetch(`${GHOST_URL}/ghost/api/admin${path}`, {
    ...opts,
    headers: { 'Authorization': `Ghost ${jwt}`, 'Content-Type': 'application/json', ...opts.headers },
  })
}

// ── Actions ─────────────────────────────────────────────────────────────────
// 1. draft   — generate blog + email preview, create Ghost draft, send Telegram alert
// 2. approve — publish Ghost draft + send emails to all users

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req)

  try {
    const body = await req.json()
    const { user_token, action } = body

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Verify admin
    const { data: { user } } = await db.auth.getUser(user_token)
    if (!user) throw new Error('Unauthorized')
    const { data: profile } = await db.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Not admin')

    // ── DRAFT ─────────────────────────────────────────────────────────────
    if (action === 'draft') {
      const { models } = body as { models: Array<{ name: string; image_url: string }> }
      if (!models?.length) throw new Error('models array required')

      const modelNames = models.map(m => m.name)
      const isBatch = models.length > 1

      // Build image section for the prompt
      const imageInstructions = models
        .filter(m => m.image_url)
        .map(m => `<p><img src="${m.image_url}" alt="${m.name}" /></p>`)
        .join('\n')

      const modelList = models.map(m => m.name).join(', ')
      const plural = isBatch ? 'models' : 'model'

      // Generate blog content with OpenAI
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{
            role: 'system',
            content: `You write sharp, punchy blog posts for prmptVAULT — an AI image and video generation platform.
Style: confident, direct, no fluff. Short paragraphs. No buzzwords. No em-dashes.
The blog theme renders post titles in UPPERCASE automatically.
IMPORTANT: The title field must be PLAIN TEXT only — no HTML tags whatsoever. Ghost does not render HTML in titles.
Headings in the body use <h2> tags. Use <em> tags in the body to accent key words in blue.
Return a JSON object with:
- title: post title (2-6 words, plain text only, NO HTML tags)
- excerpt: one sentence hero subtitle (plain text, max 120 chars). This appears below the title in the hero area — do NOT repeat it in the body.
- html: full post body HTML using ONLY these tags: <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>, <img>. Do NOT use <div>, <figure>, <figcaption>, <span>, or any tags with class attributes. For images, use plain <img src="..." alt="..." /> inside a <p> tag. For the CTA at the end, use a simple <h3> and <p> with an <a> link — no wrapper divs or classes.

BODY STRUCTURE: Start the body immediately with the first model section heading as an <h2> (e.g. "FLUX.2 <em>MAX</em>: Unparalleled Precision"). Do NOT start with an intro paragraph restating the excerpt. Jump straight into the first model. Each model gets its own <h2> section heading. Place the model's image IMMEDIATELY after the <h2> heading, before any body text paragraphs. Then follow with 2-3 short paragraphs.`
          }, {
            role: 'user',
            content: `Write a blog post announcing that ${isBatch ? 'these new models are' : `${modelNames[0]} is`} now live on prmptVAULT: ${modelList}.

For each model, write a section with an <h2> heading (model name + a punchy tagline) covering what it does, what makes it good, and how to use it on prmptVAULT (structured prompts, saves to library).

${imageInstructions ? `Include these example images in the relevant model sections:\n${imageInstructions}` : ''}

End with a CTA section like:
<h3>Try ${isBatch ? 'them' : modelNames[0]} now</h3>
<p>New models every week. Start free, no credit card required. <a href="https://prmptvault.ai">Open your vault</a></p>`
          }],
          response_format: { type: 'json_object' },
        })
      })

      const aiData = await aiRes.json()
      const { title, excerpt, html } = JSON.parse(aiData.choices[0].message.content)

      // Use the first provided image as the feature image for the blog card
      const featureImage = models.find(m => m.image_url)?.image_url || undefined

      // Create Ghost draft — use source=html so Ghost accepts raw HTML content
      const ghostRes = await ghostFetch('/posts/?source=html', {
        method: 'POST',
        body: JSON.stringify({
          posts: [{
            title,
            custom_excerpt: excerpt,
            html,
            feature_image: featureImage,
            tags: [{ name: isBatch ? 'New model drop' : modelNames[0] }, { name: 'New model drop' }],
            status: 'draft',
          }]
        })
      })

      const ghostData = await ghostRes.json()
      if (!ghostRes.ok) throw new Error(`Ghost error: ${JSON.stringify(ghostData)}`)

      const post = ghostData.posts[0]
      const postId = post.id
      const previewUrl = `${GHOST_URL}/p/${post.uuid}/`
      const adminUrl = `${GHOST_URL}/ghost/#/editor/post/${postId}`

      // Store draft info in Supabase for the approve step
      await db.from('blog_drafts').upsert({
        id: postId,
        title,
        excerpt,
        preview_url: previewUrl,
        model_names: modelNames,
        created_at: new Date().toISOString(),
      })

      // Send Telegram alert
      const approveUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/publish-blog?action=approve&post_id=${postId}&token=${user_token}`
      const tgMessage = `📝 *Blog Draft Ready*\n\n*${title.replace(/[<>]/g, '')}*\n${excerpt}\n\nModels: ${modelList}\n\n[Preview Blog](${previewUrl})\n[Edit in Ghost](${adminUrl})\n\n[✅ Approve & Publish](${approveUrl})`

      await fetch('http://localhost:8000/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: tgMessage }),
      }).catch(() => {
        // Fallback: try Telegram direct if Jamie is down
      })

      return new Response(JSON.stringify({
        ok: true,
        draft: { id: postId, title, excerpt, preview_url: previewUrl, admin_url: adminUrl },
      }), { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } })
    }

    // ── APPROVE ───────────────────────────────────────────────────────────
    if (action === 'approve') {
      const { post_id } = body
      if (!post_id) throw new Error('post_id required')

      // Publish the Ghost draft
      const ghostRes = await ghostFetch(`/posts/${post_id}/`, {
        method: 'PUT',
        body: JSON.stringify({ posts: [{ status: 'published', updated_at: new Date().toISOString() }] })
      })

      const ghostData = await ghostRes.json()
      if (!ghostRes.ok) throw new Error(`Ghost publish error: ${JSON.stringify(ghostData)}`)

      const post = ghostData.posts[0]

      // Get all user emails for the blast
      const { data: authUsers, error: authErr } = await db.auth.admin.listUsers({ perPage: 1000 })
      if (authErr) throw authErr

      const emails = authUsers.users
        .map((u: { email?: string }) => u.email)
        .filter(Boolean) as string[]

      // Send emails via Resend in batches
      const FROM_EMAIL = 'prmptVAULT <noreply@prmptvault.ai>'
      const tag = post.primary_tag?.name || 'New model drop'
      const featureImageUrl = post.feature_image || undefined
      let sent = 0
      const errors: string[] = []

      // Resend rate limit: 5 req/s — send 2 per second to stay safe
      for (const email of emails) {
        const unsubscribeUrl = `https://prmptvault.ai/unsubscribe?email=${encodeURIComponent(email)}`
        const emailHtml = buildEmailHtml({
          postTitle: post.title,
          postExcerpt: post.custom_excerpt || post.excerpt || '',
          postUrl: post.url,
          featureImageUrl,
          tag,
          unsubscribeUrl,
        })
        try {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: FROM_EMAIL, to: email, subject: post.title, html: emailHtml }),
          })
          const resBody = await res.json()
          if (!res.ok) {
            errors.push(`${email}: ${res.status} ${JSON.stringify(resBody)}`)
          } else {
            sent++
          }
        } catch (e) {
          errors.push(`${email}: ${e instanceof Error ? e.message : String(e)}`)
        }
        await new Promise(r => setTimeout(r, 500))
      }

      // Notify via Telegram
      const errorSummary = errors.length ? `\n\n⚠️ ${errors.length} failed:\n${errors.slice(0, 5).join('\n')}` : ''
      await fetch('http://localhost:8000/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `✅ Blog published & ${sent}/${emails.length} emails sent!\n\n${post.title}\n${post.url}${errorSummary}` }),
      }).catch(() => {})

      // Clean up draft record
      await db.from('blog_drafts').delete().eq('id', post_id)

      return new Response(JSON.stringify({
        ok: true,
        published: { title: post.title, url: post.url, emails_sent: sent, emails_failed: errors.length, errors: errors.slice(0, 10) },
      }), { headers: { ...corsHeaders(req), 'Content-Type': 'application/json' } })
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (err) {
    console.error('publish-blog error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
    })
  }
})

// ── Email HTML template ─────────────────────────────────────────────────────
function buildEmailHtml(params: {
  postTitle: string; postExcerpt: string; postUrl: string;
  featureImageUrl?: string; tag?: string; unsubscribeUrl: string;
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
