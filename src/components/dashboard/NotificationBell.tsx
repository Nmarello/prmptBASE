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

  // Sync from localStorage whenever the component mounts or window gains focus
  useEffect(() => {
    function sync() { setNotifications(loadNotifications()) }
    window.addEventListener('focus', sync)
    // Also listen for storage events (other tabs)
    window.addEventListener('storage', sync)
    return () => { window.removeEventListener('focus', sync); window.removeEventListener('storage', sync) }
  }, [])

  // Close on outside click
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
      // Mark all as read
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
        className={`relative p-1.5 rounded-lg transition-colors ${open ? 'text-white bg-white/10' : 'text-slate-500 hover:text-white'}`}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-sky-500 text-white text-[10px] font-bold px-1 leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#161b22] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {notifications.length > 0 && (
              <button onClick={handleClear} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-600 text-sm">No notifications yet</div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-white/5">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                    n.assetId ? 'cursor-pointer hover:bg-white/4' : ''
                  } ${!n.read ? 'bg-sky-500/5' : ''}`}
                  onClick={() => {
                    if (n.assetId && n.assetUrl && onViewAsset) {
                      onViewAsset(n.assetId, n.assetUrl, n.type === 'video_ready')
                      setOpen(false)
                    }
                  }}
                >
                  {/* Thumbnail or icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                    {n.assetUrl && n.type === 'image_ready' ? (
                      <img src={n.assetUrl} alt="" className="w-full h-full object-cover" />
                    ) : n.type === 'video_ready' ? (
                      <span className="text-lg">🎬</span>
                    ) : (
                      <span className="text-lg">🖼️</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white leading-snug">{n.message}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.modelName} · {formatTime(n.createdAt)}</p>
                  </div>

                  {!n.read && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-sky-400 mt-1.5" />
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
