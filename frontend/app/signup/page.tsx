'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api/client'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const response = await apiClient.signup(email, password)

      if (!response.success) {
        throw new Error(response.error || 'Signup failed')
      }

      setSuccess(true)
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      setError(error.message || 'An error occurred during signup')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <main className="min-h-screen retro-gameboy-bg flex items-center justify-center p-4">
        <div className="retro-gameboy-container max-w-md w-full">
          <div className="retro-gameboy-device">
            <div className="retro-screen-frame">
              <div className="retro-screen-border">
                <div className="retro-screen-content">
                  <header className="text-center mb-8">
                    <h1 className="retro-title mb-2">SUCCESS!</h1>
                    <div className="retro-divider"></div>
                    <p className="retro-subtitle mt-2">ACCOUNT CREATED</p>
                  </header>
                  <div className="bg-green-500/20 border-2 border-green-500 rounded-lg p-4 text-green-200 text-center">
                    <p className="mb-2">Check your email to verify your account!</p>
                    <p className="text-sm">Redirecting to login...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen retro-gameboy-bg flex items-center justify-center p-4">
      <div className="retro-gameboy-container max-w-md w-full">
        <div className="retro-gameboy-device">
          <div className="retro-screen-frame">
            <div className="retro-screen-border">
              <div className="retro-screen-content">
                <header className="text-center mb-8">
                  <h1 className="retro-title mb-2">SIGN UP</h1>
                  <div className="retro-divider"></div>
                  <p className="retro-subtitle mt-2">CREATE ACCOUNT</p>
                </header>

                <form onSubmit={handleSignup} className="space-y-4">
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
                      minLength={6}
                      className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-bold mb-2 text-gray-300">
                      CONFIRM PASSWORD
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-4 py-2 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                  >
                    {loading ? 'CREATING...' : 'SIGN UP'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 font-bold">
                      LOGIN
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

