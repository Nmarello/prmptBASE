import { useState } from 'react'

// Site-wide notice until prmptVAULT shuts down on Oct 19, 2026. Floats so it never shifts the
// full-height layouts; dismissal lasts for the browser session. On mobile it sits above the
// dashboard's bottom tab bar and clear of the support/feedback FABs on the right.
const DISMISS_KEY = 'pv-shutdown-banner-dismissed'

export default function ShutdownBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem(DISMISS_KEY) === '1' } catch { return false }
  })
  if (dismissed) return null

  function dismiss() {
    try { sessionStorage.setItem(DISMISS_KEY, '1') } catch { /* storage unavailable */ }
    setDismissed(true)
  }

  return (
    <div
      role="status"
      className="fixed z-[10000] left-3 right-[76px] bottom-[84px] sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:bottom-6 sm:w-max sm:max-w-xl flex items-start gap-3 px-4 py-3 rounded-2xl shadow-xl text-sm"
      style={{ background: 'var(--pv-accent)', color: '#fff' }}
    >
      <p className="flex-1 leading-snug">
        <strong>prmptVAULT is shutting down on October 19.</strong>{' '}
        Download anything you want to keep from your Assets before then.
      </p>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-lg leading-none opacity-80 hover:opacity-100 cursor-pointer">
        ×
      </button>
    </div>
  )
}
