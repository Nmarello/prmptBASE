interface GhostColumnProps {
  onAdd: () => void
}

export default function GhostColumn({ onAdd }: GhostColumnProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all group"
      style={{
        minHeight: 420,
        border: '2px dashed var(--pv-border)',
        background: 'var(--pv-surface)',
        opacity: 0.5,
      }}
      onClick={onAdd}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
    >
      <div
        className="flex items-center justify-center rounded-full mb-3 transition-all"
        style={{ width: 48, height: 48, background: 'var(--pv-surface2)', border: '1px solid var(--pv-border)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--pv-text3)' }}>
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--pv-text3)' }}>Add model</span>
    </div>
  )
}
