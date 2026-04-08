import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const ADVISOR_COLOR = '#7c3aed'

export default function ModelAdvisor({ models, userTier, onSelectModel }: Props) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<AdvisorMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Clear selections when panel closes
  useEffect(() => {
    if (!open) setSelectedSlugs(new Set())
  }, [open])

  function toggleSlug(slug: string) {
    setSelectedSlugs(prev => {
      const next = new Set(prev)
      if (next.has(slug)) {
        next.delete(slug)
      } else if (next.size < 4) {
        next.add(slug)
      }
      return next
    })
  }

  function handleCompare() {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''
    navigate('/compare', {
      state: {
        models: [...selectedSlugs],
        prompt: lastUserMsg,
      },
    })
    setOpen(false)
  }

  // Greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'bot',
        content: 'Tell me what you want to create and I\'ll find the best models for you. Try "photorealistic portraits", "animated logo", or "cinematic drone shot".',
      }])
    }
  }, [open])

  // Scroll to bottom
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 80) + 'px'
  }, [input])

  function clearConversation() {
    setMessages([{
      role: 'bot',
      content: 'Tell me what you want to create and I\'ll find the best models for you. Try "photorealistic portraits", "animated logo", or "cinematic drone shot".',
    }])
    setInput('')
  }

  async function send() {
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function handleSelect(slug: string) {
    const model = models.find(m => m.slug === slug)
    if (model) {
      onSelectModel(model)
      setOpen(false)
    }
  }

  // Suggestion chips shown before first user message
  const suggestions = ['Photorealistic portraits', 'Product photography', 'Animated video clip', 'Edit an existing photo']
  const showSuggestions = messages.length <= 1 && !loading

  return (
    <div style={{ position: 'fixed', top: 14, right: 16, zIndex: 9999 }}>
      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 54,
            right: 0,
            width: 320,
            height: 480,
            background: 'var(--pv-surface)',
            border: '1px solid var(--pv-border)',
            borderRadius: 18,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Header */}
          <div style={{ padding: '13px 16px 11px', borderBottom: '1px solid var(--pv-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: ADVISOR_COLOR, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SparkleIcon size={14} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 1.2 }}>Model Advisor</div>
                <div style={{ fontSize: 10, color: 'var(--pv-text3)' }}>prmptVAULT</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <button
                onClick={clearConversation}
                title="New conversation"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pv-text3)', fontSize: 11, padding: '3px 6px', borderRadius: 6, fontFamily: 'inherit' }}
                className="hover:text-[var(--pv-text)] hover:bg-white/5 transition-all"
              >New</button>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pv-text3)', fontSize: 16, lineHeight: 1, padding: 2 }}
                className="hover:text-[var(--pv-text)] transition-colors"
              >✕</button>
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '8px 12px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? ADVISOR_COLOR : 'var(--pv-surface2)',
                    color: msg.role === 'user' ? '#fff' : 'var(--pv-text)',
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    border: msg.role === 'bot' ? '1px solid var(--pv-border)' : 'none',
                  }}
                >
                  {msg.content.split('\n').map((line, j, arr) => (
                    <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                  ))}
                </div>

                {/* Recommendation cards */}
                {msg.recommendations && msg.recommendations.length > 0 && (
                  <div style={{ maxWidth: '94%', marginTop: 6, display: 'flex', flexDirection: 'column', gap: 5, alignSelf: 'flex-start' }}>
                    {msg.recommendations.map(rec => {
                      const model = models.find(m => m.slug === rec.slug)
                      if (!model) return null
                      const canAccess = tierCanAccess(userTier, model.min_tier)
                      const checked = selectedSlugs.has(rec.slug)
                      const maxReached = selectedSlugs.size >= 4 && !checked
                      return (
                        <div
                          key={rec.slug}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 10px 7px 8px',
                            background: checked ? 'rgba(124,58,237,0.08)' : 'var(--pv-surface2)',
                            border: `1px solid ${checked ? ADVISOR_COLOR : 'var(--pv-border)'}`,
                            borderRadius: 12,
                            transition: 'background 0.15s, border-color 0.15s',
                          }}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => !maxReached && toggleSlug(rec.slug)}
                            title={maxReached ? 'Max 4 models' : checked ? 'Remove from comparison' : 'Add to comparison'}
                            style={{
                              flexShrink: 0, width: 18, height: 18, borderRadius: 5,
                              border: `2px solid ${checked ? ADVISOR_COLOR : 'var(--pv-border)'}`,
                              background: checked ? ADVISOR_COLOR : 'transparent',
                              cursor: maxReached ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              padding: 0, opacity: maxReached ? 0.35 : 1,
                              transition: 'background 0.15s, border-color 0.15s',
                            }}
                          >
                            {checked && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            )}
                          </button>

                          <div
                            style={{
                              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                              background: modelGradient(model.slug),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 10, fontWeight: 700,
                            }}
                          >
                            {model.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--pv-text)', lineHeight: 1.2 }}>{model.name}</div>
                            <div style={{ fontSize: 10.5, color: 'var(--pv-text3)', lineHeight: 1.4, marginTop: 1 }}>{rec.reason}</div>
                          </div>
                          <button
                            onClick={() => handleSelect(rec.slug)}
                            style={{
                              flexShrink: 0, fontSize: 11, fontWeight: 700,
                              padding: '4px 9px', borderRadius: 7, border: 'none',
                              background: canAccess ? ADVISOR_COLOR : 'var(--pv-surface)',
                              color: canAccess ? '#fff' : 'var(--pv-text2)',
                              cursor: 'pointer', fontFamily: 'inherit',
                              ...(canAccess ? {} : { border: '1px solid var(--pv-border)' }),
                            }}
                            className="hover:opacity-80 transition-opacity"
                          >
                            {canAccess ? 'Use' : 'Upgrade'}
                          </button>
                        </div>
                      )
                    })}
                    {msg.recommendations.length >= 2 && (
                      <p style={{ fontSize: 10.5, color: 'var(--pv-text3)', margin: '2px 2px 0', lineHeight: 1.4 }}>
                        Check models to compare side by side (up to 4)
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <div style={{ padding: '8px 14px', borderRadius: '14px 14px 14px 4px', background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pv-text3)', animation: `pvBounce 1s ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Compare bar — shown when ≥2 models selected */}
          {selectedSlugs.size >= 2 && (
            <div style={{ padding: '8px 10px', borderTop: '1px solid var(--pv-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(124,58,237,0.07)' }}>
              <span style={{ fontSize: 11.5, color: 'var(--pv-text2)', fontWeight: 500 }}>
                {selectedSlugs.size} model{selectedSlugs.size > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={handleCompare}
                style={{
                  fontSize: 12, fontWeight: 700, padding: '5px 14px',
                  borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: ADVISOR_COLOR, color: '#fff', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
                className="hover:opacity-90 transition-opacity"
              >
                Compare
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>
            </div>
          )}

          {/* Suggestion chips */}
          {showSuggestions && (
            <div style={{ padding: '0 10px 6px', flexShrink: 0, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {suggestions.map(s => (
                <button
                  key={s}
                  onClick={() => { setInput(s); setTimeout(() => textareaRef.current?.focus(), 0) }}
                  style={{
                    fontSize: 11, padding: '4px 9px', borderRadius: 20,
                    border: '1px solid var(--pv-border)', background: 'var(--pv-surface2)',
                    color: 'var(--pv-text3)', cursor: 'pointer', fontFamily: 'inherit',
                  }}
                  className="hover:border-[#7c3aed] hover:text-[#7c3aed] transition-all"
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding: '8px 10px 10px', borderTop: '1px solid var(--pv-border)', flexShrink: 0, display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What do you want to create?"
              rows={1}
              style={{
                flex: 1, resize: 'none', boxSizing: 'border-box',
                background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)',
                borderRadius: 10, padding: '7px 10px', fontSize: 12.5,
                color: 'var(--pv-text)', outline: 'none', fontFamily: 'inherit', lineHeight: 1.4,
                maxHeight: 80, overflowY: 'auto',
              }}
              className="pv-placeholder focus:border-[#7c3aed] transition-colors"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              style={{
                width: 32, height: 32, background: ADVISOR_COLOR, border: 'none',
                borderRadius: 9, cursor: 'pointer', color: '#fff', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
              className="hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Trigger bubble */}
      <button
        onClick={() => setOpen(v => !v)}
        title="Model Advisor"
        style={{
          height: 38,
          borderRadius: 9999,
          background: ADVISOR_COLOR,
          border: 'none',
          boxShadow: '0 4px 16px rgba(124,58,237,0.5)',
          cursor: 'pointer', display: 'flex', alignItems: 'center',
          gap: 7,
          paddingLeft: 12, paddingRight: 14,
          color: '#fff',
          transition: 'box-shadow 0.2s ease',
        }}
      >
        {open ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <SparkleIcon size={15} color="#fff" />
        )}
        <span style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
          {open ? 'Close' : 'Model Advisor'}
        </span>
      </button>

      <style>{`
        @keyframes pvBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function SparkleIcon({ size = 14, color = 'currentColor', style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/>
      <path d="M19 2l.9 2.7 2.6.9-2.6.9L19 9l-.9-2.7L15.5 5.6l2.6-.9z" opacity=".6"/>
    </svg>
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
  if (slug.startsWith('runway')) return 'linear-gradient(145deg,#001a00,#004400,#00aa44)'
  return 'linear-gradient(145deg,#1a1a2e,#16213e,#0f3460)'
}
