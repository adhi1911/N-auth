'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { AUTH_CONFIG } from '@/config'

const AuthContext = createContext({
  isAuthenticated: false,
  loading: true,
  logout: async () => {}
})


export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    try {
      const res = await fetch(`${AUTH_CONFIG.BACKEND_URL}/session/validate`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-type': 'application/json'
        }
      })
      setIsAuthenticated(res.ok)
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const logout = async () => {
    try {
      await fetch(`${AUTH_CONFIG.BACKEND_URL}/logout`, {
        method: 'POST',
        credentials: 'include'
      })
      setIsAuthenticated(false)
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)