import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface User {
  telegram_id: string
  display_name: string
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (sessionToken: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('session_token'))
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('invalid')
        return res.json()
      })
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem('session_token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = (sessionToken: string, u: User) => {
    localStorage.setItem('session_token', sessionToken)
    setToken(sessionToken)
    setUser(u)
  }

  const logout = () => {
    localStorage.removeItem('session_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
