import { useState, useMemo } from 'react'
import type { UserProject, Asset, Model } from '../../types'
import AssetGrid from './AssetGrid'

interface Props {
  projects: UserProject[]
  assets: Asset[]
  models: Model[]
  assetsLoading: boolean
  onCreateProject: (name: string, description: string) => Promise<void>
  onUpdateProject: (id: string, name: string, description: string) => Promise<void>
  onDeleteProject: (id: string) => Promise<void>
  onDeleteAsset: (id: string) => void
  onGenerate: () => void
  onSendToImg2Img: (url: string) => void
  onSendToImg2Vid: (url: string) => void
}

const PROJECT_COLORS = [
  'bg-blue-50 text-blue-600 border-blue-200',
  'bg-violet-50 text-violet-600 border-violet-200',
  'bg-emerald-50 text-emerald-600 border-emerald-200',
  'bg-amber-50 text-amber-600 border-amber-200',
  'bg-rose-50 text-rose-600 border-rose-200',
  'bg-cyan-50 text-cyan-600 border-cyan-200',
  'bg-pink-50 text-pink-600 border-pink-200',
  'bg-indigo-50 text-indigo-600 border-indigo-200',
]

export default function ProjectsView({
  projects,
  assets,
  models,
  assetsLoading,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onDeleteAsset,
  onGenerate,
  onSendToImg2Img,
  onSendToImg2Vid,
}: Props) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingProject, setEditingProject] = useState<UserProject | null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null

  const coverImages = useMemo(() => {
    const map: Record<string, string> = {}
    for (const asset of assets) {
      if (asset.project_id && !map[asset.project_id]) {
        if (asset.gen_type !== 'txt2vid' && asset.gen_type !== 'img2vid') {
          map[asset.project_id] = asset.url
        }
      }
    }
    return map
  }, [assets])

  const assetCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const asset of assets) {
      if (asset.project_id) map[asset.project_id] = (map[asset.project_id] ?? 0) + 1
    }
    return map
  }, [assets])

  async function handleCreate() {
    if (!createName.trim()) return
    setCreating(true)
    await onCreateProject(createName.trim(), createDesc.trim())
    setCreating(false)
    setShowCreate(false)
    setCreateName('')
    setCreateDesc('')
  }

  async function handleSaveEdit() {
    if (!editingProject || !editName.trim()) return
    setSaving(true)
    await onUpdateProject(editingProject.id, editName.trim(), editDesc.trim())
    setSaving(false)
    setEditingProject(null)
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    await onDeleteProject(id)
    setDeleting(false)
    setDeleteConfirm(null)
    if (selectedProjectId === id) setSelectedProjectId(null)
  }

  // Project detail view
  if (selectedProject) {
    const projectAssets = assets.filter((a) => a.project_id === selectedProject.id)
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Detail header */}
        <div className="flex-shrink-0 px-4 sm:px-8 py-3 bg-white dark:bg-[#0d1117] border-b border-[#d2d2d7] dark:border-white/8 flex items-center gap-3">
          <button
            onClick={() => setSelectedProjectId(null)}
            className="text-[#6e6e73] dark:text-white/40 hover:text-[#1d1d1f] dark:hover:text-white text-sm transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0"
          >
            ← Projects
          </button>
          <div className="w-px h-4 bg-[#d2d2d7] dark:bg-white/10 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-[#1d1d1f] dark:text-white text-sm">{selectedProject.name}</span>
            {selectedProject.description && (
              <span className="text-xs text-[#6e6e73] dark:text-white/40 ml-2 truncate">{selectedProject.description}</span>
            )}
          </div>
          <button
            onClick={() => { setEditingProject(selectedProject); setEditName(selectedProject.name); setEditDesc(selectedProject.description ?? '') }}
            className="px-3 py-1.5 text-xs bg-white dark:bg-white/6 border border-[#d2d2d7] dark:border-white/10 rounded-lg text-[#6e6e73] dark:text-white/40 hover:text-[#1d1d1f] dark:hover:text-white transition-all cursor-pointer flex-shrink-0"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(selectedProject.id)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-white/6 border border-[#d2d2d7] dark:border-white/10 rounded-lg text-[#6e6e73] dark:text-white/40 hover:text-red-500 hover:border-red-200 transition-all cursor-pointer flex-shrink-0"
          >
            Delete
          </button>
        </div>

        <AssetGrid
          assets={projectAssets}
          models={models}
          projects={projects}
          loading={assetsLoading}
          onDelete={onDeleteAsset}
          onGenerate={onGenerate}
          onSendToImg2Img={onSendToImg2Img}
          onSendToImg2Vid={onSendToImg2Vid}
        />

        {/* Edit modal */}
        {editingProject && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setEditingProject(null)}>
            <div className="bg-white dark:bg-[#1c1c1e] border border-[#d2d2d7] dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4">Edit Project</h3>
              <div className="flex flex-col gap-3">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Project name"
                  className="w-full text-sm px-3 py-2.5 border border-[#d2d2d7] dark:border-white/10 rounded-xl outline-none focus:border-[#0071e3] text-[#1d1d1f] dark:text-white bg-white dark:bg-white/4"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingProject(null) }}
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  className="w-full text-sm px-3 py-2.5 border border-[#d2d2d7] dark:border-white/10 rounded-xl outline-none focus:border-[#0071e3] text-[#1d1d1f] dark:text-white bg-white dark:bg-white/4 resize-none"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editName.trim() || saving}
                    className="flex-1 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingProject(null)}
                    className="px-4 py-2.5 bg-white dark:bg-white/6 border border-[#d2d2d7] dark:border-white/10 rounded-xl text-sm text-[#6e6e73] dark:text-white/40 hover:text-[#1d1d1f] dark:hover:text-white transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm */}
        {deleteConfirm === selectedProject.id && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white dark:bg-[#1c1c1e] border border-[#d2d2d7] dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-1">Delete "{selectedProject.name}"?</h3>
              <p className="text-sm text-[#6e6e73] dark:text-white/40 mb-5">
                Assets in this project will not be deleted — they'll become uncategorized.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(selectedProject.id)}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
                >
                  {deleting ? 'Deleting…' : 'Delete Project'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2.5 bg-white dark:bg-white/6 border border-[#d2d2d7] dark:border-white/10 rounded-xl text-sm text-[#6e6e73] dark:text-white/40 hover:text-[#1d1d1f] dark:hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Projects list
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#f5f5f7] dark:bg-[#0d1117]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[#1d1d1f] dark:text-white">Projects</h2>
            {projects.length > 0 && (
              <span className="text-[#aeaeb2] dark:text-white/30 text-sm">{projects.length}</span>
            )}
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
          >
            + New Project
          </button>
        </div>

        {/* Empty state */}
        {projects.length === 0 && !showCreate && (
          <div className="bg-white dark:bg-white/4 border border-dashed border-[#d2d2d7] dark:border-white/10 rounded-2xl p-16 text-center">
            <svg className="w-12 h-12 text-[#d2d2d7] dark:text-white/15 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <p className="text-[#1d1d1f] dark:text-white font-medium mb-1">No projects yet</p>
            <p className="text-[#6e6e73] dark:text-white/40 text-sm mb-6">Organize your generated assets into projects</p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
            >
              Create your first project →
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Inline create card */}
          {showCreate && (
            <div className="bg-white dark:bg-white/4 border-2 border-[#0071e3] rounded-2xl p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-[#0071e3] uppercase tracking-wider">New Project</p>
              <input
                autoFocus
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Project name"
                className="w-full text-sm px-3 py-2.5 border border-[#d2d2d7] dark:border-white/10 rounded-xl outline-none focus:border-[#0071e3] text-[#1d1d1f] dark:text-white bg-white dark:bg-white/4"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowCreate(false); setCreateName(''); setCreateDesc('') } }}
              />
              <textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full text-sm px-3 py-2.5 border border-[#d2d2d7] dark:border-white/10 rounded-xl outline-none focus:border-[#0071e3] text-[#1d1d1f] dark:text-white bg-white dark:bg-white/4 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={!createName.trim() || creating}
                  className="flex-1 py-2 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
                >
                  {creating ? 'Creating…' : 'Create'}
                </button>
                <button
                  onClick={() => { setShowCreate(false); setCreateName(''); setCreateDesc('') }}
                  className="px-3 py-2 bg-white dark:bg-white/6 border border-[#d2d2d7] dark:border-white/10 rounded-xl text-sm text-[#6e6e73] dark:text-white/40 hover:text-[#1d1d1f] dark:hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Project cards */}
          {projects.map((p, i) => {
            const cover = coverImages[p.id]
            const count = assetCounts[p.id] ?? 0
            const colorClass = PROJECT_COLORS[i % PROJECT_COLORS.length]
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className="group bg-white dark:bg-white/4 border border-[#d2d2d7] dark:border-white/8 hover:border-[#aeaeb2] dark:hover:border-white/20 hover:shadow-md rounded-2xl overflow-hidden text-left transition-all cursor-pointer"
              >
                {/* Cover image */}
                <div className="aspect-video bg-[#f5f5f7] dark:bg-white/4 overflow-hidden">
                  {cover ? (
                    <img
                      src={cover}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-[#d2d2d7] dark:text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.5} />
                        <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 sm:p-4">
                  <div className="font-semibold text-sm text-[#1d1d1f] dark:text-white mb-0.5 truncate">{p.name}</div>
                  {p.description && (
                    <div className="text-xs text-[#6e6e73] dark:text-white/40 line-clamp-1 mb-2">{p.description}</div>
                  )}
                  <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md border ${colorClass}`}>
                    {count} {count === 1 ? 'asset' : 'assets'}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Edit modal (from list) */}
      {editingProject && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setEditingProject(null)}>
          <div className="bg-white dark:bg-[#1c1c1e] border border-[#d2d2d7] dark:border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-[#1d1d1f] dark:text-white mb-4">Edit Project</h3>
            <div className="flex flex-col gap-3">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Project name"
                className="w-full text-sm px-3 py-2.5 border border-[#d2d2d7] dark:border-white/10 rounded-xl outline-none focus:border-[#0071e3] text-[#1d1d1f] dark:text-white bg-white dark:bg-white/4"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingProject(null) }}
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full text-sm px-3 py-2.5 border border-[#d2d2d7] dark:border-white/10 rounded-xl outline-none focus:border-[#0071e3] text-[#1d1d1f] dark:text-white bg-white dark:bg-white/4 resize-none"
              />
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSaveEdit}
                  disabled={!editName.trim() || saving}
                  className="flex-1 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 rounded-xl text-sm font-medium text-white transition-all cursor-pointer"
                >
                  {saving ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2.5 bg-white dark:bg-white/6 border border-[#d2d2d7] dark:border-white/10 rounded-xl text-sm text-[#6e6e73] dark:text-white/40 hover:text-[#1d1d1f] dark:hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
