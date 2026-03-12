import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'

const TIER_COLORS: Record<string, string> = {
  newbie:  'bg-[var(--pv-surface2)] text-[var(--pv-text2)] border-[var(--pv-border)]',
  creator: 'bg-[#0050ff]/10 text-[#6699ff] border-[#0050ff]/20',
  studio:  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  pro:     'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

interface UserStats {
  profile: { id: string; email: string; display_name: string | null; tier: string; created_at: string }
  total_assets: number
  assets_today: number
  gen_type_totals: Record<string, number>
  by_model: Array<{ name: string; slug: string; provider: string; count: number; total_cost: number }>
  image_by_model: Array<{ name: string; slug: string; provider: string; txt2img: number; img2img: number }>
  video_by_model: Array<{ name: string; slug: string; provider: string; txt2vid: number; img2vid: number }>
  total_spend: number
  period_spend: number
}

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

export default function Settings() {
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setLoading(false); return }
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-stats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY },
          body: JSON.stringify({ user_token: token }),
        })
        const data = await res.json()
        if (!data.error) setStats(data)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const userInitial = (stats?.profile.display_name ?? user?.email ?? '?')[0].toUpperCase()

  return (
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
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--pv-text)' }}>
            prmpt<span style={{ color: 'var(--pv-accent)' }}>VAULT</span>
          </span>
          <div className="flex items-center gap-3">
            <a href="/dashboard" style={{ fontSize: 12, color: 'var(--pv-text3)', textDecoration: 'none' }}>← Dashboard</a>
            <button onClick={signOut} style={{ fontSize: 12, color: 'var(--pv-text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Sign out</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

            {/* Profile header */}
            <div className="flex items-center gap-4 mb-8">
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--pv-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {userInitial}
              </div>
              <div>
                <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 800, color: 'var(--pv-text)', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                  {stats?.profile.display_name ?? user?.email}
                </h1>
                {stats?.profile.display_name && <div style={{ fontSize: 13, color: 'var(--pv-text3)', marginTop: 2 }}>{user?.email}</div>}
                <div className="flex items-center gap-2 mt-2">
                  {stats?.profile.tier && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${TIER_COLORS[stats.profile.tier] ?? ''}`}>
                      {stats.profile.tier}
                    </span>
                  )}
                  {stats?.profile.created_at && (
                    <span style={{ fontSize: 11, color: 'var(--pv-text3)' }}>
                      Joined {new Date(stats.profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20 animate-pulse" style={{ color: 'var(--pv-text3)', fontSize: 13 }}>Loading…</div>
            ) : stats ? (
              <>
                {/* Assets */}
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pv-text3)', marginBottom: 10 }}>Assets</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
                  <MiniStat label="Total"   value={stats.total_assets}                        accent="var(--pv-text)" />
                  <MiniStat label="Today"   value={stats.assets_today}                        accent="var(--pv-accent)" />
                  <MiniStat label="txt2img" value={stats.gen_type_totals['txt2img'] ?? 0}     accent="var(--pv-text2)" />
                  <MiniStat label="img2img" value={stats.gen_type_totals['img2img'] ?? 0}     accent="var(--pv-text2)" />
                  <MiniStat label="txt2vid" value={stats.gen_type_totals['txt2vid'] ?? 0}     accent="#a78bfa" />
                  <MiniStat label="img2vid" value={stats.gen_type_totals['img2vid'] ?? 0}     accent="#c084fc" />
                </div>

                {/* Spend */}
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pv-text3)', marginBottom: 10 }}>Spend</div>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <MiniStat label="This month" value={stats.period_spend > 0 ? `$${stats.period_spend.toFixed(4)}` : '—'} />
                  <MiniStat label="All time"   value={stats.total_spend   > 0 ? `$${stats.total_spend.toFixed(4)}`   : '—'} />
                </div>

                {/* Image bar chart */}
                {stats.image_by_model?.length > 0 && (
                  <div style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pv-text3)' }}>Image Assets · by Model</div>
                      <div className="flex gap-3" style={{ fontSize: 10, color: 'var(--pv-text3)' }}>
                        <span style={{ color: 'var(--pv-accent)' }}>■ txt2img</span>
                        <span style={{ color: '#7aabff' }}>■ img2img</span>
                      </div>
                    </div>
                    <BarChart rows={stats.image_by_model as unknown as Array<{ name: string; slug: string; [key: string]: string | number }>} colorA="var(--pv-accent)" colorB="#7aabff" keyA="txt2img" keyB="img2img" />
                  </div>
                )}

                {/* Video bar chart */}
                {stats.video_by_model?.length > 0 && (
                  <div style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 14, padding: '16px 18px', marginBottom: 12 }}>
                    <div className="flex items-center justify-between mb-3">
                      <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pv-text3)' }}>Video Assets · by Model</div>
                      <div className="flex gap-3" style={{ fontSize: 10, color: 'var(--pv-text3)' }}>
                        <span style={{ color: '#a78bfa' }}>■ txt2vid</span>
                        <span style={{ color: '#c084fc' }}>■ img2vid</span>
                      </div>
                    </div>
                    <BarChart rows={stats.video_by_model as unknown as Array<{ name: string; slug: string; [key: string]: string | number }>} colorA="#a78bfa" colorB="#c084fc" keyA="txt2vid" keyB="img2vid" />
                  </div>
                )}

                {/* By model */}
                {stats.by_model.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--pv-text3)', marginBottom: 10 }}>By Model</div>
                    <div style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)', borderRadius: 14, overflow: 'hidden', marginBottom: 6 }}>
                      {stats.by_model.map((m, i) => (
                        <div key={m.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: i < stats.by_model.length - 1 ? '1px solid var(--pv-border)' : undefined }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--pv-text)' }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--pv-text3)' }}>{m.provider}</div>
                          </div>
                          <div className="text-right">
                            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--pv-accent)', fontFamily: "'Bricolage Grotesque', sans-serif" }}>{m.count}</div>
                            {m.total_cost > 0 && <div style={{ fontSize: 10, color: 'var(--pv-text3)' }}>${m.total_cost.toFixed(4)}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {stats.total_assets === 0 && (
                  <div style={{ textAlign: 'center', paddingTop: 32 }}>
                    <div style={{ fontSize: 14, color: 'var(--pv-text3)', marginBottom: 12 }}>No assets yet — start generating!</div>
                    <a href="/dashboard" style={{ fontSize: 13, color: 'var(--pv-accent)', textDecoration: 'none', fontWeight: 600 }}>Go to Dashboard →</a>
                  </div>
                )}

                {/* Upgrade nudge */}
                <div className="mt-6" style={{ borderTop: '1px solid var(--pv-border)', paddingTop: 20 }}>
                  <a href="/pricing" style={{ fontSize: 13, color: 'var(--pv-text3)', textDecoration: 'none' }} className="hover:text-[var(--pv-text)] transition-colors">
                    View plans & pricing →
                  </a>
                </div>
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--pv-text3)', textAlign: 'center', paddingTop: 32 }}>Failed to load stats</div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
