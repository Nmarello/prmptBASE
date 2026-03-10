import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const TIERS = ['newbie', 'creator', 'studio', 'pro'] as const
type Tier = typeof TIERS[number]

const TIER_COLORS: Record<Tier, string> = {
  newbie:  'bg-slate-500/20 text-slate-400 border-slate-500/30',
  creator: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  studio:  'bg-violet-500/20 text-violet-400 border-violet-500/30',
  pro:     'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

interface UserRow {
  id: string
  email: string
  display_name: string | null
  tier: Tier
  created_at: string
  asset_count: number
}

interface Stats {
  total_users: number
  by_tier: Record<Tier, number>
  total_assets: number
  assets_today: number
  new_users_today: number
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

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) return

    // Load users with asset counts via RPC-style query
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, email, display_name, tier, created_at')
      .order('created_at', { ascending: false })

    if (profileData) {
      // Get asset counts per user
      const { data: assetCounts } = await supabase
        .from('assets')
        .select('user_id')

      const countMap: Record<string, number> = {}
      assetCounts?.forEach(a => { countMap[a.user_id] = (countMap[a.user_id] ?? 0) + 1 })

      const rows: UserRow[] = profileData.map(p => ({
        ...p,
        tier: p.tier as Tier,
        asset_count: countMap[p.id] ?? 0,
      }))
      setUsers(rows)

      // Build stats
      const byTier = { newbie: 0, creator: 0, studio: 0, pro: 0 } as Record<Tier, number>
      rows.forEach(r => { byTier[r.tier] = (byTier[r.tier] ?? 0) + 1 })
      const today = new Date().toISOString().slice(0, 10)
      setStats({
        total_users: rows.length,
        by_tier: byTier,
        total_assets: Object.values(countMap).reduce((a, b) => a + b, 0),
        assets_today: assetCounts?.filter(a => a.user_id).length ?? 0, // rough
        new_users_today: rows.filter(r => r.created_at.startsWith(today)).length,
      })
    }
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
    const { data: { session } } = await supabase.auth.getSession()
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
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
    }
    setCreating(false)
  }

  const filtered = users.filter(u => {
    const matchTier = tierFilter === 'all' || u.tier === tierFilter
    const q = search.toLowerCase()
    const matchSearch = !q || u.email.toLowerCase().includes(q) || (u.display_name ?? '').toLowerCase().includes(q)
    return matchTier && matchSearch
  })

  return (
    <>
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-lg font-black tracking-tight">
            prmpt<span className="text-sky-400">VAULT</span>
          </span>
          <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
            Admin
          </span>
          <a href="/dashboard" className="text-xs text-slate-500 hover:text-white transition-colors">
            ← Dashboard
          </a>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{user?.email}</span>
          <button onClick={signOut} className="text-xs text-slate-600 hover:text-white transition-colors">
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {[
              { label: 'Total Users',    value: stats.total_users,       color: 'text-white' },
              { label: 'New Today',      value: stats.new_users_today,   color: 'text-sky-400' },
              { label: 'Total Assets',   value: stats.total_assets,      color: 'text-white' },
              { label: 'Newbie',         value: stats.by_tier.newbie,    color: 'text-slate-400' },
              { label: 'Creator',        value: stats.by_tier.creator,   color: 'text-sky-400' },
              { label: 'Studio / Pro',   value: stats.by_tier.studio + stats.by_tier.pro, color: 'text-violet-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/3 border border-white/8 rounded-xl p-4">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap items-center w-full">
          <input
            type="text"
            placeholder="Search email or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500/50 w-full sm:w-64"
          />
          <div className="flex gap-1">
            {(['all', ...TIERS] as const).map(t => (
              <button
                key={t}
                onClick={() => setTierFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
                  tierFilter === t
                    ? 'bg-white/10 text-white'
                    : 'text-slate-500 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-600 ml-auto">{filtered.length} users</span>
          <button
            onClick={() => { setShowCreate(true); setCreateError(null) }}
            className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 rounded-lg text-xs font-medium transition-all"
          >
            + Add user
          </button>
        </div>

        {/* User table */}
        <div className="bg-white/2 border border-white/8 rounded-2xl overflow-hidden overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-500 text-sm animate-pulse">
              Loading users…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-600 text-sm">
              No users found
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tier</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Assets</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Change Tier</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className={`border-b border-white/5 hover:bg-white/2 transition-colors ${
                      u.email === user?.email ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center text-xs font-semibold text-slate-400 flex-shrink-0">
                          {(u.display_name ?? u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white font-medium leading-tight">
                            {u.display_name ?? '—'}
                            {u.email === user?.email && (
                              <span className="ml-2 text-[10px] text-amber-400 font-semibold">YOU</span>
                            )}
                          </div>
                          <div className="text-slate-500 text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${TIER_COLORS[u.tier]}`}>
                        {u.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400">{u.asset_count}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        {TIERS.map(t => (
                          <button
                            key={t}
                            onClick={() => changeTier(u.id, t)}
                            disabled={u.tier === t || updatingTier === u.id}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all capitalize ${
                              u.tier === t
                                ? 'bg-white/8 text-white cursor-default'
                                : 'text-slate-500 hover:bg-white/8 hover:text-white disabled:opacity-40'
                            }`}
                          >
                            {updatingTier === u.id && u.tier !== t ? '…' : t}
                          </button>
                        ))}
                      </div>
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
        <div className="bg-[#161b22] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold">Add test user</h3>
            <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Email *</label>
              <input
                type="email"
                value={createEmail}
                onChange={e => setCreateEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Password <span className="text-slate-600">(leave blank to send magic link)</span></label>
              <input
                type="text"
                value={createPassword}
                onChange={e => setCreatePassword(e.target.value)}
                placeholder="Set a password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Display name <span className="text-slate-600">(optional)</span></label>
              <input
                type="text"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                placeholder="First Last"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-sky-500/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1 block">Tier</label>
              <div className="flex gap-2">
                {TIERS.map(t => (
                  <button
                    key={t}
                    onClick={() => setCreateTier(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all capitalize ${
                      createTier === t
                        ? TIER_COLORS[t] + ' ring-1 ring-current'
                        : 'bg-white/5 border-white/10 text-slate-500 hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {createError && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{createError}</p>
            )}

            <button
              onClick={createUser}
              disabled={creating || !createEmail.trim()}
              className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all mt-1"
            >
              {creating ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
