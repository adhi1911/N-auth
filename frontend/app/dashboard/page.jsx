'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AUTH_CONFIG } from '../../config';

export default function Dashboard() {
  const router = useRouter()

  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)


  const checkProtectedRoute = async () => {
    try {
      // Add your API route check here
      const response = await fetch(`${AUTH_CONFIG.BACKEND_URL}/profile`,{
        credentials: "include"
      })

      console.log(response);

      if (!response.ok) {
        throw new Error('Authentication failed')
      }
      
      const data = await response.json()
      console.log('Protected route response:', data)

      setUser({
        userName: data.user.user_id,
        userEmail: data.user.email
      })

    } catch (error) {
      console.error('Error:', error)
      setError(err.message)
      setUser(null)
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

      <div className="user-details mt-4">
        {user ? (
          <>
            <p>UserName: {user.userName}</p>
            <p>UserEmail: {user.userEmail}</p>
          </>
        ) : error ? (
          <p className="text-red-500">Error: {error}</p>
        ) : (
          <p>No data loaded</p>
        )}
      </div>
    </div>
  )
}