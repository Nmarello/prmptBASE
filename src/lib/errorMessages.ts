export function friendlyFalError(raw: unknown): string {
  // Coerce non-strings to something useful
  const rawStr: string = typeof raw === 'string'
    ? raw
    : (raw ? JSON.stringify(raw) : '')
  // Strip fal.ai prefix so inner content can be checked/parsed
  const stripped = rawStr.replace(/^fal\.ai (?:job failed|queue error|error):\s*/, '')
  let msg = ''
  try {
    const parsed = JSON.parse(stripped)
    const detail = parsed?.detail?.[0] ?? parsed?.detail ?? parsed
    const type = detail?.type ?? parsed?.type ?? ''
    msg = detail?.msg ?? parsed?.msg ?? detail?.message ?? parsed?.message ?? ''
    if (type === 'downstream_service_error' || msg.toLowerCase().includes('overloaded') || msg.toLowerCase().includes('try again')) {
      return "The model's servers are under heavy load right now — not ours. Hit Generate again and we'll retry automatically."
    }
    if (type === 'rate_limit' || msg.toLowerCase().includes('rate limit')) {
      return 'Rate limit reached. Please wait a moment before generating again.'
    }
  } catch {
    // not JSON — fall through
  }
  const s = msg || stripped || rawStr

  // ── Actionable hints — translate provider errors into fix suggestions ──

  const lower = s.toLowerCase()

  // Resolution / duration combo issues
  if (lower.includes('resolution') && lower.includes('duration')) {
    return 'This resolution and duration combination isn\'t supported by this model. Try lowering the resolution (e.g. 720p) or shortening the duration.'
  }
  if (lower.includes('720p') || (lower.includes('resolution') && lower.includes('supported'))) {
    return 'The resolution you selected isn\'t supported with your other settings. Try switching to 720p, or change the duration.'
  }
  if (lower.includes('1080p') && (lower.includes('not supported') || lower.includes('invalid') || lower.includes('only'))) {
    return '1080p isn\'t available with your current settings. Try 720p instead, or shorten the duration.'
  }

  // Duration issues
  if (lower.includes('duration') && (lower.includes('invalid') || lower.includes('not supported') || lower.includes('must be') || lower.includes('allowed'))) {
    return 'That duration isn\'t supported by this model. Try a shorter duration — most video models work best at 5 seconds.'
  }

  // Aspect ratio issues
  if (lower.includes('aspect_ratio') || lower.includes('aspect ratio')) {
    if (lower.includes('invalid') || lower.includes('not supported') || lower.includes('allowed')) {
      return 'That aspect ratio isn\'t supported by this model. Try 16:9 (landscape) or 9:16 (portrait) — those are the most widely supported.'
    }
  }

  // Prompt too long (from provider, not our own validation)
  if (lower.includes('prompt') && (lower.includes('too long') || lower.includes('too many') || lower.includes('exceed') || lower.includes('character') || lower.includes('length'))) {
    return 'Your prompt is too long for this model. Try shortening it — focus on the most important details.'
  }

  // NSFW / content policy
  if (lower.includes('nsfw') || lower.includes('safety') || lower.includes('content policy') || lower.includes('moderation') || lower.includes('inappropriate') || lower.includes('blocked')) {
    return 'This prompt was flagged by the model\'s content filter. Try rephrasing — remove any potentially sensitive language.'
  }

  // Image size / format issues
  if ((lower.includes('image') && (lower.includes('too large') || lower.includes('too big') || lower.includes('size')))) {
    return 'The source image is too large. Try a smaller image (under 10MB) or resize it before uploading.'
  }

  // Invalid parameter (generic)
  if (lower.includes('invalid') && (lower.includes('parameter') || lower.includes('value') || lower.includes('field'))) {
    return `One of your settings isn't compatible with this model. ${s.length < 300 ? s : 'Try resetting to defaults and adjusting one setting at a time.'}`
  }

  // Validation error with specific field name
  if (lower.includes('validation') || lower.includes('schema')) {
    return `A setting you chose isn't compatible with this model. Try resetting to the default options and adjusting one at a time.`
  }

  // Server overload / resource errors
  if (lower.includes('overload') || lower.includes('try again later')) {
    return "The model's servers are under heavy load right now — not ours. Hit Generate again and we'll retry automatically."
  }
  if (lower.includes('compute resources') || lower.includes('not enough compute') || lower.includes('runner_scheduling_failure') || lower.includes('failed after retries')) {
    return "The model ran out of resources on their end, not ours. Hit Generate again and we'll retry automatically."
  }

  // Timeout
  if (lower.includes('timeout') || lower.includes('timed out') || lower.includes('deadline')) {
    return 'The model took too long to respond. This usually means heavy load — try again in a minute.'
  }

  if (s) return s
  return 'Generation failed. Please try again.'
}
