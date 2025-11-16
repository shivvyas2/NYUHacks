'use client'

import { useEffect, useRef } from 'react'
import { GameRenderer } from '@/games/GameRenderer'
import { WhackAMoleGameContainer } from './WhackAMoleGameContainer'
import { CarnivalGameContainer } from './CarnivalGameContainer'

interface GameContainerProps {
  gameId: string
}

export function GameContainer({ gameId }: GameContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = Math.min(800, container.clientWidth - 32)
        canvas.height = 600
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize game
    const gameRenderer = new GameRenderer(ctx, gameId)
    gameRenderer.init()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      gameRenderer.cleanup()
    }
  }, [gameId])

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded border border-gray-700"
      />
    </div>
  )
}

