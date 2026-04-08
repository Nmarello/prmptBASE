import React, { useEffect, useRef, useState } from 'react'
import type { Model } from '../../types'
import { tierCanAccess } from '../../types'

interface Recommendation {
  slug: string
  reason: string
}

interface AdvisorMessage {
  role: 'user' | 'bot'
  content: string
  recommendations?: Recommendation[]
}

interface Props {
  models: Model[]
  userTier: string
  onSelectModel: (model: Model) => void
}

export default function ModelAdvisor({ models, userTier, onSelectModel }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AdvisorMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      if (messages.length === 0) {
        setMessages([{
          role: 'bot',
          content: 'Tell me what you want to create — I\'ll find the best models for you. Try something like "photorealistic portraits", "animated logo", or "a cinematic drone shot."',
        }])
      }
    }
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const userMsg: AdvisorMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const conversationHistory = messages
        .slice(-8)
        .map(m => ({ role: m.role === 'bot' ? 'assistant' : 'user' as const, content: m.content }))

      const activeModels = models
        .filter(m => m.is_active && !m.coming_soon)
        .map(m => ({
          slug: m.slug,
          name: m.name,
          provider: m.provider,
          description: m.description,
          supported_gen_types: m.supported_gen_types,
          is_active: m.is_active,
          coming_soon: m.coming_soon,
        }))

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/model-advisor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ message: text, models: activeModels, conversation_history: conversationHistory }),
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Request failed')

      setMessages(prev => [...prev, {
        role: 'bot',
        content: data.message ?? '',
        recommendations: data.recommendations ?? [],
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'bot',
        content: 'Something went wrong — please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(slug: string) {
    const model = models.find(m => m.slug === slug)
    if (model) {
      onSelectModel(model)
      setOpen(false)
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm py-1.5 pl-2.5 pr-3.5 rounded-full transition-colors hover:opacity-80"
        style={{
          background: 'var(--pv-surface)',
          border: '1px solid var(--pv-border)',
          color: 'var(--pv-text3)',
        }}
      >
        <SparkleIcon />
        <span className="hidden sm:inline text-xs">Find the right model…</span>
        <span className="sm:hidden text-xs">Ask AI</span>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            className="w-full sm:max-w-lg flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{
              background: 'var(--pv-bg)',
              border: '1px solid var(--pv-border)',
              maxHeight: '85vh',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
              style={{ borderBottom: '1px solid var(--pv-border)' }}
            >
              <div className="flex items-center gap-2">
                <SparkleIcon size={16} />
                <span
                  style={{
                    fontFamily: "'Bricolage Grotesque',sans-serif",
                    fontWeight: 800,
                    fontSize: 16,
                    color: 'var(--pv-text)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Model Advisor
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ color: 'var(--pv-text3)' }}
                className="hover:opacity-70 transition-opacity p-1"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 min-h-0">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === 'user' ? (
                    <div className="flex justify-end">
                      <div
                        className="max-w-xs px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed"
                        style={{ background: 'var(--pv-accent)', color: '#fff' }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--pv-text2)' }}>
                        {msg.content}
                      </p>
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="space-y-2">
                          {msg.recommendations.map(rec => {
                            const model = models.find(m => m.slug === rec.slug)
                            if (!model) return null
                            return (
                              <RecommendationCard
                                key={rec.slug}
                                model={model}
                                reason={rec.reason}
                                userTier={userTier}
                                onSelect={() => handleSelect(rec.slug)}
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2">
                  <LoadingDots />
                  <span className="text-xs" style={{ color: 'var(--pv-text3)' }}>Finding models…</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="px-4 pb-5 pt-2 flex-shrink-0"
              style={{ borderTop: '1px solid var(--pv-border)' }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl mt-3"
                style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)' }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Describe what you want to create…"
                  className="flex-1 bg-transparent text-sm outline-none pv-placeholder"
                  style={{ color: 'var(--pv-text)' }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
                  style={{ background: 'var(--pv-accent)', color: '#fff' }}
                >
                  Ask
                </button>
              </div>
              <p className="text-center mt-2 text-xs" style={{ color: 'var(--pv-text3)' }}>
                Powered by AI — describes capabilities, not guaranteed results
              </p>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function SparkleIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ color: 'var(--pv-accent)', flexShrink: 0 }}>
      <path
        fill="currentColor"
        d="M12 2l1.8 5.4 5.7.6-4.35 3.75 1.5 5.7L12 14.45l-4.65 3 1.5-5.7L4.5 8l5.7-.6z"
      />
    </svg>
  )
}

function LoadingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full animate-bounce"
          style={{ background: 'var(--pv-text3)', animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}

function RecommendationCard({
  model,
  reason,
  userTier,
  onSelect,
}: {
  model: Model
  reason: string
  userTier: string
  onSelect: () => void
}) {
  const canAccess = tierCanAccess(userTier, model.min_tier)

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{ background: 'var(--pv-surface)', border: '1px solid var(--pv-border)' }}
    >
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold"
        style={{ background: modelGradient(model.slug), fontSize: 11 }}
      >
        {model.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-sm font-semibold" style={{ color: 'var(--pv-text)' }}>
            {model.name}
          </span>
          <span className="text-xs" style={{ color: 'var(--pv-text3)' }}>
            {model.provider}
          </span>
        </div>
        <p className="text-xs leading-snug" style={{ color: 'var(--pv-text2)' }}>
          {reason}
        </p>
      </div>

      {/* CTA */}
      <button
        onClick={onSelect}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
        style={{
          background: canAccess ? 'var(--pv-accent)' : 'var(--pv-surface2)',
          color: canAccess ? '#fff' : 'var(--pv-text2)',
          border: canAccess ? 'none' : '1px solid var(--pv-border)',
        }}
      >
        {canAccess ? 'Use' : 'Upgrade'}
      </button>
    </div>
  )
}

function modelGradient(slug: string): string {
  if (slug.startsWith('flux-kontext')) return 'linear-gradient(145deg,#1a0033,#4400aa,#8855ff)'
  if (slug.startsWith('flux-pro-ultra')) return 'linear-gradient(145deg,#050505,#0f0f1a,#1a1a3e)'
  if (slug.startsWith('flux-pro')) return 'linear-gradient(145deg,#00004d,#0050ff,#60a5fa)'
  if (slug.startsWith('flux-dev')) return 'linear-gradient(145deg,#3d0066,#7b2ff7,#c084fc)'
  if (slug.startsWith('flux')) return 'linear-gradient(145deg,#003566,#0096c7,#48cae4)'
  if (slug.startsWith('dalle') || slug.startsWith('gpt-image')) return 'linear-gradient(145deg,#c0392b,#e8570a,#f5a623)'
  if (slug.startsWith('recraft')) return 'linear-gradient(145deg,#3d1a00,#a05000,#e8a020)'
  if (slug.startsWith('imagen') || slug.startsWith('nano-banana')) return 'linear-gradient(145deg,#003322,#007755,#00cc88)'
  if (slug.startsWith('kling')) return 'linear-gradient(145deg,#4a0040,#cc0066,#ff4d94)'
  if (slug.startsWith('luma')) return 'linear-gradient(145deg,#05050f,#0d1a5c,#2952e3)'
  if (slug.startsWith('sora')) return 'linear-gradient(145deg,#0a0a14,#1a1a3e,#3d3d7a)'
  if (slug.startsWith('minimax') || slug.startsWith('wan')) return 'linear-gradient(145deg,#002b36,#007070,#00c9a7)'
  if (slug.startsWith('ideogram')) return 'linear-gradient(145deg,#1a0040,#5500cc,#aa44ff)'
  if (slug.startsWith('hidream') || slug.startsWith('ltx')) return 'linear-gradient(145deg,#002233,#005577,#00aabb)'
  if (slug.startsWith('runway') || slug.startsWith('cs-runway')) return 'linear-gradient(145deg,#001a00,#004400,#00aa44)'
  return 'linear-gradient(145deg,#1a1a2e,#16213e,#0f3460)'
}
