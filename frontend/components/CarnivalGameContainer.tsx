'use client'

import { useEffect, useRef, useState } from 'react'
import { SATQuestion, CarnivalGameState, GameAnalytics } from '@/games/carnival/types'
import type { CarnivalGame } from '@/games/carnival/CarnivalGame'
import { GameOverModal } from './GameOverModal'

interface CarnivalGameContainerProps {
  gameId: string
}

export function CarnivalGameContainer({ gameId }: CarnivalGameContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<CarnivalGame | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<SATQuestion | null>(null)
  const [gameState, setGameState] = useState<CarnivalGameState | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [analytics, setAnalytics] = useState<GameAnalytics | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    let animationFrameId: number
    let game: CarnivalGame | null = null
    let resizeHandler: (() => void) | null = null

    const initGame = async () => {
      const { CarnivalGame: CarnivalGameClass } = await import('@/games/carnival/CarnivalGame')

      resizeHandler = () => {
        const container = canvas.parentElement
        if (container) {
          const width = container.clientWidth
          const height = 500
          canvas.width = width
          canvas.height = height
        }
      }

      resizeHandler()
      window.addEventListener('resize', resizeHandler)

      game = new CarnivalGameClass(canvas.width, canvas.height, canvas)
      gameRef.current = game

      game.onQuestionChange = (question) => {
        setCurrentQuestion(question)
        setSelectedAnswer(null)
        setShowResult(false)
      }

      game.onGameStateChange = (state) => {
        setGameState(state)
      }

      game.onGameOver = (analyticsData) => {
        setAnalytics(analyticsData)
        setGameOver(true)
      }

      game.init()

      let lastTime = 0
      const gameLoop = (currentTime: number) => {
        if (!game) return
        
        const deltaTime = currentTime - lastTime
        lastTime = currentTime

        game.update(deltaTime)
        game.render(null as any)

        animationFrameId = requestAnimationFrame(gameLoop)
      }

      animationFrameId = requestAnimationFrame(gameLoop)

      return () => {
        // Cleanup
      }
    }

    let cleanupListeners: (() => void) | null = null

    const init = async () => {
      cleanupListeners = await initGame()
    }

    init()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      if (resizeHandler) {
        window.removeEventListener('resize', resizeHandler)
      }
      if (cleanupListeners) {
        cleanupListeners()
      }
      if (game) {
        game.cleanup()
      }
    }
  }, [])

  const handleRestart = () => {
    window.location.reload()
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Game Canvas with Overlays */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-red-700 shadow-2xl">
        <canvas
          ref={canvasRef}
          className="w-full h-auto cursor-crosshair"
          tabIndex={-1}
        />

        {/* Question Overlay - Top */}
        {currentQuestion && !gameOver && (
          <div className="absolute top-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border-2 border-red-500">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-bold">
                {currentQuestion.topic}
              </span>
              <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                currentQuestion.difficulty === 'easy' ? 'bg-green-600' :
                currentQuestion.difficulty === 'medium' ? 'bg-yellow-600' :
                'bg-red-600'
              }`}>
                {currentQuestion.difficulty.toUpperCase()}
              </span>
            </div>
            <h3 className="text-white font-bold text-lg leading-tight">
              {currentQuestion.question}
            </h3>
          </div>
        )}

        {/* Answer Options - Compact Bottom Bar */}
        {currentQuestion && !gameOver && (
          <div className="absolute bottom-16 left-4 right-4 bg-black/90 backdrop-blur-sm rounded-lg p-2 border border-white/20">
            <div className="grid grid-cols-4 gap-2 text-xs">
              {currentQuestion.options.map((option, index) => {
                const colors = ['bg-red-500', 'bg-cyan-500', 'bg-yellow-400', 'bg-green-400']
                const textColors = ['text-white', 'text-white', 'text-black', 'text-black']
                const labels = ['A', 'B', 'C', 'D']

                return (
                  <div
                    key={index}
                    className={`${colors[index]} ${textColors[index]} rounded px-2 py-1 text-center font-bold border border-black`}
                  >
                    <span className="font-black">{labels[index]}: </span>
                    <span className="text-[10px]">{option}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Instruction */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-full font-bold text-base shadow-2xl animate-pulse border-2 border-yellow-400">
          🎈 POP THE CORRECT BALLOON!
        </div>

        {/* Bullets Remaining */}
        {gameState && !gameOver && (
          <div className="absolute bottom-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <span>🔫 Bullets:</span>
            <span className="text-xl">{gameState.bulletsRemaining}</span>
          </div>
        )}
      </div>

      {/* HUD Stats - Simple Single Line */}
      {gameState && !gameOver && (
        <div className="mt-3 bg-gray-800 rounded-lg px-6 py-2 border border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Score:</span>
            <span className="text-white font-bold text-lg">{gameState.score}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Streak:</span>
            <span className="text-orange-400 font-bold text-lg">
              {gameState.streak > 0 ? `🔥 ${gameState.streak}` : '—'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Question:</span>
            <span className="text-white font-bold text-lg">
              {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Correct:</span>
            <span className="text-green-400 font-bold text-lg">{gameState.correctAnswers}</span>
          </div>
        </div>
      )}

      {/* Instructions Below Game */}
      <div className="mt-3 bg-gradient-to-r from-red-900 via-pink-900 to-purple-900 rounded-lg p-4 border-2 border-yellow-400 shadow-xl">
        <div className="text-center text-white">
          <div className="font-bold text-xl mb-2 text-yellow-300">🎪 Carnival Balloon Shooter!</div>
          <div className="text-sm text-gray-100 space-x-5">
            <span>🖱️ <strong>Click to shoot</strong></span>
            <span>🎈 <strong>Pop the correct balloon!</strong></span>
            <span>🔫 <strong>3 bullets per question</strong></span>
            <span>💥 <strong>Watch the balloons explode!</strong></span>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {gameOver && analytics && (
        <GameOverModal analytics={analytics} onRestart={handleRestart} />
      )}
    </div>
  )
}

