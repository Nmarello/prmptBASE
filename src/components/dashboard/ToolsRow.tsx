interface Props {
  onSelectTool: (tool: string) => void
}

const TOOLS = [
  {
    id: 'upscale',
    label: 'Upscale',
    desc: 'Enhance resolution up to 4×',
    available: true,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9"/>
        <polyline points="9 21 3 21 3 15"/>
        <line x1="21" y1="3" x2="14" y2="10"/>
        <line x1="3" y1="21" x2="10" y2="14"/>
      </svg>
    ),
  },
  {
    id: 'inpaint',
    label: 'Inpaint',
    desc: 'Edit and fill regions with AI',
    available: false,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-13.5z"/>
        <path d="M15 6l3 3"/>
      </svg>
    ),
  },
  {
    id: 'remove-bg',
    label: 'Remove BG',
    desc: 'Clean background removal',
    available: false,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3"/>
        <circle cx="6" cy="18" r="3"/>
        <line x1="20" y1="4" x2="8.12" y2="15.88"/>
        <line x1="14.47" y1="14.48" x2="20" y2="20"/>
        <line x1="8.12" y1="8.12" x2="12" y2="12"/>
      </svg>
    ),
  },
  {
    id: 'expand',
    label: 'Expand',
    desc: 'Outpaint beyond your image edges',
    available: false,
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 3 21 3 21 9"/>
        <polyline points="9 21 3 21 3 15"/>
        <polyline points="21 15 21 21 15 21"/>
        <polyline points="3 9 3 3 9 3"/>
      </svg>
    ),
  },
]

export default function ToolsRow({ onSelectTool }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h2
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 18,
            fontWeight: 800,
            color: 'var(--pv-text)',
            letterSpacing: '-0.03em',
          }}
        >
          Tools
        </h2>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 20,
            background: 'color-mix(in srgb, var(--pv-accent) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--pv-accent) 30%, transparent)',
            color: 'var(--pv-accent)',
          }}
        >
          beta
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => tool.available && onSelectTool(tool.id)}
            disabled={!tool.available}
            style={{
              background: 'var(--pv-surface2)',
              borderColor: 'var(--pv-border)',
              color: 'var(--pv-text)',
              minWidth: 180,
              width: 180,
              flexShrink: 0,
              textAlign: 'left',
              position: 'relative',
              opacity: tool.available ? 1 : 0.65,
              cursor: tool.available ? 'pointer' : 'default',
            }}
            className="rounded-2xl border p-4 flex flex-col gap-3 transition-all hover:border-[var(--pv-accent)] disabled:hover:border-[var(--pv-border)]"
          >
            {/* Icon area */}
            <div
              style={{
                background: 'var(--pv-surface)',
                borderColor: 'var(--pv-border)',
                color: tool.available ? 'var(--pv-accent)' : 'var(--pv-text3)',
              }}
              className="w-11 h-11 rounded-xl border flex items-center justify-center"
            >
              {tool.icon}
            </div>

            {/* Text */}
            <div className="flex flex-col gap-0.5">
              <span
                style={{
                  fontFamily: "'Bricolage Grotesque', sans-serif",
                  color: 'var(--pv-text)',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                }}
              >
                {tool.label}
              </span>
              <span
                style={{
                  color: 'var(--pv-text3)',
                  fontSize: 11,
                  lineHeight: 1.4,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {tool.desc}
              </span>
            </div>

            {/* CTA / badge */}
            {tool.available ? (
              <span
                style={{
                  background: 'var(--pv-accent)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 20,
                  alignSelf: 'flex-start',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Open →
              </span>
            ) : (
              <span
                style={{
                  background: 'var(--pv-surface)',
                  borderColor: 'var(--pv-border)',
                  color: 'var(--pv-text3)',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 20,
                  border: '1px solid',
                  alignSelf: 'flex-start',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Soon
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
