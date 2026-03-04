import { useAuth } from '../contexts/AuthContext'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">
            prmpt<span className="text-sky-400">BASE</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <button
              onClick={signOut}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Placeholder — agents will go here */}
        <div className="bg-white/3 border border-white/8 border-dashed rounded-2xl p-16 text-center">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-slate-400 font-medium">Your agents will appear here</p>
          <p className="text-slate-600 text-sm mt-1">Connect your first agent to get started</p>
        </div>
      </div>
    </div>
  )
}
