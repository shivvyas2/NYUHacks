export interface Game {
  id: string
  name: string
  description: string
  status: 'coming-soon' | 'available'
}

export interface GameState {
  score: number
  level: number
  lives: number
  isPaused: boolean
  isGameOver: boolean
  isGameStarted?: boolean // For games with start screens
}

export interface GameConfig {
  width: number
  height: number
  fps: number
}

