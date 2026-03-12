import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const TIERS = ['newbie', 'creator', 'studio', 'pro'] as const
type Tier = typeof TIERS[number]

const TIER_COLORS: Record<Tier, string> = {
  newbie:  'bg-[#252220] text-[#9e9688] border-[#302d29]',
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

interface Stats {
  total_users: number
  by_tier: Record<Tier, number>
  total_assets: number
  assets_today: number
  new_users_today: number
  period_spend: number
  total_spend: number
  cost_by_model: CostByModel[]
}

export default function Admin() {
  const { user, signOut } = useAuth()
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
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ user_token: token }),
      }
    )
    const data = await res.json()
    if (data.error) { setLoading(false); return }

    const rows: UserRow[] = data.users.map((p: UserRow) => ({ ...p, tier: p.tier as Tier }))
    setUsers(rows)

    const byTier = { newbie: 0, creator: 0, studio: 0, pro: 0 } as Record<Tier, number>
    rows.forEach(r => { byTier[r.tier] = (byTier[r.tier] ?? 0) + 1 })
    const today = new Date().toISOString().slice(0, 10)
    const totalAssets = rows.reduce((a, r) => a + r.asset_count, 0)
    setStats({
      total_users: rows.length,
      by_tier: byTier,
      total_assets: totalAssets,
      assets_today: 0,
      new_users_today: rows.filter(r => r.created_at.startsWith(today)).length,
      period_spend: data.period_spend ?? 0,
      total_spend: data.total_spend ?? 0,
      cost_by_model: data.cost_by_model ?? [],
    })
    setLoading(false)
  }

  async function changeTier(targetUserId: string, newTier: Tier) {
    setUpdatingTier(targetUserId)
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ target_user_id: targetUserId, tier: newTier }),
        }
      )
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, tier: newTier } : u))
      if (stats) {
        const oldTier = users.find(u => u.id === targetUserId)?.tier
        if (oldTier) {
          setStats(prev => prev ? {
            ...prev,
            by_tier: {
              ...prev.by_tier,
              [oldTier]: prev.by_tier[oldTier] - 1,
              [newTier]: prev.by_tier[newTier] + 1,
            }
          } : null)
        }
      }
    } catch (err) {
      console.error(err)
    }
    setUpdatingTier(null)
  }

  async function createUser() {
    if (!createEmail.trim()) return
    setCreating(true)
    setCreateError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error('Not authenticated')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            user_token: token,
            email: createEmail.trim(),
            password: createPassword.trim() || undefined,
            display_name: createName.trim() || undefined,
            tier: createTier,
          }),
        }
      )
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? data.message ?? `HTTP ${res.status}`)
      setShowCreate(false)
      setCreateEmail(''); setCreatePassword(''); setCreateName(''); setCreateTier('newbie')
      loadAll()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  function openEdit(u: UserRow) {
    setEditUser(u)
    setEditEmail(u.email)
    setEditName(u.display_name ?? '')
    setEditPassword('')
    setEditError(null)
  }

  async function saveEdit() {
    if (!editUser) return
    setSaving(true)
    setEditError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            target_user_id: editUser.id,
            ...(editEmail.trim() !== editUser.email ? { email: editEmail.trim() } : {}),
            ...(editName.trim() !== (editUser.display_name ?? '') ? { display_name: editName.trim() } : {}),
            ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
          }),
        }
      )
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setUsers(prev => prev.map(u => u.id === editUser.id
        ? { ...u, email: editEmail.trim(), display_name: editName.trim() || null }
        : u
      ))
      setEditUser(null)
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const filtered = users.filter(u => {
    const matchTier = tierFilter === 'all' || u.tier === tierFilter
    const q = search.toLowerCase()
    const matchSearch = !q || u.email.toLowerCase().includes(q) || (u.display_name ?? '').toLowerCase().includes(q)
    return matchTier && matchSearch
  })

  return (
    <>
    <div className="min-h-screen" style={{ background: '#0d0c0b', color: '#f2ede4', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #302d29' }} className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '17px', fontWeight: 800, letterSpacing: '-0.03em' }}>
            prmpt<span style={{ color: '#3d7fff' }}>VAULT</span>
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '99px', background: 'rgba(255,200,50,0.08)', color: '#f5c842', border: '1px solid rgba(255,200,50,0.15)' }}>
            Admin
          </span>
          <a href="/dashboard" style={{ fontSize: '12px', color: '#4a4540' }} className="hover:text-white transition-colors">
            ← Dashboard
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span style={{ fontSize: '13px', color: '#4a4540' }}>{user?.email}</span>
          <button onClick={signOut} style={{ fontSize: '12px', color: '#4a4540' }} className="hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {[
              { label: 'Total Users',   value: stats.total_users,                          accent: '#f2ede4' },
              { label: 'New Today',     value: stats.new_users_today,                      accent: '#3d7fff' },
              { label: 'Total Assets',  value: stats.total_assets,                         accent: '#f2ede4' },
              { label: 'Newbie',        value: stats.by_tier.newbie,                       accent: '#7a7268' },
              { label: 'Creator',       value: stats.by_tier.creator,                      accent: '#6699ff' },
              { label: 'Studio / Pro',  value: stats.by_tier.studio + stats.by_tier.pro,   accent: '#c084fc' },
            ].map(s => (
              <div key={s.label} style={{ background: '#1e1c19', border: '1px solid #302d29', borderRadius: '14px', padding: '16px' }}>
                <div style={{ fontSize: '11px', color: '#4a4540', marginBottom: '6px', fontWeight: 500, letterSpacing: '0.02em' }}>{s.label}</div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: s.accent, fontFamily: "'Bricolage Grotesque', sans-serif", letterSpacing: '-0.03em' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Cost section */}
        {stats && (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 mb-8">

            {/* Spend tracker */}
            <div style={{ background: '#1e1c19', border: '1px solid #302d29', borderRadius: '14px', padding: '20px' }}>
              <div style={{ fontSize: '11px', color: '#4a4540', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '14px' }}>Spend — This Month</div>
              <div style={{ fontSize: '36px', fontWeight: 700, color: '#f2ede4', letterSpacing: '-0.04em', marginBottom: '4px' }}>
                ${stats.period_spend.toFixed(4)}
              </div>
              <div style={{ fontSize: '12px', color: '#4a4540', marginBottom: '16px' }}>
                ${stats.total_spend.toFixed(4)} all time
              </div>
              {/* Progress bar — show month spend vs all-time as context */}
              <div style={{ height: 4, background: '#252220', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 99,
                  background: 'linear-gradient(90deg, #3d7fff, #7aabff)',
                  width: stats.total_spend > 0 ? `${Math.min((stats.period_spend / stats.total_spend) * 100, 100)}%` : '0%',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ fontSize: '11px', color: '#4a4540', marginTop: '6px' }}>
                {stats.total_spend > 0 ? `${((stats.period_spend / stats.total_spend) * 100).toFixed(0)}% of all-time` : 'No cost data yet'}
              </div>
            </div>

            {/* Predicted vs actual cost per model */}
            <div style={{ background: '#1e1c19', border: '1px solid #302d29', borderRadius: '14px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#4a4540', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cost per Generation · Predicted vs Actual · by Model</div>
                <div style={{ display: 'flex', gap: 16, fontSize: '10px', color: '#4a4540' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#4a4540', display: 'inline-block' }} />Predicted</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: '#7aabff', display: 'inline-block' }} />Actual avg</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #302d29' }}>
                      {['Model', 'Provider', 'Predicted', 'Actual Avg', 'Δ', 'Runs', 'Total Spent', 'Unit'].map(h => (
                        <th key={h} className="pb-2 text-left pr-4" style={{ fontSize: '10px', fontWeight: 600, color: '#4a4540', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.cost_by_model.map(m => {
                      const delta = (m.avg_actual_cost != null && m.predicted_cost != null) ? m.avg_actual_cost - m.predicted_cost : null
                      const deltaColor = delta == null ? '#4a4540' : delta > 0.001 ? '#f87171' : delta < -0.001 ? '#34c759' : '#7a7268'
                      return (
                        <tr key={m.slug} style={{ borderBottom: '1px solid #1a1814' }}>
                          <td className="py-2 pr-4" style={{ color: '#f2ede4', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>{m.name}</td>
                          <td className="py-2 pr-4" style={{ color: '#4a4540', fontSize: '11px' }}>{m.provider}</td>
                          <td className="py-2 pr-4" style={{ color: '#7a7268', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                            {m.predicted_cost != null ? `$${m.predicted_cost.toFixed(4)}` : '—'}
                          </td>
                          <td className="py-2 pr-4" style={{ color: m.avg_actual_cost != null ? '#7aabff' : '#4a4540', fontSize: '12px', fontWeight: m.avg_actual_cost != null ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}>
                            {m.avg_actual_cost != null ? `$${m.avg_actual_cost.toFixed(4)}` : '—'}
                          </td>
                          <td className="py-2 pr-4" style={{ color: deltaColor, fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>
                            {delta != null ? `${delta >= 0 ? '+' : ''}$${delta.toFixed(4)}` : '—'}
                          </td>
                          <td className="py-2 pr-4" style={{ color: '#7a7268', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>{m.count > 0 ? m.count.toLocaleString() : '—'}</td>
                          <td className="py-2 pr-4" style={{ color: '#7a7268', fontSize: '12px', fontVariantNumeric: 'tabular-nums' }}>{m.total_cost > 0 ? `$${m.total_cost.toFixed(4)}` : '—'}</td>
                          <td className="py-2" style={{ color: '#4a4540', fontSize: '11px', whiteSpace: 'nowrap' }}>{m.cost_notes ?? '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap items-center w-full">
          <input
            type="text"
            placeholder="Search email or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: '#1e1c19', border: '1px solid #302d29', borderRadius: '12px', padding: '8px 14px', fontSize: '13px', color: '#f2ede4', outline: 'none', width: '100%', maxWidth: '260px' }}
            className="pv-placeholder focus:border-[#3d7fff] transition-colors"
          />
          <div className="flex gap-1" style={{ background: '#1e1c19', border: '1px solid #302d29', borderRadius: '12px', padding: '4px' }}>
            {(['all', ...TIERS] as const).map(t => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                style={tierFilter === t
                  ? { background: '#252220', color: '#f2ede4', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 600 }
                  : { color: '#4a4540', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 500 }
                }
                className="capitalize transition-colors hover:text-[#f2ede4] cursor-pointer"
              >
                {t}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: '#4a4540', marginLeft: 'auto' }}>{filtered.length} users</span>
          <button
            onClick={() => { setShowCreate(true); setCreateError(null) }}
            style={{ background: '#0050ff', borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, color: '#fff' }}
            className="hover:opacity-90 transition-opacity cursor-pointer"
          >
            + Add user
          </button>
        </div>

        {/* User table */}
        <div style={{ background: '#1a1814', border: '1px solid #302d29', borderRadius: '18px', overflow: 'hidden' }} className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-sm animate-pulse" style={{ color: '#4a4540' }}>
              Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-sm" style={{ color: '#4a4540' }}>
              No users found
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid #302d29' }}>
                  {['User', 'Tier', 'Assets', 'Joined', 'Change Tier', 'Edit'].map(h => (
                    <th key={h} className="px-5 py-3 text-left" style={{ fontSize: '11px', fontWeight: 600, color: '#4a4540', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    style={{ borderBottom: '1px solid #252220' }}
                    className={`transition-colors hover:bg-white/[0.02] ${u.email === user?.email ? 'bg-amber-500/[0.04]' : ''}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#252220', border: '1px solid #302d29', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#7a7268', flexShrink: 0 }}>
                          {(u.display_name ?? u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: '#f2ede4', fontWeight: 500, fontSize: '13px', lineHeight: 1.3 }}>
                            {u.display_name ?? '—'}
                            {u.email === user?.email && (
                              <span style={{ marginLeft: 6, fontSize: '10px', color: '#f5c842', fontWeight: 700 }}>YOU</span>
                            )}
                          </div>
                          <div style={{ color: '#4a4540', fontSize: '11.5px' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${TIER_COLORS[u.tier]}`}>
                        {u.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3.5" style={{ color: '#7a7268', fontSize: '13px' }}>{u.asset_count}</td>
                    <td className="px-5 py-3.5" style={{ color: '#4a4540', fontSize: '12px' }}>
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
                              ? { background: '#252220', color: '#f2ede4', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: 600 }
                              : { color: '#4a4540', borderRadius: '8px', padding: '4px 8px', fontSize: '11px', fontWeight: 500 }
                            }
                            className="capitalize transition-colors hover:text-[#f2ede4] hover:bg-white/5 disabled:opacity-40 cursor-pointer"
                          >
                            {updatingTier === u.id && u.tier !== t ? '…' : t}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openEdit(u)}
                        style={{ color: '#4a4540', borderRadius: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 500 }}
                        className="hover:bg-white/5 hover:text-[#f2ede4] transition-colors cursor-pointer"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>

    {/* Create user modal */}
    {showCreate && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setShowCreate(false)}>
        <div style={{ background: '#1e1c19', border: '1px solid #302d29', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '16px', color: '#f2ede4' }}>Add test user</h3>
            <button onClick={() => setShowCreate(false)} style={{ color: '#4a4540', fontSize: '18px' }} className="hover:text-white transition-colors cursor-pointer">✕</button>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Email *', value: createEmail, setter: setCreateEmail, type: 'email', placeholder: 'test@example.com' },
              { label: 'Password', sub: 'leave blank to send magic link', value: createPassword, setter: setCreatePassword, type: 'text', placeholder: 'Set a password' },
              { label: 'Display name', sub: 'optional', value: createName, setter: setCreateName, type: 'text', placeholder: 'First Last' },
            ].map(({ label, sub, value, setter, type, placeholder }) => (
              <div key={label}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#7a7268', display: 'block', marginBottom: '5px' }}>
                  {label}{sub && <span style={{ color: '#4a4540', fontWeight: 400 }}> ({sub})</span>}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={placeholder}
                  style={{ width: '100%', background: '#252220', border: '1px solid #302d29', borderRadius: '12px', padding: '10px 12px', fontSize: '13px', color: '#f2ede4', outline: 'none' }}
                  className="pv-placeholder focus:border-[#3d7fff] transition-colors"
                />
              </div>
            ))}
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#7a7268', display: 'block', marginBottom: '5px' }}>Tier</label>
              <div className="flex gap-2">
                {TIERS.map(t => (
                  <button
                    key={t}
                    onClick={() => setCreateTier(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all capitalize cursor-pointer ${
                      createTier === t
                        ? TIER_COLORS[t] + ' ring-1 ring-current'
                        : 'border-[#302d29] text-[#4a4540] hover:text-[#f2ede4]'
                    }`}
                    style={{ background: createTier === t ? undefined : '#252220' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {createError && (
              <p style={{ fontSize: '12px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '10px', padding: '8px 12px' }}>{createError}</p>
            )}

            <button
              onClick={createUser}
              disabled={creating || !createEmail.trim()}
              style={{ width: '100%', padding: '10px', background: '#0050ff', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px' }}
              className="hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
            >
              {creating ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Edit user modal */}
    {editUser && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4" onClick={() => setEditUser(null)}>
        <div style={{ background: '#1e1c19', border: '1px solid #302d29', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: '16px', color: '#f2ede4' }}>Edit user</h3>
            <button onClick={() => setEditUser(null)} style={{ color: '#4a4540', fontSize: '18px' }} className="hover:text-white transition-colors cursor-pointer">✕</button>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Email', value: editEmail, setter: setEditEmail, type: 'email', placeholder: '' },
              { label: 'Display name', value: editName, setter: setEditName, type: 'text', placeholder: '' },
              { label: 'New password', sub: 'leave blank to keep current', value: editPassword, setter: setEditPassword, type: 'text', placeholder: 'Enter new password' },
            ].map(({ label, sub, value, setter, type, placeholder }) => (
              <div key={label}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#7a7268', display: 'block', marginBottom: '5px' }}>
                  {label}{sub && <span style={{ color: '#4a4540', fontWeight: 400 }}> ({sub})</span>}
                </label>
                <input
                  type={type}
                  value={value}
                  onChange={e => setter(e.target.value)}
                  placeholder={placeholder}
                  style={{ width: '100%', background: '#252220', border: '1px solid #302d29', borderRadius: '12px', padding: '10px 12px', fontSize: '13px', color: '#f2ede4', outline: 'none' }}
                  className="pv-placeholder focus:border-[#3d7fff] transition-colors"
                />
              </div>
            ))}

            {editError && (
              <p style={{ fontSize: '12px', color: '#f87171', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: '10px', padding: '8px 12px' }}>{editError}</p>
            )}

            <button
              onClick={saveEdit}
              disabled={saving}
              style={{ width: '100%', padding: '10px', background: '#0050ff', borderRadius: '12px', fontSize: '14px', fontWeight: 600, color: '#fff', marginTop: '4px' }}
              className="hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
