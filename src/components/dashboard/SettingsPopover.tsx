import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../../contexts/ThemeContext'

const TIMEZONES = [
  'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Anchorage', 'Pacific/Honolulu', 'America/Toronto', 'America/Vancouver',
  'America/Sao_Paulo', 'America/Mexico_City', 'Europe/London', 'Europe/Paris',
  'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Amsterdam',
  'Europe/Stockholm', 'Europe/Moscow', 'Asia/Dubai', 'Asia/Karachi',
  'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo',
  'Asia/Seoul', 'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland',
]

const TZ_LABELS: Record<string, string> = {
  'America/New_York': 'Eastern (ET)',
  'America/Chicago': 'Central (CT)',
  'America/Denver': 'Mountain (MT)',
  'America/Los_Angeles': 'Pacific (PT)',
  'America/Anchorage': 'Alaska (AKT)',
  'Pacific/Honolulu': 'Hawaii (HT)',
  'America/Toronto': 'Toronto',
  'America/Vancouver': 'Vancouver',
  'America/Sao_Paulo': 'São Paulo',
  'America/Mexico_City': 'Mexico City',
  'Europe/London': 'London (GMT)',
  'Europe/Paris': 'Paris (CET)',
  'Europe/Berlin': 'Berlin',
  'Europe/Madrid': 'Madrid',
  'Europe/Rome': 'Rome',
  'Europe/Amsterdam': 'Amsterdam',
  'Europe/Stockholm': 'Stockholm',
  'Europe/Moscow': 'Moscow',
  'Asia/Dubai': 'Dubai (GST)',
  'Asia/Karachi': 'Karachi (PKT)',
  'Asia/Kolkata': 'India (IST)',
  'Asia/Bangkok': 'Bangkok (ICT)',
  'Asia/Singapore': 'Singapore (SGT)',
  'Asia/Tokyo': 'Tokyo (JST)',
  'Asia/Seoul': 'Seoul (KST)',
  'Asia/Shanghai': 'Shanghai (CST)',
  'Australia/Sydney': 'Sydney (AEDT)',
  'Pacific/Auckland': 'Auckland (NZDT)',
}

const TZ_STORAGE_KEY = 'prmptVAULT_timezone'

interface Props {
  onSignOut: () => void
  userInitial?: string
  inBottomNav?: boolean
  isAdmin?: boolean
}

export default function SettingsPopover({ onSignOut, userInitial = '?', inBottomNav, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()

  const [timezone, setTimezone] = useState<string>(() => {
    try { return localStorage.getItem(TZ_STORAGE_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'America/New_York' }
  })

  function handleTimezone(tz: string) {
    setTimezone(tz)
    try { localStorage.setItem(TZ_STORAGE_KEY, tz) } catch {}
  }

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      {/* Avatar button */}
      {inBottomNav ? (
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Settings"
          data-tour="settings-btn"
          className="flex flex-col items-center gap-0.5 py-1 px-4 cursor-pointer transition-opacity"
          style={{ color: open ? 'var(--pv-accent)' : 'var(--pv-text3)', background: 'none', border: 'none', fontFamily: 'inherit' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
          <span className="text-[10px] font-medium">Account</span>
        </button>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Settings"
          data-tour="settings-btn"
          className="flex items-center justify-center rounded-full cursor-pointer transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ width: 30, height: 30, background: 'var(--pv-accent)', color: '#fff', fontSize: 12, fontWeight: 700, userSelect: 'none', border: 'none' }}
        >
          {userInitial}
        </button>
      )}

      {open && (
        <div
          className="absolute bottom-full right-0 mb-2 sm:bottom-0 sm:left-full sm:right-auto sm:mb-0 sm:ml-2 w-72 max-w-[calc(100vw-16px)] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in"
          style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)' }}
        >
          {/* Timezone */}
          <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--pv-border)' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pv-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => handleTimezone(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm cursor-pointer outline-none"
              style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text)' }}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{TZ_LABELS[tz] ?? tz}</option>
              ))}
            </select>
          </div>

          {/* Theme toggle */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--pv-border)' }}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontSize: 13, color: 'var(--pv-text)' }}>Theme</p>
                <p style={{ fontSize: 11, color: 'var(--pv-text3)' }}>Dark / Light</p>
              </div>
              <button
                type="button"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="flex items-center gap-2 cursor-pointer"
                style={{ background: 'none', border: 'none' }}
              >
                <span style={{ fontSize: 12, color: 'var(--pv-text3)' }}>{theme === 'dark' ? 'Dark' : 'Light'}</span>
                <div style={{ width: 40, height: 20, borderRadius: 99, position: 'relative', background: theme === 'dark' ? 'var(--pv-accent)' : 'var(--pv-surface2)', border: '1px solid var(--pv-border)', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, width: 14, height: 14, background: '#fff', borderRadius: '50%', transition: 'left 0.2s', left: theme === 'dark' ? 22 : 2 }} />
                </div>
              </button>
            </div>
          </div>

          {/* My stats */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--pv-border)' }}>
            <a
              href="/settings"
              onClick={() => setOpen(false)}
              style={{ fontSize: 13, color: 'var(--pv-text2)', textDecoration: 'none', display: 'block' }}
              className="hover:text-[var(--pv-text)] transition-colors"
            >
              My stats →
            </a>
          </div>

          {/* Admin link — only shown to admins */}
          {isAdmin && (
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--pv-border)' }}>
              <a
                href="/admin"
                onClick={() => setOpen(false)}
                style={{ fontSize: 13, color: 'var(--pv-text2)', textDecoration: 'none', display: 'block' }}
                className="hover:text-[var(--pv-text)] transition-colors"
              >
                Admin panel →
              </a>
            </div>
          )}

          {/* Sign out */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => { setOpen(false); onSignOut() }}
              style={{ fontSize: 13, color: 'var(--pv-text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'left', padding: 0 }}
              className="hover:text-[var(--pv-text)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
