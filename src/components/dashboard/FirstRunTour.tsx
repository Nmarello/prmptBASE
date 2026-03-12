import { useEffect, useState } from 'react'

export const FIRST_RUN_KEY = 'prmptVAULT_firstRunSeen'

export function hasSeenFirstRun(): boolean {
  try { return !!localStorage.getItem(FIRST_RUN_KEY) } catch { return false }
}

export function markFirstRunSeen(): void {
  try { localStorage.setItem(FIRST_RUN_KEY, '1') } catch {}
}

export function clearFirstRun(): void {
  try { localStorage.removeItem(FIRST_RUN_KEY) } catch {}
}

// ── Step definitions ──────────────────────────────────────────────────────────

interface Step {
  target: string | null
  position: 'center' | 'right' | 'left' | 'bottom' | 'top'
  title: string
  body?: string
  special?: 'subject' | 'thinking' | 'generating' | 'settings'
  hasButton?: boolean
  buttonLabel?: string
}

// Total: 12 steps (0–11)
const STEPS: Step[] = [
  // 0
  {
    target: null,
    position: 'center',
    title: 'Welcome to prmptVAULT',
    body: 'Most AI tools give you a blank box and hope for the best.\n\nprmptVAULT gives you structure — purpose-built fields that shape every part of your image. Let\'s make your first one in about 60 seconds.',
    hasButton: true,
    buttonLabel: "Let's go →",
  },
  // 1 – click DALL-E card
  {
    target: '[data-tour="dalle-card"]',
    position: 'right',
    title: 'Choose your model',
    body: "These are your AI models — each one has different strengths. Tap DALL-E 3 to get started.",
  },
  // 2 – click Generate in drawer
  {
    target: '[data-tour="model-drawer-generate"]',
    position: 'left',
    title: 'Open the prompt builder',
    body: 'Click Generate to open the structured template for DALL-E 3.',
  },
  // 3 – select Text to Image
  {
    target: '[data-tour="gentype-picker"]',
    position: 'left',
    title: 'Select Text to Image',
    body: "DALL-E 3 can create from text or transform an existing image. Select Text to Image to get started.",
  },
  // 4 – type in subject
  {
    target: '[data-tour="field-subject"]',
    position: 'left',
    title: 'Start with the Subject',
    special: 'subject',
  },
  // 5 – click AI Assist
  {
    target: '[data-tour="ai-assist-subject"]',
    position: 'left',
    title: 'Try AI Assist',
    body: 'Click the "AI assist" button next to Subject. It\'ll expand your simple idea into a detailed, effective prompt.',
  },
  // 6 – waiting for AI response
  {
    target: '[data-tour="field-subject"]',
    position: 'left',
    title: 'AI is thinking…',
    special: 'thinking',
  },
  // 7 – accept suggestion
  {
    target: '[data-tour="ai-suggestion-subject"]',
    position: 'left',
    title: 'Your enhanced prompt',
    body: "AI has expanded your idea into a richer prompt. Click Accept to use it.",
  },
  // 8 – explain optional settings
  {
    target: null,
    position: 'center',
    title: 'Optional settings',
    special: 'settings',
    hasButton: true,
    buttonLabel: 'Got it →',
  },
  // 9 – generate
  {
    target: '[data-tour="generate-btn"]',
    position: 'top',
    title: 'Ready to generate',
    body: 'Your prompt is set. Hit Generate to create your first image.',
  },
  // 10 – generating
  {
    target: null,
    position: 'center',
    title: 'Generating your image…',
    special: 'generating',
  },
  // 11 – done
  {
    target: null,
    position: 'center',
    title: 'Your first generation',
    body: "It's been saved to your Assets automatically. You can download it, use it as a reference, or keep generating.",
    hasButton: true,
    buttonLabel: 'Start exploring →',
  },
]

const PAD = 12
const CARD_W = 300
const GAP = 16

interface Rect { top: number; left: number; width: number; height: number }

function getRect(selector: string): Rect | null {
  try {
    const el = document.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: r.top, left: r.left, width: r.width, height: r.height }
  } catch { return null }
}

interface Props {
  step: number
  onNext: () => void
  onSkip: () => void
  onDone: () => void
}

