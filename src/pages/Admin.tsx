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
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
        body: JSON.stringify({ target_user_id: targetUserId, tier: newTier }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, tier: newTier } : u))
      if (stats) {
        const oldTier = users.find(u => u.id === targetUserId)?.tier
        if (oldTier) setStats(prev => prev ? { ...prev, by_tier: { ...prev.by_tier, [oldTier]: prev.by_tier[oldTier] - 1, [newTier]: prev.by_tier[newTier] + 1 } } : null)
      }
    } catch (err) { console.error(err) }
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
                        <tr key={u.id} style={{ borderBottom: '1px solid var(--pv-border)' }} className={`transition-colors hover:bg-white/[0.02] ${u.email === user?.email ? 'bg-amber-500/[0.03]' : ''}`}>
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
                          <td className="px-5 py-3.5">
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
                          <td className="px-5 py-3.5">
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
