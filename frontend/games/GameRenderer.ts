// GameRenderer.ts
import { BaseGame } from './BaseGame'
import { SubwaySurfersGame } from './subway-surfers/SubwaySurfersGame'
import { SquidGameGame } from './squid-game/SquidGameGame'
import { MarioGame } from './mario/MarioGame'
import { PacManGame } from './pac-man/PacManGame'

export class GameRenderer {
  private game: BaseGame | null = null
  private animationFrameId: number | null = null
  private lastTime: number = 0
  private resizeObserver: ResizeObserver | null = null
  private usesThreeJS: boolean = false
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null = null

  constructor(
    canvas: HTMLCanvasElement,
    private gameId: string
  ) {
    this.canvas = canvas
  }

  init() {
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

    window.addEventListener('keydown', this.keydownHandler)
  }

  private setupResizeObserver() {
    const handleResize = () => {
      // Handle resize if needed
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

    const deltaTime = currentTime - this.lastTime
    this.lastTime = currentTime

    this.game.update(deltaTime)

    // Clear overlay canvas for UI
    if (this.ctx && this.usesThreeJS) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    } else if (this.ctx && !this.usesThreeJS) {
      this.ctx.fillStyle = '#000'
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    // Render game
    if (this.ctx) {
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
    this.game?.cleanup()
  }
}

