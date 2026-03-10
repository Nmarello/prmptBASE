import type { Asset } from '../../types'

// ─── Showcase assets ──────────────────────────────────────────────────────────
// Replace these URLs with real platform-generated showcase images stored in
// Supabase storage under assets/showcase/. They fill empty bento slots at 90%
// opacity so users notice their own content slowly taking over.
const SHOWCASE_URLS: string[] = [
  // TODO: populate with real showcase images
  // e.g. 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/showcase/01.jpg',
]

// ─── Bento slot config ────────────────────────────────────────────────────────
// 7-slot layout on a 4-column grid:
//   [0] hero  → col-span-2 row-span-2
//   [1] med   → col-span-1 row-span-2
//   [2] med   → col-span-1 row-span-2
//   [3][4][5][6] small → col-span-1 row-span-1
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
const ONBOARDING_THRESHOLD = 0  // show onboarding only when 0 assets

interface Props {
  assets: Asset[]
  onSelectModel: () => void  // jump to model picker
}

interface SlotData {
  url: string
  isShowcase: boolean
  isVideo: boolean
}

export default function HomeGrid({ assets, onSelectModel }: Props) {
  // ── Onboarding state (0 assets) ──────────────────────────────────────────
  if (assets.length === ONBOARDING_THRESHOLD) {
    return (
      <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto text-center gap-10">
        <div>
          <p className="text-2xl font-bold text-white mb-2">Welcome to prmptBASE</p>
          <p className="text-slate-400 text-sm">Your AI generation workspace. Start with three steps.</p>
        </div>

        <div className="w-full space-y-3">
          {[
            { n: '01', label: 'Pick a model', sub: 'Choose from the sidebar — images or video', action: true },
            { n: '02', label: 'Fill the template', sub: 'Structured fields replace the blank box' },
            { n: '03', label: 'Generate & save', sub: 'Every output lands in your asset library automatically' },
          ].map(({ n, label, sub, action }) => (
            <button
              key={n}
              onClick={action ? onSelectModel : undefined}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                action
                  ? 'bg-sky-500/10 border-sky-500/30 hover:bg-sky-500/20 cursor-pointer'
                  : 'bg-white/3 border-white/8 cursor-default'
              }`}
            >
              <span className="text-2xl font-bold text-white/20 w-8 shrink-0">{n}</span>
              <div>
                <div className="text-white font-semibold text-sm">{label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{sub}</div>
              </div>
              {action && <span className="ml-auto text-sky-400 text-sm">→</span>}
            </button>
          ))}
        </div>

        <p className="text-slate-600 text-xs">No credit card required to get started</p>
      </div>
    )
  }

  // ── Build slot data ───────────────────────────────────────────────────────
  const slots: SlotData[] = []

  // Fill with user assets first
  for (let i = 0; i < Math.min(assets.length, TOTAL_SLOTS); i++) {
    const a = assets[i]
    slots.push({
      url: a.url,
      isShowcase: false,
      isVideo: a.gen_type === 'txt2vid' || a.gen_type === 'img2vid',
    })
  }

  // Backfill remaining slots with showcase assets at 90% opacity
  if (slots.length < TOTAL_SLOTS && SHOWCASE_URLS.length > 0) {
    let si = 0
    while (slots.length < TOTAL_SLOTS && si < SHOWCASE_URLS.length) {
      slots.push({ url: SHOWCASE_URLS[si % SHOWCASE_URLS.length], isShowcase: true, isVideo: false })
      si++
    }
  }

  // ── Bento grid ────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-bold text-lg">Your Assets</h2>
          <p className="text-slate-500 text-xs mt-0.5">{assets.length} generation{assets.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={onSelectModel}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 rounded-xl text-sm font-medium transition-all"
        >
          + New generation
        </button>
      </div>

      <div className="grid grid-cols-4 grid-rows-3 gap-2 flex-1 min-h-0">
        {slots.map((slot, i) => (
          <div
            key={i}
            className={`${SLOT_CLASSES[i]} relative rounded-2xl overflow-hidden bg-white/3 border border-white/8 transition-all hover:border-white/20 group`}
            style={{ opacity: slot.isShowcase ? 0.9 : 1 }}
          >
            {slot.isVideo ? (
              <video
                src={slot.url}
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={slot.url}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
            {slot.isShowcase && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            )}
          </div>
        ))}

        {/* Empty slots when no showcase images available */}
        {Array.from({ length: Math.max(0, TOTAL_SLOTS - slots.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className={`${SLOT_CLASSES[slots.length + i]} rounded-2xl border border-dashed border-white/8 bg-white/2 flex items-center justify-center`}
          >
            <span className="text-white/10 text-xs">—</span>
          </div>
        ))}
      </div>
    </div>
  )
}
