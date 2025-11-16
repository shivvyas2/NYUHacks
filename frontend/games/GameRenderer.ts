import { BaseGame } from './BaseGame'
import { SubwaySurfersGame } from './subway-surfers/SubwaySurfersGame'
import { SquidGameGame } from './squid-game/SquidGameGame'
import { MarioGame } from './mario/MarioGame'
import { PacManGame } from './pac-man/PacManGame'

/**
 * GameRenderer
 * Handles game initialization and rendering loop.
 * Currently uses Canvas 2D, but will be updated to use Three.js WebGLRenderer.
 * Games run in fullscreen mode when selected from the main menu.
 */
export class GameRenderer {
  private game: BaseGame | null = null
  private animationFrameId: number | null = null
  private lastTime: number = 0
  private resizeObserver: ResizeObserver | null = null
  private canvas: HTMLCanvasElement

  constructor(
    private ctx: CanvasRenderingContext2D | null,
    private gameId: string,
    canvas?: HTMLCanvasElement
  ) {
    // Get canvas from ctx if available, otherwise use the provided canvas
    this.canvas = ctx?.canvas || canvas || document.createElement('canvas')
  }

  init() {
    // Get canvas dimensions
    const width = this.canvas.width
    const height = this.canvas.height
    
    if (!width || !height) {
      console.error('Canvas dimensions not set')
      return
    }

    // Initialize game with fullscreen dimensions
    switch (this.gameId) {
      case 'subway-surfers':
        this.game = new SubwaySurfersGame(width, height)
        break
      case 'squid-game':
        this.game = new SquidGameGame(width, height)
        break
      case 'mario':
        this.game = new MarioGame(width, height)
        break
      case 'pac-man':
        this.game = new PacManGame(width, height)
        break
      default:
        console.error(`Unknown game: ${this.gameId}`)
        return
    }

    this.game.init()
    this.setupEventListeners()
    this.setupResizeObserver()
    this.gameLoop(0)
  }

  private setupEventListeners() {
    if (!this.game) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture ESC key - let it be handled by GameContainer for exit
      if (e.key === 'Escape') return
      this.game?.handleInput(e.key)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Handle key release for games that support it
      if (this.game && typeof (this.game as any).handleKeyUp === 'function') {
        (this.game as any).handleKeyUp(e.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    // Store cleanup function
    this.cleanup = () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }

  private setupResizeObserver() {
    // Update game dimensions when canvas is resized (for fullscreen)
    const handleResize = () => {
      if (this.game) {
        // Note: For Three.js, we'll update the renderer size instead
        // This is a placeholder for canvas 2D
        const width = this.canvas.width
        const height = this.canvas.height
        // Game will handle resize in its update/render methods
      }
    }

    // Use ResizeObserver for better performance
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(handleResize)
      this.resizeObserver.observe(this.canvas)
    } else {
      window.addEventListener('resize', handleResize)
    }
  }

  // Expose pause toggle for UI controls
  togglePause() {
    this.game?.togglePause()
  }

  private gameLoop = (currentTime: number) => {
    if (!this.game) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    // Update game state
    this.game.update(deltaTime)

    // Clear canvas only for 2D games (Three.js games handle their own clearing)
    const isThreeJSGame = this.gameId === 'subway-surfers' || this.gameId === 'squid-game'
    if (!isThreeJSGame && this.ctx) {
      this.ctx.fillStyle = '#000'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    // Render game
    // For Three.js games, the render method gets the canvas from ctx.canvas
    // but doesn't actually use the 2D context for rendering
    // We need to pass a context that has the canvas property
    if (isThreeJSGame && !this.ctx) {
      // For Three.js, create a proxy object that has the canvas property
      // The render method will extract the canvas and use it for WebGL
      const proxyCtx = {
        canvas: this.canvas
      } as CanvasRenderingContext2D
      this.game.render(proxyCtx)
    } else if (this.ctx) {
      this.game.render(this.ctx)
    }

    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  cleanup() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    this.game?.cleanup()
  }
}

