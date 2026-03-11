import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'
const STORAGE_KEY = 'prmptVAULT_theme'

function getSaved(): Theme {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'dark' || v === 'light') return v
  } catch {}
  return 'light'
}

function applyTheme(t: Theme) {
  if (t === 'dark') document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
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
