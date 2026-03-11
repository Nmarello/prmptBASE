import { createContext, useContext, useState } from 'react'

export type LearningMode = 'none' | 'tooltips' | 'guided'

const STORAGE_KEY = 'prmptVAULT_learningMode'

function getSaved(): LearningMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'tooltips' || v === 'guided') return v
  } catch {}
  return 'none'
}

interface Ctx {
  mode: LearningMode
  setMode: (m: LearningMode) => void
}

const LearningModeContext = createContext<Ctx>({ mode: 'none', setMode: () => {} })

export function LearningModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LearningMode>(getSaved)

  function setMode(m: LearningMode) {
    setModeState(m)
    try { localStorage.setItem(STORAGE_KEY, m) } catch {}
  }

  return (
    <LearningModeContext.Provider value={{ mode, setMode }}>
      {children}
    </LearningModeContext.Provider>
  )
}

export function useLearningMode() {
  return useContext(LearningModeContext)
}
