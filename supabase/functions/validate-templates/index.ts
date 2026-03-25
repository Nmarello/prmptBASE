import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

/**
 * validate-templates — Daily template health check
 *
 * Strategy:
 * - Replicate models: fetch OpenAPI schema from Replicate API (authoritative)
 * - FAL-only models: known-params allowlist (derived from our payload builders)
 * - Google/OpenAI: manual allowlist
 *
 * Compares template fields against accepted params, reports drift.
 * Sends Telegram alert via /api/notify when issues found.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const REPLICATE_API_KEY = Deno.env.get('REPLICATE_API_KEY')!
const NOTIFY_URL = Deno.env.get('NOTIFY_URL') ?? 'https://ava.marello.productions/api/notify'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ── Prompt-building fields: always safe, compose into prompt string ──
const PROMPT_FIELDS = new Set([
  'prompt', 'subject', 'style', 'lighting', 'lens', 'depth_of_field',
  'composition', 'mood', 'color_palette', 'time_of_day', 'weather',
  'camera_medium', 'additional_details',
])

// ── Fields our edge functions translate/handle internally before sending to the API ──
// These are safe even if the provider schema doesn't list them by this name,
// because our code converts them (e.g., num_images → num_outputs).
const INTERNALLY_HANDLED = new Set([
  'num_images',      // generate-fal/replicate convert to num_outputs, n, etc.
  'output_format',   // converted per-model (e.g., Recraft uses response_format)
  'quality',         // mapped to output_quality or model-specific param
])

// ── Replicate model slugs → paths (authoritative schema source) ──
const REPLICATE_MODELS: Record<string, string> = {
  'sd35-large':       'stability-ai/stable-diffusion-3.5-large',
  'sd35-large-turbo': 'stability-ai/stable-diffusion-3.5-large-turbo',
  'sd35-medium':      'stability-ai/stable-diffusion-3.5-medium',
  'flux-schnell':     'black-forest-labs/flux-schnell',
  'flux-dev':         'black-forest-labs/flux-dev',
  'flux-pro':         'black-forest-labs/flux-pro',
  'flux-pro-ultra':   'black-forest-labs/flux-1.1-pro-ultra',
  'flux2-pro':        'black-forest-labs/flux-2-pro',
  'flux2-max':        'black-forest-labs/flux-2-max',
  'recraft-v3':       'recraft-ai/recraft-v3',
  'recraft-v4':       'recraft-ai/recraft-v4',
  'recraft-v4-pro':   'recraft-ai/recraft-v4-pro',
  'ideogram-v3':      'ideogram-ai/ideogram-v3-balanced',
  'hidream-fast':     'prunaai/hidream-l1-fast',
  'hidream-full':     'prunaai/hidream-l1-full',
  'seedream-45':      'bytedance/seedream-4.5',
  'nano-banana-pro':  'google/nano-banana-pro',
}

// ── FAL-only models: known accepted API params (from our payload builders) ──
// These don't have a schema API, so we maintain the allowlist manually.
// Update these when adding/changing FAL model integrations.
const FAL_KNOWN_PARAMS: Record<string, Set<string>> = {
  'nano-banana':      new Set(['prompt', 'negative_prompt', 'aspect_ratio', 'num_images', 'seed', 'num_inference_steps', 'guidance_scale', 'output_format']),
  'nano-banana-edit': new Set(['prompt', 'source_image', 'seed', 'num_inference_steps', 'guidance_scale']),
  'flux-dev-img2img': new Set(['prompt', 'source_image', 'strength', 'num_images', 'num_inference_steps', 'guidance_scale', 'output_format', 'seed']),
  'flux-kontext-pro': new Set(['prompt', 'source_image', 'num_images', 'guidance_scale', 'output_format', 'safety_tolerance', 'num_inference_steps', 'seed']),
  'flux-kontext-dev': new Set(['prompt', 'source_image', 'num_images', 'guidance_scale', 'output_format', 'seed']),
  'hidream-full-i2i': new Set(['prompt', 'source_image', 'strength', 'aspect_ratio', 'num_images', 'output_format', 'seed']),
  // Video models
  'kling':            new Set(['prompt', 'aspect_ratio', 'duration', 'source_image', 'cfg_scale']),
  'kling-v3':         new Set(['prompt', 'aspect_ratio', 'duration', 'source_image', 'cfg_scale']),
  'pixverse-v5':      new Set(['prompt', 'aspect_ratio', 'duration', 'negative_prompt', 'seed', 'quality']),
  'luma':             new Set(['prompt', 'aspect_ratio', 'resolution', 'duration', 'loop', 'source_image']),
  'minimax-txt2vid':  new Set(['prompt']),
  'sora2':            new Set(['prompt', 'aspect_ratio', 'resolution', 'duration', 'model']),
  'pika':             new Set(['prompt', 'aspect_ratio', 'resolution', 'duration', 'seed']),
  'ltx-video':        new Set(['prompt', 'aspect_ratio', 'negative_prompt', 'num_inference_steps', 'guidance_scale', 'seed']),
  'wan-21-txt2vid':   new Set(['prompt', 'aspect_ratio', 'resolution', 'num_inference_steps', 'seed']),
  'hunyuan-video':    new Set(['prompt', 'aspect_ratio', 'negative_prompt', 'seed', 'source_image']),
}

// ── Google/OpenAI: manual allowlists ──
const MANUAL_PARAMS: Record<string, Set<string>> = {
  'imagen-4.0-generate-001': new Set(['prompt', 'aspect_ratio', 'num_images', 'seed']),
  'dalle':                    new Set(['prompt', 'aspect_ratio', 'num_images', 'quality']),
  'gpt-image-1':             new Set(['prompt', 'aspect_ratio', 'num_images', 'quality']),
  'veo-2.0-generate-001':   new Set(['prompt', 'aspect_ratio', 'duration', 'source_image']),
}

// ── Our template field ID → possible API param name aliases ──
const FIELD_ALIASES: Record<string, string[]> = {
  'num_images':          ['num_outputs', 'num_images', 'number_of_images', 'n'],
  'steps':               ['num_inference_steps', 'steps'],
  'num_inference_steps': ['num_inference_steps', 'steps'],
  'guidance_scale':      ['guidance_scale', 'cfg_scale', 'guide_scale', 'guidance'],
  'output_format':       ['output_format', 'response_format'],
  'negative_prompt':     ['negative_prompt'],
  'source_image':        ['image_url', 'image', 'source_image', 'init_image', 'image_prompt', 'input_images'],
  'strength':            ['strength', 'image_strength', 'prompt_strength', 'image_prompt_strength'],
  'seed':                ['seed'],
  'aspect_ratio':        ['aspect_ratio', 'size', 'resolution'],
  'resolution':          ['resolution', 'size', 'aspect_ratio'],
  'duration':            ['duration', 'duration_seconds'],
  'quality':             ['quality', 'output_quality'],
  'safety_tolerance':    ['safety_tolerance'],
  'acceleration':        ['acceleration', 'go_fast', 'speed_mode'],
  'loop':                ['loop'],
  'cfg_scale':           ['cfg_scale', 'guidance_scale', 'guidance'],
  'model':               ['model', 'model_type'],
}

// ── Schema fetching ──

interface SchemaResult {
  slug: string
  provider: string
  acceptedParams: Set<string>
  error?: string
}

async function fetchReplicateSchema(slug: string, path: string): Promise<SchemaResult> {
  try {
    const res = await fetch(`https://api.replicate.com/v1/models/${path}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_KEY}` },
    })
    if (!res.ok) {
      return { slug, provider: 'replicate', acceptedParams: new Set(), error: `Replicate ${res.status}: ${res.statusText}` }
    }
    const data = await res.json()
    const props = data?.latest_version?.openapi_schema?.components?.schemas?.Input?.properties ?? {}
    return { slug, provider: 'replicate', acceptedParams: new Set(Object.keys(props)) }
  } catch (e) {
    return { slug, provider: 'replicate', acceptedParams: new Set(), error: (e as Error).message }
  }
}

// ── Matching logic ──

function fieldMatchesSchema(fieldId: string, acceptedParams: Set<string>): boolean {
  // Prompt-building fields always pass — they compose the prompt, not sent as API params
  if (PROMPT_FIELDS.has(fieldId)) return true
  // Fields our edge functions translate internally — always safe
  if (INTERNALLY_HANDLED.has(fieldId)) return true

  // Check direct match first
  if (acceptedParams.has(fieldId)) return true

  // Check aliases
  const aliases = FIELD_ALIASES[fieldId]
  if (aliases) return aliases.some(a => acceptedParams.has(a))

  // Unknown field ID not in any known set — skip (UI-only field)
  return true
}

// ── Main ──

interface DriftIssue {
  slug: string
  modelName: string
  field: string
  issue: 'deprecated'
  detail: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' },
    })
  }

  try {
    // 1. Load models + templates
    const { data: models, error: mErr } = await supabase
      .from('models').select('id, slug, name, is_active').eq('is_active', true)
    if (mErr) throw new Error(`Models: ${mErr.message}`)

    const { data: templates, error: tErr } = await supabase
      .from('templates').select('model_id, gen_type, fields')
    if (tErr) throw new Error(`Templates: ${tErr.message}`)

    const templatesByModel = new Map<string, Array<{ gen_type: string; fields: Array<{ id: string }> }>>()
    for (const t of templates!) {
      const arr = templatesByModel.get(t.model_id) ?? []
      arr.push(t)
      templatesByModel.set(t.model_id, arr)
    }

    // 2. Fetch schemas — Replicate (staggered to avoid rate limits), FAL + manual are instant
    const schemaMap = new Map<string, SchemaResult>()
    const errors: string[] = []

    // Replicate — sequential with 200ms delay to respect rate limits
    for (const model of models!) {
      const repPath = REPLICATE_MODELS[model.slug]
      if (!repPath) continue
      const result = await fetchReplicateSchema(model.slug, repPath)
      if (result.error) errors.push(`${model.slug}: ${result.error}`)
      else schemaMap.set(model.slug, result)
      await new Promise(r => setTimeout(r, 200))
    }

    // FAL known params — instant lookup
    for (const model of models!) {
      if (schemaMap.has(model.slug)) continue // already got from Replicate
      const known = FAL_KNOWN_PARAMS[model.slug]
      if (known) schemaMap.set(model.slug, { slug: model.slug, provider: 'fal-known', acceptedParams: known })
    }

    // Manual params — Google/OpenAI
    for (const model of models!) {
      if (schemaMap.has(model.slug)) continue
      const manual = MANUAL_PARAMS[model.slug]
      if (manual) schemaMap.set(model.slug, { slug: model.slug, provider: 'manual', acceptedParams: manual })
    }

    // 3. Compare
    const issues: DriftIssue[] = []

    for (const model of models!) {
      const schema = schemaMap.get(model.slug)
      if (!schema) continue

      const modelTemplates = templatesByModel.get(model.id) ?? []
      for (const tmpl of modelTemplates) {
        for (const field of (tmpl.fields ?? [])) {
          if (!fieldMatchesSchema(field.id, schema.acceptedParams)) {
            issues.push({
              slug: model.slug,
              modelName: model.name,
              field: field.id,
              issue: 'deprecated',
              detail: `"${field.id}" not in ${schema.provider} schema for ${model.slug} (accepted: ${[...schema.acceptedParams].join(', ')})`,
            })
          }
        }
      }
    }

    // 4. Report
    const report = {
      timestamp: new Date().toISOString(),
      modelsChecked: schemaMap.size,
      schemaErrors: errors.length,
      driftIssues: issues.length,
      issues,
      errors,
    }

    // 5. Store
    await supabase.from('template_health').upsert({
      id: 'latest',
      checked_at: report.timestamp,
      models_checked: report.modelsChecked,
      issues_found: report.driftIssues,
      schema_errors: report.schemaErrors,
      report,
    }, { onConflict: 'id' }).then()

    // 6. Notify on drift
    if (issues.length > 0) {
      const lines = issues.map(i => `• ${i.modelName}: "${i.field}" deprecated`).join('\n')
      const msg = `⚠️ Template Health Check\n\n${issues.length} issue${issues.length > 1 ? 's' : ''}:\n${lines}${errors.length > 0 ? `\n\n${errors.length} schema fetch error${errors.length > 1 ? 's' : ''}` : ''}`
      try {
        await fetch(NOTIFY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: msg }),
        })
      } catch { /* best-effort */ }
    }

    return new Response(JSON.stringify(report, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
})
