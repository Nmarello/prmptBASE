import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

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

function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function fmt(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ModelPicker({ tier, userId }: { tier: string; userId: string }) {
  const [allModels, setAllModels] = useState<PickerModel[]>([])
  // selectedIds = what's checked in the UI right now
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  // savedIds = what's actually saved in DB (minimum floor — can't go below this count)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  // per-model lock map: model_id → locked_until Date (only active locks)
  const [lockedMap, setLockedMap] = useState<Map<string, Date>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const limit = tier === 'creator' ? CREATOR_LIMIT : STUDIO_VIDEO_LIMIT

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
      const [modelsRes, selsRes] = await Promise.all([
        supabase
          .from('models')
          .select('id, slug, name, provider, supported_gen_types')
          .eq('is_active', true)
          .eq('coming_soon', false)
          .order('sort_order'),
        supabase
          .from('user_model_selections')
          .select('model_id, locked_until')
          .eq('user_id', userId),
      ])

      if (modelsRes.data) setAllModels(modelsRes.data as PickerModel[])

      if (selsRes.data) {
        const ids = new Set(selsRes.data.map(s => s.model_id as string))
        setSelectedIds(ids)
        setSavedIds(new Set(ids))

        const now = new Date()
        const locks = new Map<string, Date>()
        for (const s of selsRes.data) {
          if (s.locked_until) {
            const d = new Date(s.locked_until)
            if (d > now) locks.set(s.model_id, d)
          }
        }
        setLockedMap(locks)
      }

      setLoading(false)
    }
    load()
  }, [userId, tier])

  function toggle(modelId: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(modelId)) {
        // Trying to uncheck — block if locked
        if (lockedMap.has(modelId)) return prev
        // Block if it would drop below the saved floor
        if (next.size - 1 < savedIds.size && savedIds.has(modelId)) return prev
        next.delete(modelId)
      } else {
        if (next.size >= limit) return prev
        next.add(modelId)
      }
      return next
    })
  }

  const addedIds = [...selectedIds].filter(id => !savedIds.has(id))
  const removedIds = [...savedIds].filter(id => !selectedIds.has(id))
  const isDirty = addedIds.length > 0 || removedIds.length > 0
  const isSwap = addedIds.length > 0 && removedIds.length > 0
  // Pure uncheck with no replacement — save not allowed
  const isInvalidRemove = removedIds.length > 0 && addedIds.length === 0

  // Compute what the lock date would be for any swapped-in models
  const now = new Date()
  let activeWindowExpiry: Date | null = null
  for (const [, d] of lockedMap) {
    if (d > now && (!activeWindowExpiry || d > activeWindowExpiry)) activeWindowExpiry = d
  }
  const swapLockDate = isSwap
    ? (activeWindowExpiry ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    : null

  const canSave = isDirty && !isInvalidRemove && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    try {
      // Delete removed selections
      if (removedIds.length > 0) {
        await supabase
          .from('user_model_selections')
          .delete()
          .eq('user_id', userId)
          .in('model_id', removedIds)
      }

      // Insert added selections
      if (addedIds.length > 0) {
        const lockedUntilVal = swapLockDate ? swapLockDate.toISOString() : null
        await supabase
          .from('user_model_selections')
          .insert(addedIds.map(model_id => ({ user_id: userId, model_id, locked_until: lockedUntilVal })))
      }

      // Update profile lock cache to the new max locked_until
      if (swapLockDate) {
        await supabase
          .from('profiles')
          .update({ model_picker_locked_until: swapLockDate.toISOString() })
          .eq('id', userId)
      }

      // Update local state
      const newLockedMap = new Map(lockedMap)
      for (const id of removedIds) newLockedMap.delete(id)
      if (swapLockDate) {
        for (const id of addedIds) newLockedMap.set(id, swapLockDate)
      }
      setLockedMap(newLockedMap)
      setSavedIds(new Set(selectedIds))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {}
    setSaving(false)
  }

  if (!['creator', 'studio'].includes(tier)) return null

  // Global lock summary (earliest expiry any locked model has, for display)
  const latestLock = activeWindowExpiry

  return (
    <div>
      <div style={{ fontSize: 13, color: 'var(--pv-text3)', marginBottom: 16, lineHeight: 1.5 }}>
        {tier === 'creator'
          ? `Choose up to ${CREATOR_LIMIT} image models. Empty slots can be filled anytime. Swapping a model locks that slot for 30 days.`
          : `Choose up to ${STUDIO_VIDEO_LIMIT} video models (Sora 2 and Kling are Pro-only). Empty slots can be filled anytime. Swapping locks that slot for 30 days.`
        }
      </div>

      {/* Count + lock summary + save */}
      <div className="flex items-center justify-between mb-4" style={{ gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--pv-text)' }}>
            {selectedIds.size} / {limit} selected
          </span>
          {latestLock && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--pv-text3)', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', borderRadius: 20, padding: '2px 8px' }}>
              <LockIcon />
              Some slots locked until {fmt(latestLock)}
            </span>
          )}
          {isInvalidRemove && (
            <span style={{ fontSize: 11, color: '#f59e0b' }}>Pick a replacement to swap</span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            padding: '7px 16px',
            borderRadius: 10,
            background: canSave ? 'var(--pv-accent)' : 'var(--pv-surface2)',
            border: '1px solid ' + (canSave ? 'transparent' : 'var(--pv-border)'),
            color: canSave ? '#fff' : 'var(--pv-text3)',
            fontSize: 13,
            fontWeight: 600,
            cursor: canSave ? 'pointer' : 'not-allowed',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            flexShrink: 0,
          }}
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save selection'}
        </button>
      </div>

      {/* Swap preview: what will get locked */}
      {isSwap && swapLockDate && (
        <div style={{ fontSize: 12, color: 'var(--pv-text3)', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
          Swapped models will be locked until <strong style={{ color: 'var(--pv-text)' }}>{fmt(swapLockDate)}</strong>
          {activeWindowExpiry && ' (joining your active swap window)'}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse" style={{ fontSize: 13, color: 'var(--pv-text3)', padding: '24px 0' }}>Loading…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {pickerModels.map(m => {
            const sel = selectedIds.has(m.id)
            const modelLock = lockedMap.get(m.id)
            const isModelLocked = !!modelLock
            const atLimit = !sel && selectedIds.size >= limit
            const canToggle = sel
              ? !isModelLocked && !(savedIds.has(m.id) && selectedIds.size - 1 < savedIds.size)
              : !atLimit

            return (
              <button
                key={m.id}
                onClick={() => toggle(m.id)}
                title={isModelLocked ? `Locked until ${fmt(modelLock!)}` : undefined}
                style={{
                  position: 'relative',
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: sel ? (isModelLocked ? 'color-mix(in srgb, var(--pv-accent) 65%, transparent)' : 'var(--pv-accent)') : 'var(--pv-surface)',
                  border: '1px solid ' + (sel ? 'transparent' : 'var(--pv-border)'),
                  color: sel ? '#fff' : atLimit ? 'var(--pv-text3)' : 'var(--pv-text)',
                  textAlign: 'left',
                  cursor: canToggle ? 'pointer' : (isModelLocked ? 'not-allowed' : 'default'),
                  opacity: atLimit ? 0.45 : 1,
                  fontFamily: 'inherit',
                  transition: 'all 0.12s',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, paddingRight: (sel || isModelLocked) ? 18 : 0 }}>{m.name}</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>
                  {isModelLocked ? fmt(modelLock!) : m.provider}
                </div>
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  {isModelLocked ? (
                    <span style={{ color: sel ? 'rgba(255,255,255,0.7)' : 'var(--pv-text3)' }}><LockIcon /></span>
                  ) : sel ? (
                    <span style={{ color: '#fff' }}><CheckIcon /></span>
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
