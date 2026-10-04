import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'
import { buildShutdownHtml, buildShutdownText, shutdownSubject } from './template.ts'

// One-off for the prmptVAULT shutdown: emails every user the shutdown notice through Resend,
// scheduled for SEND_AT. Triggered manually (pg_net from SQL) with a one-time token.
//   mode 'dry_run'  → recipient count only
//   mode 'test'     → sends now to test_to only
//   mode 'schedule' → schedules for every user; refuses after SEND_DEADLINE

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'prmptVAULT <noreply@prmptvault.ai>'
const REPLY_TO = 'nick@marello.productions'
const SHUTDOWN_DATE = 'Monday, October 19, 2026'
const SHUTDOWN_DATE_SHORT = 'October 19'
const SEND_AT = '2026-10-05T13:00:00Z' // Monday 9:00am ET
const SEND_DEADLINE = Date.parse('2026-10-05T12:00:00Z')
const TOKEN_SHA256 = '21070319f4aa47111cbfc53d778b0f963a81db1c8a0010d92568ac98f57593bb'

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

async function sendOne(to: string, firstName: string, opts: { scheduledAt?: string; idempotencyKey?: string; subjectPrefix?: string }) {
  const params = { firstName, shutdownDate: SHUTDOWN_DATE, shutdownDateShort: SHUTDOWN_DATE_SHORT }
  const body = JSON.stringify({
    from: FROM_EMAIL,
    to,
    reply_to: REPLY_TO,
    subject: `${opts.subjectPrefix ?? ''}${shutdownSubject(SHUTDOWN_DATE_SHORT)}`,
    html: buildShutdownHtml(params),
    text: buildShutdownText(params),
    ...(opts.scheduledAt ? { scheduled_at: opts.scheduledAt } : {}),
  })
  const headers: Record<string, string> = { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey

  // Resend's default rate limit is a few requests/sec — back off and retry on 429.
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers, body })
    const data = await res.json().catch(() => ({}))
    if (res.status !== 429) return { ok: res.ok, status: res.status, data }
    await sleep(1500 * (attempt + 1))
  }
  return { ok: false, status: 429, data: { message: 'rate limited' } }
}

Deno.serve(async (req) => {
  try {
    const { token, mode, test_to } = await req.json() as { token?: string; mode?: string; test_to?: string }
    if (!token || (await sha256Hex(token)) !== TOKEN_SHA256) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    if (mode === 'test') {
      if (!test_to) throw new Error('Missing test_to')
      const result = await sendOne(test_to, 'Nick', { subjectPrefix: '[TEST] ' })
      return new Response(JSON.stringify({ mode, ...result }), { headers: { 'Content-Type': 'application/json' } })
    }

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: { users }, error } = await db.auth.admin.listUsers({ perPage: 1000 })
    if (error) throw error
    const { data: profiles } = await db.from('profiles').select('id, display_name')
    const displayNames = new Map((profiles ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name]))

    const recipients = users
      .filter((u: { email?: string }) => !!u.email)
      .map((u: { id: string; email: string; user_metadata?: { full_name?: string } }) => {
        const fullName = (u.user_metadata?.full_name || displayNames.get(u.id) || '').trim()
        return { id: u.id, email: u.email, firstName: fullName.split(/\s+/)[0] || 'there' }
      })

    if (mode === 'dry_run') {
      return new Response(JSON.stringify({ mode, recipients: recipients.length, send_at: SEND_AT }), { headers: { 'Content-Type': 'application/json' } })
    }
    if (mode !== 'schedule') throw new Error(`Unknown mode: ${mode}`)
    if (Date.now() > SEND_DEADLINE) throw new Error('Past SEND_DEADLINE — update SEND_AT/SEND_DEADLINE and redeploy')

    const scheduled: { email: string; id: string }[] = []
    const failed: { email: string; status: number; error: unknown }[] = []
    for (const r of recipients) {
      const result = await sendOne(r.email, r.firstName, { scheduledAt: SEND_AT, idempotencyKey: `shutdown-notice/${r.id}` })
      if (result.ok) scheduled.push({ email: r.email, id: (result.data as { id: string }).id })
      else failed.push({ email: r.email, status: result.status, error: result.data })
      console.log(JSON.stringify({ email: r.email, ok: result.ok, status: result.status }))
      await sleep(600)
    }

    return new Response(JSON.stringify({ mode, send_at: SEND_AT, scheduled: scheduled.length, failed, ids: scheduled }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
