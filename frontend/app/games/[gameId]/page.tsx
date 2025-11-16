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
    <div className="fixed inset-0 w-screen h-screen bg-black overflow-hidden" style={{ margin: 0, padding: 0 }}>
      <GameContainer gameId={params.gameId} />
    </div>
  )
}

