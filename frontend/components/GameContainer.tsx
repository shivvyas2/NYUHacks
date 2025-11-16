'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GameRenderer } from '@/games/GameRenderer'

interface GameContainerProps {
  gameId: string
}

export function GameContainer({ gameId }: GameContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const uiCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [showExitButton, setShowExitButton] = useState(true)

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const container = containerRef.current

    // Set canvas to fullscreen dimensions
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      // Also resize UI canvas if it exists
      if (uiCanvasRef.current) {
        uiCanvasRef.current.width = window.innerWidth
        uiCanvasRef.current.height = window.innerHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Check if game uses Three.js (squid-game)
    const usesThreeJS = gameId === 'squid-game'
    
    let gameRenderer: GameRenderer | null = null
    
    if (usesThreeJS) {
      // For Three.js games, wait a bit for UI canvas to be ready, then get context
      // Use requestAnimationFrame to ensure React has rendered the UI canvas
      const initGame = () => {
        const uiCanvas = uiCanvasRef.current
        let uiCtx: CanvasRenderingContext2D | null = null
        if (uiCanvas) {
          uiCtx = uiCanvas.getContext('2d')
          if (uiCtx) {
            // Set canvas size
            uiCanvas.width = window.innerWidth
            uiCanvas.height = window.innerHeight
          }
        }
        // Pass the canvas element for Three.js and UI context for overlays
        gameRenderer = new GameRenderer(uiCtx, gameId, canvas)
        
        // Initialize game (async for Three.js games)
        gameRenderer.init().catch((error) => {
          console.error('Failed to initialize game:', error)
        })
      }
      
      // Wait for next frame to ensure UI canvas is rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(initGame)
      })
    } else {
      // For Canvas 2D games, get 2D context
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      gameRenderer = new GameRenderer(ctx, gameId)
      
      // Initialize game
      gameRenderer.init().catch((error) => {
        console.error('Failed to initialize game:', error)
      })
    }

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
      window.removeEventListener('keydown', handleKeyDown)
      clearTimeout(hideTimer)
      if (gameRenderer) {
        gameRenderer.cleanup()
      }
    }
  }, [gameId, router])

  const handleExit = () => {
    router.push('/')
  }

  return (
    <div ref={containerRef} className="relative w-screen h-screen" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-screen h-screen"
        style={{ display: 'block', margin: 0, padding: 0 }}
      />
      {/* UI overlay canvas for Three.js games */}
      {gameId === 'squid-game' && (
        <canvas
          ref={uiCanvasRef}
          className="absolute inset-0 w-screen h-screen pointer-events-none"
          style={{ zIndex: 10, display: 'block', margin: 0, padding: 0 }}
        />
      )}
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

