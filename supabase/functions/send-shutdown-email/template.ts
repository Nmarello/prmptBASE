export interface ShutdownEmailParams {
  firstName: string
  shutdownDate: string       // e.g. "Friday, November 6, 2026"
  shutdownDateShort: string  // e.g. "November 6"
}

export function shutdownSubject(shutdownDateShort: string): string {
  return `prmptVAULT is shutting down on ${shutdownDateShort}`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function buildShutdownHtml({ firstName, shutdownDate, shutdownDateShort }: ShutdownEmailParams): string {
  const name = escapeHtml(firstName)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>We're closing the vault.</title>
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
    .em-text strong { color: #0a0a0a; }

    .em-callout { background-color: #f7f7f7; border-left: 3px solid #2952E3; border-radius: 0 6px 6px 0; padding: 14px 16px; margin: 0 0 24px; }
    .em-callout p { font-size: 12px; color: #555555; line-height: 1.6; margin: 0 0 10px; }
    .em-callout p.last { margin: 0; }
    .em-callout strong { color: #0a0a0a; font-weight: 700; }

    .em-cta-wrap { text-align: center; margin: 0 0 8px; }
    .em-cta-btn { display: inline-block; background-color: #2952E3; color: #ffffff !important; font-size: 12px; font-weight: 800; padding: 13px 32px; border-radius: 4px; text-decoration: none !important; letter-spacing: 0.06em; text-transform: uppercase; }
    .em-cta-sub { text-align: center; font-size: 10px; color: #bbbbbb; margin: 8px 0 24px; }

    .em-sign { font-size: 13px; color: #aaaaaa; margin: 20px 0 0; padding-top: 16px; border-top: 1px solid #f0f0f0; }

    .em-footer { background-color: #0a0a0a; padding: 16px 28px; }
    .em-footer-logo { font-size: 12px; font-weight: 900; color: #ffffff !important; text-decoration: none !important; letter-spacing: -0.02em; }
    .em-footer-logo-accent { color: #2952E3 !important; }
    .em-footer-note { font-size: 10px; color: #555555; }

    @media only screen and (max-width: 600px) {
      .em-header, .em-hero, .em-content, .em-footer { padding-left: 16px !important; padding-right: 16px !important; }
      .em-title { font-size: 22px !important; }
      .em-logo { font-size: 20px !important; }
    }
  </style>
</head>
<body>
<!-- PREHEADER -->
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">Save anything you want to keep before ${shutdownDateShort}. Here's what you need to know.</div>
<div class="email-wrapper">
<div class="email-body">

  <!-- HEADER -->
  <div class="em-header">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td><a href="https://prmptvault.ai" class="em-logo" style="color:#ffffff !important; text-decoration:none !important;">prmpt<span class="em-logo-accent" style="color:#2952E3 !important;">VAULT</span></a></td>
        <td align="right"><span class="em-badge">Update</span></td>
      </tr>
    </table>
  </div>

  <!-- HERO -->
  <div class="em-hero">
    <p class="em-kicker">A note from Nick</p>
    <h1 class="em-title">We're closing<br><span class="em-title-accent">the vault.</span></h1>
  </div>

  <!-- BODY -->
  <div class="em-content">
    <p class="em-greeting">Hi ${name},</p>
    <p class="em-text">After a lot of thought, I've decided to shut down prmptVAULT. The site will go offline on <strong>${shutdownDate}</strong>.</p>
    <p class="em-text">Thank you for giving it a try. Whether you made one image or hundreds, it meant a lot that you spent time here.</p>

    <div class="em-callout">
      <p><strong>Save your work before ${shutdownDateShort}.</strong> Your images and videos are still in your Assets library. Open any of them and hit download to keep a copy.</p>
      <p><strong>You won't be charged.</strong> Billing is turned off, so there's nothing to cancel.</p>
      <p class="last"><strong>Then everything is deleted.</strong> After ${shutdownDateShort}, your account, prompts and generated files will be permanently deleted.</p>
    </div>

    <div class="em-cta-wrap">
      <a href="https://prmptvault.ai/dashboard" class="em-cta-btn" style="color:#ffffff !important; text-decoration:none !important;">Download your work &rarr;</a>
    </div>
    <p class="em-cta-sub">Log in, then open Assets from the sidebar.</p>

    <p class="em-text">Questions about any of this? Just reply to this email.</p>

    <p class="em-sign">— Nick, prmptVAULT</p>
  </div>

  <!-- FOOTER -->
  <div class="em-footer">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td><a href="https://prmptvault.ai" class="em-footer-logo" style="color:#ffffff !important; text-decoration:none !important;">prmpt<span class="em-footer-logo-accent" style="color:#2952E3 !important;">VAULT</span></a></td>
        <td align="right"><span class="em-footer-note">You're getting this because you have a prmptVAULT account.</span></td>
      </tr>
    </table>
  </div>

</div>
</div>
</body>
</html>`
}

export function buildShutdownText({ firstName, shutdownDate, shutdownDateShort }: ShutdownEmailParams): string {
  return `Hi ${firstName},

After a lot of thought, I've decided to shut down prmptVAULT. The site will go offline on ${shutdownDate}.

Thank you for giving it a try. Whether you made one image or hundreds, it meant a lot that you spent time here.

- Save your work before ${shutdownDateShort}. Your images and videos are still in your Assets library. Open any of them and hit download to keep a copy: https://prmptvault.ai/dashboard
- You won't be charged. Billing is turned off, so there's nothing to cancel.
- Then everything is deleted. After ${shutdownDateShort}, your account, prompts and generated files will be permanently deleted.

Questions about any of this? Just reply to this email.

— Nick, prmptVAULT

You're getting this because you have a prmptVAULT account.`
}
