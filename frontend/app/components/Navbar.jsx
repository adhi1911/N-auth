'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AUTH_CONFIG } from '../../config'
import { useAuth } from '@/context/AuthContext'

const Navbar = () => {
    const router = useRouter()
    const { isAuthenticated, loading, logout } = useAuth()

    const handleLogin = () => {
        const loginUrl = `${AUTH_CONFIG.BACKEND_URL}/login`
        window.location.href = loginUrl
    }

    const handleLogout = async () => {
        await logout()
    }

     return (
        <nav className="w-full bg-[#0F1724]/95 backdrop-blur-sm border-b border-[#2C3B5B] sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <Link href="/" className="group flex items-center space-x-2">
                        <div className="w-8 h-8 bg-[#4B9EFD] rounded-lg flex items-center justify-center transition-transform duration-300">
                            <span className="text-white font-bold text-sm">N</span>
                        </div>
                        <span className="text-xl font-bold text-white group-hover:text-[#4B9EFD] transition-colors duration-200">
                            N-Auth
                        </span>
                    </Link>
                    
                    <div className="flex items-center space-x-4">
                        {!loading && (
                            isAuthenticated ? (
                                <div className="flex items-center space-x-4">
                                    <Link 
                                        href="/dashboard" 
                                        className="text-[#94A3B8] hover:text-white transition-colors duration-200 relative group"
                                    >
                                        Dashboard
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#4B9EFD] transition-all duration-300 group-hover:w-full"></span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 bg-[#2D1B23] border border-[#FF4E64]/30 text-[#FF4E64] hover:bg-[#3D1B23] rounded-lg transition-all duration-200 text-sm"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleLogin}
                                    className="px-6 py-2 bg-[#4B9EFD] hover:bg-[#5BA8FF] text-white rounded-lg transition-all duration-200 font-medium shadow-lg"
                                >
                                    Login
                                </button>
                            )
                        )}
                        
                        {loading && (
                            <div className="relative">
                                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#1B2B4B] border-t-[#4B9EFD]"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default Navbar