/**
 * Validates that a URL returned by an AI provider is safe to fetch.
 * Blocks: non-HTTPS, localhost, private IP ranges, file:// and other schemes.
 * Allows: known AI CDN hostnames (Replicate, FAL, Google, OpenAI, etc.)
 */

const ALLOWED_HOSTNAMES = new Set([
  // Replicate
  'replicate.delivery',
  'pbxt.replicate.delivery',
  'replicate.com',
  // FAL
  'fal.run',
  'fal.media',
  'cdn.fal.ai',
  'fal-cdn.com',
  'storage.googleapis.com',   // FAL uses GCS
  // Google
  'generativelanguage.googleapis.com',
  'aiplatform.googleapis.com',
  'googleapis.com',
  // OpenAI / DALL-E (Azure blob)
  'oaidalleapiprodscus.blob.core.windows.net',
  'openai.com',
])

const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,   // link-local / AWS metadata
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
]

export function isSafeProviderUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  if (parsed.protocol !== 'https:') return false

  const hostname = parsed.hostname.toLowerCase()

  // Block localhost by name
  if (hostname === 'localhost') return false

  // Block private IP ranges
  for (const range of PRIVATE_IP_RANGES) {
    if (range.test(hostname)) return false
  }

  // Allow exact hostname match or subdomain of an allowed hostname
  for (const allowed of ALLOWED_HOSTNAMES) {
    if (hostname === allowed || hostname.endsWith(`.${allowed}`)) return true
  }

  return false
}
