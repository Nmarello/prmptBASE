import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Video models excluded from Studio picker (Pro-only)
const STUDIO_VIDEO_EXCLUDED = ['sora2', 'sora2-txt2vid', 'sora2-img2vid', 'kling', 'kling-txt2vid', 'kling-img2vid']

const CREATOR_LIMIT = 10
const STUDIO_VIDEO_LIMIT = 5

interface PickerModel {
  id: string
  slug: string
  name: string
  provider: string
  supported_gen_types: string[]
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

export default function ModelPicker({ tier, userId }: { tier: string; userId: string }) {
  const [allModels, setAllModels] = useState<PickerModel[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [lockedUntil, setLockedUntil] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const isLocked = lockedUntil !== null && lockedUntil > new Date()
  const limit = tier === 'creator' ? CREATOR_LIMIT : STUDIO_VIDEO_LIMIT
  const label = tier === 'creator' ? 'image' : 'video'

  const pickerModels = allModels.filter(m => {
    if (tier === 'creator') {
      return m.supported_gen_types.some(g => ['txt2img', 'img2img', 'multi_img2img'].includes(g))
    }
    if (tier === 'studio') {
      return m.supported_gen_types.some(g => ['txt2vid', 'img2vid', 'vid2vid'].includes(g))
        && !STUDIO_VIDEO_EXCLUDED.includes(m.slug)
    }
    return false
  })

  useEffect(() => {
    async function load() {
      const [modelsRes, selsRes, profileRes] = await Promise.all([
        supabase
          .from('models')
          .select('id, slug, name, provider, supported_gen_types')
          .eq('is_active', true)
          .eq('coming_soon', false)
          .order('sort_order'),
        supabase
          .from('user_model_selections')
          .select('model_id')
          .eq('user_id', userId),
        supabase
          .from('profiles')
          .select('model_picker_locked_until')
          .eq('id', userId)
          .single(),
      ])

      if (modelsRes.data) setAllModels(modelsRes.data as PickerModel[])
      if (selsRes.data) {
        const ids = new Set(selsRes.data.map(s => s.model_id))
        setSelectedIds(ids)
        setSavedIds(new Set(ids))
      }
      if (profileRes.data?.model_picker_locked_until) {
        setLockedUntil(new Date(profileRes.data.model_picker_locked_until))
      }
      setLoading(false)
    }
    load()
  }, [userId, tier])

  function toggle(modelId: string) {
    if (isLocked) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(modelId)) {
        next.delete(modelId)
      } else if (next.size < limit) {
        next.add(modelId)
      }
      return next
    })
  }

  const isDirty = (() => {
    if (selectedIds.size !== savedIds.size) return true
    for (const id of selectedIds) if (!savedIds.has(id)) return true
    return false
  })()

  async function handleSave() {
    if (isLocked || saving || selectedIds.size === 0) return
    setSaving(true)
    try {
      const pickerModelIds = pickerModels.map(m => m.id)

      // Remove old selections for this model category
      await supabase
        .from('user_model_selections')
        .delete()
        .eq('user_id', userId)
        .in('model_id', pickerModelIds)

      // Insert new selections
      if (selectedIds.size > 0) {
        await supabase
          .from('user_model_selections')
          .insert([...selectedIds].map(model_id => ({ user_id: userId, model_id })))
      }

      // Set 30-day lock
      const newLockedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      await supabase
        .from('profiles')
        .update({ model_picker_locked_until: newLockedUntil.toISOString() })
        .eq('id', userId)

      setLockedUntil(newLockedUntil)
      setSavedIds(new Set(selectedIds))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
    setSaving(false)
  }

  if (!['creator', 'studio'].includes(tier)) return null

  const unlockDate = lockedUntil?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  return (
    <div>
      {/* Context line */}
      <div style={{ fontSize: 13, color: 'var(--pv-text3)', marginBottom: 16, lineHeight: 1.5 }}>
        {tier === 'creator'
          ? `Choose up to ${CREATOR_LIMIT} image models. Your selection locks for 30 days after saving.`
          : `Choose up to ${STUDIO_VIDEO_LIMIT} video models. Sora 2 and Kling are Pro-only. Your selection locks for 30 days after saving.`
        }
      </div>

      {/* Count + lock + save */}
      <div className="flex items-center justify-between mb-4" style={{ gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--pv-text)' }}>
            {selectedIds.size} / {limit} selected
          </span>
          {isLocked && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--pv-text3)', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', borderRadius: 20, padding: '2px 8px' }}>
              <LockIcon />
              Locked until {unlockDate}
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isLocked || saving || selectedIds.size === 0 || !isDirty}
          style={{
            padding: '7px 16px',
            borderRadius: 10,
            background: (isLocked || selectedIds.size === 0 || !isDirty) ? 'var(--pv-surface2)' : 'var(--pv-accent)',
            border: '1px solid ' + ((isLocked || selectedIds.size === 0 || !isDirty) ? 'var(--pv-border)' : 'transparent'),
            color: (isLocked || selectedIds.size === 0 || !isDirty) ? 'var(--pv-text3)' : '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: (isLocked || selectedIds.size === 0 || !isDirty) ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save selection'}
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse" style={{ fontSize: 13, color: 'var(--pv-text3)', padding: '24px 0' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {pickerModels.map(m => {
            const sel = selectedIds.has(m.id)
            const atLimit = !sel && selectedIds.size >= limit
            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                disabled={isLocked || atLimit}
                style={{
                  position: 'relative',
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: sel ? 'var(--pv-accent)' : 'var(--pv-surface)',
                  border: '1px solid ' + (sel ? 'transparent' : 'var(--pv-border)'),
                  color: sel ? '#fff' : (atLimit || isLocked) ? 'var(--pv-text3)' : 'var(--pv-text)',
                  textAlign: 'left',
                  cursor: (isLocked || atLimit) ? 'not-allowed' : 'pointer',
                  opacity: (atLimit && !sel) ? 0.45 : 1,
                  fontFamily: 'inherit',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, paddingRight: sel ? 18 : 0 }}>{m.name}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{m.provider}</div>
                {sel && (
                  <div style={{ position: 'absolute', top: 10, right: 10, color: '#fff' }}>
                    <CheckIcon />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {isLocked && (
        <p style={{ fontSize: 12, color: 'var(--pv-text3)', marginTop: 12, lineHeight: 1.5 }}>
          Your {label} model selection is locked until {unlockDate}. You can update your selection again after that date.
        </p>
      )}
    </div>
  )
}
