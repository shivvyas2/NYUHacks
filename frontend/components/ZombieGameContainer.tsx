'use client'

import { useEffect, useRef, useState } from 'react'
import { ZombieGame } from '@/games/zombie/ZombieGame'
import { satQuestions } from '@/games/zombie/questions'
import { SATQuestion, ZombieGameState } from '@/games/zombie/types'
import { GameOverModal } from './GameOverModal'
import { fetchQuestionsWithCache } from '@/lib/api/questions'

export default function ZombieGameContainer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<ZombieGame | null>(null)
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<SATQuestion[]>(satQuestions)
  const [gameState, setGameState] = useState<ZombieGameState>({
    score: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    currentQuestionIndex: 0,
    totalQuestions: satQuestions.length,
    streak: 0,
    maxStreak: 0,
    ammo: 50,
    health: 100,
    isGameOver: false
  })
  const [currentQuestion, setCurrentQuestion] = useState<SATQuestion | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  // Fetch AI questions on mount
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const aiQuestions = await fetchQuestionsWithCache('zombie', 50, satQuestions)
        setQuestions(aiQuestions)
        setGameState(prev => ({ ...prev, totalQuestions: aiQuestions.length }))
      } catch (error) {
        console.error('Failed to load AI questions:', error)
        // Fall back to hardcoded questions (already set)
      } finally {
        setLoading(false)
      }
    }
    
    loadQuestions()
  }, [])

  useEffect(() => {
    if (!canvasRef.current || loading) return

    // Dynamic import of ZombieGame
    const initGame = async () => {
      const { ZombieGame } = await import('@/games/zombie/ZombieGame')
      
      const canvas = canvasRef.current!
      // Set canvas to full screen
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const game = new ZombieGame(canvas, questions)
      gameRef.current = game

      // Setup callbacks
      game.onScoreUpdate = (score: number) => {
        setGameState(prev => ({ ...prev, score }))
      }

      game.onQuestionComplete = (correct: boolean) => {
        setIsCorrect(correct)
        setShowFeedback(true)
        setTimeout(() => setShowFeedback(false), 1000)
      }

      game.onGameOver = (finalState: ZombieGameState) => {
        setGameState(finalState)
        setGameOver(true)
      }

      // Start first question
      game.spawnZombies(questions[0])
      setCurrentQuestion(questions[0])

      // Handle window resize
      const handleResize = () => {
        if (canvas && game) {
          canvas.width = window.innerWidth
          canvas.height = window.innerHeight
          game.resize(window.innerWidth, window.innerHeight)
        }
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        game.dispose()
      }
    }

    initGame()
  }, [loading, questions])

  // Update question when index changes
  useEffect(() => {
    if (gameRef.current && !gameOver) {
      const state = gameRef.current.getGameState()
      setGameState(state)
      
      if (state.currentQuestionIndex < questions.length && state.currentQuestionIndex > 0) {
        const question = questions[state.currentQuestionIndex]
        setCurrentQuestion(question)
        gameRef.current.spawnZombies(question)
      }
    }
  }, [gameState.currentQuestionIndex, gameOver, questions])
  
  // Poll game state for updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameRef.current && !gameOver) {
        const state = gameRef.current.getGameState()
        setGameState(state)
      }
    }, 100)
    
    return () => clearInterval(interval)
  }, [gameOver])

  const handlePlayAgain = () => {
    window.location.reload()
  }

  // Show loading screen while fetching AI questions
  if (loading) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🧟</div>
          <div className="text-white text-2xl font-bold mb-2">Loading AI Questions...</div>
          <div className="text-gray-400">Generating personalized SAT questions with Claude Haiku 4.5</div>
          <div className="mt-4">
            <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-green-500 animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* HUD */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="max-w-7xl mx-auto flex justify-between items-start text-white">
          {/* Left side stats */}
          <div className="space-y-2">
            <div className="text-3xl font-bold text-green-400">
              SCORE: {gameState.score}
            </div>
            <div className="text-sm space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓ {gameState.correctAnswers}</span>
                <span className="text-red-400">✗ {gameState.wrongAnswers}</span>
              </div>
              <div className="text-yellow-400">
                🔥 Streak: {gameState.streak}
              </div>
            </div>
          </div>

          {/* Question */}
          {currentQuestion && !gameOver && (
            <div className="flex-1 mx-8 bg-black/95 backdrop-blur-sm rounded-lg p-4 border-2 border-red-500 max-w-2xl shadow-2xl">
              <div className="text-center">
                <div className="text-xs text-red-400 mb-2 uppercase font-bold flex items-center justify-center gap-2">
                  <span>🧟 SHOOT THE CORRECT ZOMBIE! 🧟</span>
                  <span className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px]">
                    {currentQuestion.topic} - {currentQuestion.difficulty.toUpperCase()}
                  </span>
                </div>
                <div className="text-xl font-bold text-white mb-2">
                  {currentQuestion.question}
                </div>
                <div className="text-xs text-gray-400">
                  Look for the zombie with the correct answer label (A, B, C, or D)
                </div>
              </div>
            </div>
          )}

          {/* Right side stats */}
          <div className="text-right space-y-2">
            <div className="text-sm">
              Question {gameState.currentQuestionIndex + 1}/{gameState.totalQuestions}
            </div>
            
            {/* Health Bar */}
            <div className="w-32">
              <div className="text-xs text-gray-300 mb-1">HEALTH</div>
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden border border-white/30">
                <div 
                  className="h-full bg-gradient-to-r from-red-500 to-pink-500 transition-all duration-300"
                  style={{ width: `${gameState.health}%` }}
                />
              </div>
              <div className="text-xs text-white mt-1">{gameState.health}%</div>
            </div>

            {/* Ammo Counter */}
            <div className="w-32">
              <div className="text-xs text-gray-300 mb-1">AMMO</div>
              <div className="text-2xl font-bold text-yellow-400">
                🔫 {gameState.ammo}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Answer Options (Bottom Bar) */}
      {currentQuestion && !gameOver && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-black/90 backdrop-blur-sm rounded-lg px-6 py-3 border-2 border-red-500">
            <div className="flex gap-4 text-sm font-bold">
              {currentQuestion.options.map((option, index) => {
                const colors = ['bg-red-600', 'bg-cyan-600', 'bg-yellow-500', 'bg-green-500']
                const labels = ['A', 'B', 'C', 'D']
                
                return (
                  <div
                    key={index}
                    className={`${colors[index]} text-white rounded px-4 py-2 border-2 border-black shadow-lg`}
                  >
                    <span className="font-black text-base">{labels[index]}: </span>
                    <span className="text-xs">{option}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
          <div className={`text-8xl font-black animate-pulse ${isCorrect ? 'text-green-400' : 'text-red-500'}`}>
            {isCorrect ? '✓ HEADSHOT!' : '✗ MISSED!'}
          </div>
        </div>
      )}

      {/* No UI crosshair - using 3D crosshair in game instead */}

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        style={{ display: 'block' }}
      />

      {/* Controls moved to top right - less intrusive */}
      {!gameOver && (
        <div className="absolute top-20 right-4 text-white text-xs opacity-60 z-10">
          <div className="bg-black/70 rounded px-3 py-2 text-right space-y-1">
            <div>WASD = Move</div>
            <div>Mouse = Look</div>
            <div>Click = Shoot</div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameOver && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 max-w-2xl w-full border-2 border-red-500 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">🧟</div>
              <h2 className="text-4xl font-bold text-white mb-2">
                {gameState.health > 0 ? 'Mission Complete!' : 'Game Over!'}
              </h2>
              <p className="text-gray-400 text-sm">
                {gameState.health > 0 ? 'You survived the zombie apocalypse!' : 'The zombies got you...'}
              </p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-black text-white">{gameState.score}</div>
                <div className="text-green-200 text-sm font-semibold mt-1">SCORE</div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-black text-white">
                  {gameState.totalQuestions > 0 ? Math.round((gameState.correctAnswers / gameState.totalQuestions) * 100) : 0}%
                </div>
                <div className="text-blue-200 text-sm font-semibold mt-1">ACCURACY</div>
              </div>
              <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-black text-white">{gameState.correctAnswers}</div>
                <div className="text-purple-200 text-sm font-semibold mt-1">CORRECT</div>
              </div>
              <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-center">
                <div className="text-4xl font-black text-white">{gameState.maxStreak}</div>
                <div className="text-orange-200 text-sm font-semibold mt-1">MAX STREAK</div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="bg-gray-800/50 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-red-400 text-2xl font-bold">{gameState.wrongAnswers}</div>
                  <div className="text-gray-400 text-xs">Wrong Answers</div>
                </div>
                <div>
                  <div className="text-yellow-400 text-2xl font-bold">{gameState.totalQuestions}</div>
                  <div className="text-gray-400 text-xs">Total Questions</div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handlePlayAgain}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold text-lg py-4 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              🎮 Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

