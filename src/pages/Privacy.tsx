import type React from 'react'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--pv-text, #f0ede8)', marginBottom: 12, marginTop: 0, letterSpacing: '-0.3px', paddingBottom: 10, borderBottom: '1px solid var(--pv-border, rgba(255,255,255,0.07))' }}>{title}</h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '0 0 12px', color: 'var(--pv-text2, rgba(240,237,232,0.65))', fontSize: 14, lineHeight: 1.8 }}>{children}</p>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--pv-text, #f0ede8)', margin: '20px 0 8px' }}>{children}</h3>
}

function UL({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: '8px 0 12px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map(i => <li key={i} style={{ color: 'var(--pv-text2, rgba(240,237,232,0.65))', fontSize: 14, lineHeight: 1.7 }}>{i}</li>)}
    </ul>
  )
}

export default function Privacy() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pv-bg, #131210)', color: 'var(--pv-text, #f0ede8)', fontFamily: "'DM Sans', -apple-system, sans-serif", padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <a href="/" style={{ display: 'inline-block', fontSize: 13, color: 'var(--pv-text3, rgba(240,237,232,0.35))', textDecoration: 'none', marginBottom: 48 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--pv-text2, rgba(240,237,232,0.6))')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--pv-text3, rgba(240,237,232,0.35))')}
        >← Back to home</a>

        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--pv-accent, #3d7fff)', marginBottom: 10 }}>Legal</div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-1.5px', margin: '0 0 8px' }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: 'var(--pv-text3, rgba(240,237,232,0.35))', margin: 0 }}>Effective Date: March 12, 2026</p>
        </div>

        <P>We take your privacy seriously. Here's exactly what we collect and why.</P>

        <Section title="1. Overview">
          <P>This Privacy Policy explains how PrmptVault ("we," "us," or "our") collects, uses, and protects information about you when you use our platform at prmptbase.ai. We are committed to data minimization: we collect only what we need to operate the service.</P>
          <P>If you have questions about this policy, contact us at <a href="mailto:legal@prmptbase.ai" style={{ color: 'var(--pv-accent, #3d7fff)' }}>legal@prmptbase.ai</a>.</P>
        </Section>

        <Section title="2. Information We Collect">
          <H3>2.1 Information You Provide</H3>
          <UL items={[
            'Account information: your name, email address, and optional profile picture',
            'Prompts and prompt templates you create on the platform',
            'Images and videos you upload as inputs for generation (img2img, img2vid workflows)',
            'Billing information (processed by our payment provider; we do not receive or store card numbers)',
            'Communications you send to our support team',
          ]} />
          <H3>2.2 Information Collected Automatically</H3>
          <UL items={[
            'Log data: IP address, browser type, pages visited, timestamps, referring URLs',
            'Usage data: generation history, model selections, prompt template usage, feature interactions',
            'Device information: operating system, browser version, screen resolution',
            'Cookies and similar technologies (see Section 6)',
          ]} />
          <H3>2.3 Information from Third Parties</H3>
          <P>When you authenticate via Google OAuth, we receive your name, email, and profile photo from Google. We do not receive your Google password or access to other Google services unless you explicitly grant additional permissions.</P>
        </Section>

        <Section title="3. How We Use Your Information">
          <P>We use the information we collect to:</P>
          <UL items={[
            'Create and manage your account',
            'Process and route your generation requests to AI model providers',
            'Store and organize your generated assets and prompt history',
            'Process payments and manage subscriptions',
            'Send transactional emails (account confirmations, billing receipts, password reset)',
            'Send product updates and marketing communications (you can opt out at any time)',
            'Detect and prevent abuse, fraud, and violations of our Terms of Service',
            'Improve platform performance, reliability, and feature development',
            'Comply with legal obligations',
          ]} />
          <P>We do not sell your personal information to third parties. We do not use your prompts or generated content to train AI models.</P>
        </Section>

        <Section title="4. How We Share Your Information">
          <H3>4.1 AI Model Providers</H3>
          <P>When you submit a generation request, your prompt text and any uploaded media are transmitted to the applicable third-party AI model provider (OpenAI, Google, fal.ai). These providers process your data according to their own privacy policies. We recommend reviewing those policies:</P>
          <UL items={[
            'OpenAI Privacy Policy: openai.com/privacy',
            'Google Privacy Policy: policies.google.com/privacy',
            'fal.ai Privacy Policy: fal.ai/privacy',
          ]} />
          <H3>4.2 Infrastructure and Service Providers</H3>
          <P>We use the following sub-processors to operate the platform:</P>
          <UL items={[
            'Supabase: database hosting and authentication infrastructure (PostgreSQL, row-level security)',
            'Cloudflare Pages: front-end hosting and CDN',
            'Payment processor: billing and subscription management',
          ]} />
          <P>These providers are contractually obligated to protect your data and may not use it for their own purposes.</P>
          <H3>4.3 Legal Requirements</H3>
          <P>We may disclose your information if required to do so by law, court order, or governmental authority, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.</P>
          <H3>4.4 Business Transfers</H3>
          <P>If we are acquired, merged with, or substantially all of our assets are transferred to another company, your information may be transferred as part of that transaction. We will notify you via email and/or a prominent notice on our platform prior to such a transfer.</P>
        </Section>

        <Section title="5. Data Retention">
          <P>We retain your account information and generated assets for as long as your account is active. If you cancel your account, we will delete your personal data within 90 days, except where we are required to retain it for legal or financial compliance purposes.</P>
          <P>Prompt history and generation logs are retained for 12 months to support your ability to revisit and reuse prior work. You may request earlier deletion by contacting <a href="mailto:legal@prmptbase.ai" style={{ color: 'var(--pv-accent, #3d7fff)' }}>legal@prmptbase.ai</a>.</P>
        </Section>

        <Section title="6. Cookies">
          <P>We use cookies and similar technologies to:</P>
          <UL items={[
            'Maintain your authenticated session',
            'Remember your preferences and settings',
            'Analyze platform usage patterns (via privacy-respecting analytics)',
          ]} />
          <P>We do not use third-party advertising cookies. You can control cookie behavior through your browser settings; disabling cookies may affect platform functionality.</P>
        </Section>

        <Section title="7. Your Rights and Choices">
          <P>Depending on your jurisdiction, you may have the following rights:</P>
          <UL items={[
            'Access: Request a copy of the personal data we hold about you',
            'Correction: Request correction of inaccurate data',
            'Deletion: Request deletion of your account and personal data',
            'Portability: Request an export of your data in a machine-readable format',
            'Opt-out: Unsubscribe from marketing emails at any time via the unsubscribe link or by contacting us',
          ]} />
          <P>To exercise any of these rights, contact us at <a href="mailto:legal@prmptbase.ai" style={{ color: 'var(--pv-accent, #3d7fff)' }}>legal@prmptbase.ai</a>. We will respond within 30 days.</P>
          <H3>7.1 California Residents (CCPA)</H3>
          <P>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, the right to deletion, and the right to opt out of the sale of personal information. We do not sell personal information. To submit a CCPA request, contact us at legal@prmptbase.ai.</P>
          <H3>7.2 EEA/UK Residents (GDPR)</H3>
          <P>If you are located in the European Economic Area or United Kingdom, our legal basis for processing your data is: (a) performance of a contract (to provide the service you signed up for), (b) legitimate interests (security, fraud prevention, platform improvement), and (c) your consent (marketing communications). You have the right to lodge a complaint with your local data protection authority.</P>
        </Section>

        <Section title="8. Security">
          <P>We implement industry-standard security measures including:</P>
          <UL items={[
            'Encrypted data transmission via HTTPS/TLS',
            'Row-level security enforced at the database level via Supabase',
            'API keys and credentials stored encrypted at rest',
            'Regular security reviews of our infrastructure',
          ]} />
          <P>No system is 100% secure. In the event of a data breach that poses a risk to your rights or freedoms, we will notify you as required by applicable law.</P>
        </Section>

        <Section title="9. Children's Privacy">
          <P>Our platform is not directed at children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will delete it promptly. If you believe a child has provided us with personal information, contact us at <a href="mailto:legal@prmptbase.ai" style={{ color: 'var(--pv-accent, #3d7fff)' }}>legal@prmptbase.ai</a>.</P>
        </Section>

        <Section title="10. Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. We will notify you of material changes by email or via a notice on the platform. The effective date at the top of this policy reflects when the most recent version took effect. Continued use of the platform after changes constitutes acceptance of the updated policy.</P>
        </Section>

        <Section title="11. Contact Us">
          <P>For questions, concerns, or data requests related to this Privacy Policy, contact us at:</P>
          <P>PrmptVault<br /><a href="mailto:legal@prmptbase.ai" style={{ color: 'var(--pv-accent, #3d7fff)' }}>legal@prmptbase.ai</a><br />prmptbase.ai</P>
        </Section>

      </div>
    </div>
  )
}
