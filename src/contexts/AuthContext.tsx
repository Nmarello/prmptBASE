import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { type Session, type User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  signInWithMicrosoft: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('is_admin').eq('id', userId).single()
    setIsAdmin(data?.is_admin ?? false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setIsAdmin(false)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  const signInWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  const signInWithFacebook = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user, session, loading, isAdmin,
      signInWithGoogle, signInWithMicrosoft, signInWithFacebook,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
