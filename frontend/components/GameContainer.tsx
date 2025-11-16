'use client'

import { useEffect, useRef } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const rendererRef = useRef<GameRenderer | null>(null)

  // Render specific game containers for Three.js games
  if (gameId === 'whackamole') {
    return <WhackAMoleGameContainer gameId={gameId} />
  }

  if (gameId === 'carnival') {
    return <CarnivalGameContainer gameId={gameId} />
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
    rendererRef.current.init()

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
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  )
}

export default GameContainer