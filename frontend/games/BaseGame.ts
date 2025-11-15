import { GameState } from '@/types/game'

export abstract class BaseGame {
  protected state: GameState = {
    score: 0,
    level: 1,
    lives: 3,
    isPaused: false,
    isGameOver: false,
  }

  constructor(
    protected width: number,
    protected height: number
  ) {}

  abstract init(): void
  abstract update(deltaTime: number): void
  abstract render(ctx: CanvasRenderingContext2D): void
  abstract handleInput(key: string): void

  cleanup(): void {
    // Override in subclasses if needed
  }

  protected getState(): GameState {
    return { ...this.state }
  }

  protected setState(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates }
  }
}

