import { GameState } from '@/types/game'

/**
 * Base Game Class
 * All games extend this class and use Three.js for 3D rendering.
 * 
 * Note: The render method currently uses Canvas 2D for placeholders,
 * but will be updated to use Three.js WebGLRenderer in implementations.
 */
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
    // Clean up Three.js resources (scenes, geometries, materials, etc.)
  }

  protected getState(): GameState {
    return { ...this.state }
  }

  protected setState(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates }
  }

  // Public helpers for pause control
  public pause(): void {
    this.state.isPaused = true
  }

  public resume(): void {
    this.state.isPaused = false
  }

  public togglePause(): void {
    this.state.isPaused = !this.state.isPaused
  }

  public isPaused(): boolean {
    return this.state.isPaused
  }
}

