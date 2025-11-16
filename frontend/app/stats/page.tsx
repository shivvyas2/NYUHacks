'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserStats {
  total_games_played: number
  total_score: number
  total_questions_answered: number
  total_correct: number
  total_wrong: number
  overall_accuracy: number
  favorite_game: string | null
  weak_topics: string[]
  strong_topics: string[]
}

interface GameSession {
  id: string
  game_id: string
  score: number
  accuracy: number
  correct_answers: number
  wrong_answers: number
  max_streak: number
  created_at: string
}

export default function StatsPage() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [sessions, setSessions] = useState<GameSession[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user is authenticated
        await apiClient.getCurrentUser()
      } catch (error) {
        // Not authenticated, redirect to login
        router.push('/login')
        return
      }

      try {
        // Fetch user stats
        const statsData = await apiClient.getUserStats()
        if (statsData) {
          setStats(statsData)
        }

        // Fetch recent game sessions
        const sessionsData = await apiClient.getRecentSessions(10)
        if (sessionsData) {
          setSessions(sessionsData)
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  if (loading) {
    return (
      <main className="min-h-screen retro-gameboy-bg flex items-center justify-center p-4">
        <div className="text-white text-xl">Loading...</div>
      </main>
    )
  }

  const gameNames: { [key: string]: string } = {
    whackamole: 'SAT Whack-A-Mole',
    carnival: 'SAT Balloon Pop',
    'subway-surfers': 'Subway Surfers',
    'squid-game': 'Squid Game',
    'pac-man': 'Pac-Man',
  }

  return (
    <main className="min-h-screen retro-gameboy-bg flex items-center justify-center p-4">
      <div className="retro-gameboy-container max-w-4xl w-full">
        <div className="retro-gameboy-device">
          <div className="retro-screen-frame">
            <div className="retro-screen-border">
              <div className="retro-screen-content">
                <header className="text-center mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <Link
                      href="/"
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      ← Back
                    </Link>
                    <h1 className="retro-title">STATISTICS</h1>
                    <div className="w-24"></div>
                  </div>
                  <div className="retro-divider"></div>
                </header>

                {stats ? (
                  <>
                    {/* Overall Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-white">{stats.total_games_played}</div>
                        <div className="text-blue-200 text-xs font-semibold mt-1">GAMES PLAYED</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-white">
                          {stats.overall_accuracy ? (stats.overall_accuracy * 100).toFixed(0) : 0}%
                        </div>
                        <div className="text-green-200 text-xs font-semibold mt-1">ACCURACY</div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-white">{stats.total_score}</div>
                        <div className="text-purple-200 text-xs font-semibold mt-1">TOTAL SCORE</div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-4 text-center">
                        <div className="text-3xl font-black text-white">{stats.total_questions_answered}</div>
                        <div className="text-orange-200 text-xs font-semibold mt-1">QUESTIONS</div>
                      </div>
                    </div>

                    {/* Weak Topics */}
                    {stats.weak_topics && stats.weak_topics.length > 0 && (
                      <div className="bg-red-500/20 border-2 border-red-500 rounded-xl p-4 mb-4">
                        <h3 className="text-white font-bold text-sm mb-2">⚠️ Weak Topics (Need Practice)</h3>
                        <div className="flex flex-wrap gap-2">
                          {stats.weak_topics.map((topic, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strong Topics */}
                    {stats.strong_topics && stats.strong_topics.length > 0 && (
                      <div className="bg-green-500/20 border-2 border-green-500 rounded-xl p-4 mb-4">
                        <h3 className="text-white font-bold text-sm mb-2">✅ Strong Topics</h3>
                        <div className="flex flex-wrap gap-2">
                          {stats.strong_topics.map((topic, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Sessions */}
                    {sessions.length > 0 && (
                      <div className="bg-gray-800/50 rounded-xl p-4">
                        <h3 className="text-white font-bold text-sm mb-3">📊 Recent Games</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {sessions.map((session) => (
                            <div
                              key={session.id}
                              className="bg-gray-700/50 rounded-lg p-3 flex justify-between items-center"
                            >
                              <div>
                                <div className="text-white font-bold text-sm">
                                  {gameNames[session.game_id] || session.game_id}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {new Date(session.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-white font-bold">{session.score}</div>
                                <div className="text-gray-400 text-xs">
                                  {(session.accuracy * 100).toFixed(0)}% accuracy
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <p>No statistics yet. Play some games to see your stats!</p>
                    <Link
                      href="/"
                      className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
                    >
                      Play Games
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

