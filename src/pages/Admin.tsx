import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'

const TIERS = ['newbie', 'creator', 'studio', 'pro'] as const
type Tier = typeof TIERS[number]

const TIER_COLORS: Record<Tier, string> = {
  newbie:  'bg-[var(--pv-surface2)] text-[var(--pv-text2)] border-[var(--pv-border)]',
  creator: 'bg-[#0050ff]/10 text-[#6699ff] border-[#0050ff]/20',
  studio:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  pro:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

interface UserRow {
  id: string
  email: string
  display_name: string | null
  tier: Tier
  created_at: string
  asset_count: number
}

interface CostByModel {
  name: string
  slug: string
  provider: string
  predicted_cost: number | null
  cost_notes: string | null
  avg_actual_cost: number | null
  total_cost: number
  count: number
}

interface VideoByModel {
  name: string
  slug: string
  provider: string
  txt2vid: number
  img2vid: number
}

interface ImageByModel {
  name: string
  slug: string
  provider: string
  txt2img: number
  img2img: number
}

interface UserDetail {
  profile: { id: string; email: string; display_name: string | null; tier: Tier; created_at: string; is_admin: boolean }
  total_assets: number
  assets_today: number
  gen_type_totals: Record<string, number>
  by_model: Array<{ name: string; slug: string; provider: string; count: number; total_cost: number }>
  total_spend: number
  period_spend: number
}

interface Stats {
  total_users: number
  by_tier: Record<Tier, number>
  total_assets: number
  assets_today: number
  new_users_today: number
  period_spend: number
  total_spend: number
  cost_by_model: CostByModel[]
  gen_type_totals: Record<string, number>
  video_by_model: VideoByModel[]
  image_by_model: ImageByModel[]
}

// ─── Self-hosting reference data ─────────────────────────────────────────────
// gpuSecondsH100: avg inference time on H100 per generation
// falCostPer: fal.ai list price per generation
// open: weights are publicly available — can actually be self-hosted
const SELF_HOST_REF: { slug: string; name: string; falCostPer: number; gpuSecondsH100: number; open: true }[] = [
  { slug: 'flux-schnell',       name: 'Flux Schnell',      falCostPer: 0.003,  gpuSecondsH100: 4,   open: true },
  { slug: 'flux-dev',           name: 'Flux Dev',          falCostPer: 0.025,  gpuSecondsH100: 28,  open: true },
  { slug: 'flux-dev-img2img',   name: 'Flux Dev img2img',  falCostPer: 0.025,  gpuSecondsH100: 28,  open: true },
]

// Open-weight models on fal.ai worth adding to prmptVAULT
const ADDABLE_MODELS = [
  { name: 'SDXL Lightning',     provider: 'ByteDance',       slug: 'fal-ai/lightning-models',         note: '4-step SDXL, extremely fast' },
  { name: 'HiDream',            provider: 'HiDream.ai',      slug: 'fal-ai/hidream-i1-fast',          note: 'New high-quality open image model' },
  { name: 'Stable Diffusion 3.5',provider: 'Stability AI',   slug: 'fal-ai/stable-diffusion-v35-large', note: 'Best SD release yet, Apache 2.0' },
  { name: 'FLUX.1 Kontext',     provider: 'BFL',             slug: 'fal-ai/flux-pro/kontext',         note: 'In-context image editing + generation' },
  { name: 'OmniGen2',           provider: 'OmniGen',         slug: 'fal-ai/omnigen-v2',               note: 'Multi-modal, instruction-based editing' },
  { name: 'Sana',               provider: 'NVIDIA',          slug: 'fal-ai/sana',                     note: 'Ultra-fast, linear-attention architecture' },
]

// ─── tiny shared primitives ──────────────────────────────────────────────────

function Card({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 14 }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pv-text3)', marginBottom: 12 }}>
      {children}
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent?: string }) {
  return (
    <Card className="p-4">
      <div style={{ fontSize: 10, color: 'var(--pv-text3)', marginBottom: 5, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: accent ?? 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.03em' }}>{value}</div>
    </Card>
  )
}

function BarChart({
  rows, colorA, colorB, keyA, keyB,
}: {
  rows: Array<{ name: string; slug: string; [key: string]: string | number }>
  colorA: string; colorB: string; labelA: string; labelB: string
  keyA: string; keyB: string
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
            <div style={{ width: 130, fontSize: 12, color: 'var(--pv-text)', fontWeight: 500, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {m.name}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: 2, height: 20, alignItems: 'center' }}>
              {a > 0 && (
                <div style={{
                  height: '100%', borderRadius: b > 0 ? '4px 2px 2px 4px' : '4px',
                  background: colorA, width: `${(a / maxTotal) * 80}%`, minWidth: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.7)',
                }}>{a}</div>
              )}
              {b > 0 && (
                <div style={{
                  height: '100%', borderRadius: a > 0 ? '2px 4px 4px 2px' : '4px',
                  background: colorB, width: `${(b / maxTotal) * 80}%`, minWidth: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.7)',
                }}>{b}</div>
              )}
            </div>
            <div style={{ fontSize: 11, color: 'var(--pv-text3)', width: 24, textAlign: 'right', flexShrink: 0 }}>{total}</div>
          </div>
        )
      })}
    </div>
  )
}

