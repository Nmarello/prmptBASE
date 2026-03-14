import { useCallback, useEffect, useRef, useState } from 'react'
import Settings from '../../pages/Settings'

interface Props {
  onClose: () => void
  section?: string
}

export default function SettingsDrawer({ onClose, section }: Props) {
  const [closing, setClosing] = useState(false)
  const isClosingRef = useRef(false)

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return
    isClosingRef.current = true
    setClosing(true)
    setTimeout(onClose, 210)
  }, [onClose])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <>
      <style>{`
        @keyframes settingsDrawerIn {
          from { transform: translateX(-100%) }
          to   { transform: translateX(0) }
        }
        @keyframes settingsDrawerOut {
          from { transform: translateX(0) }
          to   { transform: translateX(-100%) }
        }
        @keyframes settingsBackdropIn {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes settingsBackdropOut {
          from { opacity: 1 }
          to   { opacity: 0 }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed top-0 bottom-0 right-0 z-40 left-0 sm:left-[60px]"
        style={{
          background: 'rgba(8,7,6,0.6)',
          backdropFilter: 'blur(6px)',
          animation: closing
            ? 'settingsBackdropOut 0.21s cubic-bezier(0.22,1,0.36,1) forwards'
            : 'settingsBackdropIn 0.22s cubic-bezier(0.22,1,0.36,1)',
        }}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 bottom-0 z-50 left-0 sm:left-[60px] flex flex-col overflow-hidden"
        style={{
          width: '100vw',
          maxWidth: 480,
          background: 'var(--pv-surface)',
          borderRight: '1px solid var(--pv-border)',
          boxShadow: '24px 0 80px rgba(0,0,0,0.45)',
          animation: closing
            ? 'settingsDrawerOut 0.21s cubic-bezier(0.22,1,0.36,1) forwards'
            : 'settingsDrawerIn 0.22s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <Settings asDrawer onClose={handleClose} scrollTo={section} />
      </div>
    </>
  )
}
