'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GameRenderer } from '@/games/GameRenderer'

interface GameContainerProps {
  gameId: string
}

export function GameContainer({ gameId }: GameContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [showExitButton, setShowExitButton] = useState(true)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const container = containerRef.current
    
    // Check if this is a Three.js game (needs WebGL context, not 2D)
    const isThreeJSGame = gameId === 'subway-surfers' || gameId === 'squid-game'
    
    let ctx: CanvasRenderingContext2D | null = null
    if (!isThreeJSGame) {
      ctx = canvas.getContext('2d')
      if (!ctx) return
    }

    // Set canvas to fullscreen dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize game
    // For Three.js games, we pass null ctx and the canvas element
    // For 2D games, we pass the 2D context
    const gameRenderer = new GameRenderer(ctx, gameId, canvas)
    gameRenderer.init()
    // Also ensure cleanup on pagehide (e.g., browser back swipe)
    const handlePageHide = () => {
      try {
        ;(window as any).__nyuStopAllAudio?.()
      } catch {}
      gameRenderer.cleanup()
    }
    window.addEventListener('pagehide', handlePageHide, { once: true })

    // Handle ESC key to exit
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        router.push('/')
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    // Auto-hide exit button after 3 seconds
    const hideTimer = setTimeout(() => {
      setShowExitButton(false)
    }, 3000)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(hideTimer)
      gameRenderer.cleanup()
    }
  }, [gameId, router])

  const handleExit = () => {
    try {
      ;(window as any).__nyuStopAllAudio?.()
    } catch {}
    router.push('/')
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
      {showExitButton && (
        <button
          onClick={handleExit}
          className="absolute top-4 right-4 z-10 px-4 py-2 bg-black/70 hover:bg-black/90 text-white rounded-lg border border-white/20 transition-all duration-300 backdrop-blur-sm"
          onMouseEnter={() => setShowExitButton(true)}
        >
          <span className="mr-2">←</span>
          Exit Game (ESC)
        </button>
      )}
      <div
        className="absolute top-4 right-4 z-0 w-20 h-10"
        onMouseEnter={() => setShowExitButton(true)}
      />
    </div>
  )
}

