'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AUTH_CONFIG } from '../../config'

const Navbar = () => {
    const router = useRouter()

    const handleLogin = () => {
        const loginUrl = `${AUTH_CONFIG.BACKEND_URL}/login`
        window.location.href = loginUrl
    }

    return (
        <nav className="w-full bg-gray-900 shadow-md">
            <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
                <Link href="/" className="text-2xl font-bold text-white hover:text-gray-300 transition">
                    N-Auth
                </Link>
                <button
                    onClick={handleLogin}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                >
                    Login
                </button>
            </div>
        </nav>
    )
}

export default Navbar
