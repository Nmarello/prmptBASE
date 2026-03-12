import { useEffect, useRef, useState } from 'react'

export interface AppNotification {
  id: string
  type: 'image_ready' | 'video_ready'
  message: string
  modelName: string
  assetUrl?: string
  assetId?: string
  createdAt: number
  read: boolean
}

const STORAGE_KEY = 'prmptVAULT_notifications'
const MAX_NOTIFICATIONS = 50

export function loadNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveNotifications(notifications: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS)))
}

export function addNotification(n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): AppNotification {
  const notification: AppNotification = {
    ...n,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
    read: false,
  }
  const existing = loadNotifications()
  saveNotifications([notification, ...existing])
  return notification
}

interface Props {
  onViewAsset?: (assetId: string, assetUrl: string, isVideo: boolean) => void
}

export default function NotificationBell({ onViewAsset }: Props) {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadNotifications())
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function sync() { setNotifications(loadNotifications()) }
    window.addEventListener('focus', sync)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('focus', sync); window.removeEventListener('storage', sync) }
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const unread = notifications.filter((n) => !n.read).length

  function handleOpen() {
    setOpen((v) => !v)
    if (!open && unread > 0) {
      const updated = notifications.map((n) => ({ ...n, read: true }))
      setNotifications(updated)
      saveNotifications(updated)
    }
  }

  function handleClear() {
    setNotifications([])
    saveNotifications([])
  }

  function formatTime(ts: number) {
    const diff = Date.now() - ts
    if (diff < 60_000) return 'just now'
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`
    return new Date(ts).toLocaleDateString()
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className={`relative p-1.5 rounded-lg transition-colors cursor-pointer ${open ? '' : 'hover:opacity-80'}`}
        style={{ color: open ? 'var(--pv-text)' : 'var(--pv-text2)' }}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#0071e3] text-white text-[10px] font-bold px-1 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-2 sm:bottom-0 sm:left-full sm:right-auto sm:mb-0 sm:ml-2 w-80 max-w-[calc(100vw-16px)] rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in" style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)' }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--pv-border)' }}>
            <span className="text-sm font-semibold" style={{ color: 'var(--pv-text)' }}>Notifications</span>
            {notifications.length > 0 && (
              <button onClick={handleClear} className="text-xs hover:opacity-80 transition-opacity cursor-pointer" style={{ color: 'var(--pv-text3)' }}>
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--pv-text3)' }}>No notifications yet</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y" style={{ borderColor: 'var(--pv-border)' }}>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                    n.assetId ? 'cursor-pointer' : ''
                  } ${!n.read ? 'bg-[rgba(0,80,255,0.04)]' : ''}`}
                  onClick={() => {
                    if (n.assetId && n.assetUrl && onViewAsset) {
                      onViewAsset(n.assetId, n.assetUrl, n.type === 'video_ready')
                      setOpen(false)
                    }
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center" style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)' }}>
                    {n.assetUrl && n.type === 'image_ready' ? (
                      <img src={n.assetUrl} alt="" className="w-full h-full object-cover" />
                    ) : n.type === 'video_ready' ? (
                      <svg className="w-5 h-5" style={{ color: 'var(--pv-text3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.277A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                    ) : (
                      <svg className="w-5 h-5" style={{ color: 'var(--pv-text3)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.5}/><circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 21"/></svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug" style={{ color: 'var(--pv-text)' }}>{n.message}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--pv-text3)' }}>{n.modelName} · {formatTime(n.createdAt)}</p>
                  </div>

                  {!n.read && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5" style={{ background: 'var(--pv-accent)' }} />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
