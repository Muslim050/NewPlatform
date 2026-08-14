import { createContext, useContext, useState, useCallback } from 'react'

const AUTH_KEY = 'bloom.auth.v1'
const AuthCtx = createContext(null)

function loadAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY)) || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadAuth)

  const login = useCallback((nextUser) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(nextUser))
    setUser(nextUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setUser(null)
  }, [])

  // viewer — тот же админский обзор, но без права что-либо менять.
  const role = user?.role

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: role === 'admin' || role === 'viewer',
    isAdvertiser: role === 'advertiser',
    isViewer: role === 'viewer',
    // Единая проверка на любое изменение данных.
    canEdit: !!role && role !== 'viewer',
  }

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth должен вызываться внутри <AuthProvider>')
  return ctx
}