function SbBtn({ tip, active, onClick, children }: { tip?: string; active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={tip}
      className="relative flex items-center justify-center rounded-[11px] transition-all cursor-pointer"
      style={{ width: 40, height: 40, color: active ? 'var(--pv-accent)' : 'var(--pv-text3)', background: active ? 'var(--pv-surface2)' : 'transparent', border: 'none', flexShrink: 0 }}
      onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = 'var(--pv-text)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--pv-surface2)' } }}
      onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLButtonElement).style.color = 'var(--pv-text3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' } }}
    >
      {children}
    </button>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

type AdminView = 'stats' | 'users'

export default function Admin() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [view, setView] = useState<AdminView>('stats')
  const [users, setUsers] = useState<UserRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<Tier | 'all'>('all')
  const [loading, setLoading] = useState(true)
  const [gpuRate, setGpuRate] = useState(3.89) // $/hr — RunPod H100 default
  const [updatingTier, setUpdatingTier] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createEmail, setCreateEmail] = useState('')
  const [createPassword, setCreatePassword] = useState('')
  const [createName, setCreateName] = useState('')
  const [createTier, setCreateTier] = useState<Tier>('newbie')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editName, setEditName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [detailUser, setDetailUser] = useState<UserRow | null>(null)
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailEditName, setDetailEditName] = useState('')
  const [detailSaving, setDetailSaving] = useState(false)
  const [detailSaved, setDetailSaved] = useState(false)
  const [showDeleteUser, setShowDeleteUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState(false)
  const [deleteUserError, setDeleteUserError] = useState<string | null>(null)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { setLoading(false); return }
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-list-users`,
      { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY }, body: JSON.stringify({ user_token: token }) }
    )
    const data = await res.json()
    if (data.error) { setLoading(false); return }
    const rows: UserRow[] = data.users.map((p: UserRow) => ({ ...p, tier: p.tier as Tier }))
    setUsers(rows)
    const byTier = { newbie: 0, creator: 0, studio: 0, pro: 0 } as Record<Tier, number>
    rows.forEach(r => { byTier[r.tier] = (byTier[r.tier] ?? 0) + 1 })
    const today = new Date().toISOString().slice(0, 10)
    setStats({
      total_users: rows.length,
      by_tier: byTier,
      total_assets: rows.reduce((a, r) => a + r.asset_count, 0),
      assets_today: data.assets_today ?? 0,
      new_users_today: rows.filter(r => r.created_at.startsWith(today)).length,
      period_spend: data.period_spend ?? 0,
      total_spend: data.total_spend ?? 0,
      cost_by_model: data.cost_by_model ?? [],
      gen_type_totals: data.gen_type_totals ?? {},
      video_by_model: data.video_by_model ?? [],
      image_by_model: data.image_by_model ?? [],
    })
    setLoading(false)
  }

  async function changeTier(targetUserId: string, newTier: Tier) {
    setUpdatingTier(targetUserId)
    try {
      const { error } = await supabase.rpc('admin_set_tier', { target_user_id: targetUserId, new_tier: newTier })
      if (error) throw new Error(error.message)
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, tier: newTier } : u))
      if (stats) {
        const oldTier = users.find(u => u.id === targetUserId)?.tier
        if (oldTier) setStats(prev => prev ? { ...prev, by_tier: { ...prev.by_tier, [oldTier]: prev.by_tier[oldTier] - 1, [newTier]: prev.by_tier[newTier] + 1 } } : null)
      }
    } catch (err) {
      console.error(err)
      alert(`Tier update failed: ${err instanceof Error ? err.message : err}`)
    }
    setUpdatingTier(null)
  }

  async function createUser() {
    if (!createEmail.trim()) return
    setCreating(true); setCreateError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ user_token: token, email: createEmail.trim(), password: createPassword.trim() || undefined, display_name: createName.trim() || undefined, tier: createTier }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`)
      setShowCreate(false); setCreateEmail(''); setCreatePassword(''); setCreateName(''); setCreateTier('newbie')
      loadAll()
    } catch (err) { setCreateError(err instanceof Error ? err.message : 'Failed to create user') }
    finally { setCreating(false) }
  }

  function openEdit(u: UserRow) { setEditUser(u); setEditEmail(u.email); setEditName(u.display_name ?? ''); setEditPassword(''); setEditError(null) }

  async function openUserDetail(u: UserRow) {
    setDetailUser(u)
    setUserDetail(null)
    setDetailLoading(true)
    setDetailEditName(u.display_name ?? '')
    setDetailSaved(false)
    setShowDeleteUser(false)
    setDeleteUserError(null)
    setDeleteConfirmText('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ user_token: token, target_user_id: u.id }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUserDetail(data)
    } catch (err) { console.error(err) }
    finally { setDetailLoading(false) }
  }

  async function saveEdit() {
    if (!editUser) return
    setSaving(true); setEditError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({
          target_user_id: editUser.id,
          ...(editEmail.trim() !== editUser.email ? { email: editEmail.trim() } : {}),
          ...(editName.trim() !== (editUser.display_name ?? '') ? { display_name: editName.trim() } : {}),
          ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, email: editEmail.trim(), display_name: editName.trim() || null } : u))
      setEditUser(null)
    } catch (err) { setEditError(err instanceof Error ? err.message : 'Save failed') }
    finally { setSaving(false) }
  }

  async function saveDetailName() {
    if (!detailUser) return
    setDetailSaving(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ target_user_id: detailUser.id, display_name: detailEditName.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setUsers(prev => prev.map(u => u.id === detailUser.id ? { ...u, display_name: detailEditName.trim() || null } : u))
      setDetailUser(prev => prev ? { ...prev, display_name: detailEditName.trim() || null } : null)
      setDetailSaved(true)
      setTimeout(() => setDetailSaved(false), 2000)
    } catch {}
    setDetailSaving(false)
  }

  async function deleteDetailUser() {
    if (!detailUser) return
    setDeletingUser(true); setDeleteUserError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ user_token: token, target_user_id: detailUser.id }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? 'Failed to delete user')
      setUsers(prev => prev.filter(u => u.id !== detailUser.id))
      setDetailUser(null)
      loadAll()
    } catch (err) { setDeleteUserError(err instanceof Error ? err.message : 'Delete failed') }
    setDeletingUser(false)
  }

  const filtered = users.filter(u => {
    const matchTier = tierFilter === 'all' || u.tier === tierFilter
    const q = search.toLowerCase()
    return matchTier && (!q || u.email.toLowerCase().includes(q) || (u.display_name ?? '').toLowerCase().includes(q))
  })

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <>
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--pv-bg)', color: 'var(--pv-text)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Icon Sidebar (desktop) ── */}
      <aside className="hidden sm:flex flex-col items-center py-4 gap-1 flex-shrink-0" style={{ width: 60, background: 'var(--pv-surface)', borderRight: '1px solid var(--pv-border)' }}>
        {/* Logo */}
        <a href="/dashboard" style={{ textDecoration: 'none', marginBottom: 4 }}>
          <div className="rounded-[10px] flex items-center justify-center" style={{ width: 36, height: 36, background: '#18140e' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
        </a>

        {/* Admin badge */}
        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: 'rgba(245,200,66,0.12)', color: '#f5c842', border: '1px solid rgba(245,200,66,0.2)', letterSpacing: '0.04em', marginBottom: 8 }}>
          ADMIN
        </span>

        {/* Nav: Stats */}
        <SbBtn tip="Stats" active={view === 'stats'} onClick={() => setView('stats')}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </SbBtn>

        {/* Nav: Users */}
        <SbBtn tip="Users" active={view === 'users'} onClick={() => setView('users')}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </SbBtn>

        {/* Bottom actions */}
        <div className="mt-auto flex flex-col items-center gap-1">
          {/* Theme toggle */}
          <SbBtn tip={theme === 'dark' ? 'Light mode' : 'Dark mode'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </SbBtn>
          {/* Back to dashboard */}
          <SbBtn tip="Dashboard" onClick={() => window.location.href = '/dashboard'}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </SbBtn>
          {/* Sign out */}
          <SbBtn tip="Sign out" onClick={signOut}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </SbBtn>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Mobile top bar */}
        <div className="sm:hidden flex items-center justify-between px-4 flex-shrink-0" style={{ height: 52, background: 'var(--pv-surface)', borderBottom: '1px solid var(--pv-border)' }}>
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--pv-text)' }}>
              prmpt<span style={{ color: 'var(--pv-accent)' }}>VAULT</span>
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 99, background: 'rgba(245,200,66,0.12)', color: '#f5c842', border: '1px solid rgba(245,200,66,0.2)' }}>ADMIN</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/dashboard" style={{ fontSize: 12, color: 'var(--pv-text3)', textDecoration: 'none' }}>← Dashboard</a>
            <button onClick={signOut} style={{ fontSize: 12, color: 'var(--pv-text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

            {/* Page header */}
            <div className="mb-6">
              <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 24, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.05em', lineHeight: 1.1 }}>
                {view === 'stats' ? 'Stats' : 'Users'}
              </h1>
              <p style={{ fontSize: 13, color: 'var(--pv-text3)', marginTop: 3 }}>{user?.email}</p>
            </div>

            {/* ── Stats view ── */}
            {view === 'stats' && stats && (
              <>
              {/* Row 1 — 8 count cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-3">
                <StatCard label="Total Users"  value={stats.total_users}                            accent="var(--pv-text)" />
                <StatCard label="New Today"    value={stats.new_users_today}                        accent="var(--pv-accent)" />
                <StatCard label="Assets Today" value={stats.assets_today}                           accent="var(--pv-accent)" />
                <StatCard label="Total Assets" value={stats.total_assets}                           accent="var(--pv-text)" />
                <StatCard label="txt2img"      value={stats.gen_type_totals['txt2img'] ?? 0}        accent="var(--pv-text2)" />
                <StatCard label="img2img"      value={stats.gen_type_totals['img2img'] ?? 0}        accent="var(--pv-text2)" />
                <StatCard label="txt2vid"      value={stats.gen_type_totals['txt2vid'] ?? 0}        accent="#a78bfa" />
                <StatCard label="img2vid"      value={stats.gen_type_totals['img2vid'] ?? 0}        accent="#c084fc" />
              </div>

              {/* Row 2 — tier cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <StatCard label="Newbie"  value={stats.by_tier.newbie}  accent="var(--pv-text2)" />
                <StatCard label="Creator" value={stats.by_tier.creator} accent="#6699ff" />
                <StatCard label="Studio"  value={stats.by_tier.studio}  accent="#c084fc" />
                <StatCard label="Pro"     value={stats.by_tier.pro}     accent="#f5c842" />
              </div>

              {/* Row 3 — image + video charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                {([
                  { title: 'Image Assets · by Model & Type', data: stats.image_by_model as unknown as Array<{ name: string; slug: string; [key: string]: string | number }>, keyA: 'txt2img', keyB: 'img2img', labelA: 'txt2img', labelB: 'img2img', colorA: 'var(--pv-accent)', colorB: '#7aabff' },
                  { title: 'Video Assets · by Model & Type', data: stats.video_by_model as unknown as Array<{ name: string; slug: string; [key: string]: string | number }>, keyA: 'txt2vid', keyB: 'img2vid', labelA: 'txt2vid', labelB: 'img2vid', colorA: '#a78bfa', colorB: '#c084fc' },
                ]).map(chart => (
                  <Card key={chart.title} className="p-4 sm:p-5">
                    <div className="flex items-center justify-between mb-3">
                      <SectionLabel>{chart.title}</SectionLabel>
                      <div className="flex gap-3 text-[10px]" style={{ color: 'var(--pv-text3)', marginBottom: 12 }}>
                        <span style={{ color: chart.colorA }}>■ {chart.labelA}</span>
                        <span style={{ color: chart.colorB }}>■ {chart.labelB}</span>
                      </div>
                    </div>
                    {chart.data.length === 0
                      ? <div style={{ fontSize: 12, color: 'var(--pv-text3)' }}>No data yet</div>
                      : <BarChart rows={chart.data} colorA={chart.colorA} colorB={chart.colorB} labelA={chart.labelA} labelB={chart.labelB} keyA={chart.keyA} keyB={chart.keyB} />
                    }
                  </Card>
                ))}
              </div>

              {/* Row 4 — spend + cost table */}
              <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-3 mb-8">

                {/* Spend tracker */}
                <Card className="p-5">
                  <SectionLabel>Spend — This Month</SectionLabel>
                  <div style={{ fontSize: 34, fontWeight: 700, color: 'var(--pv-text)', letterSpacing: '-0.04em', fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: 2 }}>
                    ${stats.period_spend.toFixed(4)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--pv-text3)', marginBottom: 16 }}>${stats.total_spend.toFixed(4)} all time</div>
                  <div style={{ height: 3, background: 'var(--pv-surface2)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: 'linear-gradient(90deg, var(--pv-accent), #7aabff)',
                      width: stats.total_spend > 0 ? `${Math.min((stats.period_spend / stats.total_spend) * 100, 100)}%` : '0%',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--pv-text3)', marginTop: 6 }}>
                    {stats.total_spend > 0 ? `${((stats.period_spend / stats.total_spend) * 100).toFixed(0)}% of all-time` : 'No cost data yet'}
                  </div>
                </Card>

                {/* Cost table */}
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <SectionLabel>Cost per Generation · Predicted vs Actual</SectionLabel>
                    <div className="flex gap-4 text-[10px]" style={{ color: 'var(--pv-text3)', marginBottom: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: 'var(--pv-text3)', display: 'inline-block' }} />Predicted</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: 2, background: '#7aabff', display: 'inline-block' }} />Actual</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--pv-border)' }}>
                          {['Model', 'Provider', 'Predicted', 'Actual Avg', 'Δ', 'Runs', 'Total', 'Unit'].map(h => (
                            <th key={h} className="pb-2 text-left pr-4" style={{ fontSize: 10, fontWeight: 600, color: 'var(--pv-text3)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.cost_by_model.map(m => {
                          const delta = (m.avg_actual_cost != null && m.predicted_cost != null) ? m.avg_actual_cost - m.predicted_cost : null
                          const deltaColor = delta == null ? 'var(--pv-text3)' : delta > 0.001 ? '#f87171' : delta < -0.001 ? '#34c759' : 'var(--pv-text2)'
                          return (
                            <tr key={m.slug} style={{ borderBottom: '1px solid var(--pv-border)' }}>
                              <td className="py-2 pr-4" style={{ color: 'var(--pv-text)', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>{m.name}</td>
                              <td className="py-2 pr-4" style={{ color: 'var(--pv-text3)', fontSize: 11 }}>{m.provider}</td>
                              <td className="py-2 pr-4" style={{ color: 'var(--pv-text2)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{m.predicted_cost != null ? `$${m.predicted_cost.toFixed(4)}` : '—'}</td>
                              <td className="py-2 pr-4" style={{ color: m.avg_actual_cost != null ? '#7aabff' : 'var(--pv-text3)', fontSize: 12, fontWeight: m.avg_actual_cost != null ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>{m.avg_actual_cost != null ? `$${m.avg_actual_cost.toFixed(4)}` : '—'}</td>
                              <td className="py-2 pr-4" style={{ color: deltaColor, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{delta != null ? `${delta >= 0 ? '+' : ''}$${delta.toFixed(4)}` : '—'}</td>
                              <td className="py-2 pr-4" style={{ color: 'var(--pv-text2)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{m.count > 0 ? m.count.toLocaleString() : '—'}</td>
                              <td className="py-2 pr-4" style={{ color: 'var(--pv-text2)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{m.total_cost > 0 ? `$${m.total_cost.toFixed(4)}` : '—'}</td>
                              <td className="py-2" style={{ color: 'var(--pv-text3)', fontSize: 11, whiteSpace: 'nowrap' }}>{m.cost_notes ?? '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* Row 5 — Self-hosting planner */}
              {(() => {
                const gpuCostPerSec = gpuRate / 3600
                const rows = SELF_HOST_REF.map(ref => {
                  const model = stats.cost_by_model.find(m => m.slug === ref.slug)
                  const monthlyCount = model?.count ?? 0
                  const monthlyFal = monthlyCount * ref.falCostPer
                  const selfHostPerGen = gpuCostPerSec * ref.gpuSecondsH100
                  const monthlySelfHost = monthlyCount * selfHostPerGen
                  // breakeven: how many gens/month until self-host is cheaper
                  // (only relevant for cloud GPU — own hardware is fixed cost)
                  const breakeven = Math.ceil(gpuRate * 24 * 30 / (ref.falCostPer - selfHostPerGen > 0 ? ref.falCostPer - selfHostPerGen : Infinity))
                  const pct = breakeven === Infinity ? 0 : Math.min((monthlyCount / breakeven) * 100, 100)
                  const savings = monthlyFal - monthlySelfHost
                  return { ...ref, monthlyCount, monthlyFal, selfHostPerGen, monthlySelfHost, breakeven, pct, savings }
                })
                const totalFalOpen = rows.reduce((s, r) => s + r.monthlyFal, 0)
                const totalSelfHost = rows.reduce((s, r) => s + r.monthlySelfHost, 0)
                return (
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-3 mb-8">
                    <Card className="p-5">
                      <div className="flex items-center gap-3 mb-4 flex-wrap">
                        <SectionLabel>Self-Hosting Planner · Open-Weight Models</SectionLabel>
                        <div className="flex items-center gap-2 ml-auto" style={{ marginBottom: 12 }}>
                          <span style={{ fontSize: 11, color: 'var(--pv-text3)' }}>GPU $/hr</span>
                          <input
                            type="number"
                            min={0.5} max={20} step={0.1}
                            value={gpuRate}
                            onChange={e => setGpuRate(parseFloat(e.target.value) || 3.89)}
                            style={{ width: 68, padding: '3px 8px', borderRadius: 7, border: '1px solid var(--pv-border)', background: 'var(--pv-surface2)', color: 'var(--pv-text)', fontSize: 12, fontFamily: 'inherit', outline: 'none' }}
                          />
                          <span style={{ fontSize: 10, color: 'var(--pv-text3)' }}>RunPod H100 ≈ $3.89</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {rows.map(r => {
                          const barColor = r.pct >= 80 ? '#f87171' : r.pct >= 50 ? '#f5c842' : 'var(--pv-accent)'
                          return (
                            <div key={r.slug}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--pv-text)' }}>{r.name}</span>
                                <span style={{ fontSize: 11, color: 'var(--pv-text3)' }}>fal.ai ${r.falCostPer.toFixed(3)}/gen · self-host ${r.selfHostPerGen.toFixed(4)}/gen</span>
                                <span style={{ marginLeft: 'auto', fontSize: 11, color: r.savings > 0 ? '#34c759' : r.savings < 0 ? '#f87171' : 'var(--pv-text3)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                  {r.monthlyCount === 0 ? 'No data yet' : r.savings > 0 ? `fal saves $${r.savings.toFixed(2)}/mo at current vol` : `self-host saves $${Math.abs(r.savings).toFixed(2)}/mo`}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ flex: 1, height: 6, background: 'var(--pv-surface2)', borderRadius: 99, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${r.pct}%`, background: barColor, borderRadius: 99, transition: 'width 0.4s' }} />
                                </div>
                                <span style={{ fontSize: 11, color: 'var(--pv-text3)', whiteSpace: 'nowrap', minWidth: 120, textAlign: 'right' }}>
                                  {r.monthlyCount.toLocaleString()} gens · breakeven at {r.breakeven === Infinity ? 'N/A' : r.breakeven.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--pv-border)', display: 'flex', gap: 24, fontSize: 12, color: 'var(--pv-text3)' }}>
                        <span>Open-weight fal spend this month: <strong style={{ color: 'var(--pv-text)' }}>${totalFalOpen.toFixed(4)}</strong></span>
                        <span>If self-hosted: <strong style={{ color: 'var(--pv-text)' }}>${totalSelfHost.toFixed(4)}</strong></span>
                        <span style={{ color: totalFalOpen < totalSelfHost ? '#34c759' : '#f5c842' }}>
                          {totalFalOpen <= totalSelfHost ? `fal.ai saves $${(totalSelfHost - totalFalOpen).toFixed(4)} at current volume` : `self-host would save $${(totalFalOpen - totalSelfHost).toFixed(4)}/mo now`}
                        </span>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 10, color: 'var(--pv-text3)' }}>
                        Breakeven assumes a dedicated 24/7 cloud GPU instance. Your own hardware (4090) ≈ $82/mo fixed — breakeven at ~{Math.ceil(82 / 0.003).toLocaleString()} Schnell gens or ~{Math.ceil(82 / 0.025).toLocaleString()} Dev gens/month.
                      </div>
                    </Card>

                    <Card className="p-5">
                      <SectionLabel>Open Models to Add</SectionLabel>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {ADDABLE_MODELS.map(m => (
                          <div key={m.slug} style={{ paddingBottom: 10, borderBottom: '1px solid var(--pv-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pv-text)' }}>{m.name}</span>
                              <span style={{ fontSize: 10, color: 'var(--pv-text3)' }}>{m.provider}</span>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--pv-text3)' }}>{m.note}</div>
                            <div style={{ fontSize: 10, color: 'var(--pv-accent)', marginTop: 3, fontFamily: 'monospace', opacity: 0.7 }}>{m.slug}</div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                )
              })()}

              </>
            )}

            {/* ── Users view ── */}
            {view === 'users' && <><div className="flex gap-3 mb-4 flex-wrap items-center">
              <input
                type="text"
                placeholder="Search email or name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 12, padding: '8px 14px', fontSize: 13, color: 'var(--pv-text)', outline: 'none', width: '100%', maxWidth: 260 }}
                className="pv-placeholder focus:border-[var(--pv-accent)] transition-colors"
              />
              <div className="flex gap-1" style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 12, padding: 4 }}>
                {(['all', ...TIERS] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTierFilter(t)}
                    style={tierFilter === t
                      ? { background: 'var(--pv-surface2)', color: 'var(--pv-text)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }
                      : { color: 'var(--pv-text3)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }
                    }
                    className="capitalize transition-colors hover:text-[var(--pv-text)]"
                  >{t}</button>
                ))}
              </div>
              <span style={{ fontSize: 12, color: 'var(--pv-text3)', marginLeft: 'auto' }}>{filtered.length} users</span>
              <button
                onClick={() => { setShowCreate(true); setCreateError(null) }}
                style={{ background: 'var(--pv-accent)', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                className="hover:opacity-90 transition-opacity"
              >+ Add user</button>
            </div>

            <Card>
              {loading ? (
                <div className="flex items-center justify-center py-20 text-sm animate-pulse" style={{ color: 'var(--pv-text3)' }}>Loading users…</div>
              ) : filtered.length === 0 ? (
                <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--pv-text3)' }}>No users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--pv-border)' }}>
                        {['User', 'Tier', 'Assets', 'Joined', 'Change Tier', 'Edit'].map(h => (
                          <th key={h} className="px-5 py-3 text-left" style={{ fontSize: 11, fontWeight: 600, color: 'var(--pv-text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(u => (
                        <tr key={u.id} onClick={() => openUserDetail(u)} style={{ borderBottom: '1px solid var(--pv-border)', cursor: 'pointer' }} className={`transition-colors hover:bg-white/[0.03] ${u.email === user?.email ? 'bg-amber-500/[0.03]' : ''}`}>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--pv-text2)', flexShrink: 0 }}>
                                {(u.display_name ?? u.email)[0].toUpperCase()}
                              </div>
                              <div>
                                <div style={{ color: 'var(--pv-text)', fontWeight: 500, fontSize: 13, lineHeight: 1.3 }}>
                                  {u.display_name ?? '—'}
                                  {u.email === user?.email && <span style={{ marginLeft: 6, fontSize: 10, color: '#f5c842', fontWeight: 700 }}>YOU</span>}
                                </div>
                                <div style={{ color: 'var(--pv-text3)', fontSize: 11.5 }}>{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${TIER_COLORS[u.tier]}`}>{u.tier}</span>
                          </td>
                          <td className="px-5 py-3.5" style={{ color: 'var(--pv-text2)', fontSize: 13 }}>{u.asset_count}</td>
                          <td className="px-5 py-3.5" style={{ color: 'var(--pv-text3)', fontSize: 12 }}>
                            {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                            <div className="flex gap-1">
                              {TIERS.map(t => (
                                <button
                                  key={t}
                                  onClick={() => changeTier(u.id, t)}
                                  disabled={u.tier === t || updatingTier === u.id}
                                  style={u.tier === t
                                    ? { background: 'var(--pv-surface2)', color: 'var(--pv-text)', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'default', fontFamily: 'inherit' }
                                    : { color: 'var(--pv-text3)', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }
                                  }
                                  className="capitalize transition-colors hover:text-[var(--pv-text)] hover:bg-white/5 disabled:opacity-40"
                                >{updatingTier === u.id && u.tier !== t ? '…' : t}</button>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => openEdit(u)}
                              style={{ color: 'var(--pv-text3)', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                              className="hover:bg-white/5 hover:text-[var(--pv-text)] transition-colors"
                            >Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card></>}

          </div>
        </div>
      </div>
    </div>

    {/* ── User Detail Panel ── */}
    {detailUser && (
      <div className="fixed inset-0 z-40 flex" onClick={() => setDetailUser(null)}>
        {/* backdrop */}
        <div className="flex-1 bg-black/40 backdrop-blur-sm" />
        {/* panel */}
        <div
          className="flex flex-col overflow-y-auto"
          style={{ width: '100%', maxWidth: 480, background: 'var(--pv-surface)', borderLeft: '1px solid var(--pv-border)', height: '100%' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--pv-border)', flexShrink: 0 }}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3" style={{ flex: 1, minWidth: 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: 'var(--pv-text2)', flexShrink: 0 }}>
                  {(detailUser.display_name ?? detailUser.email)[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    type="text"
                    value={detailEditName}
                    onChange={e => setDetailEditName(e.target.value)}
                    placeholder="Display name"
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--pv-text)', letterSpacing: '-0.02em', padding: 0, marginBottom: 2 }}
                    className="focus:underline focus:decoration-dashed focus:decoration-[var(--pv-text3)]"
                  />
                  <div style={{ fontSize: 12, color: 'var(--pv-text3)' }}>{detailUser.email}</div>
                </div>
              </div>
              <button onClick={() => setDetailUser(null)} style={{ color: 'var(--pv-text3)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }} className="hover:text-[var(--pv-text)] transition-colors">✕</button>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${TIER_COLORS[detailUser.tier]}`}>{detailUser.tier}</span>
              <span style={{ fontSize: 11, color: 'var(--pv-text3)' }}>Joined {new Date(detailUser.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {detailEditName !== (detailUser.display_name ?? '') && (
                <button
                  onClick={saveDetailName}
                  disabled={detailSaving}
                  style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 8, background: 'var(--pv-accent)', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  className="hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {detailSaving ? 'Saving…' : 'Save name'}
                </button>
              )}
              {detailSaved && <span style={{ fontSize: 12, color: '#34c759', marginLeft: 'auto' }}>Saved ✓</span>}
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: 24, flex: 1 }}>
            {detailLoading ? (
              <div className="flex items-center justify-center py-16 animate-pulse" style={{ color: 'var(--pv-text3)', fontSize: 13 }}>Loading…</div>
            ) : userDetail ? (
              <>
                {/* Asset count stats */}
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pv-text3)', marginBottom: 10 }}>Assets</div>
                <div className="grid grid-cols-3 gap-2 mb-5">
                  {[
                    { label: 'Total',    value: userDetail.total_assets,                          accent: 'var(--pv-text)' },
                    { label: 'Today',    value: userDetail.assets_today,                          accent: 'var(--pv-accent)' },
                    { label: 'txt2img',  value: userDetail.gen_type_totals['txt2img']  ?? 0,      accent: 'var(--pv-text2)' },
                    { label: 'img2img',  value: userDetail.gen_type_totals['img2img']  ?? 0,      accent: 'var(--pv-text2)' },
                    { label: 'txt2vid',  value: userDetail.gen_type_totals['txt2vid']  ?? 0,      accent: '#a78bfa' },
                    { label: 'img2vid',  value: userDetail.gen_type_totals['img2vid']  ?? 0,      accent: '#c084fc' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--pv-bg)', border: '1px solid var(--pv-border)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 9, color: 'var(--pv-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: s.accent, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.03em' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Spend */}
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pv-text3)', marginBottom: 10 }}>Spend</div>
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {[
                    { label: 'This month', value: `$${userDetail.period_spend.toFixed(4)}` },
                    { label: 'All time',   value: `$${userDetail.total_spend.toFixed(4)}` },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--pv-bg)', border: '1px solid var(--pv-border)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 9, color: 'var(--pv-text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.03em' }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* By model */}
                {userDetail.by_model.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pv-text3)', marginBottom: 10 }}>By Model</div>
                    <div style={{ background: 'var(--pv-bg)', border: '1px solid var(--pv-border)', borderRadius: 10, overflow: 'hidden' }}>
                      {userDetail.by_model.map((m, i) => (
                        <div key={m.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 14px', borderBottom: i < userDetail.by_model.length - 1 ? '1px solid var(--pv-border)' : undefined }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--pv-text)' }}>{m.name}</div>
                            <div style={{ fontSize: 10, color: 'var(--pv-text3)' }}>{m.provider}</div>
                          </div>
                          <div className="text-right">
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--pv-accent)' }}>{m.count}</div>
                            {m.total_cost > 0 && <div style={{ fontSize: 10, color: 'var(--pv-text3)' }}>${m.total_cost.toFixed(4)}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {userDetail.total_assets === 0 && (
                  <div style={{ fontSize: 13, color: 'var(--pv-text3)', textAlign: 'center', paddingTop: 24 }}>No assets yet</div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--pv-text3)', textAlign: 'center', paddingTop: 24 }}>Failed to load</div>
            )}

            {/* ── Danger zone ── */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--pv-border)' }}>
              {!showDeleteUser ? (
                <button
                  onClick={() => { setShowDeleteUser(true); setDeleteConfirmText(''); setDeleteUserError(null) }}
                  style={{ width: '100%', padding: '10px 0', borderRadius: 10, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  className="hover:bg-red-500/15 transition-colors"
                >
                  Delete user account
                </button>
              ) : (
                <div style={{ background: 'rgba(248,113,113,0.04)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 13, color: '#f87171', fontWeight: 600, marginBottom: 6 }}>Delete {detailUser.display_name ?? detailUser.email}?</div>
                  <div style={{ fontSize: 12, color: 'var(--pv-text3)', marginBottom: 10 }}>This permanently deletes their account and all assets. Type <strong style={{ color: 'var(--pv-text)' }}>DELETE</strong> to confirm.</div>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    style={{ width: '100%', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: 'var(--pv-text)', outline: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }}
                  />
                  {deleteUserError && <div style={{ fontSize: 12, color: '#f87171', marginBottom: 8 }}>{deleteUserError}</div>}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowDeleteUser(false)} style={{ flex: 1, padding: '8px 0', borderRadius: 9, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', color: 'var(--pv-text2)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    <button
                      onClick={deleteDetailUser}
                      disabled={deleteConfirmText !== 'DELETE' || deletingUser}
                      style={{ flex: 1, padding: '8px 0', borderRadius: 9, background: deleteConfirmText === 'DELETE' ? '#f87171' : 'var(--pv-surface2)', border: 'none', color: deleteConfirmText === 'DELETE' ? '#fff' : 'var(--pv-text3)', fontSize: 12, fontWeight: 700, cursor: deleteConfirmText === 'DELETE' ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s' }}
                    >
                      {deletingUser ? 'Deleting…' : 'Delete user'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ── Modal: Create user ── */}
    {showCreate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setShowCreate(false)}>
        <Card className="p-6 w-full max-w-sm" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--pv-text)' }}>Add test user</h3>
            <button onClick={() => setShowCreate(false)} style={{ color: 'var(--pv-text3)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }} className="hover:text-[var(--pv-text)] transition-colors">✕</button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Email *', value: createEmail, setter: setCreateEmail, type: 'email', placeholder: 'test@example.com' },
              { label: 'Password', sub: 'leave blank to send magic link', value: createPassword, setter: setCreatePassword, type: 'text', placeholder: 'Set a password' },
              { label: 'Display name', sub: 'optional', value: createName, setter: setCreateName, type: 'text', placeholder: 'First Last' },
            ].map(({ label, sub, value, setter, type, placeholder }) => (
              <div key={label}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pv-text2)', display: 'block', marginBottom: 5 }}>
                  {label}{sub && <span style={{ color: 'var(--pv-text3)', fontWeight: 400 }}> ({sub})</span>}
                </label>
                <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                  style={{ width: '100%', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: 'var(--pv-text)', outline: 'none', boxSizing: 'border-box' }}
                  className="pv-placeholder focus:border-[var(--pv-accent)] transition-colors" />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pv-text2)', display: 'block', marginBottom: 5 }}>Tier</label>
              <div className="flex gap-2">
                {TIERS.map(t => (
                  <button key={t} onClick={() => setCreateTier(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all capitalize cursor-pointer ${createTier === t ? TIER_COLORS[t] + ' ring-1 ring-current' : 'text-[var(--pv-text3)] hover:text-[var(--pv-text)]'}`}
                    style={{ background: createTier === t ? undefined : 'var(--pv-surface2)', borderColor: createTier === t ? undefined : 'var(--pv-border)', fontFamily: 'inherit' }}
                  >{t}</button>
                ))}
              </div>
            </div>
            {createError && <p style={{ fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 10, padding: '8px 12px' }}>{createError}</p>}
            <button onClick={createUser} disabled={creating || !createEmail.trim()}
              style={{ width: '100%', padding: 10, background: 'var(--pv-accent)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#fff', border: 'none', marginTop: 4, cursor: 'pointer', fontFamily: 'inherit' }}
              className="hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >{creating ? 'Creating…' : 'Create user'}</button>
          </div>
        </Card>
      </div>
    )}

    {/* ── Modal: Edit user ── */}
    {editUser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setEditUser(null)}>
        <Card className="p-6 w-full max-w-sm" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--pv-text)' }}>Edit user</h3>
            <button onClick={() => setEditUser(null)} style={{ color: 'var(--pv-text3)', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }} className="hover:text-[var(--pv-text)] transition-colors">✕</button>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Email', value: editEmail, setter: setEditEmail, type: 'email', placeholder: '' },
              { label: 'Display name', value: editName, setter: setEditName, type: 'text', placeholder: '' },
              { label: 'New password', sub: 'leave blank to keep current', value: editPassword, setter: setEditPassword, type: 'text', placeholder: 'Enter new password' },
            ].map(({ label, sub, value, setter, type, placeholder }) => (
              <div key={label}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--pv-text2)', display: 'block', marginBottom: 5 }}>
                  {label}{sub && <span style={{ color: 'var(--pv-text3)', fontWeight: 400 }}> ({sub})</span>}
                </label>
                <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder}
                  style={{ width: '100%', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', borderRadius: 12, padding: '10px 12px', fontSize: 13, color: 'var(--pv-text)', outline: 'none', boxSizing: 'border-box' }}
                  className="pv-placeholder focus:border-[var(--pv-accent)] transition-colors" />
              </div>
            ))}
            {editError && <p style={{ fontSize: 12, color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.18)', borderRadius: 10, padding: '8px 12px' }}>{editError}</p>}
            <button onClick={saveEdit} disabled={saving}
              style={{ width: '100%', padding: 10, background: 'var(--pv-accent)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#fff', border: 'none', marginTop: 4, cursor: 'pointer', fontFamily: 'inherit' }}
              className="hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </Card>
      </div>
    )}
    </>
  )
}
