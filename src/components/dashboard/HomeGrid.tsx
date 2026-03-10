import { useEffect, useMemo, useState } from 'react'
import type { Asset } from '../../types'

function useNumCols() {
  const get = () => {
    if (typeof window === 'undefined') return 5
    if (window.innerWidth < 640) return 2
    if (window.innerWidth < 1024) return 3
    return 5
  }
  const [numCols, setNumCols] = useState(get)
  useEffect(() => {
    const handler = () => setNumCols(get())
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return numCols
}

// ─── Supabase (anon — showcase_assets is publicly readable) ──────────────────
const SUPABASE_URL = 'https://knlelqirhlvgvmmwiske.supabase.co'
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGVscWlyaGx2Z3ZtbXdpc2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzkzNDEsImV4cCI6MjA4ODIxNTM0MX0.o7xSpuOl-1-6C9MZcFDm-XIwMhJdvIiZNlL6ZSwKTsc'

function pickFormat(): [number, number] {
  return SOCIAL_FORMATS[Math.floor(Math.random() * SOCIAL_FORMATS.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Real-world screen formats (entertainment + social media) ─────────────────
// Used for both the onboarding bg AND the returning-user asset grid
const SOCIAL_FORMATS: [number, number][] = [
  [16, 9],   // YouTube, Netflix, TV, Twitch
  [9, 16],   // TikTok, IG Reels, YouTube Shorts, Snapchat
  [1, 1],    // Instagram post, Twitter/X post
  [4, 5],    // Instagram portrait post
  [4, 3],    // iPad, Facebook video
  [21, 9],   // Cinematic ultrawide
  [2, 3],    // Pinterest, portrait photography
  [3, 2],    // DSLR landscape, Twitter card
  [1.91, 1], // Facebook/IG landscape ad
]


// Flip to 0 before launch
const ONBOARDING_THRESHOLD = 0

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShowcaseRow { url: string; gen_type: string | null }

interface GridItem extends ShowcaseRow {
  aspectW: number
  aspectH: number
  isVideo: boolean
}

interface Props {
  assets: Asset[]
  onAssetClick?: (asset: Asset) => void
}

// ─── Background grid for onboarding screen ───────────────────────────────────
function ShowcaseBg({ rows, numCols }: { rows: ShowcaseRow[]; numCols: number }) {
  // Shuffle + assign formats once per mount — new arrangement every page load
  const columns = useMemo<GridItem[][]>(() => {
    if (rows.length === 0) return Array.from({ length: numCols }, () => [])
    const shuffled = shuffle(rows)
    const items: GridItem[] = shuffled.map(row => {
      const [w, h] = pickFormat()
      return {
        ...row,
        aspectW: w,
        aspectH: h,
        isVideo: row.gen_type === 'txt2vid' || row.gen_type === 'img2vid',
      }
    })
    const cols: GridItem[][] = Array.from({ length: numCols }, () => [])
    items.forEach((item, i) => cols[i % numCols].push(item))
    return cols
  }, [rows, numCols])

  if (rows.length === 0) return null

  return (
    <div className="absolute inset-0 flex gap-2 p-2 overflow-hidden">
      {columns.map((col, ci) => (
        <div key={ci} className="flex flex-col gap-2 flex-1 overflow-hidden">
          {col.map((item, ii) => {
            const pct = (item.aspectH / item.aspectW) * 100
            return (
              <div
                key={ii}
                className="relative w-full flex-shrink-0 rounded-xl overflow-hidden bg-white/5"
                style={{ paddingBottom: `${pct}%` }}
              >
                {item.isVideo ? (
                  <video
                    src={item.url}
                    autoPlay muted loop playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function HomeGrid({ assets, onAssetClick }: Props) {
  const numCols = useNumCols()
  const [showcase, setShowcase] = useState<ShowcaseRow[]>([])

  useEffect(() => {
    fetch(
      `${SUPABASE_URL}/rest/v1/showcase_assets?select=url,gen_type&order=created_at.desc&limit=40`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
    )
      .then(r => r.json())
      .then((data: ShowcaseRow[]) => setShowcase(data))
      .catch(() => {})
  }, [])

  // ── Returning user — random aspect-ratio column grid ─────────────────────
  // Always call useMemo (hooks must be called unconditionally).
  // When assets is empty the result is unused (onboarding renders instead).
  const columns = useMemo(() => {
    if (assets.length === 0) return Array.from({ length: numCols }, () => [] as never[])

    const shuffledAssets = shuffle([...assets])

    // Round up to the nearest complete row so all columns have equal item counts
    const neededTotal = Math.max(numCols, Math.ceil(shuffledAssets.length / numCols) * numCols)
    const backfillCount = neededTotal - shuffledAssets.length
    const backfillPool = shuffle([...showcase])

    type CombinedItem = { url: string; gen_type: string | null; _key: string; _asset?: Asset }
    const combined: CombinedItem[] = [
      ...shuffledAssets.map(a => ({ url: a.url, gen_type: a.gen_type, _key: a.id, _asset: a })),
      ...backfillPool.slice(0, backfillCount).map((s, i) => ({ url: s.url, gen_type: s.gen_type, _key: `sc-${i}` })),
    ]

    const items = combined.map(a => {
      const [w, h] = pickFormat()
      return { ...a, aspectW: w, aspectH: h, isVideo: a.gen_type === 'txt2vid' || a.gen_type === 'img2vid' }
    })
    const cols: typeof items[] = Array.from({ length: numCols }, () => [])
    items.forEach((item, i) => cols[i % numCols].push(item))
    return cols
  }, [assets, showcase, numCols])

  // ── Onboarding (0 assets) ─────────────────────────────────────────────────
  if (assets.length <= ONBOARDING_THRESHOLD) {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl">

        {/* Decorative background — varied aspect ratio showcase grid */}
        <ShowcaseBg rows={showcase} numCols={numCols} />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-start pt-8 sm:pt-16 px-4 sm:px-8">
          <div className="max-w-md w-full text-center">

            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-400">
              Welcome to prmptVAULT
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
              Build better AI prompts,<br />faster.
            </h2>
            <p className="text-slate-400 text-sm mb-8 sm:mb-10 leading-relaxed">
              Pick any model, fill a structured template, and generate.<br className="hidden sm:block" />
              Everything you create is saved automatically in your library.
            </p>

            <div className="flex items-start justify-center gap-4 sm:gap-6 mb-8 sm:mb-10">
              {[
                { icon: '⬡', label: 'Pick a model',      sub: 'Images or video' },
                { icon: '▤', label: 'Fill the template', sub: 'No blank boxes'  },
                { icon: '◈', label: 'Generate & save',   sub: 'Auto-organized'  },
              ].map(({ icon, label, sub }, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-lg">
                    {icon}
                  </div>
                  <div className="text-white text-xs font-semibold">{label}</div>
                  <div className="text-slate-600 text-xs">{sub}</div>
                </div>
              ))}
            </div>

            <p className="text-slate-600 text-xs">
              15 free generations per day — no credit card required
            </p>

          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-2 flex-1 min-h-0 overflow-hidden">
        {columns.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-2 flex-1 overflow-hidden">
            {col.map((item) => {
              const pct = (item.aspectH / item.aspectW) * 100
              return (
                <div
                  key={item._key}
                  onClick={() => item._asset && onAssetClick?.(item._asset)}
                  className={`relative w-full flex-shrink-0 rounded-xl overflow-hidden bg-white/3 border border-white/8 hover:border-white/20 transition-all group${item._asset ? ' cursor-pointer' : ''}`}
                  style={{ paddingBottom: `${pct}%` }}
                >
                  {item.isVideo ? (
                    <video src={item.url} autoPlay muted loop playsInline
                      className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} alt=""
                      className="absolute inset-0 w-full h-full object-cover" />
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
