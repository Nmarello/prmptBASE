import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const GHOST_KEY = '69b4e199fca1590001329776:fab8b688919123ab2aa43e92d1f09d62b1e58f6ad9111cc7360f4436aca3f54f'
const GHOST_URL = 'https://prmptvault-ai-news.ghost.io'
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Base64url ───────────────────────────────────────────────────────────────
function b64url(bytes: Uint8Array): string {
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function b64urlStr(s: string): string {
  return b64url(new TextEncoder().encode(s))
}

// ── Ghost Admin JWT ─────────────────────────────────────────────────────────
async function ghostJwt(): Promise<string> {
  const [id, secret] = GHOST_KEY.split(':')
  const secretBytes = new Uint8Array((secret.match(/.{2}/g) ?? []).map(b => parseInt(b, 16)))
  const now = Math.floor(Date.now() / 1000)
  const header = b64urlStr(JSON.stringify({ alg: 'HS256', kid: id, typ: 'JWT' }))
  const payload = b64urlStr(JSON.stringify({ iat: now, exp: now + 300, aud: '/admin/' }))
  const data = `${header}.${payload}`
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return `${data}.${b64url(new Uint8Array(sig))}`
}

// ── Generate blog post with OpenAI ──────────────────────────────────────────
async function generateBlogPost(
  db: ReturnType<typeof createClient>,
  modelSlug: string,
  modelName: string,
): Promise<{ ok: boolean; url?: string; title?: string; status?: string; error?: string }> {
  const { data: model } = await db.from('models').select('id').eq('slug', modelSlug).single()
  if (!model) return { ok: false, error: 'Model not found' }

  const { data: assets } = await db
    .from('assets')
    .select('url, gen_type')
    .eq('model_id', model.id)
    .in('gen_type', ['txt2img', 'img2img'])
    .order('created_at', { ascending: false })
    .limit(3)

  const imageUrls = (assets ?? []).map((a: { url: string }) => a.url)
  const imagesNote = imageUrls.length
    ? `\n\nEmbed these asset images from the prmptVAULT library naturally in the post body using <img> tags:\n${imageUrls.map(u => `<img src="${u}" />`).join('\n')}`
    : ''

  const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
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

  const aiData = await aiRes.json()
  const { title, excerpt, html } = JSON.parse(aiData.choices[0].message.content)

  const jwt = await ghostJwt()
  const ghostRes = await fetch(`${GHOST_URL}/ghost/api/admin/posts/`, {
    method: 'POST',
    headers: { 'Authorization': `Ghost ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      posts: [{
        title,
        custom_excerpt: excerpt,
        html,
        tags: [{ name: 'New model drop' }],
        status: 'draft',
      }]
    })
  })

  const ghostText = await ghostRes.text()
  let ghostData
  try { ghostData = JSON.parse(ghostText) } catch { ghostData = { raw: ghostText } }

  if (!ghostRes.ok) {
    return { ok: false, error: `Ghost ${ghostRes.status}: ${JSON.stringify(ghostData)}` }
  }

  const post = ghostData.posts?.[0]
  return { ok: true, url: post?.url, title: post?.title, status: post?.status }
}

// ── Main ────────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { user_token, action, model_slug } = await req.json()
    if (!model_slug || !action) throw new Error('model_slug and action are required')

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Verify caller is admin
    const { data: { user } } = await db.auth.getUser(user_token)
    if (!user) throw new Error('Unauthorized')
    const { data: profile } = await db.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) throw new Error('Not admin')

    if (action === 'mark_tested') {
      const { error: updateErr } = await db.from('model_status')
        .update({ tested: true, updated_at: new Date().toISOString() })
        .eq('model_slug', model_slug)
      if (updateErr) throw new Error(`model_status update failed: ${updateErr.message}`)

    } else if (action === 'set_live') {
      await db.from('models')
        .update({ is_active: true, coming_soon: false, released_at: new Date().toISOString() })
        .eq('slug', model_slug)

      const { data: model } = await db.from('models').select('name').eq('slug', model_slug).single()
      const blog = await generateBlogPost(db, model_slug, model?.name ?? model_slug)

      return new Response(
        JSON.stringify({ success: true, blog }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )

    } else if (action === 'set_coming_soon') {
      await db.from('models')
        .update({ coming_soon: true, is_active: false })
        .eq('slug', model_slug)

    } else {
      throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
