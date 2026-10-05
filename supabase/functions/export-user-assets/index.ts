import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

// One-off for the prmptVAULT shutdown. Takes a manifest of storage objects (built in SQL and
// POSTed here via pg_net), turns it into a bash script that downloads every file into one
// folder per user, stores the script in the private `exports` bucket and returns a signed URL.

const TOKEN_SHA256 = '21070319f4aa47111cbfc53d778b0f963a81db1c8a0010d92568ac98f57593bb'
const BUCKET = 'exports'
const SIGNED_URL_TTL = 60 * 60 * 24 * 3 // 3 days
const DEFAULT_DEST = '/Volumes/Marello Productions/02-Products/prmptVault/User Assets'
const CONCURRENCY = 8

// Signed URLs carry a long JWT that got mangled when copied out of chat, so the generated
// script is also served from GET ?code=… — a short code that pastes cleanly into a terminal.
const DOWNLOAD_OBJECT = 'prmptvault-export-1791084066218.sh'
const DOWNLOAD_CODE_SHA256 = '833751012d3fdd50487bbc39a4685661825bdbef460eab4d94cfceb50d6d2e89'
const DOWNLOAD_EXPIRES = Date.parse('2026-10-07T03:21:00Z')

interface Entry {
  folder: string
  file: string
  path: string
  size?: number
  created_at?: string | null
  model?: string | null
  prompt?: string | null
}

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Folder and file names come from user data — keep each path segment inert.
function safeSegment(s: string): string {
  const cleaned = s.replace(/[\\/:\x00-\x1f]/g, '-').replace(/^\.+/, '_').trim()
  return cleaned || '_'
}

function safeRelPath(p: string): string {
  return p.split('/').map(safeSegment).join('/')
}

function sq(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`
}

function csvField(s: string): string {
  return `"${s.replace(/\r\n?/g, '\n').replace(/"/g, '""')}"`
}

function buildScript(entries: Entry[], baseUrl: string): string {
  const totalBytes = entries.reduce((n, e) => n + (e.size ?? 0), 0)
  const totalGb = (totalBytes / 1024 ** 3).toFixed(1)
  const heredocTag = `PV_EOF_${crypto.randomUUID().replace(/-/g, '')}`

  const byFolder = new Map<string, Entry[]>()
  for (const e of entries) {
    const folder = safeSegment(e.folder)
    if (!byFolder.has(folder)) byFolder.set(folder, [])
    byFolder.get(folder)!.push(e)
  }

  const csvBlocks: string[] = []
  for (const [folder, list] of byFolder) {
    const rows = list.filter(e => e.prompt)
    if (rows.length === 0) continue
    const lines = ['file,created_at,model,prompt']
    for (const e of rows) {
      lines.push([safeRelPath(e.file), e.created_at ?? '', e.model ?? '', e.prompt ?? ''].map(csvField).join(','))
    }
    const body = lines.join('\n')
    if (body.split('\n').includes(heredocTag)) throw new Error('heredoc tag collision')
    csvBlocks.push(`mkdir -p "$DEST"/${sq(folder)}\ncat > "$DEST"/${sq(`${folder}/prompts.csv`)} <<'${heredocTag}'\n${body}\n${heredocTag}`)
  }

  const runLines = entries.map(e => {
    const out = `${safeSegment(e.folder)}/${safeRelPath(e.file)}`
    const src = e.path.split('/').map(encodeURIComponent).join('/')
    return `run ${sq(out)} ${sq(src)}`
  })

  return `#!/bin/bash
# prmptVAULT user asset export — generated ${new Date().toISOString()}
# Downloads ${entries.length} files (~${totalGb} GB) into one folder per user, plus a
# prompts.csv per user listing the prompt and model behind each library file.
#
#   library/          files from the user's Assets library
#   uploads/          reference images the user uploaded
#   not-in-library/   files in their storage folder with no library entry (likely deleted by them)
#
# Usage:  bash prmptvault-export.sh ["/optional/destination"]
# Safe to re-run: finished files are skipped, so a second run only retries failures.

set -u
DEST="\${1:-${DEFAULT_DEST}}"
BASE=${sq(baseUrl)}
TOTAL=${entries.length}

PARENT="$(dirname "$DEST")"
if [ ! -d "$PARENT" ]; then
  echo "Can't find: $PARENT" >&2
  echo "Is the Marello Productions drive connected? Or pass a destination: bash $0 ~/Desktop/prmptvault-export" >&2
  exit 1
fi
mkdir -p "$DEST" || exit 1
FAILED="$DEST/_failed-downloads.txt"
: > "$FAILED"

echo "Writing prompts.csv files..."
${csvBlocks.join('\n\n')}

dl() {
  local out="$DEST/$1" src="$2"
  [ -s "$out" ] && return 0
  mkdir -p "$(dirname "$out")"
  if curl -fsS --retry 3 --retry-delay 2 -o "$out.part" "$BASE$src"; then
    mv "$out.part" "$out"
  else
    rm -f "$out.part"
    echo "$1" >> "$FAILED"
  fi
}

i=0
jobs_running=0
run() {
  dl "$1" "$2" &
  i=$((i + 1))
  jobs_running=$((jobs_running + 1))
  if [ "$jobs_running" -ge ${CONCURRENCY} ]; then wait; jobs_running=0; fi
  if [ $((i % 50)) -eq 0 ]; then echo "  $i / $TOTAL files"; fi
}

echo "Downloading $TOTAL files (~${totalGb} GB) to: $DEST"
${runLines.join('\n')}
wait

if [ -s "$FAILED" ]; then
  echo ""
  echo "$(wc -l < "$FAILED" | tr -d ' ') files failed. Re-run the script to retry them. List: $FAILED"
  exit 1
fi
rm -f "$FAILED"
echo ""
echo "Done. All $TOTAL files are in: $DEST"
command -v open >/dev/null && open "$DEST"
exit 0
`
}

