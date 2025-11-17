'use client'

import { useEffect, useRef, useState } from 'react'
import { SATQuestion, CarnivalGameState, GameAnalytics } from '@/games/carnival/types'
import type { CarnivalGame } from '@/games/carnival/CarnivalGame'
import { GameOverModal } from './GameOverModal'
import { fetchQuestionsWithCache } from '@/lib/api/questions'
import { satQuestions } from '@/games/carnival/questions'

interface CarnivalGameContainerProps {
  gameId: string
}

export function CarnivalGameContainer({ gameId }: CarnivalGameContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<CarnivalGame | null>(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<SATQuestion[]>(satQuestions)
  const [currentQuestion, setCurrentQuestion] = useState<SATQuestion | null>(null)
  const [gameState, setGameState] = useState<CarnivalGameState | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [analytics, setAnalytics] = useState<GameAnalytics | null>(null)

  // Fetch AI questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const aiQuestions = await fetchQuestionsWithCache('carnival', 50, satQuestions)
        setQuestions(aiQuestions)
      } catch (error) {
        console.error('Failed to load AI questions:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadQuestions()
  }, [])

  useEffect(() => {
    if (!canvasRef.current || loading) return

    const canvas = canvasRef.current
    let animationFrameId: number
    let game: CarnivalGame | null = null
    let resizeHandler: (() => void) | null = null

    const initGame = async () => {
      const { CarnivalGame: CarnivalGameClass } = await import('@/games/carnival/CarnivalGame')

      resizeHandler = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }

      resizeHandler()
      window.addEventListener('resize', resizeHandler)

      game = new CarnivalGameClass(canvas.width, canvas.height, canvas, questions)
      gameRef.current = game

      game.onQuestionChange = (question) => {
        setCurrentQuestion(question)
        setSelectedAnswer(null)
        setShowResult(false)
      }

      game.onGameStateChange = (state) => {
        setGameState(state)
      }

      game.onGameOver = async (analyticsData) => {
        setAnalytics(analyticsData)
        setGameOver(true)
        
        // Save score to database via FastAPI
        try {
          const { apiClient } = await import('@/lib/api/client')
          await apiClient.saveScore('carnival', analyticsData)
        } catch (error) {
          console.error('Error saving score:', error)
        }
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
  }, [loading, questions])

  const handleRestart = () => {
    window.location.reload()
  }

  // Show loading screen while fetching AI questions
  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-yellow-400 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <div className="text-white text-2xl font-bold mb-2">Loading AI Questions...</div>
          <div className="text-white/80">Generating personalized SAT questions with Claude Haiku 4.5</div>
          <div className="mt-4">
            <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-white animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Game Canvas with Overlays */}
      <div className="relative w-full h-full">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          style={{ 
            display: 'block',
            margin: 0,
            padding: 0
          }}
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
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-full font-bold text-base shadow-2xl animate-pulse border-2 border-yellow-400 z-10">
          🎈 POP THE CORRECT BALLOON!
        </div>

        {/* Bullets Remaining */}
        {gameState && !gameOver && (
          <div className="absolute bottom-4 left-4 bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 z-10">
            <span>🔫 Bullets:</span>
            <span className="text-xl">{gameState.bulletsRemaining}</span>
          </div>
        )}

        {/* HUD Stats - Overlay Top Right */}
        {gameState && !gameOver && (
          <div className="absolute top-20 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-gray-700 flex flex-col gap-2 z-10">
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
      </div>

      {/* Game Over Modal */}
      {gameOver && analytics && (
        <GameOverModal analytics={analytics} onRestart={handleRestart} />
      )}
    </div>
  )
}

