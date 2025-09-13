'use client'

import Link from 'next/link'
import {useRouter} from 'next/navigation'
import { AUTH_CONFIG } from '../../config';

const Navbar= () =>{
    const router = useRouter()

    const handleLogin = () =>{
        // Frontend redirects user to Auth0
        const loginUrl = `${AUTH_CONFIG.BACKEND_URL}/login` 

        window.location.href = loginUrl;
    }

    return (
        <nav className="w-full p-4 bg-slate-100">
        <div className="flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
            My App
            </Link>
            <button
            onClick={handleLogin}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
            Login
            </button>
        </div>
        </nav>
    )
}


export default Navbar