import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'

const STORAGE_KEY_PREFIX = 'pv_support_conv_'

interface ChatMessage {
  role: 'user' | 'bot'
  content: string
  imagePreview?: string
}

export default function SupportWidget() {
  const { user, session } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [escalated, setEscalated] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [pendingImage, setPendingImage] = useState<string | null>(null) // base64 data URL
  const fileRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load persisted conversation from localStorage
  useEffect(() => {
    const storedId = localStorage.getItem(`${STORAGE_KEY_PREFIX}id`)
    const storedMsgs = localStorage.getItem(`${STORAGE_KEY_PREFIX}messages`)
    const storedEscalated = localStorage.getItem(`${STORAGE_KEY_PREFIX}escalated`)
    if (storedId) setConversationId(storedId)
    if (storedMsgs) {
      try { setMessages(JSON.parse(storedMsgs)) } catch (_) {}
    }
    if (storedEscalated === 'true') setEscalated(true)
  }, [])

  // Persist to localStorage when conversation changes
  useEffect(() => {
    if (conversationId) localStorage.setItem(`${STORAGE_KEY_PREFIX}id`, conversationId)
    if (messages.length > 0) localStorage.setItem(`${STORAGE_KEY_PREFIX}messages`, JSON.stringify(messages))
    localStorage.setItem(`${STORAGE_KEY_PREFIX}escalated`, String(escalated))
  }, [conversationId, messages, escalated])

  // Scroll to bottom when messages update
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Show greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const name = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? null
      setMessages([{
        role: 'bot',
        content: `Hi${name ? ` ${name}` : ' there'}! What can I help you with today?`,
      }])
    }
  }, [open])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setPendingImage(ev.target?.result as string)
    reader.readAsDataURL(file)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function send() {
    if ((!input.trim() && !pendingImage) || sending || escalated) return
    const userText = input.trim() || '(screenshot attached)'
    const imageToSend = pendingImage

    setMessages(prev => [...prev, { role: 'user', content: userText, imagePreview: imageToSend ?? undefined }])
    setInput('')
    setPendingImage(null)
    setSending(true)

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            message: userText,
            image_url: imageToSend ?? null,
            user_token: session?.access_token ?? null,
          }),
        }
      )
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (data.conversation_id) setConversationId(data.conversation_id)
      if (data.escalated) setEscalated(true)
      setMessages(prev => [...prev, { role: 'bot', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." }])
    }
    setSending(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  function clearConversation() {
    setMessages([])
    setConversationId(null)
    setEscalated(false)
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}id`)
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}messages`)
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}escalated`)
    // Show greeting again
    const name = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? null
    setMessages([{ role: 'bot', content: `Hi${name ? ` ${name}` : ' there'}! What can I help you with today?` }])
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 20, zIndex: 9999 }}>
      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 60,
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
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--pv-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                💬
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--pv-text)', fontFamily: "'Bricolage Grotesque', sans-serif", lineHeight: 1.2 }}>Support</div>
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

          {/* Escalated banner */}
          {escalated && (
            <div style={{ padding: '8px 14px', background: 'rgba(245,200,66,0.08)', borderBottom: '1px solid rgba(245,200,66,0.15)', fontSize: 11.5, color: '#f5c842', flexShrink: 0 }}>
              Nick has been notified and will follow up within 24 hours.
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div
                  style={{
                    maxWidth: '82%',
                    padding: '8px 12px',
                    borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                    background: msg.role === 'user' ? 'var(--pv-accent)' : 'var(--pv-surface2)',
                    color: msg.role === 'user' ? '#fff' : 'var(--pv-text)',
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    border: msg.role === 'bot' ? '1px solid var(--pv-border)' : 'none',
                  }}
                >
                  {msg.imagePreview && (
                    <img src={msg.imagePreview} alt="attachment" style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 5, display: 'block' }} />
                  )}
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < msg.content.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              </div>
            ))}
            {sending && (
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

          {/* Image preview strip */}
          {pendingImage && (
            <div style={{ padding: '6px 12px 0', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src={pendingImage} alt="preview" style={{ height: 44, width: 44, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--pv-border)' }} />
              <button
                onClick={() => setPendingImage(null)}
                style={{ fontSize: 11, color: 'var(--pv-text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                className="hover:text-[var(--pv-text)] transition-colors"
              >Remove</button>
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding: '8px 10px 10px', borderTop: '1px solid var(--pv-border)', flexShrink: 0, display: 'flex', gap: 6, alignItems: 'flex-end' }}>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleImageSelect} style={{ display: 'none' }} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={escalated}
              title="Attach screenshot"
              style={{ width: 32, height: 32, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)', borderRadius: 9, cursor: 'pointer', color: 'var(--pv-text3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              className="hover:border-[var(--pv-accent)] hover:text-[var(--pv-accent)] disabled:opacity-30 transition-all"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </button>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={escalated ? "Conversation escalated" : "Message…"}
              disabled={escalated}
              rows={1}
              style={{
                flex: 1, resize: 'none', boxSizing: 'border-box',
                background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)',
                borderRadius: 10, padding: '7px 10px', fontSize: 12.5,
                color: 'var(--pv-text)', outline: 'none', fontFamily: 'inherit', lineHeight: 1.4,
                maxHeight: 80, overflowY: 'auto',
              }}
              className="pv-placeholder focus:border-[var(--pv-accent)] transition-colors disabled:opacity-40"
            />
            <button
              onClick={send}
              disabled={(!input.trim() && !pendingImage) || sending || escalated}
              style={{
                width: 32, height: 32, background: 'var(--pv-accent)', border: 'none',
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

      {/* Trigger button */}
      <button
        onClick={() => setOpen(v => !v)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Support"
        style={{
          height: 44,
          width: (!open && hovered) ? 122 : 44,
          borderRadius: 9999,
          background: 'var(--pv-accent)',
          border: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: 12, paddingLeft: (!open && hovered) ? 14 : 12,
          overflow: 'hidden', whiteSpace: 'nowrap',
          color: '#fff',
          transition: 'width 0.22s ease, padding-left 0.22s ease',
        }}
      >
        {!open && (
          <span style={{
            flex: 1, fontSize: 12.5, fontWeight: 600, minWidth: 0,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.12s 0.08s',
            overflow: 'hidden',
          }}>Support</span>
        )}
        {open ? (
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: hovered ? 7 : 0, transition: 'margin-left 0.22s ease' }}>
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
            <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
        )}
      </button>

      {/* Typing indicator keyframes */}
      <style>{`
        @keyframes pvBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
