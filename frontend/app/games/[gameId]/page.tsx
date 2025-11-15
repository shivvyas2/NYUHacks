import { notFound } from 'next/navigation'
import { games } from '@/lib/games'
import { GameContainer } from '@/components/GameContainer'

interface GamePageProps {
  params: {
    gameId: string
  }
}

export async function generateStaticParams() {
  return games.map((game) => ({
    gameId: game.id,
  }))
}

export default function GamePage({ params }: GamePageProps) {
  const game = games.find((g) => g.id === params.gameId)

  if (!game) {
    notFound()
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <a
            href="/"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            ← Back to Arcade
          </a>
        </div>
        <h1 className="text-4xl font-bold mb-4">{game.name}</h1>
        <p className="text-gray-400 mb-8">{game.description}</p>
        <GameContainer gameId={params.gameId} />
      </div>
    </div>
  )
}

