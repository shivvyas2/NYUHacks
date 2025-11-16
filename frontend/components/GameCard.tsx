import Link from 'next/link'
import { Game } from '@/types/game'

interface GameCardProps {
  game: Game
  index: number
}

export function GameCard({ game, index }: GameCardProps) {
  return (
    <Link href={`/games/${game.id}`}>
      <div className="retro-game-item group">
        <div className="retro-game-number">{String(index + 1).padStart(2, '0')}</div>
        <div className="retro-game-content">
          <div className="retro-game-name">{game.name}</div>
          <div className="retro-game-desc">{game.description}</div>
        </div>
        <div className="retro-game-arrow">▶</div>
      </div>
    </Link>
  )
}

