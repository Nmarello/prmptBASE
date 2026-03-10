import { StrictMode, Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#0d1117', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', padding: '2rem' }}>
          <div style={{ color: '#f87171', fontSize: '1.2rem', marginBottom: '1rem' }}>Runtime Error</div>
          <pre style={{ color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'pre-wrap', maxWidth: '80vw' }}>{String(this.state.error)}</pre>
          <pre style={{ color: '#475569', fontSize: '0.7rem', whiteSpace: 'pre-wrap', maxWidth: '80vw', marginTop: '1rem' }}>{(this.state.error as Error).stack}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
