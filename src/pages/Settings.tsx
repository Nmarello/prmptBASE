import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import Logo from '../components/Logo'
import { supabase } from '../lib/supabase'
import ModelPicker from '../components/settings/ModelPicker'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const ANON_KEY     = import.meta.env.VITE_SUPABASE_ANON_KEY as string

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

const TIER_COLORS: Record<string, string> = {
  newbie:  'bg-[var(--pv-surface2)] text-[var(--pv-text2)] border-[var(--pv-border)]',
  creator: 'bg-[#0050ff]/10 text-[#6699ff] border-[#0050ff]/20',
  studio:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  pro:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

interface UserStats {
  profile: { id: string; email: string; display_name: string | null; tier: string; created_at: string; avatar_url?: string | null }
  total_assets: number
  assets_today: number
  gen_type_totals: Record<string, number>
  by_model: Array<{ name: string; slug: string; provider: string; count: number; total_cost: number }>
  image_by_model: Array<{ name: string; slug: string; provider: string; txt2img: number; img2img: number }>
  video_by_model: Array<{ name: string; slug: string; provider: string; txt2vid: number; img2vid: number }>
  total_spend: number
  period_spend: number
}

interface RecentAsset { id: string; url: string; gen_type: string }

function BarChart({ rows, colorA, colorB, keyA, keyB }: {
  rows: Array<{ name: string; slug: string; [key: string]: string | number }>
  colorA: string; colorB: string; keyA: string; keyB: string
}) {
  const maxTotal = Math.max(...rows.map(r => ((r[keyA] as number) ?? 0) + ((r[keyB] as number) ?? 0)), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map(m => {
        const a = (m[keyA] as number) ?? 0
        const b = (m[keyB] as number) ?? 0
        const total = a + b
        return (
          <div key={m.slug} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 120, fontSize: 12, color: 'var(--pv-text)', fontWeight: 500, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
            <div style={{ flex: 1, display: 'flex', gap: 2, height: 20, alignItems: 'center' }}>
              {a > 0 && <div style={{ height: '100%', borderRadius: b > 0 ? '4px 2px 2px 4px' : '4px', background: colorA, width: `${(a / maxTotal) * 80}%`, minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.7)' }}>{a}</div>}
              {b > 0 && <div style={{ height: '100%', borderRadius: a > 0 ? '2px 4px 4px 2px' : '4px', background: colorB, width: `${(b / maxTotal) * 80}%`, minWidth: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.7)' }}>{b}</div>}
            </div>
            <div style={{ fontSize: 11, color: 'var(--pv-text3)', width: 24, textAlign: 'right', flexShrink: 0 }}>{total}</div>
          </div>
        )
      })}
    </div>
  )
}

function SbBtn({ tip, onClick, children }: { tip?: string; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={tip}
      className="flex items-center justify-center rounded-[11px] transition-all cursor-pointer"
      style={{ width: 40, height: 40, color: 'var(--pv-text3)', background: 'transparent', border: 'none', flexShrink: 0 }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--pv-text)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--pv-surface2)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--pv-text3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
    >
      {children}
    </button>
  )
}

function MiniStat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 9, color: 'var(--pv-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent ?? 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.03em' }}>{value}</div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pv-text3)', marginBottom: 10 }}>
      {children}
    </div>
  )
}

