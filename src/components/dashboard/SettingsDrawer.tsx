import { useEffect } from 'react'
import Settings from '../../pages/Settings'

interface Props {
  onClose: () => void
}

export default function SettingsDrawer({ onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
      `}</style>

      {/* Backdrop — starts after sidebar on desktop */}
      <div
        className="fixed top-0 bottom-0 right-0 z-40 left-0 sm:left-[60px]"
        style={{ background: 'rgba(8,7,6,0.6)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Drawer panel — slides in from the left, next to sidebar */}
      <div
        className="fixed top-0 bottom-0 z-50 left-0 sm:left-[60px] flex flex-col overflow-hidden"
        style={{
          width: '100vw',
          maxWidth: 480,
          background: 'var(--pv-surface)',
          borderRight: '1px solid var(--pv-border)',
          boxShadow: '24px 0 80px rgba(0,0,0,0.45)',
          animation: 'settingsDrawerIn 0.22s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <Settings asDrawer onClose={onClose} />
      </div>
    </>
  )
}
