
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'noreply@prmptvault.ai'

const SHOWCASE_IMAGE_URLS = [
  'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773373758999-l9uvrjwo7b.png',
  'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773365831134.png',
  'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773353025401.png',
  'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773276565870-gc1ziwuizgu.webp',
]

function buildEmailHtml(firstName: string, imageUrls: string[], unsubscribeUrl: string): string {
  const gridHtml = imageUrls.length >= 4 ? `
    <!-- IMAGE GRID -->
    <p class="em-grid-label">Made with prmptVAULT</p>
    <div class="em-grid">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td><img src="${imageUrls[0]}" alt="" /></td>
          <td><img src="${imageUrls[1]}" alt="" /></td>
        </tr>
        <tr>
          <td style="padding-top:6px;"><img src="${imageUrls[2]}" alt="" /></td>
          <td style="padding-top:6px;"><img src="${imageUrls[3]}" alt="" /></td>
        </tr>
      </table>
    </div>` : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Your vault is ready.</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Inter', -apple-system, BlinkMacSystemFont, Arial, sans-serif; }

    .email-wrapper { background-color: #f4f4f4; padding: 32px 16px; }
    .email-body { background-color: #ffffff; max-width: 560px; margin: 0 auto; border-radius: 8px; overflow: hidden; border: 1px solid #e8e8e8; }

    .em-header { background-color: #0a0a0a; padding: 24px 28px; }
    .em-logo { font-size: 26px; font-weight: 900; color: #ffffff; text-decoration: none; letter-spacing: -0.03em; }
    .em-logo-accent { color: #2952E3; }
    .em-badge { background-color: #2952E3; color: #ffffff; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 3px; letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap; }

    .em-hero { background-color: #0a0a0a; padding: 28px 28px 24px; border-bottom: 2px solid #2952E3; }
    .em-kicker { color: #2952E3; font-size: 10px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px; }
    .em-title { color: #ffffff; font-size: 26px; font-weight: 900; line-height: 1.1; letter-spacing: -0.03em; text-transform: uppercase; margin: 0; }
    .em-title-accent { color: #2952E3; }

    .em-content { padding: 28px 28px 24px; }
    .em-greeting { font-size: 14px; color: #0a0a0a; font-weight: 700; margin: 0 0 12px; }
    .em-text { font-size: 13px; color: #555555; line-height: 1.75; margin: 0 0 20px; }

    .em-callout { background-color: #f7f7f7; border-left: 3px solid #2952E3; border-radius: 0 6px 6px 0; padding: 14px 16px; margin: 0 0 24px; }
    .em-callout p { font-size: 12px; color: #555555; line-height: 1.6; margin: 0; }
    .em-callout strong { color: #0a0a0a; font-weight: 700; }

    .em-grid-label { font-size: 9px; font-weight: 800; color: #bbbbbb; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 10px; }
    .em-grid { margin: 0 0 24px; }
    .em-grid table { width: 100%; border-collapse: separate; border-spacing: 6px; }
    .em-grid td { width: 50%; padding: 0; }
    .em-grid img { width: 100%; height: 130px; object-fit: cover; border-radius: 6px; display: block; }

    .em-cta-wrap { text-align: center; margin: 0 0 8px; }
    .em-cta-btn { display: inline-block; background-color: #2952E3; color: #ffffff !important; font-size: 12px; font-weight: 800; padding: 13px 32px; border-radius: 4px; text-decoration: none !important; letter-spacing: 0.06em; text-transform: uppercase; }
    .em-cta-sub { text-align: center; font-size: 10px; color: #bbbbbb; margin: 8px 0 0; }

    .em-sign { font-size: 13px; color: #aaaaaa; margin: 20px 0 0; padding-top: 16px; border-top: 1px solid #f0f0f0; }

    .em-footer { background-color: #0a0a0a; padding: 16px 28px; }
    .em-footer-logo { font-size: 12px; font-weight: 900; color: #ffffff !important; text-decoration: none !important; letter-spacing: -0.02em; }
    .em-footer-logo-accent { color: #2952E3 !important; }
    .em-footer-link { font-size: 10px; color: #555555; text-decoration: none; }

    @media only screen and (max-width: 600px) {
      .em-header, .em-hero, .em-content, .em-footer { padding-left: 16px !important; padding-right: 16px !important; }
      .em-title { font-size: 22px !important; }
      .em-logo { font-size: 20px !important; }
    }
  </style>
</head>
<body>
<div class="email-wrapper">
<div class="email-body">

  <!-- HEADER -->
  <div class="em-header">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td><a href="https://prmptvault.ai" class="em-logo" style="color:#ffffff !important; text-decoration:none !important;">prmpt<span class="em-logo-accent" style="color:#2952E3 !important;">VAULT</span></a></td>
        <td align="right"><span class="em-badge">Welcome</span></td>
      </tr>
    </table>
  </div>

  <!-- HERO -->
  <div class="em-hero">
    <p class="em-kicker">You're in</p>
    <h1 class="em-title">Your vault is<br><span class="em-title-accent">ready.</span></h1>
  </div>

  <!-- BODY -->
  <div class="em-content">
    <p class="em-greeting">Hi ${firstName},</p>
    <p class="em-text">Tons of AI models. Structured prompt templates. Everything you generate — saved, organized, and ready to use again. No blank text boxes.</p>

    <div class="em-callout">
      <p><strong>When you land, we'll walk you through the vault</strong> so you know exactly where everything lives. Takes two minutes. Then you're on your own — in the best way.</p>
    </div>

    ${gridHtml}

    <div class="em-cta-wrap">
      <a href="https://prmptvault.ai" class="em-cta-btn" style="color:#ffffff !important; text-decoration:none !important;">Open your vault &rarr;</a>
    </div>
    <p class="em-cta-sub">New models drop every week. You'll hear from us when they do.</p>

    <p class="em-sign">— The PrmptVault Team</p>
  </div>

  <!-- FOOTER -->
  <div class="em-footer">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td><a href="https://prmptvault.ai" class="em-footer-logo" style="color:#ffffff !important; text-decoration:none !important;">prmpt<span class="em-footer-logo-accent" style="color:#2952E3 !important;">VAULT</span></a></td>
        <td align="right">
          <a href="https://twitter.com/prmptvault" class="em-footer-link" style="margin-right:14px;">Twitter</a>
          <a href="https://blog.prmptvault.ai" class="em-footer-link" style="margin-right:14px;">Blog</a>
          <a href="${unsubscribeUrl}" class="em-footer-link">Unsubscribe</a>
        </td>
      </tr>
    </table>
  </div>

</div>
</div>
</body>
</html>`
}

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

    const unsubscribeUrl = `https://prmptvault.ai/unsubscribe?email=${encodeURIComponent(email)}`
    const html = buildEmailHtml(firstName, SHOWCASE_IMAGE_URLS, unsubscribeUrl)

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
        html,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify({ ok: res.ok, resend: data }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
