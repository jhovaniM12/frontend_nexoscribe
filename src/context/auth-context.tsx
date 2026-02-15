'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { authApi, api } from '@/lib/api'

interface User {
  _id: string
  name: string
  email: string
  role: string
  systemRole?: string
  isActive: boolean
  avatar?: string
  accountType?: 'individual' | 'business'
  companyName?: string
}

interface AuthContextType {
  user: User | null
  activeOrganizationId: string | null
  loading: boolean
  login: (email: string, password: string, redirectTo?: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
  checkAuth: () => Promise<void>
  updateActiveOrganizationId: (id: string) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Verificar autenticación con el backend
  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get<{ user: User & { avatarUrl?: string }; activeOrganizationId?: string }>('/api/me')
      if (response.user) {
        // Backend devuelve avatarUrl, frontend usa avatar
        const u = response.user
        setUser({ ...u, avatar: u.avatar ?? u.avatarUrl ?? undefined } as User)
        if (response.activeOrganizationId) {
          setActiveOrganizationId(response.activeOrganizationId)
        }
      }
    } catch {
      // Token inválido o no hay sesión
      setUser(null)
      setActiveOrganizationId(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const updateActiveOrganizationId = (id: string) => {
    setActiveOrganizationId(id)
  }

  const login = async (email: string, password: string, redirectTo?: string) => {
    try {
      const response = await authApi.login({ email, password })
      const u = response.user as User & { avatarUrl?: string }
      setUser({ ...u, avatar: u.avatar ?? u.avatarUrl ?? undefined } as User)
      if (response.activeOrganizationId) {
        setActiveOrganizationId(response.activeOrganizationId)
      }
      setLoading(false)

      // Si hay un redirect, usarlo; si no, redirección inteligente según rol
      if (redirectTo) {
        router.push(redirectTo)
      } else if (response.user.systemRole === 'superadmin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      console.error('Error al cerrar sesión:', error)
    } finally {
      setUser(null)
      setActiveOrganizationId(null)
      router.push('/login')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        activeOrganizationId,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        checkAuth,
        updateActiveOrganizationId
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}