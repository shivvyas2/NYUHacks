'use client'

import { useEffect, useRef, useState } from 'react'
import { SATQuestion, WhackAMoleGameState, GameAnalytics } from '@/games/whackamole/types'
import type { WhackAMoleGame } from '@/games/whackamole/WhackAMoleGame'
import { GameOverModal } from './GameOverModal'

interface WhackAMoleGameContainerProps {
  gameId: string
}

export function WhackAMoleGameContainer({ gameId }: WhackAMoleGameContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<WhackAMoleGame | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<SATQuestion | null>(null)
  const [gameState, setGameState] = useState<WhackAMoleGameState | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [analytics, setAnalytics] = useState<GameAnalytics | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    let animationFrameId: number
    let game: WhackAMoleGame | null = null
    let resizeHandler: (() => void) | null = null

    const initGame = async () => {
      const { WhackAMoleGame: WhackAMoleGameClass } = await import('@/games/whackamole/WhackAMoleGame')

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

      game = new WhackAMoleGameClass(canvas.width, canvas.height, canvas)
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
      <div className="relative bg-gray-900 rounded-lg overflow-hidden border-2 border-gray-700 shadow-2xl">
        <canvas
          ref={canvasRef}
          className="w-full h-auto"
          style={{ cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 width=%2732%27 height=%2732%27 viewBox=%270 0 32 32%27><text y=%2728%27 font-size=%2728%27>🔨</text></svg>") 8 24, auto' }}
          tabIndex={-1}
        />

        {/* Question Overlay - Top */}
        {currentQuestion && !gameOver && (
          <div className="absolute top-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 border-2 border-white/20">
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
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse">
          🖱️ CLICK THE CORRECT MOLE!
        </div>
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
      <div className="mt-3 bg-gradient-to-r from-purple-900 to-pink-900 rounded-lg p-3 border-2 border-yellow-500 shadow-xl">
        <div className="text-center text-white">
          <div className="font-bold text-lg mb-2 text-yellow-300">🔨 How to Play</div>
          <div className="text-sm text-gray-100 space-x-4">
            <span>🖱️ <strong>Click moles</strong></span>
            <span>🎯 <strong>Hit the correct answer</strong></span>
            <span>⏰ <strong>3 seconds per question!</strong></span>
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

