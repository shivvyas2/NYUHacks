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
}

export interface GameConfig {
  width: number
  height: number
  fps: number
}

