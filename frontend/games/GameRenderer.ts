// GameRenderer.ts
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
  private usesThreeJS: boolean = false
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null = null

  constructor(
    canvas: HTMLCanvasElement,
    private gameId: string
  ) {
    this.canvas = canvas
  }

  async init() {
    // Initialize game with fullscreen dimensions
    switch (this.gameId) {
      case 'subway-surfers':
        this.game = new SubwaySurfersGame(this.canvas.width, this.canvas.height, this.canvas)
        this.usesThreeJS = true
        break
      case 'squid-game':
        this.game = new SquidGameGame(this.canvas.width, this.canvas.height, this.canvas)
        this.usesThreeJS = true
        break
      case 'mario':
        this.game = new MarioGame(this.canvas.width, this.canvas.height, this.canvas)
        this.usesThreeJS = true
        break
      case 'pac-man':
        this.game = new PacManGame(this.canvas.width, this.canvas.height, this.canvas)
        this.usesThreeJS = true
        break
      default:
        console.error(`Unknown game: ${this.gameId}`)
        return
    }

    // Only get 2D context for non-Three.js games
    if (!this.usesThreeJS) {
      this.ctx = this.canvas.getContext('2d')
      if (!this.ctx) {
        console.error('Could not get 2D context')
        return
      }
    } else {
      // For Three.js games, create an overlay canvas for 2D UI
      const overlayCanvas = document.createElement('canvas')
      overlayCanvas.width = this.canvas.width
      overlayCanvas.height = this.canvas.height
      overlayCanvas.style.position = 'absolute'
      overlayCanvas.style.top = '0'
      overlayCanvas.style.left = '0'
      overlayCanvas.style.pointerEvents = 'none'
      this.canvas.parentElement?.appendChild(overlayCanvas)
      this.ctx = overlayCanvas.getContext('2d')
    }

    this.game.init()
    
    // Setup Three.js for squid-game (needs async initialization)
    if (this.gameId === 'squid-game' && 'setupThreeJS' in this.game) {
      try {
        await (this.game as any).setupThreeJS(this.canvas)
      } catch (error) {
        console.error('Failed to setup Three.js for squid-game:', error)
      }
    }
    
    this.setupEventListeners()
    this.setupResizeObserver()
    this.gameLoop(0)
  }

  private setupEventListeners() {
    if (!this.game) return

    this.keydownHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return
      this.game?.handleInput(e.key)
    }

    this.keyupHandler = (e: KeyboardEvent) => {
      // Handle key release for games that need it (like squid game)
      if ('handleKeyRelease' in (this.game as any)) {
        (this.game as any).handleKeyRelease(e.key)
      }
    }

    window.addEventListener('keydown', this.keydownHandler)
    window.addEventListener('keyup', this.keyupHandler)
  }

  private setupResizeObserver() {
    const handleResize = () => {
      if (this.game) {
        // For Three.js games, update renderer size
        if (this.gameId === 'squid-game' && 'gameObjects' in this.game) {
          const gameObjects = (this.game as any).gameObjects
          if (gameObjects?.renderer) {
            const width = this.canvas.width || window.innerWidth
            const height = this.canvas.height || window.innerHeight
            gameObjects.renderer.setSize(width, height)
            gameObjects.camera.aspect = width / height
            gameObjects.camera.updateProjectionMatrix()
          }
        }
      }
    }

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(handleResize)
      this.resizeObserver.observe(this.canvas)
    } else {
      window.addEventListener('resize', handleResize)
    }
  }

  private gameLoop = (currentTime: number) => {
    if (!this.game) return

    // Handle first frame
    if (this.lastTime === 0) {
      this.lastTime = currentTime
      this.animationFrameId = requestAnimationFrame(this.gameLoop)
      return
    }

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    // Cap deltaTime to prevent large jumps (max 50ms = 20 FPS minimum for smooth animations)
    // This ensures smooth motion even if the browser tab was inactive
    const cappedDeltaTime = Math.min(deltaTime, 50)

    // Update game state
    this.game.update(cappedDeltaTime)

    // Clear overlay canvas for UI
    if (this.ctx && this.usesThreeJS) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    } else if (this.ctx && !this.usesThreeJS) {
      this.ctx.fillStyle = '#000'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    // Render game
    if (this.gameId === 'squid-game') {
      // Three.js games handle their own rendering
      this.game.render(null as any) // Pass null, game handles Three.js rendering
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
    if (this.keydownHandler) {
      window.removeEventListener('keydown', this.keydownHandler)
    }
    if (this.keyupHandler) {
      window.removeEventListener('keyup', this.keyupHandler)
    }
    this.game?.cleanup()
  }
}

