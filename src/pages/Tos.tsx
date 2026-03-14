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

export default function Tos() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--pv-bg, #131210)', color: 'var(--pv-text, #f0ede8)', fontFamily: "'DM Sans', -apple-system, sans-serif", padding: '72px 24px 96px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <a href="/" style={{ display: 'inline-block', fontSize: 13, color: 'var(--pv-text3, rgba(240,237,232,0.35))', textDecoration: 'none', marginBottom: 48 }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--pv-text2, rgba(240,237,232,0.6))')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--pv-text3, rgba(240,237,232,0.35))')}
        >← Back to home</a>

        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--pv-accent, #3d7fff)', marginBottom: 10 }}>Legal</div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '-1.5px', margin: '0 0 8px' }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: 'var(--pv-text3, rgba(240,237,232,0.35))', margin: 0 }}>Effective Date: March 12, 2026</p>
        </div>

        <P>Please read these terms carefully before using our platform.</P>

        <Section title="1. Agreement to Terms">
          <P>By accessing or using PrmptVault (available at prmptbase.ai), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the platform. These Terms apply to all users, including free and paid accounts.</P>
          <P>PrmptVault is operated by PrmptVault, Inc. ("we," "us," or "our"). We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the updated Terms. We will notify you of material changes by email or in-app notification.</P>
        </Section>

        <Section title="2. Description of Service">
          <P>PrmptVault is a SaaS platform that provides:</P>
          <UL items={[
            'Structured AI prompt templates for image and video generation',
            'Access to third-party AI models including DALL-E 3, Google Imagen 4, fal.ai Flux, and Google Veo 2',
            'A personal asset library for storing and organizing AI-generated media',
            'Project folders, prompt history, and generation management tools',
          ]} />
          <P>We act as an intermediary between you and third-party AI model providers. We do not train AI models. Generation quality, content policies, and output characteristics are governed in part by those providers.</P>
        </Section>

        <Section title="3. Account Registration">
          <H3>3.1 Eligibility</H3>
          <P>You must be at least 13 years old to use this service. If you are under 18, you represent that a parent or guardian has reviewed and agreed to these Terms on your behalf.</P>
          <H3>3.2 Account Responsibility</H3>
          <P>You are responsible for all activity under your account. You may not share your account credentials or allow others to access your account. Notify us immediately at support@prmptbase.ai if you suspect unauthorized access.</P>
        </Section>

        <Section title="4. Acceptable Use">
          <H3>4.1 Permitted Use</H3>
          <P>You may use the platform for lawful creative, commercial, and personal purposes, including generating images and videos for use in your projects, content, and products.</P>
          <H3>4.2 Prohibited Use</H3>
          <P>You agree not to use the platform to:</P>
          <UL items={[
            'Generate content that depicts child sexual abuse material (CSAM) or sexualizes minors in any way',
            'Generate content intended to harass, defame, or harm specific real individuals',
            'Create non-consensual synthetic intimate imagery ("deepfakes") of real people',
            'Generate content promoting violence, terrorism, or illegal activity',
            'Attempt to reverse-engineer, scrape, or extract model weights or infrastructure',
            'Use automated tools to exceed your plan\'s generation limits or circumvent rate limiting',
            'Resell or sublicense access to the platform without our written consent',
            'Use the platform in a manner that violates the terms of any underlying AI model provider',
          ]} />
          <P>We reserve the right to suspend or terminate accounts that violate these prohibitions without notice.</P>
        </Section>

        <Section title="5. Intellectual Property">
          <H3>5.1 Your Content</H3>
          <P>You retain ownership of prompts you create and content you upload to the platform. By uploading content, you grant us a limited, non-exclusive license to store and process that content solely to provide the service to you.</P>
          <H3>5.2 Generated Output</H3>
          <P>AI-generated images and videos produced through the platform are subject to the terms of the underlying model providers (OpenAI, Google, fal.ai). We make no representation that generated outputs are copyright-free or that you hold exclusive rights to them. You are responsible for reviewing applicable model provider terms regarding ownership of generated content.</P>
          <H3>5.3 Our IP</H3>
          <P>The PrmptVault platform, including its interface, prompt templates, branding, and software, is owned by us and protected by intellectual property law. You may not copy, modify, or distribute our platform without our express written consent.</P>
        </Section>

        <Section title="6. Subscription Plans and Billing">
          <H3>6.1 Plans</H3>
          <P>We offer the following plans:</P>
          <UL items={[
            'Free: Core models, 25 generations per month',
            'Creator ($12/month): All image models, 500 generations per month',
            'Studio ($29/month): All image and video models, 2,000 generations per month',
            'Pro ($59/month): Unlimited generations, all models, API access',
          ]} />
          <P>Generation limits reset monthly. Unused generations do not roll over.</P>
          <H3>6.2 Billing</H3>
          <P>Paid plans are billed monthly or annually. All payments are processed by our third-party payment processor. We do not store your payment card information. Plans auto-renew unless cancelled before the renewal date.</P>
          <H3>6.3 Free Trials</H3>
          <P>Paid plans include a 3-day free trial. You will not be charged until the trial period ends. Cancel any time before the trial ends to avoid charges.</P>
          <H3>6.4 Refunds</H3>
          <P>We do not offer refunds for partial billing periods. If you experience a platform outage or service failure attributable to us, contact support and we will assess credits on a case-by-case basis.</P>
          <H3>6.5 Plan Changes</H3>
          <P>You may upgrade or downgrade your plan at any time. Upgrades take effect immediately. Downgrades take effect at the next billing cycle.</P>
        </Section>

        <Section title="7. Third-Party AI Model Providers">
          <P>Generation requests are routed to third-party providers including OpenAI (DALL-E 3), Google, and fal.ai (Flux). Your use of these models through our platform is also subject to those providers' terms of service and content policies:</P>
          <UL items={[
            'OpenAI Usage Policies: openai.com/policies/usage-policies',
            'Google Terms of Service: policies.google.com/terms',
            'fal.ai Terms: fal.ai/terms',
          ]} />
          <P>We are not responsible for outputs generated by third-party models, for changes to model availability, or for downtime caused by model providers.</P>
        </Section>

        <Section title="8. Disclaimers and Limitation of Liability">
          <H3>8.1 No Warranty</H3>
          <P>PrmptVault is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the platform will be uninterrupted, error-free, or that generated outputs will meet your requirements.</P>
          <H3>8.2 Limitation of Liability</H3>
          <P>To the maximum extent permitted by applicable law, PrmptVault shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the platform. Our total liability to you for any claim shall not exceed the amount you paid us in the three months preceding the claim.</P>
          <H3>8.3 AI-Generated Content</H3>
          <P>AI-generated content may be inaccurate, offensive, or inappropriate. You are solely responsible for reviewing and approving any generated content before use. We are not liable for harm resulting from your use or distribution of AI-generated outputs.</P>
        </Section>

        <Section title="9. Termination">
          <P>You may cancel your account at any time through your account settings. We may suspend or terminate your account if you violate these Terms. Upon termination, your access to the platform and your stored assets will be discontinued. We are not obligated to retain your data after account termination.</P>
        </Section>

        <Section title="10. Governing Law">
          <P>These Terms are governed by the laws of the State of California, United States, without regard to its conflict of law provisions. Any disputes shall be resolved in the state or federal courts located in Orange County, California.</P>
        </Section>

        <Section title="11. Contact">
          <P>For questions about these Terms, contact us at <a href="mailto:legal@prmptbase.ai" style={{ color: 'var(--pv-accent, #3d7fff)' }}>legal@prmptbase.ai</a>.</P>
        </Section>

      </div>
    </div>
  )
}
