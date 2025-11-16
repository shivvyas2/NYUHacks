import { BaseGame } from './BaseGame'
import { SubwaySurfersGame } from './subway-surfers/SubwaySurfersGame'
import { SquidGameGame } from './squid-game/SquidGameGame'
import { MarioGame } from './mario/MarioGame'
import { PacManGame } from './pac-man/PacManGame'

/**
 * GameRenderer
 * Handles game initialization and rendering loop.
 * Supports both Canvas 2D and Three.js WebGLRenderer.
 * Games run in fullscreen mode when selected from the main menu.
 */
export class GameRenderer {
  private game: BaseGame | null = null
  private animationFrameId: number | null = null
  private lastTime: number = 0
  private resizeObserver: ResizeObserver | null = null

  constructor(
    private ctx: CanvasRenderingContext2D | null,
    private gameId: string,
    private canvas?: HTMLCanvasElement
  ) {}

  async init() {
    if (!this.canvas && !this.ctx) {
      console.error('No canvas or context provided')
      return
    }

    const canvas = this.canvas || (this.ctx?.canvas as HTMLCanvasElement)
    const width = canvas.width || window.innerWidth
    const height = canvas.height || window.innerHeight

    // Initialize game with fullscreen dimensions
    switch (this.gameId) {
      case 'subway-surfers':
        this.game = new SubwaySurfersGame(width, height)
        break
      case 'squid-game':
        this.game = new SquidGameGame(width, height)
        // Initialize Three.js for squid game
        if (this.canvas && 'setupThreeJS' in this.game) {
          await (this.game as any).setupThreeJS(this.canvas)
        }
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
      // Handle key release for games that need it (like squid game)
      if ('handleKeyRelease' in (this.game as any)) {
        (this.game as any).handleKeyRelease(e.key)
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
    const canvas = this.canvas || (this.ctx?.canvas as HTMLCanvasElement)
    if (!canvas) return
    
    // Update game dimensions when canvas is resized (for fullscreen)
    const handleResize = () => {
      if (this.game) {
        const width = canvas.width || window.innerWidth
        const height = canvas.height || window.innerHeight
        
        // For Three.js games, update renderer size
        if (this.gameId === 'squid-game' && 'gameObjects' in this.game) {
          const gameObjects = (this.game as any).gameObjects
          if (gameObjects?.renderer) {
            gameObjects.renderer.setSize(width, height)
            gameObjects.camera.aspect = width / height
            gameObjects.camera.updateProjectionMatrix()
          }
        }
      }
    }

    // Use ResizeObserver for better performance
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(handleResize)
      this.resizeObserver.observe(canvas)
    } else {
      window.addEventListener('resize', handleResize)
    }
  }

  private gameLoop = (currentTime: number) => {
    if (!this.game) return

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    // Update game state
    this.game.update(deltaTime)

    // Render game
    if (this.gameId === 'squid-game') {
      // Three.js games handle their own rendering
      this.game.render(null as any) // Pass null, game handles Three.js rendering
    } else if (this.ctx) {
      // Canvas 2D games
      this.ctx.fillStyle = '#000'
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
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

