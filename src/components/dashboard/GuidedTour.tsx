import { useEffect, useState } from 'react'

const TOUR_SEEN_KEY = 'prmptVAULT_tourSeen'

interface Step {
  target: string | null   // CSS selector for the spotlight element, null = centered card
  title: string
  body: string
  position?: 'right' | 'left' | 'bottom' | 'top' | 'center'
}

const STEPS: Step[] = [
  {
    target: null,
    title: 'Welcome to prmptVAULT',
    body: 'The AI generation tool built around structure — not blank boxes. This quick tour will show you around. Takes about 60 seconds.',
    position: 'center',
  },
  {
    target: '[data-tour="sidebar"]',
    title: 'Pick your model',
    body: 'Browse AI models organized by provider — OpenAI, Black Forest Labs, Google, and more. Each card shows what it\'s good at and which generation types it supports.',
    position: 'right',
  },
  {
    target: '[data-tour="builder-area"]',
    title: 'Structured templates',
    body: 'Select any model to open its template. Instead of a blank text box, you get purpose-built fields for every parameter that model supports. No more guessing what works.',
    position: 'left',
  },
  {
    target: '[data-tour="template-form"]',
    title: 'Fill in the fields',
    body: 'Each field shapes a specific part of your output — style, lighting, lens, mood, and more. The AI assist button (✨) can help fill in any field if you\'re not sure what to write.',
    position: 'left',
  },
  {
    target: '[data-tour="live-prompt"]',
    title: 'See the prompt being built',
    body: 'This panel shows the exact prompt that will be sent to the model, updating as you adjust fields. You can edit it directly — your changes take priority over the auto-build.',
    position: 'left',
  },
  {
    target: '[data-tour="assets-nav"]',
    title: 'Your generations live in Assets',
    body: 'Every image and video you generate is saved here automatically. Filter by model, sort by date, and click any asset to open it in the full lightbox viewer.',
    position: 'bottom',
  },
  {
    target: null,
    title: "You're all set",
    body: "That's the whole tour. Change or turn off this guide anytime in Settings (the ⚙ icon). Switch to Tooltips mode for ℹ️ help icons on every template field.",
    position: 'center',
  },
]

interface SpotlightRect {
  top: number
  left: number
  width: number
  height: number
}

function getRect(selector: string): SpotlightRect | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return { top: r.top, left: r.left, width: r.width, height: r.height }
}

const PAD = 10

interface Props {
  active: boolean
  onFinish: () => void
}

export default function GuidedTour({ active, onFinish }: Props) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<SpotlightRect | null>(null)

  const current = STEPS[step]

  useEffect(() => {
    if (!active) return
    setStep(0)
  }, [active])

  useEffect(() => {
    if (!active || !current.target) { setRect(null); return }
    // Small delay so DOM is ready after view changes
    const t = setTimeout(() => setRect(getRect(current.target!)), 80)
    return () => clearTimeout(t)
  }, [active, step, current.target])

  if (!active) return null

  const isFirst = step === 0
  const isLast = step === STEPS.length - 1
  const isCentered = current.position === 'center' || !rect

  function next() {
    if (isLast) { onFinish(); return }
    setStep((s) => s + 1)
  }
  function back() { setStep((s) => Math.max(0, s - 1)) }
  function skip() { onFinish() }

  // Card position logic relative to spotlight
  function cardStyle(): React.CSSProperties {
    if (isCentered || !rect) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }
    }
    const GAP = 16
    const pos = current.position ?? 'right'
    if (pos === 'right') return { position: 'fixed', top: rect.top + rect.height / 2, left: rect.left + rect.width + GAP, transform: 'translateY(-50%)', zIndex: 9999 }
    if (pos === 'left')  return { position: 'fixed', top: rect.top + rect.height / 2, left: rect.left - GAP, transform: 'translate(-100%, -50%)', zIndex: 9999 }
    if (pos === 'bottom') return { position: 'fixed', top: rect.top + rect.height + GAP, left: rect.left + rect.width / 2, transform: 'translateX(-50%)', zIndex: 9999 }
    if (pos === 'top')    return { position: 'fixed', top: rect.top - GAP, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)', zIndex: 9999 }
    return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999 }
  }

  return (
    <>
      {/* Dark overlay */}
      <div className="fixed inset-0 z-[9990] pointer-events-none" style={{ background: 'rgba(0,0,0,0.7)' }} />

      {/* Spotlight cutout */}
      {rect && (
        <div
          className="fixed z-[9991] rounded-xl pointer-events-none transition-all duration-200"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
            border: '1.5px solid rgba(56,189,248,0.4)',
          }}
        />
      )}

      {/* Step card */}
      <div style={cardStyle()} className="w-80 bg-white border border-[#d2d2d7] rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] p-5 animate-fade-in">
        {/* Progress dots */}
        <div className="flex gap-1 mb-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all duration-200 ${
                i === step ? 'bg-sky-500 w-4' : i < step ? 'bg-sky-500/40 w-2' : 'bg-[#d2d2d7] w-2'
              }`}
            />
          ))}
        </div>

        <h3 className="text-[#1d1d1f] font-semibold text-base mb-2">{current.title}</h3>
        <p className="text-[#6e6e73] text-sm leading-relaxed mb-5">{current.body}</p>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={skip}
            className="text-xs text-[#aeaeb2] hover:text-[#6e6e73] transition-colors cursor-pointer"
          >
            {isLast ? '' : 'Skip tour'}
          </button>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                type="button"
                onClick={back}
                className="px-3 py-1.5 text-xs text-[#6e6e73] hover:text-[#1d1d1f] border border-[#d2d2d7] hover:border-[#aeaeb2] rounded-lg transition-all cursor-pointer"
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={next}
              className="px-4 py-1.5 text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white rounded-lg transition-all cursor-pointer"
            >
              {isLast ? 'Finish' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// Auto-trigger helper — call this from Dashboard
export function shouldAutoTriggerTour(mode: string): boolean {
  if (mode !== 'guided') return false
  try { return !localStorage.getItem(TOUR_SEEN_KEY) } catch { return false }
}

export function markTourSeen() {
  try { localStorage.setItem(TOUR_SEEN_KEY, '1') } catch {}
}
