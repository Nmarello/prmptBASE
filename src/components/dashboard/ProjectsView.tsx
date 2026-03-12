import { useState, useMemo } from 'react'
import type { UserProject, Asset, Model } from '../../types'
import AssetGrid from './AssetGrid'

interface Props {
  projects: UserProject[]
  assets: Asset[]
  models: Model[]
  assetsLoading: boolean
  onCreateProject: (name: string, description: string) => Promise<unknown>
  onUpdateProject: (id: string, name: string, description: string) => Promise<void>
  onDeleteProject: (id: string) => Promise<void>
  onDeleteAsset: (id: string) => void
  onMoveToProject: (assetId: string, projectId: string | null) => Promise<void>
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
  onMoveToProject,
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
        <div className="flex-shrink-0 px-4 sm:px-8 py-3 border-b flex items-center gap-3" style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }}>
          <button
            onClick={() => setSelectedProjectId(null)}
            style={{ color: 'var(--pv-text2)' }}
            className="text-sm transition-colors cursor-pointer flex items-center gap-1 flex-shrink-0 hover:opacity-80"
          >
            ← Projects
          </button>
          <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--pv-border)' }} />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-sm" style={{ color: 'var(--pv-text)' }}>{selectedProject.name}</span>
            {selectedProject.description && (
              <span className="text-xs ml-2 truncate" style={{ color: 'var(--pv-text2)' }}>{selectedProject.description}</span>
            )}
          </div>
          <button
            onClick={() => { setEditingProject(selectedProject); setEditName(selectedProject.name); setEditDesc(selectedProject.description ?? '') }}
            style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
            className="px-3 py-1.5 text-xs border rounded-lg hover:opacity-80 transition-all cursor-pointer flex-shrink-0"
          >
            Edit
          </button>
          <button
            onClick={() => setDeleteConfirm(selectedProject.id)}
            style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
            className="px-3 py-1.5 text-xs border rounded-lg hover:text-red-500 hover:border-red-200 transition-all cursor-pointer flex-shrink-0"
          >
            Delete
          </button>
        </div>

        <AssetGrid
          assets={projectAssets}
          models={models}
          projects={projects}
          loading={assetsLoading}
          title={`${selectedProject.name} Assets`}
          onDelete={onDeleteAsset}
          onGenerate={onGenerate}
          onSendToImg2Img={onSendToImg2Img}
          onSendToImg2Vid={onSendToImg2Vid}
          onMoveToProject={onMoveToProject}
        />

        {/* Edit modal */}
        {editingProject && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setEditingProject(null)}>
            <div style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }} className="border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold mb-4" style={{ color: 'var(--pv-text)' }}>Edit Project</h3>
              <div className="flex flex-col gap-3">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Project name"
                  style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
                  className="w-full text-sm px-3 py-2.5 border rounded-xl outline-none focus:border-[#0071e3]"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingProject(null) }}
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="Description (optional)"
                  rows={2}
                  style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
                  className="w-full text-sm px-3 py-2.5 border rounded-xl outline-none focus:border-[#0071e3] resize-none"
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
                    style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                    className="px-4 py-2.5 border rounded-xl text-sm hover:opacity-80 transition-all cursor-pointer"
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
            <div style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }} className="border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-bold mb-1" style={{ color: 'var(--pv-text)' }}>Delete "{selectedProject.name}"?</h3>
              <p className="text-sm mb-5" style={{ color: 'var(--pv-text2)' }}>
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
                  style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                  className="px-4 py-2.5 border rounded-xl text-sm hover:opacity-80 transition-all cursor-pointer"
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
    <div className="flex-1 overflow-y-auto p-4 sm:p-8" style={{ background: 'var(--pv-bg)' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--pv-text)' }}>Projects</h2>
            {projects.length > 0 && (
              <span className="text-sm" style={{ color: 'var(--pv-text3)' }}>{projects.length}</span>
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
          <div className="border border-dashed rounded-2xl p-16 text-center" style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }}>
            <svg className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--pv-border)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
            <p className="font-medium mb-1" style={{ color: 'var(--pv-text)' }}>No projects yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--pv-text2)' }}>Organize your generated assets into projects</p>
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
            <div className="border-2 border-[#0071e3] rounded-2xl p-4 flex flex-col gap-3" style={{ background: 'var(--pv-surface)' }}>
              <p className="text-xs font-semibold text-[#0071e3] uppercase tracking-wider">New Project</p>
              <input
                autoFocus
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Project name"
                style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
                className="w-full text-sm px-3 py-2.5 border rounded-xl outline-none focus:border-[#0071e3]"
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowCreate(false); setCreateName(''); setCreateDesc('') } }}
              />
              <textarea
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
                className="w-full text-sm px-3 py-2.5 border rounded-xl outline-none focus:border-[#0071e3] resize-none"
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
                  style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                  className="px-3 py-2 border rounded-xl text-sm hover:opacity-80 transition-all cursor-pointer"
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
                style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }}
                className="group border hover:shadow-md rounded-2xl overflow-hidden text-left transition-all cursor-pointer hover:opacity-90"
              >
                {/* Cover image */}
                <div className="aspect-video overflow-hidden" style={{ background: 'var(--pv-surface2)' }}>
                  {cover ? (
                    <img
                      src={cover}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-10 h-10" style={{ color: 'var(--pv-border)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.5} />
                        <circle cx="8.5" cy="8.5" r="1.5" strokeWidth={1.5} />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15l-5-5L5 21" />
                      </svg>
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 sm:p-4">
                  <div className="font-semibold text-sm mb-0.5 truncate" style={{ color: 'var(--pv-text)' }}>{p.name}</div>
                  {p.description && (
                    <div className="text-xs line-clamp-1 mb-2" style={{ color: 'var(--pv-text2)' }}>{p.description}</div>
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
          <div style={{ background: 'var(--pv-surface)', borderColor: 'var(--pv-border)' }} className="border rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--pv-text)' }}>Edit Project</h3>
            <div className="flex flex-col gap-3">
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Project name"
                style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
                className="w-full text-sm px-3 py-2.5 border rounded-xl outline-none focus:border-[#0071e3]"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingProject(null) }}
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text)' }}
                className="w-full text-sm px-3 py-2.5 border rounded-xl outline-none focus:border-[#0071e3] resize-none"
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
                  style={{ background: 'var(--pv-surface2)', borderColor: 'var(--pv-border)', color: 'var(--pv-text2)' }}
                  className="px-4 py-2.5 border rounded-xl text-sm hover:opacity-80 transition-all cursor-pointer"
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
