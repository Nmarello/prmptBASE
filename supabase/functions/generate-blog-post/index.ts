import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const GHOST_ADMIN_KEY = Deno.env.get('GHOST_ADMIN_KEY')!
const GHOST_URL = 'https://prmptvault-ai-news.ghost.io'
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Ghost Admin JWT ───────────────────────────────────────────────────────────
async function ghostJwt(): Promise<string> {
  const [id, secret] = GHOST_ADMIN_KEY.split(':')
  const secretBytes = new Uint8Array((secret.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)))
  const now = Math.floor(Date.now() / 1000)
  const b64url = (s: string) => btoa(s).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: id }))
  const payload = b64url(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }))
  const data = `${header}.${payload}`
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `${data}.${sigB64}`
}

// ── Write post body with OpenAI ───────────────────────────────────────────────
async function writePost(modelName: string, imageUrls: string[]): Promise<{ title: string; excerpt: string; html: string }> {
  const imagesNote = imageUrls.length
    ? `\n\nEmbed these asset images from the prmptVAULT library naturally in the post body using <img> tags:\n${imageUrls.map(u => `<img src="${u}" />`).join('\n')}`
    : ''

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{
        role: 'system',
        content: `You write sharp, punchy blog posts for prmptVAULT — an AI image and video generation platform.
Style: confident, direct, no fluff. Short paragraphs. No buzzwords. No em-dashes.
The blog theme renders post titles in UPPERCASE automatically. Use <em> tags to accent key words in blue.
Headings use <h2> tags, wrap accent words in <em>.
Return a JSON object with:
- title: post title (2-6 words, use <em> for one word to accent in blue)
- excerpt: one sentence hero subtitle (shown below the title, plain text, max 120 chars)
- html: full post body HTML using only <p>, <h2>, <h3>, <strong>, <em>, <ul>, <li>, <img> tags`
      }, {
        role: 'user',
        content: `Write a blog post announcing that ${modelName} is now live on prmptVAULT. Cover: what the model does, what makes it good, how to use it on prmptVAULT (structured prompts, saves to library). End with a CTA section using this HTML:\n\n<div class="pv-cta-block"><h3>Try <span>${modelName}</span> now</h3><p>New models every week. Start free, no credit card required.</p><a href="https://prmptvault.ai" class="pv-cta-btn">Open your vault →</a></div>${imagesNote}`
      }],
      response_format: { type: 'json_object' },
    })
  })

  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

// ── Main ──────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { model_slug, model_name, tag = 'New model drop', as_draft = false } = await req.json()
    if (!model_slug || !model_name) {
      return new Response(JSON.stringify({ error: 'model_slug and model_name required' }), { status: 400 })
    }

    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Look up model ID
    const { data: model } = await db.from('models').select('id').eq('slug', model_slug).single()
    if (!model) return new Response(JSON.stringify({ error: 'Model not found' }), { status: 404 })

    // Grab up to 3 recent image assets from real users for this model
    const { data: assets } = await db
      .from('assets')
      .select('url, gen_type')
      .eq('model_id', model.id)
      .in('gen_type', ['txt2img', 'img2img'])
      .order('created_at', { ascending: false })
      .limit(3)

    const imageUrls = (assets ?? []).map((a: { url: string }) => a.url)

    // Generate post content
    const { title, excerpt, html } = await writePost(model_name, imageUrls)

    // Publish to Ghost
    const jwt = await ghostJwt()
    const ghostRes = await fetch(`${GHOST_URL}/ghost/api/admin/posts/`, {
      method: 'POST',
      headers: { 'Authorization': `Ghost ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        posts: [{
          title,
          custom_excerpt: excerpt,
          html,
          tags: [{ name: tag }],
          status: as_draft ? 'draft' : 'published',
        }]
      })
    })

    const ghostData = await ghostRes.json()
    const post = ghostData.posts?.[0]

    return new Response(JSON.stringify({
      ok: true,
      url: post?.url,
      title: post?.title,
      status: post?.status,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: corsHeaders })
  }
})
