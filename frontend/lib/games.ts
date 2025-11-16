import { Game } from '@/types/game'

export const games: Game[] = [
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
    id: 'snake',
    name: 'Snake',
    description: 'Classic snake game - eat food and grow longer!',
    status: 'available',
  },
  {
    id: 'pong',
    name: 'Pong',
    description: 'The original arcade classic - bounce the ball!',
    status: 'available',
  },
  {
    id: 'tetris',
    name: 'Tetris',
    description: 'Stack blocks and clear lines in this puzzle classic!',
    status: 'available',
  },
]

