import { notFound } from 'next/navigation';
import { games } from '@/lib/games';
import { GameContainer } from '@/components/GameContainer';

interface GamePageProps {
  params: {
    gameId: string;
  };
}

// Generate static params for SSG
export async function generateStaticParams() {
  return games.map((game) => ({
    gameId: game.id,
  }));
}

export default function GamePage({ params }: GamePageProps) {
  const game = games.find((g) => g.id === params.gameId);

  if (!game) {
    return notFound(); // ensure notFound() is returned
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      {/* Pass the game object or gameId to the container */}
      <GameContainer game={game} />
    </div>
  );
}
