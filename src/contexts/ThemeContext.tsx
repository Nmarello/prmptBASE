import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'blue'
const STORAGE_KEY = 'prmptVAULT_theme'

function getSaved(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'dark' || v === 'light' || v === 'blue') return v
  } catch {}
  return 'dark'
}

function applyTheme(t: Theme) {
  const cl = document.documentElement.classList
  cl.remove('dark', 'blue')
  if (t === 'dark' || t === 'blue') cl.add('dark')
  if (t === 'blue') cl.add('blue')
}

interface Ctx { theme: Theme; setTheme: (t: Theme) => void }
const ThemeContext = createContext<Ctx>({ theme: 'light', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getSaved)

  useEffect(() => { applyTheme(theme) }, [theme])

  function setTheme(t: Theme) {
    setThemeState(t)
    try { localStorage.setItem(STORAGE_KEY, t) } catch {}
    applyTheme(t)
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() { return useContext(ThemeContext) }
