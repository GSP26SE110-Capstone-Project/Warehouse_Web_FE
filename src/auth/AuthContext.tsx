import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '../api/auth'
import * as usersApi from '../api/users'
import type { ApiUser, LoginPayload } from '../api/types'
import { clearSession, getAccessToken, getStoredUser, saveSession } from './storage'

type AuthState = {
  user: ApiUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<ApiUser>
  logout: () => void
  refreshUser: () => Promise<void>
  syncUser: (user: ApiUser) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(() => getStoredUser())
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      return
    }
    try {
      const me = await usersApi.getMe()
      setUser(me)
      saveSession(token, me)
    } catch {
      clearSession()
      setUser(null)
    }
  }, [])

  const syncUser = useCallback((next: ApiUser) => {
    const token = getAccessToken()
    if (!token) return
    setUser(next)
    saveSession(token, next)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!getAccessToken()) {
        if (!cancelled) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }
      try {
        await refreshUser()
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [refreshUser])

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authApi.login(payload)
    saveSession(result.accessToken, result.user)
    setUser(result.user)
    return result.user
  }, [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user && !!getAccessToken(),
      login,
      logout,
      refreshUser,
      syncUser,
    }),
    [user, isLoading, login, logout, refreshUser, syncUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getHomePathForRole(role: ApiUser['role']) {
  if (role === 'WH_TRANSPORTER') return '/staff/my-deliveries'
  if (role === 'WH_STAFF' || role === 'TENANT_STAFF') return '/staff/dashboard'
  if (role === 'TENANT_ADMIN') return '/staff/products'
  if (role === 'SYSTEM_ADMIN') return '/admin/requests'
  return '/admin/dashboard'
}

export const ADMIN_ROLES: ApiUser['role'][] = ['SYSTEM_ADMIN', 'WH_ADMIN']
export const STAFF_ROLES: ApiUser['role'][] = [
  'WH_STAFF',
  'TENANT_ADMIN',
  'TENANT_STAFF',
]
export const TRANSPORTER_ROLES: ApiUser['role'][] = ['WH_TRANSPORTER']
