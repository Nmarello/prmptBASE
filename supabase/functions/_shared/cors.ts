/**
 * Dynamic CORS helper — echoes the request origin if it's in the allowlist,
 * otherwise falls back to the primary production domain.
 * Replaces the static `'Access-Control-Allow-Origin': '*'` pattern.
 */

const ALLOWED_ORIGINS = new Set([
  'https://prmptvault.ai',
  'https://www.prmptvault.ai',
  'https://prmptbase.ai',
  'https://www.prmptbase.ai',
  'https://prmptbase.pages.dev',
  'https://staging.prmptbase.pages.dev',
  // Local dev
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5200',
  'http://localhost:3000',
])

const FALLBACK_ORIGIN = 'https://prmptvault.ai'

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : FALLBACK_ORIGIN
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

export function optionsResponse(req: Request): Response {
  return new Response('ok', { headers: corsHeaders(req) })
}

/** Sanitize error messages before returning to client — never leak internals. */
export function safeErrorMessage(err: unknown): string {
  if (!(err instanceof Error)) return 'An unexpected error occurred'
  const msg = err.message
  // Allow safe, user-facing messages through; block anything that looks like a stack trace or internal path
  if (msg.length > 200) return 'An unexpected error occurred'
  if (/at \w+ \(/.test(msg)) return 'An unexpected error occurred'
  if (/\/supabase\/functions\//.test(msg)) return 'An unexpected error occurred'
  return msg
}
