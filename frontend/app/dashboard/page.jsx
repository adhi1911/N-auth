'use client'
import { useRouter } from 'next/navigation'
import { AUTH_CONFIG } from '../../config';
import Cookies from 'js-cookie';

export default function Dashboard() {
  const router = useRouter()

  const checkProtectedRoute = async () => {
    try {
      // Add your API route check here
      const token = Cookies.get('access_token');
      const response = await fetch(`${AUTH_CONFIG.BACKEND_URL}/protected`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Authentication failed')
      }
      
      const data = await response.json()
      console.log('Protected route response:', data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <button
        onClick={checkProtectedRoute}
        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        Check Protected Route
      </button>
    </div>
  )
}