// ── Gallery picker modal ──────────────────────────────────────────────────────
function GalleryPicker({ userId, onPick, onClose }: { userId: string; onPick: (url: string) => void; onClose: () => void }) {
  const [assets, setAssets] = useState<RecentAsset[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('assets')
      .select('id, url, gen_type')
      .eq('user_id', userId)
      .in('gen_type', ['txt2img', 'img2img'])
      .order('created_at', { ascending: false })
      .limit(16)
      .then(({ data }) => { setAssets((data ?? []) as RecentAsset[]); setLoading(false) })
  }, [userId])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--pv-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--pv-text)' }}>Pick from generations</div>
          <button onClick={onClose} style={{ color: 'var(--pv-text3)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }} className="hover:text-[var(--pv-text)] transition-colors">✕</button>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--pv-text3)', fontSize: 13 }} className="animate-pulse">Loading…</div>
          ) : assets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--pv-text3)', fontSize: 13 }}>No images generated yet</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {assets.map(a => (
                <button
                  key={a.id}
                  onClick={() => { onPick(a.url); onClose() }}
                  style={{ aspectRatio: '1', borderRadius: 10, overflow: 'hidden', border: '2px solid transparent', cursor: 'pointer', padding: 0, background: 'var(--pv-surface2)' }}
                  className="hover:border-[var(--pv-accent)] transition-all"
                >
                  <img src={a.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({ onConfirm, onClose, loading }: { onConfirm: () => void; onClose: () => void; loading: boolean }) {
  const [typed, setTyped] = useState('')
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={onClose}>
      <div
        style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 18, width: '100%', maxWidth: 400, padding: 24 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 18, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>Delete account?</div>
        <p style={{ fontSize: 13, color: 'var(--pv-text2)', marginBottom: 16, lineHeight: 1.5 }}>
          This permanently deletes your account and all generated assets. This cannot be undone.
        </p>
        <p style={{ fontSize: 12, color: 'var(--pv-text3)', marginBottom: 8 }}>Type <strong style={{ color: 'var(--pv-text)' }}>DELETE</strong> to confirm:</p>
        <input
          type="text"
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder="DELETE"
          autoFocus
          style={{ width: '100%', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', borderRadius: 10, padding: '9px 12px', fontSize: 14, color: 'var(--pv-text)', outline: 'none', fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }}
          className="focus:border-red-500 transition-colors"
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={typed !== 'DELETE' || loading}
            style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: typed === 'DELETE' ? '#f87171' : 'var(--pv-surface2)', border: 'none', color: typed === 'DELETE' ? '#fff' : 'var(--pv-text3)', fontSize: 13, fontWeight: 700, cursor: typed === 'DELETE' ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s' }}
          >
            {loading ? 'Deleting…' : 'Delete my account'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Avatar menu popup ─────────────────────────────────────────────────────────
function AvatarMenu({ onUpload, onPickGallery, onRemove, hasAvatar, onClose }: {
  onUpload: () => void; onPickGallery: () => void; onRemove: () => void; hasAvatar: boolean; onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [onClose])

  return (
    <div ref={ref} style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6, background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 12, overflow: 'hidden', minWidth: 180, zIndex: 30, boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}>
      {[
        { label: 'Upload photo', onClick: onUpload },
        { label: 'Pick from generations', onClick: onPickGallery },
        ...(hasAvatar ? [{ label: 'Remove photo', onClick: onRemove, danger: true }] : []),
      ].map(item => (
        <button
          key={item.label}
          onClick={() => { item.onClick(); onClose() }}
          style={{ display: 'block', width: '100%', padding: '10px 16px', fontSize: 13, color: (item as any).danger ? '#f87171' : 'var(--pv-text2)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
          className="hover:bg-white/5 transition-colors"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Settings({ asDrawer = false, onClose, scrollTo }: { asDrawer?: boolean; onClose?: () => void; scrollTo?: string } = {}) {
  const { user, signOut, isAdmin } = useAuth()
  const { theme, setTheme } = useTheme()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  // profile edit state
  const [editName, setEditName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [profileDirty, setProfileDirty] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // password reset
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  // delete
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // billing portal
  const [portalLoading, setPortalLoading] = useState(false)

  async function openBillingPortal() {
    setPortalLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, apikey: ANON_KEY },
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {}
    setPortalLoading(false)
  }

  // timezone
  const [timezone, setTimezone] = useState<string>(() => {
    try { return localStorage.getItem(TZ_STORAGE_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone } catch { return 'America/New_York' }
  })

  function handleTimezone(tz: string) {
    setTimezone(tz)
    try { localStorage.setItem(TZ_STORAGE_KEY, tz) } catch {}
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setLoading(false); return }
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/user-stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
          body: JSON.stringify({ user_token: token }),
        })
        const data = await res.json()
        if (!data.error) {
          setStats(data)
          setEditName(data.profile.display_name ?? '')
          setAvatarUrl(data.profile.avatar_url ?? null)
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  // track dirty
  useEffect(() => {
    if (!stats) return
    const nameDirty = editName !== (stats.profile.display_name ?? '')
    const avatarDirty = avatarUrl !== (stats.profile.avatar_url ?? null)
    setProfileDirty(nameDirty || avatarDirty)
  }, [editName, avatarUrl, stats])

  async function saveProfile() {
    if (!user || !stats) return
    setSavingProfile(true)
    try {
      await supabase.from('profiles').update({
        display_name: editName.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id)
      setStats(prev => prev ? { ...prev, profile: { ...prev.profile, display_name: editName.trim() || null, avatar_url: avatarUrl } } : null)
      setProfileDirty(false)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch {}
    setSavingProfile(false)
  }

  async function handleFileUpload(file: File) {
    if (!user) return
    setUploadingAvatar(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) return

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const res = await fetch(`${SUPABASE_URL}/functions/v1/upload-avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
        body: JSON.stringify({ user_token: token, file_base64: base64, content_type: file.type }),
      })
      const data = await res.json()
      if (data.url) {
        setAvatarUrl(data.url)
        setStats(prev => prev ? { ...prev, profile: { ...prev.profile, avatar_url: data.url } } : null)
        setProfileDirty(false)
      }
    } catch {}
    setUploadingAvatar(false)
  }

  async function sendPasswordReset() {
    if (!user?.email) return
    setResetLoading(true)
    await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    setResetSent(true)
    setResetLoading(false)
  }

  async function deleteAccount() {
    setDeleting(true); setDeleteError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')
      const res = await fetch(`${SUPABASE_URL}/functions/v1/delete-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}`, 'apikey': ANON_KEY },
        body: JSON.stringify({ user_token: token }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to delete account')
      await supabase.auth.signOut()
      window.location.href = '/'
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
    }
    setDeleting(false)
  }

  const initial = (stats?.profile.display_name ?? user?.email ?? '?')[0].toUpperCase()

  useEffect(() => {
    if (!scrollTo || !asDrawer) return
    const timer = setTimeout(() => {
      const el = document.getElementById(`settings-${scrollTo}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 280)
    return () => clearTimeout(timer)
  }, [scrollTo, asDrawer])

  // ── Shared scrollable content ─────────────────────────────────────────────
  const settingsBody = (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Profile card ── */}
        <div id="settings-profile" style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 16, padding: '20px 22px', marginBottom: 24 }}>

          {/* Avatar + name row */}
          <div className="flex items-center gap-4 mb-4">

            {/* Avatar with menu */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={() => setShowAvatarMenu(v => !v)}
                style={{ width: 64, height: 64, borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', border: '2px solid var(--pv-border)', padding: 0, background: 'var(--pv-surface2)', position: 'relative', flexShrink: 0 }}
                className="group"
              >
                {(uploadingAvatar) ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--pv-surface2)' }} className="animate-pulse">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pv-text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
                    </svg>
                  </div>
                ) : avatarUrl ? (
                  <>
                    <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }} className="group-hover:opacity-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--pv-accent)', fontSize: 22, fontWeight: 700, color: '#fff' }}>
                      {initial}
                    </div>
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }} className="group-hover:opacity-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                  </>
                )}
              </button>

              {showAvatarMenu && (
                <AvatarMenu
                  hasAvatar={!!avatarUrl}
                  onUpload={() => fileInputRef.current?.click()}
                  onPickGallery={() => setShowGallery(true)}
                  onRemove={() => { setAvatarUrl(null); setProfileDirty(true) }}
                  onClose={() => setShowAvatarMenu(false)}
                />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = '' }}
              />
            </div>

            {/* Name + email */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Display name"
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 20, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em', marginBottom: 3, padding: 0 }}
                className="focus:underline focus:decoration-dashed focus:decoration-[var(--pv-text3)]"
              />
              <div style={{ fontSize: 13, color: 'var(--pv-text3)' }}>{user?.email}</div>
            </div>
          </div>

          {/* Tier + joined */}
          {stats && (
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${TIER_COLORS[stats.profile.tier] ?? ''}`}>
                {stats.profile.tier}
              </span>
              <span style={{ fontSize: 11, color: 'var(--pv-text3)' }}>
                Joined {new Date(stats.profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Save / cancel */}
          {profileDirty && (
            <div className="flex items-center gap-2">
              <button
                onClick={saveProfile}
                disabled={savingProfile}
                style={{ padding: '7px 18px', borderRadius: 10, background: 'var(--pv-accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                className="hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingProfile ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => { setEditName(stats?.profile.display_name ?? ''); setAvatarUrl(stats?.profile.avatar_url ?? null); setProfileDirty(false) }}
                style={{ padding: '7px 14px', borderRadius: 10, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
            </div>
          )}
          {profileSaved && (
            <div style={{ fontSize: 12, color: '#34c759', marginTop: 2 }}>Profile saved ✓</div>
          )}
        </div>

        {/* ── Stats ── */}
        <div id="settings-stats" />
        {loading ? (
          <div className="flex items-center justify-center py-20 animate-pulse" style={{ color: 'var(--pv-text3)', fontSize: 13 }}>Loading…</div>
        ) : stats ? (
          <>
            <SectionLabel>Assets</SectionLabel>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
              <MiniStat label="Total"   value={stats.total_assets}                        accent="var(--pv-text)" />
              <MiniStat label="Today"   value={stats.assets_today}                        accent="var(--pv-accent)" />
              <MiniStat label="txt2img" value={stats.gen_type_totals['txt2img'] ?? 0}     accent="var(--pv-text2)" />
              <MiniStat label="img2img" value={stats.gen_type_totals['img2img'] ?? 0}     accent="var(--pv-text2)" />
              <MiniStat label="txt2vid" value={stats.gen_type_totals['txt2vid'] ?? 0}     accent="#a78bfa" />
              <MiniStat label="img2vid" value={stats.gen_type_totals['img2vid'] ?? 0}     accent="#c084fc" />
            </div>


            {stats.image_by_model?.length > 0 && (
              <div style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Image Assets · by Model</SectionLabel>
                  <div className="flex gap-3" style={{ fontSize: 10, color: 'var(--pv-text3)', marginBottom: 12 }}>
                    <span style={{ color: 'var(--pv-accent)' }}>■ txt2img</span>
                    <span style={{ color: '#7aabff' }}>■ img2img</span>
                  </div>
                </div>
                <BarChart rows={stats.image_by_model as unknown as Array<{ name: string; slug: string; [key: string]: string | number }>} colorA="var(--pv-accent)" colorB="#7aabff" keyA="txt2img" keyB="img2img" />
              </div>
            )}

            {stats.video_by_model?.length > 0 && (
              <div style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
                <div className="flex items-center justify-between mb-3">
                  <SectionLabel>Video Assets · by Model</SectionLabel>
                  <div className="flex gap-3" style={{ fontSize: 10, color: 'var(--pv-text3)', marginBottom: 12 }}>
                    <span style={{ color: '#a78bfa' }}>■ txt2vid</span>
                    <span style={{ color: '#c084fc' }}>■ img2vid</span>
                  </div>
                </div>
                <BarChart rows={stats.video_by_model as unknown as Array<{ name: string; slug: string; [key: string]: string | number }>} colorA="#a78bfa" colorB="#c084fc" keyA="txt2vid" keyB="img2vid" />
              </div>
            )}

            {stats.by_model.length > 0 && (
              <div className="mb-6">
                <SectionLabel>By Model</SectionLabel>
                <div style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 14, overflow: 'hidden' }}>
                  {stats.by_model.map((m, i) => (
                    <div key={m.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < stats.by_model.length - 1 ? '1px solid var(--pv-border)' : undefined }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pv-text)' }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--pv-text3)' }}>{m.provider}</div>
                      </div>
                      <div className="text-right">
                        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pv-accent)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{m.count}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.total_assets === 0 && (
              <div style={{ textAlign: 'center', paddingTop: 16, paddingBottom: 24 }}>
                <div style={{ fontSize: 14, color: 'var(--pv-text3)', marginBottom: 12 }}>No assets yet — start generating!</div>
                <a href="/dashboard" style={{ fontSize: 13, color: 'var(--pv-accent)', textDecoration: 'none', fontWeight: 600 }}>Go to Dashboard →</a>
              </div>
            )}
          </>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--pv-text3)', textAlign: 'center', paddingTop: 32 }}>Failed to load stats</div>
        )}

        {/* ── Model Picker (creator + studio only) ── */}
        {stats && ['creator', 'studio'].includes(stats.profile.tier) && user && (
          <div style={{ borderTop: '1px solid var(--pv-border)', paddingTop: 24, marginTop: 8 }}>
            <SectionLabel>My Models</SectionLabel>
            <ModelPicker tier={stats.profile.tier} userId={user.id} />
          </div>
        )}

        {/* ── Preferences ── */}
        <div id="settings-preferences" style={{ borderTop: '1px solid var(--pv-border)', paddingTop: 24, marginTop: 8 }}>
          <SectionLabel>Preferences</SectionLabel>
          <div style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>

            {/* Theme */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--pv-border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pv-text)' }}>Theme</div>
                <div style={{ fontSize: 11, color: 'var(--pv-text3)' }}>Dark or light mode</div>
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

            {/* Timezone */}
            <div style={{ padding: '14px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pv-text)', marginBottom: 8 }}>Timezone</div>
              <select
                value={timezone}
                onChange={e => handleTimezone(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm cursor-pointer outline-none"
                style={{ background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text)' }}
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{TZ_LABELS[tz] ?? tz}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Account ── */}
        <div id="settings-account" style={{ paddingTop: 8, marginTop: 8 }}>
          <SectionLabel>Account</SectionLabel>
          <div style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>

            {/* Change password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--pv-border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pv-text)' }}>Password</div>
                <div style={{ fontSize: 11, color: 'var(--pv-text3)' }}>Send a reset link to your email</div>
              </div>
              {resetSent ? (
                <span style={{ fontSize: 12, color: '#34c759' }}>Reset link sent ✓</span>
              ) : (
                <button
                  onClick={sendPasswordReset}
                  disabled={resetLoading}
                  style={{ padding: '6px 14px', borderRadius: 9, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  className="hover:border-[var(--pv-accent)] hover:text-[var(--pv-text)] transition-colors disabled:opacity-50"
                >
                  {resetLoading ? 'Sending…' : 'Reset password'}
                </button>
              )}
            </div>

            {/* Pricing */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--pv-border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pv-text)' }}>Plan &amp; billing</div>
                <div style={{ fontSize: 11, color: 'var(--pv-text3)' }}>
                  {stats?.profile.tier && stats.profile.tier !== 'newbie'
                    ? 'Manage your subscription, invoices, or cancel'
                    : 'View plans and upgrade'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {stats?.profile.tier && stats.profile.tier !== 'newbie' && (
                  <button
                    onClick={openBillingPortal}
                    disabled={portalLoading}
                    style={{ padding: '6px 14px', borderRadius: 9, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    className="hover:border-[var(--pv-accent)] hover:text-[var(--pv-text)] transition-colors disabled:opacity-50"
                  >
                    {portalLoading ? 'Loading…' : 'Manage →'}
                  </button>
                )}
                <a
                  href="/pricing"
                  style={{ padding: '6px 14px', borderRadius: 9, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
                  className="hover:border-[var(--pv-accent)] hover:text-[var(--pv-text)] transition-colors"
                >
                  {stats?.profile.tier && stats.profile.tier !== 'newbie' ? 'Plans →' : 'View plans →'}
                </a>
              </div>
            </div>

            {/* Admin link */}
            {isAdmin && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--pv-border)' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pv-text)' }}>Admin panel</div>
                  <div style={{ fontSize: 11, color: 'var(--pv-text3)' }}>Manage users and platform settings</div>
                </div>
                <a
                  href="/admin"
                  style={{ padding: '6px 14px', borderRadius: 9, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}
                  className="hover:border-[var(--pv-accent)] hover:text-[var(--pv-text)] transition-colors"
                >
                  Open →
                </a>
              </div>
            )}

            {/* Restart onboarding */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid var(--pv-border)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pv-text)' }}>Onboarding tour</div>
                <div style={{ fontSize: 11, color: 'var(--pv-text3)' }}>Replay the first-generation walkthrough</div>
              </div>
              <button
                type="button"
                onClick={() => { try { localStorage.removeItem('prmptVAULT_firstRunSeen') } catch {} window.location.href = '/dashboard?tour=restart' }}
                style={{ padding: '6px 14px', borderRadius: 9, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                className="hover:border-[var(--pv-accent)] hover:text-[var(--pv-text)] transition-colors"
              >
                Restart →
              </button>
            </div>

            {/* Sign out */}
            <div style={{ padding: '14px 18px' }}>
              <button
                type="button"
                onClick={signOut}
                style={{ fontSize: 13, color: 'var(--pv-text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
                className="hover:text-[var(--pv-text)] transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* ── Data ── */}
        <div id="settings-data" style={{ marginTop: 8 }}>
          <SectionLabel>Data</SectionLabel>
          <div style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--pv-text)' }}>Export library</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text3)', letterSpacing: '0.04em' }}>COMING SOON</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--pv-text3)' }}>Download all your generated assets as a ZIP</div>
              </div>
              <button
                disabled
                style={{ padding: '6px 14px', borderRadius: 9, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text3)', fontSize: 12, fontWeight: 600, cursor: 'not-allowed', fontFamily: 'inherit', opacity: 0.5 }}
              >
                Export
              </button>
            </div>
          </div>
        </div>

        {/* ── Danger zone ── */}
        <div id="settings-danger" style={{ marginTop: 8, marginBottom: 32 }}>
          <SectionLabel>Danger zone</SectionLabel>
          <div style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 14, padding: '14px 18px' }}>
            <div className="flex items-center justify-between">
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pv-text)' }}>Delete account</div>
                <div style={{ fontSize: 11, color: 'var(--pv-text3)' }}>Permanently delete your account and all assets</div>
              </div>
              <button
                onClick={() => setShowDelete(true)}
                style={{ padding: '6px 14px', borderRadius: 9, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                className="hover:bg-red-500/20 transition-colors"
              >
                Delete account
              </button>
            </div>
            {deleteError && <div style={{ fontSize: 12, color: '#f87171', marginTop: 8 }}>{deleteError}</div>}
          </div>
        </div>

      </div>
    </div>
  )

  const modals = (
    <>
      {showGallery && user && (
        <GalleryPicker
          userId={user.id}
          onPick={url => { setAvatarUrl(url); setProfileDirty(true) }}
          onClose={() => setShowGallery(false)}
        />
      )}
      {showDelete && (
        <DeleteModal onConfirm={deleteAccount} onClose={() => { setShowDelete(false); setDeleteError(null) }} loading={deleting} />
      )}
    </>
  )

  // ── Drawer mode ─────────────────────────────────────────────────────────────
  if (asDrawer) {
    return (
      <>
        <div className="flex flex-col h-full" style={{ background: 'var(--pv-bg)', color: 'var(--pv-text)', fontFamily: "'DM Sans', sans-serif" }}>
          {/* Drawer header */}
          <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--pv-border)' }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 17, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.03em' }}>
              Settings
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center justify-center rounded-[8px] transition-all cursor-pointer"
                style={{ width: 32, height: 32, background: 'var(--pv-surface2)', color: 'var(--pv-text3)', border: 'none' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--pv-text)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--pv-text3)')}
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <polygon points="15,4 15,20 5,12"/>
                </svg>
              </button>
            )}
          </div>
          {settingsBody}
        </div>
        {modals}
      </>
    )
  }

  // ── Full page mode ───────────────────────────────────────────────────────────
  return (
    <>
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--pv-bg)', color: 'var(--pv-text)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className="hidden sm:flex flex-col items-center py-4 gap-1 flex-shrink-0" style={{ width: 60, background: 'var(--pv-surface)', borderRight: '1px solid var(--pv-border)' }}>
        <a href="/dashboard" style={{ textDecoration: 'none', marginBottom: 8 }}>
          <div className="rounded-[10px] flex items-center justify-center" style={{ width: 36, height: 36, background: '#18140e' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        </a>
        <div className="mt-auto flex flex-col items-center gap-1">
          <SbBtn tip="Dashboard" onClick={() => window.location.href = '/dashboard'}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </SbBtn>
          <SbBtn tip="Sign out" onClick={signOut}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </SbBtn>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="sm:hidden flex items-center justify-between px-4 flex-shrink-0" style={{ height: 52, background: 'var(--pv-surface)', borderBottom: '1px solid var(--pv-border)' }}>
          <Logo height={18} />
          <div className="flex items-center gap-3">
            <a href="/dashboard" style={{ fontSize: 12, color: 'var(--pv-text3)', textDecoration: 'none' }}>← Dashboard</a>
            <button onClick={signOut} style={{ fontSize: 12, color: 'var(--pv-text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
          </div>
        </div>

        {settingsBody}
      </div>
    </div>

    {modals}
    </>
  )
}
