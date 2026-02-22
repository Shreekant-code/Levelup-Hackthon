import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../utils/api'

const AuthContext = createContext(null)

const parseJwt = (token) => {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

const isTokenValid = (token) => {
  const payload = parseJwt(token)
  if (!payload || !payload.exp) return false
  return payload.exp * 1000 > Date.now()
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem('token')
    if (!saved || !isTokenValid(saved)) {
      localStorage.removeItem('token')
      return null
    }
    return saved
  })
  const [profile, setProfile] = useState(null)

  const tokenUser = useMemo(() => {
    if (!token) return null
    const payload = parseJwt(token)
    if (!payload) return null
    return { userId: payload.userId }
  }, [token])

  const persistToken = useCallback((value) => {
    if (!value) {
      localStorage.removeItem('token')
      setToken(null)
      setProfile(null)
      return
    }

    localStorage.setItem('token', value)
    setToken(value)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!token) {
      setProfile(null)
      return { ok: false, status: 401 }
    }

    const response = await api.get('/api/auth/me')
    if (response.ok) {
      setProfile(response.data)
      return response
    }

    if (response.status === 401) {
      persistToken(null)
    }

    return response
  }, [token, persistToken])

  useEffect(() => {
    refreshProfile()
  }, [refreshProfile])

  const user = useMemo(() => profile || tokenUser, [profile, tokenUser])

  const login = useCallback(async (email, password) => {
    const result = await api.post('/api/auth/login', { email, password })

    if (!result.ok) {
      if (result.status === 401) throw new Error('Invalid credentials')
      throw new Error(result.data?.message || 'Login failed')
    }

    if (!result.data?.token) throw new Error('Token not received')

    persistToken(result.data.token)
    setProfile(result.data.user || null)
    await refreshProfile()
    return result.data
  }, [persistToken, refreshProfile])

  const register = useCallback(async (payload) => {
    const result = await api.post('/api/auth/register', payload)

    if (!result.ok) throw new Error(result.data?.message || 'Signup failed')
    if (!result.data?.token) throw new Error('Token not received')

    persistToken(result.data.token)
    setProfile(result.data.user || null)
    await refreshProfile()
    return result.data
  }, [persistToken, refreshProfile])

  const logout = useCallback(() => persistToken(null), [persistToken])

  const authFetch = useCallback(async (path, options = {}) => {
    if (!token || !isTokenValid(token)) {
      logout()
      throw new Error('Session expired. Please login again.')
    }

    const method = (options.method || 'GET').toUpperCase()
    let result

    if (method === 'POST') result = await api.post(path, options.body || {})
    else if (method === 'PUT') result = await api.put(path, options.body || {})
    else if (method === 'DELETE') result = await api.delete(path)
    else result = await api.get(path)

    if (!result.ok && result.status === 401) {
      logout()
      throw new Error('Session expired. Please login again.')
    }

    return result
  }, [token, logout])

  const value = {
    user,
    profile,
    token,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    authFetch,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
