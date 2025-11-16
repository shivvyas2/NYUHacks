import { Game } from '@/games/subway-surfers/types/game'

export const games: Game[] = [
  {
    id: 'zombie',
    name: '🧟 SAT Zombie Apocalypse',
    description: 'First-person shooter! Shoot zombies with the correct SAT answers - don\'t let them reach you!',
    status: 'available',
  },
  {
    id: 'whackamole',
    name: 'SAT Whack-A-Mole',
    description: 'Whack the mole with the correct SAT answer!',
    status: 'available',
  },
  {
    id: 'carnival',
    name: 'SAT Balloon Pop',
    description: 'Pop balloons to answer SAT questions - 3 shots per question!',
    status: 'available',
  },
  {
    id: 'subway-surfers',
    name: 'Subway Surfers',
    description: 'Endless runner - dodge obstacles and collect coins!',
    status: 'available',
  },
  {
    id: 'squid-game',
    name: 'Squid Game',
    description: 'Survive the challenges inspired by the popular series!',
    status: 'available',
  },
  {
    id: 'pac-man',
    name: 'Pac-Man',
    description: 'Classic maze game - eat dots and avoid ghosts!',
    status: 'available',
  },
]

