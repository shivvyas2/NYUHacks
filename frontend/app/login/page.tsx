'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.login(email, password)

      if (!response.access_token) {
        throw new Error('Login failed - no token received')
      }

      // Redirect to the game or home page
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
      router.refresh()
    } catch (error: any) {
      setError(error.message || 'An error occurred during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen retro-gameboy-bg flex items-center justify-center p-4">
      <div className="retro-gameboy-container max-w-md w-full">
        <div className="retro-gameboy-device">
          <div className="retro-screen-frame">
            <div className="retro-screen-border">
              <div className="retro-screen-content">
                <header className="text-center mb-8">
                  <h1 className="retro-title mb-2">LOGIN</h1>
                  <div className="retro-divider"></div>
                  <p className="retro-subtitle mt-2">ENTER CREDENTIALS</p>
                </header>

                <form onSubmit={handleLogin} className="space-y-4">
                  {error && (
                    <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-3 text-red-200 text-sm">
                      {error}
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-bold mb-2 text-gray-300">
                      EMAIL
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-bold mb-2 text-gray-300">
                      PASSWORD
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                  >
                    {loading ? 'LOADING...' : 'LOGIN'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    Don't have an account?{' '}
                    <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-bold">
                      SIGN UP
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

