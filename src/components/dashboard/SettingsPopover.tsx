import { useEffect, useRef, useState } from 'react'
import { useLearningMode, type LearningMode } from '../../contexts/LearningModeContext'

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

const LEARNING_MODE_OPTIONS: { value: LearningMode; label: string; desc: string }[] = [
  { value: 'none',     label: 'None',    desc: 'No guidance' },
  { value: 'tooltips', label: 'Tooltips', desc: 'ℹ️ on each field' },
  { value: 'guided',   label: 'Guided',  desc: 'Full site tour' },
]

interface Props {
  onSignOut: () => void
  onStartTour: () => void
}

export default function SettingsPopover({ onSignOut, onStartTour }: Props) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const { mode, setMode } = useLearningMode()

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
      {/* Gear icon button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
          open ? 'text-white bg-white/10' : 'text-white/50 hover:text-white hover:bg-white/8'
        }`}
        aria-label="Settings"
        data-tour="settings-btn"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#1c1c1e] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">

          {/* Timezone */}
          <div className="px-4 pt-4 pb-3 border-b border-white/8">
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-2">
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => handleTimezone(e.target.value)}
              className="w-full bg-white/6 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500/50 cursor-pointer"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{TZ_LABELS[tz] ?? tz}</option>
              ))}
            </select>
          </div>

          {/* Theme toggle — inactive */}
          <div className="px-4 py-3 border-b border-white/8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/40">Theme</p>
                <p className="text-[11px] text-white/25">Dark / Light</p>
              </div>
              <div className="flex items-center gap-2 opacity-40 cursor-not-allowed">
                <span className="text-xs text-white/50">Dark</span>
                <div className="w-10 h-5 bg-white/10 rounded-full relative border border-white/10">
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white/30 rounded-full" />
                </div>
                <span className="text-[10px] text-white/30 bg-white/8 px-1.5 py-0.5 rounded-full">soon</span>
              </div>
            </div>
          </div>

          {/* Learning Mode */}
          <div className="px-4 py-3 border-b border-white/8">
            <label className="text-[11px] font-semibold text-white/40 uppercase tracking-wider block mb-3">
              Learning Mode
            </label>
            <div className="flex gap-1.5">
              {LEARNING_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value)}
                  className={`flex-1 py-2 px-1 rounded-xl border text-xs font-medium transition-all cursor-pointer text-center ${
                    mode === opt.value
                      ? 'bg-sky-500/15 border-sky-500/40 text-sky-400'
                      : 'bg-white/4 border-white/8 text-white/40 hover:text-white/70 hover:border-white/20'
                  }`}
                >
                  <div>{opt.label}</div>
                  <div className={`text-[10px] mt-0.5 font-normal ${mode === opt.value ? 'text-sky-400/70' : 'text-white/25'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>

            {mode === 'guided' && (
              <button
                type="button"
                onClick={() => { onStartTour(); setOpen(false) }}
                className="mt-2.5 w-full py-2 rounded-xl border border-sky-500/30 bg-sky-500/8 text-sky-400 text-xs font-medium hover:bg-sky-500/15 transition-all cursor-pointer"
              >
                ▶ Restart tour
              </button>
            )}
          </div>

          {/* Sign out */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={() => { setOpen(false); onSignOut() }}
              className="w-full text-left text-sm text-white/40 hover:text-white/70 transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
