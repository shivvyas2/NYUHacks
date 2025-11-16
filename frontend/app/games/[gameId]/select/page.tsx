'use client'

import { useParams, useRouter } from 'next/navigation'
import { games } from '@/lib/games'
import { DashboardLayout } from '@/components/DashboardLayout'
import Link from 'next/link'

export default function GameSelectPage() {
  const params = useParams()
  const router = useRouter()
  const gameId = params.gameId as string
  const game = games.find((g) => g.id === gameId)

  if (!game) {
    return (
      <DashboardLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Game not found</p>
            <Link href="/" className="text-blue-600 hover:underline mt-2 inline-block">
              Go back to dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen retro-gameboy-bg flex items-center justify-center p-4">
        <div className="retro-gameboy-container max-w-4xl w-full">
          {/* Game Boy Device */}
          <div className="retro-gameboy-device">
            {/* Game Boy Screen Frame */}
            <div className="retro-screen-frame">
              {/* Screen Border */}
              <div className="retro-screen-border">
                {/* Screen Content */}
                <div className="retro-screen-content">
                  {/* Header */}
                  <header className="text-center mb-8">
                    <h1 className="retro-title mb-2">{game.name.toUpperCase()}</h1>
                    <div className="retro-divider"></div>
                    <p className="retro-subtitle mt-2">READY TO PLAY?</p>
                  </header>

                  {/* Game Info */}
                  <div className="mb-8 space-y-4">
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                      <p className="text-gray-300 text-sm mb-2">{game.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Status: {game.status === 'available' ? '✓ Available' : 'Coming Soon'}</span>
                        <span>Mode: Single Player</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Link
                      href={`/games/${game.id}`}
                      className="block w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-center transition-colors retro-button-press"
                    >
                      START GAME
                    </Link>
                    <button
                      onClick={() => router.back()}
                      className="block w-full px-6 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                    >
                      BACK
                    </button>
                  </div>

                  {/* Footer Instructions */}
                  <div className="retro-footer mt-8">
                    <div className="retro-instruction">
                      <span className="retro-key">A</span> START
                    </div>
                    <div className="retro-instruction">
                      <span className="retro-key">B</span> BACK
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Game Boy Controls */}
            <div className="retro-controls">
              {/* D-Pad */}
              <div className="retro-dpad-container">
                <div className="retro-dpad">
                  <div className="retro-dpad-up"></div>
                  <div className="retro-dpad-middle">
                    <div className="retro-dpad-left"></div>
                    <div className="retro-dpad-center"></div>
                    <div className="retro-dpad-right"></div>
                  </div>
                  <div className="retro-dpad-down"></div>
                </div>
                <div className="retro-label">DIRECTION</div>
              </div>

              {/* A and B Buttons */}
              <div className="retro-buttons-container">
                <div className="retro-buttons">
                  <div className="retro-button retro-button-b">
                    <div className="retro-button-inner">B</div>
                  </div>
                  <div className="retro-button retro-button-a">
                    <div className="retro-button-inner">A</div>
                  </div>
                </div>
                <div className="retro-label">ACTION</div>
              </div>
            </div>

            {/* Start and Select */}
            <div className="retro-start-select">
              <div className="retro-start-select-button">
                <div className="retro-start-select-label">SELECT</div>
              </div>
              <div className="retro-start-select-button">
                <div className="retro-start-select-label">START</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

