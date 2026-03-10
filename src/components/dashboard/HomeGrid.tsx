import type { Asset } from '../../types'

// ─── Showcase assets ──────────────────────────────────────────────────────────
// Platform-generated showcase content used to backfill empty bento slots.
// Shown at 90% opacity so users notice their own assets taking over.
const SHOWCASE: { url: string; isVideo: boolean }[] = [
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773097957715-vbcmkai9f0h.jpg', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773097895754-gisdzjotcn9.jpg', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773097840496-zln7cfsexdb.jpg', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773097779411-6tbdqm308qy.jpg', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773097728856-v3ap7gzlfnn.jpg', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773097669991-vcaf8o2fhni.jpg', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772773304799.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772772981088.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772772684856.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772772580175.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772772445427.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772772089090.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772772002691.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772729597864.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772729476761.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772726421198.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1772726010394.png', isVideo: false },
  { url: 'https://knlelqirhlvgvmmwiske.supabase.co/storage/v1/object/public/assets/f9965304-4af9-4eba-a762-7b7c892473e1/1773102057074-8lky3sgejaq.mp4', isVideo: true },
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
const ONBOARDING_THRESHOLD = 999  // PREVIEW: set back to 0 before launch

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
      <div className="relative h-full overflow-hidden rounded-2xl">

        {/* Background bento — showcase at very low opacity as a teaser */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-2 p-2">
          {SHOWCASE.slice(0, TOTAL_SLOTS).map((s, i) => (
            <div key={i} className={`${SLOT_CLASSES[i]} relative rounded-xl overflow-hidden`}>
              {s.isVideo ? (
                <video src={s.url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={s.url} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          ))}
        </div>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[#0a0a0f]/80 backdrop-blur-sm" />

        {/* Centered content */}
        <div className="relative h-full flex flex-col items-center justify-center px-8">
          <div className="max-w-md w-full text-center">

            {/* Headline */}
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

            {/* Steps */}
            <div className="flex items-start justify-center gap-6 mb-10">
              {[
                { icon: '⬡', label: 'Pick a model', sub: 'Images or video' },
                { icon: '▤', label: 'Fill the template', sub: 'No blank boxes' },
                { icon: '◈', label: 'Generate & save', sub: 'Auto-organized' },
              ].map(({ icon, label, sub }, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-lg">
                    {icon}
                  </div>
                  {i < 2 && (
                    <div className="absolute mt-5 ml-24 text-white/20 text-xs">→</div>
                  )}
                  <div className="text-white text-xs font-semibold">{label}</div>
                  <div className="text-slate-600 text-xs">{sub}</div>
                </div>
              ))}
            </div>

            {/* CTA */}
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
  if (slots.length < TOTAL_SLOTS && SHOWCASE.length > 0) {
    let si = 0
    while (slots.length < TOTAL_SLOTS && si < SHOWCASE.length) {
      const s = SHOWCASE[si % SHOWCASE.length]
      slots.push({ url: s.url, isShowcase: true, isVideo: s.isVideo })
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
