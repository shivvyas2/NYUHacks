import { BaseGame } from '../BaseGame'

/**
 * Snake Game
 * Classic snake game where you control a snake to eat food and grow longer.
 * 
 * TODO: Implement game logic
 */
export class SnakeGame extends BaseGame {
  init(): void {
    // TODO: Initialize game state
    this.setState({ score: 0, level: 1, lives: 3, isPaused: false, isGameOver: false })
  }

  update(deltaTime: number): void {
    // TODO: Update game state
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Draw placeholder
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, this.width, this.height)
    
    ctx.fillStyle = '#fff'
    ctx.font = '24px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('Snake Game', this.width / 2, this.height / 2 - 20)
    ctx.font = '16px monospace'
    ctx.fillText('Coming Soon...', this.width / 2, this.height / 2 + 20)
    ctx.textAlign = 'left'
  }

  handleInput(key: string): void {
    // TODO: Handle user input
  }
}

