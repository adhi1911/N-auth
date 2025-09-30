'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { AUTH_CONFIG } from '../../config'

export default function Dashboard() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const loadProfile = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${AUTH_CONFIG.BACKEND_URL}/profile`, {
        credentials: "include"
      })

      if (!response.ok) {
        throw new Error('Failed to load profile')
      }
      
      const data = await response.json()
      setUser(data.user)

    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }
if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1724] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#1B2B4B] border-t-[#4B9EFD]"></div>
          </div>
          <p className="mt-4 text-[#94A3B8]">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!loading && !isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#0F1724]">
      {/* Subtle gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#131B2E] to-[#0F1724] pointer-events-none"></div>

      <div className="relative container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-[#1B2B4B]/50 border border-[#2C3B5B] rounded-xl p-8 backdrop-blur-sm">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#2C3B5B] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#4B9EFD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
                <p className="text-[#94A3B8]">View your secure profile information</p>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="bg-[#1B2B4B]/50 border border-[#2C3B5B] rounded-xl p-8 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <span>Profile Information</span>
                {user && <div className="ml-3 w-2 h-2 rounded-full bg-[#4B9EFD] animate-pulse"></div>}
              </h2>
            </div>

            {!user && !isLoading && (
              <div className="mb-6 p-4 bg-[#131B2E] border border-[#2C3B5B] rounded-lg">
                <p className="text-[#94A3B8] text-center">Click below to load your profile data</p>
              </div>
            )}

            <button
              onClick={loadProfile}
              disabled={isLoading}
              className={`
                w-full px-6 py-3 rounded-lg font-medium transition-all duration-300
                ${isLoading 
                  ? 'bg-[#2C3B5B] text-[#94A3B8] cursor-not-allowed' 
                  : 'bg-[#4B9EFD] hover:bg-[#5BA8FF] text-white shadow-lg shadow-[#4B9EFD]/10'
                }
              `}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                  Loading Profile...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Load Profile
                </span>
              )}
            </button>

            {user && (
              <div className="mt-6">
                <div className="bg-[#131B2E] border border-[#2C3B5B] rounded-lg divide-y divide-[#2C3B5B]">
                  <div className="p-4 flex items-center justify-between hover:bg-[#1B2B4B] transition-colors">
                    <span className="text-[#94A3B8] flex items-center">
                      <svg className="w-4 h-4 mr-2 text-[#4B9EFD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      User ID
                    </span>
                    <code className="text-white bg-[#2C3B5B] px-3 py-1 rounded text-sm font-mono">
                      {user.user_id}
                    </code>
                  </div>
                  <div className="p-4 flex items-center justify-between hover:bg-[#1B2B4B] transition-colors">
                    <span className="text-[#94A3B8] flex items-center">
                      <svg className="w-4 h-4 mr-2 text-[#4B9EFD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                      Email
                    </span>
                    <code className="text-white bg-[#2C3B5B] px-3 py-1 rounded text-sm font-mono">
                      {user.email}
                    </code>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6">
                <div className="p-4 bg-[#2D1B23] border border-[#FF4E64]/20 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-[#FF4E64]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[#FF4E64] text-sm">{error}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
  
}
  