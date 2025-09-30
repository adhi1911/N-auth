'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { AUTH_CONFIG } from '@/config'
import { set } from 'zod'

const AuthContext = createContext({
  isAuthenticated: false,
  loading: true,
  logout: async () => {},
  login: () => {},
  forceLogoutInfo: null,
  clearForceLogoutInfo: () => {}

})


export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [forceLogoutInfo, setForceLogoutInfo] = useState(null)

    const login = () => {
      const loginUrl = `${AUTH_CONFIG.BACKEND_URL}/login`
      window.location.href = loginUrl
    }

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
        
        const data = await res.json()
        console.log("Auth check:", data)
        
        if (data.valid) {
          setIsAuthenticated(true)
          setForceLogoutInfo(null)
        } else {
          setIsAuthenticated(false)
          // Check if user was force logged out
          if (data.reason === 'force_logged_out') {
            setForceLogoutInfo(data.details)
          }
        }
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

  const clearForceLogoutInfo = () => {
    setForceLogoutInfo(null)
  }

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      loading, 
      logout,
      login,
      forceLogoutInfo,
      clearForceLogoutInfo
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)