import Link from 'next/link'
import { Game } from '@/types/game'

interface GameCardProps {
  game: Game
}

export function GameCard({ game }: GameCardProps) {
  return (
    <Link href={`/games/${game.id}`}>
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-cyan-500 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 cursor-pointer h-full flex flex-col">
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-2">{game.name}</h2>
          <p className="text-gray-400 text-sm">{game.description}</p>
        </div>
        <div className="mt-auto">
          <div className="inline-block px-4 py-2 bg-cyan-600 rounded text-sm font-semibold hover:bg-cyan-500 transition-colors">
            Play Now →
          </div>
        </div>
      </div>
    </Link>
  )
}

