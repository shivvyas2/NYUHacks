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
      <div className="flex items-center gap-3">
        <Link
          href="/stats"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
        >
          📊 Stats
        </Link>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold transition-colors"
        >
          Logout
        </button>
      </div>
    )
  }

  return (
    <Link
      href="/login"
      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-bold transition-colors"
    >
      Login
    </Link>
  )
}