export default function FirstRunTour({ step, onNext, onSkip, onDone }: Props) {
  const [rect, setRect] = useState<Rect | null>(null)
  const current = STEPS[step]
  if (!current) return null

  const isCentered = current.position === 'center' || !current.target

  // Scroll generate button into view when we reach that step
  useEffect(() => {
    if (step === 9) {
      const el = document.querySelector('[data-tour="generate-btn"]')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [step])

  // Keep spotlight rect in sync
  useEffect(() => {
    if (!current.target) { setRect(null); return }
    function update() {
      setRect(current.target ? getRect(current.target) : null)
    }
    update()
    const id = setInterval(update, 200)
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => { clearInterval(id); window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [step, current.target])

  function cardStyle(): React.CSSProperties {
    const base: React.CSSProperties = { position: 'fixed', zIndex: 9999, width: CARD_W }
    if (isCentered || !rect) {
      return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
    const centerY = Math.min(Math.max(rect.top + rect.height / 2, 120), window.innerHeight - 260)
    const pos = current.position
    if (pos === 'right') return { ...base, top: centerY, left: rect.left + rect.width + GAP, transform: 'translateY(-50%)' }
    if (pos === 'left')  return { ...base, top: centerY, left: Math.max(rect.left - GAP - CARD_W, 12), transform: 'translateY(-50%)' }
    if (pos === 'bottom') return { ...base, top: rect.top + rect.height + PAD + GAP, left: rect.left + rect.width / 2, transform: 'translateX(-50%)' }
    if (pos === 'top')   return { ...base, top: rect.top - GAP, left: rect.left + rect.width / 2, transform: 'translate(-50%, -100%)' }
    return { ...base, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  return (
    <>
      <style>{`
        @keyframes frTourIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
        @keyframes frPulseDot { 0%, 100% { opacity: 1; transform: scale(1) } 50% { opacity: 0.45; transform: scale(0.8) } }
      `}</style>

      {/* Backdrop — lighter so the UI is still visible */}
      <div className="fixed inset-0 z-[9990] pointer-events-none" style={{ background: 'rgba(0,0,0,0.48)' }} />

      {/* Spotlight cutout */}
      {rect && (
        <div
          className="fixed z-[9991] rounded-xl pointer-events-none"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.48)',
            border: '1.5px solid var(--pv-accent)',
            transition: 'top 0.25s, left 0.25s, width 0.25s, height 0.25s',
          }}
        />
      )}

      {/* Step card */}
      <div
        style={{
          ...cardStyle(),
          background: 'var(--pv-surface)',
          border: '1px solid var(--pv-border)',
          borderRadius: 18,
          boxShadow: '0 16px 60px rgba(0,0,0,0.65)',
          padding: '20px 20px 16px',
          pointerEvents: 'all',
          animation: 'frTourIn 0.18s ease',
        }}
      >
        {/* Step counter */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--pv-accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
          Step {step + 1} of {STEPS.length}
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'var(--pv-surface2)', borderRadius: 99, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, background: 'var(--pv-accent)', borderRadius: 99, transition: 'width 0.3s' }} />
        </div>

        {/* Title */}
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 15, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.02em', marginBottom: 8 }}>
          {current.title}
        </div>

        {/* Body content */}
        {current.special === 'subject' && (
          <div style={{ fontSize: 13, color: 'var(--pv-text2)', lineHeight: 1.6, marginBottom: 8 }}>
            Type this in the Subject field:
            <div style={{ margin: '8px 0', padding: '8px 12px', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', borderRadius: 10, fontFamily: 'monospace', fontSize: 13, color: 'var(--pv-text)', letterSpacing: '-0.01em' }}>
              A 2 story building on a city street
            </div>
            Then we'll use AI to make it much better.
          </div>
        )}

        {current.special === 'thinking' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--pv-text2)', lineHeight: 1.6, marginBottom: 14 }}>
              Give it a moment — it's reading your subject and crafting a detailed prompt.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--pv-border)', borderTopColor: 'var(--pv-accent)', flexShrink: 0 }} className="pv-spin" />
              <span style={{ fontSize: 12, color: 'var(--pv-text3)' }}>AI is thinking…</span>
            </div>
          </div>
        )}

        {current.special === 'generating' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--pv-text2)', lineHeight: 1.6, marginBottom: 14 }}>
              DALL-E 3 usually takes 15–30 seconds. Hang tight.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--pv-border)', borderTopColor: 'var(--pv-accent)', flexShrink: 0 }} className="pv-spin" />
              <span style={{ fontSize: 12, color: 'var(--pv-text3)' }}>Generating…</span>
            </div>
          </div>
        )}

        {current.special === 'settings' && (
          <div style={{ fontSize: 13, color: 'var(--pv-text2)', lineHeight: 1.6, marginBottom: 16 }}>
            Below the Subject you'll find optional settings — <strong style={{ color: 'var(--pv-text)' }}>Style, Lighting, Mood, Lens,</strong> and more.
            <br /><br />
            You don't need to touch any of these right now. They're there for when you're ready to go deeper and shape your images more precisely.
          </div>
        )}

        {!current.special && current.body && (
          <div style={{ fontSize: 13, color: 'var(--pv-text2)', lineHeight: 1.6, marginBottom: current.hasButton ? 16 : 8, whiteSpace: 'pre-line' }}>
            {current.body}
          </div>
        )}

        {/* Waiting indicator */}
        {!current.hasButton && current.special !== 'thinking' && current.special !== 'generating' && (
          <div className="flex items-center gap-2 mt-2" style={{ fontSize: 11, color: 'var(--pv-text3)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--pv-accent)', animation: 'frPulseDot 1.4s ease-in-out infinite' }} />
            Waiting for you…
          </div>
        )}

        {/* Action button */}
        {current.hasButton && (
          <div className="flex items-center justify-between mt-2">
            {step === 0 && (
              <button
                onClick={onSkip}
                style={{ fontSize: 12, color: 'var(--pv-text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                className="hover:text-[var(--pv-text)] transition-colors"
              >
                Skip for now
              </button>
            )}
            <div className="ml-auto">
              <button
                onClick={step === STEPS.length - 1 ? onDone : onNext}
                style={{ padding: '8px 18px', borderRadius: 10, background: 'var(--pv-accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                className="hover:opacity-90 transition-opacity"
              >
                {current.buttonLabel}
              </button>
            </div>
          </div>
        )}

        {/* Skip link on action-waiting steps */}
        {!current.hasButton && current.special !== 'thinking' && current.special !== 'generating' && step > 0 && (
          <button
            onClick={onSkip}
            style={{ fontSize: 11, color: 'var(--pv-text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: 6, display: 'block' }}
            className="hover:text-[var(--pv-text)] transition-colors"
          >
            Skip tour
          </button>
        )}
      </div>
    </>
  )
}
