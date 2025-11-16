'use client'

import { useEffect, useRef, useState } from 'react'
import { GameRenderer } from '@/games/GameRenderer'
import { WhackAMoleGameContainer } from './WhackAMoleGameContainer'
import { CarnivalGameContainer } from './CarnivalGameContainer'

interface GameContainerProps {
  game: {
    id: string
    title: string
  }
}

export function GameContainer({ game }: GameContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const uiCanvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<GameRenderer | null>(null)
  const [isLoading, setIsLoading] = useState(game.id === 'squid-game')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingMessage, setLoadingMessage] = useState('Initializing...')

  // Render specific game containers for Three.js games
  if (game.id === 'whackamole') {
    return <WhackAMoleGameContainer gameId={game.id} />
  }

  if (game.id === 'carnival') {
    return <CarnivalGameContainer gameId={game.id} />
  }

  // Default HTML5 Canvas games
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current

    // Set canvas to full screen
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Initialize game renderer - pass canvas directly, not context
    rendererRef.current = new GameRenderer(canvas, game.id)
    
    // For squid game, set up loading progress tracking
    if (game.id === 'squid-game') {
      rendererRef.current.init().then(() => {
        // Start checking loading progress
        const checkLoading = () => {
          const gameInstance = (rendererRef.current as any)?.game
          if (gameInstance) {
            // Access private properties via type casting
            const progress = (gameInstance as any).loadingProgress || 0
            const message = (gameInstance as any).loadingMessage || 'Loading...'
            const loaded = (gameInstance as any).assetsLoaded || false
            
            setLoadingProgress(progress)
            setLoadingMessage(message)
            
            if (loaded) {
              setIsLoading(false)
            } else {
              requestAnimationFrame(checkLoading)
            }
          }
        }
        
        // Start checking immediately
        requestAnimationFrame(checkLoading)
      }).catch((error) => {
        console.error('Failed to initialize game:', error)
        setIsLoading(false)
      })
    } else {
      rendererRef.current.init().catch((error) => {
        console.error('Failed to initialize game:', error)
      })
    }

    // Handle resize
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth
        canvasRef.current.height = window.innerHeight
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      rendererRef.current?.cleanup()
    }
  }, [game.id])

  return (
    <div ref={containerRef} className="relative w-screen h-screen" style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      
      {/* Loading Overlay for Squid Game */}
      {isLoading && game.id === 'squid-game' && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center">
            <div className="mb-8">
              <div className="text-white text-4xl font-bold mb-4 font-mono">SQUID GAME</div>
              <div className="text-gray-400 text-lg mb-6 font-mono">{loadingMessage}</div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-80 h-4 bg-gray-800 border-2 border-gray-600 rounded overflow-hidden">
              <div 
                className="h-full bg-red-600 transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            
            <div className="mt-4 text-white text-2xl font-bold font-mono">
              {loadingProgress}%
            </div>
            
            {/* Loading Animation */}
            <div className="mt-8 flex justify-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameContainer