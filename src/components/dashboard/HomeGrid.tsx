import { useEffect, useMemo, useState } from 'react'
import type { Asset } from '../../types'

// ─── Supabase (anon — showcase_assets is publicly readable) ──────────────────
const SUPABASE_URL = 'https://knlelqirhlvgvmmwiske.supabase.co'
const ANON_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtubGVscWlyaGx2Z3ZtbXdpc2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzkzNDEsImV4cCI6MjA4ODIxNTM0MX0.o7xSpuOl-1-6C9MZcFDm-XIwMhJdvIiZNlL6ZSwKTsc'

// ─── Real-world screen aspect ratios ─────────────────────────────────────────
// [w, h, label]
const FORMATS: [number, number, string][] = [
  [16, 9,  'landscape'],   // YouTube, TV, widescreen
  [4,  3,  'classic'],     // traditional monitor
  [1,  1,  'square'],      // Instagram post, Twitter
  [9,  16, 'story'],       // TikTok, IG Story/Reel, Snapchat
  [4,  5,  'portrait'],    // Instagram portrait post
  [3,  2,  'photo'],       // standard photo
]

function pickFormat(): [number, number] {
  return FORMATS[Math.floor(Math.random() * FORMATS.length)].slice(0, 2) as [number, number]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── Bento config (returning users) ──────────────────────────────────────────
const SLOT_CLASSES = [
  'col-span-2 row-span-2',
  'col-span-1 row-span-2',
  'col-span-1 row-span-2',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-1',
]
const TOTAL_SLOTS = SLOT_CLASSES.length

// Flip to 0 before launch
const ONBOARDING_THRESHOLD = 999

// ─── Types ────────────────────────────────────────────────────────────────────
interface ShowcaseRow { url: string; gen_type: string | null }

interface GridItem extends ShowcaseRow {
  aspectW: number
  aspectH: number
  isVideo: boolean
}

interface Props {
  assets: Asset[]
  onSelectModel: () => void
}

// ─── Background grid for onboarding screen ───────────────────────────────────
function ShowcaseBg() {
  const [rows, setRows] = useState<ShowcaseRow[]>([])

  useEffect(() => {
    fetch(
      `${SUPABASE_URL}/rest/v1/showcase_assets?select=url,gen_type&order=created_at.desc&limit=40`,
      { headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` } }
    )
      .then(r => r.json())
      .then((data: ShowcaseRow[]) => setRows(data))
      .catch(() => {})
  }, [])

  // Shuffle + assign formats once per mount — new arrangement every page load
  const columns = useMemo<GridItem[][]>(() => {
    if (rows.length === 0) return [[], [], [], [], []]
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
    // Distribute into 5 columns
    const cols: GridItem[][] = [[], [], [], [], []]
    items.forEach((item, i) => cols[i % 5].push(item))
    return cols
  }, [rows])

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
export default function HomeGrid({ assets, onSelectModel }: Props) {

  // ── Onboarding (0 assets) ─────────────────────────────────────────────────
  if (assets.length <= ONBOARDING_THRESHOLD) {
    return (
      <div className="relative h-full overflow-hidden rounded-2xl">

        {/* Decorative background — varied aspect ratio showcase grid */}
        <ShowcaseBg />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-start pt-16 px-8">
          <div className="max-w-md w-full text-center">

            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-sky-400">
              Welcome to prmptBASE
            </div>
            <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
              Build better AI prompts,<br />faster.
            </h2>
            <p className="text-slate-400 text-sm mb-10 leading-relaxed">
              Pick any model, fill a structured template, and generate.<br />
              Everything you create is saved automatically in your library.
            </p>

            <div className="flex items-start justify-center gap-6 mb-10">
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

            <button
              onClick={onSelectModel}
              className="w-full py-3.5 bg-sky-500 hover:bg-sky-400 active:bg-sky-600 rounded-2xl text-white font-semibold text-sm transition-all shadow-lg shadow-sky-500/20"
            >
              Start generating →
            </button>
            <p className="text-slate-600 text-xs mt-4">
              Your first 5 generations are free — no credit card required
            </p>

          </div>
        </div>
      </div>
    )
  }

  // ── Returning user bento grid ─────────────────────────────────────────────
  const userSlots = assets.slice(0, TOTAL_SLOTS)

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-bold text-lg">Your Assets</h2>
          <p className="text-slate-500 text-xs mt-0.5">
            {assets.length} generation{assets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={onSelectModel}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-medium transition-all"
        >
          + New generation
        </button>
      </div>

      <div className="grid grid-cols-4 grid-rows-3 gap-2 flex-1 min-h-0">
        {userSlots.map((a, i) => {
          const isVideo = a.gen_type === 'txt2vid' || a.gen_type === 'img2vid'
          return (
            <div
              key={a.id}
              className={`${SLOT_CLASSES[i]} relative rounded-2xl overflow-hidden bg-white/3 border border-white/8 hover:border-white/20 transition-all`}
            >
              {isVideo ? (
                <video src={a.url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={a.url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          )
        })}
        {Array.from({ length: Math.max(0, TOTAL_SLOTS - userSlots.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className={`${SLOT_CLASSES[userSlots.length + i]} rounded-2xl border border-dashed border-white/8 bg-white/2 flex items-center justify-center`}
          >
            <span className="text-white/10 text-xs">—</span>
          </div>
        ))}
      </div>
    </div>
  )
}
