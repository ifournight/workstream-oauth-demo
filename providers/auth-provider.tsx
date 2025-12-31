'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  identityId: string | null
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session')
      const data = await response.json()

      if (data.authenticated && data.user) {
        setUser({ identityId: data.user.identityId })
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        
        // If not authenticated and not already on login page, redirect to login
        // This handles cases where SESSION_SECRET changed and old session is invalid
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          const isLoginPage = currentPath === '/login'
          const isPublicRoute = currentPath.startsWith('/clients') || 
                               currentPath.startsWith('/callback') ||
                               currentPath.startsWith('/auth')
          
          if (!isLoginPage && !isPublicRoute) {
            const returnUrl = currentPath !== '/' ? currentPath : '/'
            router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`)
          }
        }
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setUser(null)
      setIsAuthenticated(false)
      
      // On error, also redirect to login if not already there
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        const isLoginPage = currentPath === '/login'
        if (!isLoginPage) {
          const returnUrl = currentPath !== '/' ? currentPath : '/'
          router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async () => {
    // Redirect to login page
    const currentPath = window.location.pathname
    const returnUrl = currentPath !== '/login' ? currentPath : '/'
    router.push(`/login?return_url=${encodeURIComponent(returnUrl)}`)
  }, [router])

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/session', {
        method: 'DELETE',
      })
      setUser(null)
      setIsAuthenticated(false)
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
      // Even if API call fails, clear local state
      setUser(null)
      setIsAuthenticated(false)
      router.push('/login')
    }
  }, [router])

  const refresh = useCallback(async () => {
    await checkAuth()
  }, [checkAuth])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refresh,
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