async function serveDownload(req: Request): Promise<Response> {
  const code = new URL(req.url).searchParams.get('code') ?? ''
  if (Date.now() > DOWNLOAD_EXPIRES || !code || (await sha256Hex(code)) !== DOWNLOAD_CODE_SHA256) {
    return new Response('Not found\n', { status: 404 })
  }
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data, error } = await db.storage.from(BUCKET).download(DOWNLOAD_OBJECT)
  if (error || !data) return new Response(`Download failed: ${error?.message ?? 'no data'}\n`, { status: 500 })
  return new Response(data, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="prmptvault-export.sh"',
      'Cache-Control': 'no-store',
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'GET') return serveDownload(req)
  try {
    const { token, entries, action } = await req.json() as { token?: string; entries?: Entry[]; action?: string }
    if (!token || (await sha256Hex(token)) !== TOKEN_SHA256) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const db = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // The script holds user emails and prompts — remove it and the bucket once downloaded.
    if (action === 'cleanup') {
      const { data: objects, error: listError } = await db.storage.from(BUCKET).list('', { limit: 1000 })
      if (listError) throw listError
      const removed = (objects ?? []).map(o => o.name)
      if (removed.length > 0) {
        const { error: removeError } = await db.storage.from(BUCKET).remove(removed)
        if (removeError) throw removeError
      }
      const { error: bucketError } = await db.storage.deleteBucket(BUCKET)
      return new Response(JSON.stringify({ ok: true, removed, bucket_deleted: !bucketError, bucket_error: bucketError?.message ?? null }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!Array.isArray(entries) || entries.length === 0) throw new Error('No entries')

    const script = buildScript(entries, `${supabaseUrl}/storage/v1/object/public/assets/`)

    const { error: bucketError } = await db.storage.createBucket(BUCKET, { public: false })
    if (bucketError && !/already exists/i.test(bucketError.message)) throw bucketError

    const objectName = `prmptvault-export-${Date.now()}.sh`
    const { error: uploadError } = await db.storage.from(BUCKET).upload(
      objectName,
      new Blob([script], { type: 'text/plain' }),
      { contentType: 'text/plain; charset=utf-8', upsert: false },
    )
    if (uploadError) throw uploadError

    const { data: signed, error: signError } = await db.storage.from(BUCKET)
      .createSignedUrl(objectName, SIGNED_URL_TTL, { download: 'prmptvault-export.sh' })
    if (signError) throw signError

    const folders = new Set(entries.map(e => e.folder)).size
    return new Response(JSON.stringify({
      ok: true, files: entries.length, folders, object: objectName, script_bytes: script.length, signed_url: signed.signedUrl,
    }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
