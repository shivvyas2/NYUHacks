'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function AuthButton() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const user = await apiClient.getCurrentUser()
        setUser(user)
      } catch (error) {
        // Not authenticated
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const handleLogout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg text-sm">
        Loading...
      </div>
    )
  }

  if (user) {
    return (
      <div className="w-full space-y-2">
        <div className="px-3 py-2 text-sm text-gray-600 border-b border-gray-200">
          <div className="font-medium text-gray-800">{user.email || 'User'}</div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-2">
      <Link
        href="/login"
        className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium text-center transition-colors"
      >
        Login
      </Link>
      <Link
        href="/signup"
        className="block w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium text-center transition-colors"
      >
        Sign Up
      </Link>
    </div>
  )
}

