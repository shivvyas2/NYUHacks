// frontend/games/BaseGame.ts
import { GameState } from '@/types/game'
import { gameAPI, SAT_Question, AnswerResponse } from '@/lib/api'

/**
 * Base Game Class with API Integration
 * All games extend this class and use Three.js for 3D rendering.
<<<<<<< HEAD
=======
 * 
 * IMPORTANT: This file should NOT import any game implementations
 * to avoid circular dependencies.
>>>>>>> d863a3d7fda6963f8096b8436011c714958557a2
 */
export abstract class BaseGame {
  protected state: GameState = {
    score: 0,
    level: 1,
    lives: 3,
    isPaused: false,
    isGameOver: false,
  }

  // API Integration
  protected sessionId: string | null = null
  protected currentQuestion: SAT_Question | null = null
  protected showQuestion: boolean = false
  protected questionTimer: number = 0
  protected questionStartTime: number = 0

  constructor(
    protected width: number,
    protected height: number,
<<<<<<< HEAD
    protected canvas?: HTMLCanvasElement
=======
    protected canvas: HTMLCanvasElement
>>>>>>> d863a3d7fda6963f8096b8436011c714958557a2
  ) {}

  abstract init(): void
  abstract update(deltaTime: number): void
  abstract render(ctx: CanvasRenderingContext2D | null): void
  abstract handleInput(key: string): void

  /**
   * Initialize game session with backend
   */
  async initSession(playerName: string, gameType: string): Promise<void> {
    try {
      const response = await gameAPI.createSession(
        playerName,
        gameType as any,
        'medium'
      )
      this.sessionId = response.session_id
      console.log('Session created:', response)
    } catch (error) {
      console.error('Failed to create session:', error)
      // Continue without backend if it fails
    }
  }

  /**
   * Trigger a question when player hits obstacle
   */
  async triggerQuestion(): Promise<void> {
    if (!this.sessionId) {
      console.warn('No session ID, using local questions')
      return
    }

    if (this.showQuestion) return // Already showing a question

    try {
      const question = await gameAPI.getQuestion(this.sessionId)
      this.currentQuestion = question
      this.showQuestion = true
      this.questionTimer = 0
      this.questionStartTime = Date.now()
      this.setState({ isPaused: true }) // Pause game during question
      console.log('Question fetched:', question)
    } catch (error) {
      console.error('Failed to fetch question:', error)
    }
  }

  /**
   * Submit answer to backend
   */
  async submitAnswer(answerIndex: number): Promise<void> {
    if (!this.sessionId || !this.currentQuestion) return

    const timeTaken = (Date.now() - this.questionStartTime) / 1000 // Convert to seconds

    try {
      const response = await gameAPI.submitAnswer(
        this.sessionId,
        this.currentQuestion.question_id,
        answerIndex,
        timeTaken
      )

      // Update game state based on response
      this.handleAnswerResponse(response)

      // Clear question UI
      this.showQuestion = false
      this.currentQuestion = null
      this.setState({ isPaused: false }) // Resume game

      console.log('Answer submitted:', response)
    } catch (error) {
      console.error('Failed to submit answer:', error)
      // Fallback to local handling if API fails
      this.handleLocalAnswer(answerIndex)
    }
  }

  /**
   * Handle answer response from backend
   */
  protected handleAnswerResponse(response: AnswerResponse): void {
    if (response.is_correct) {
      // Correct answer - add points
      this.setState({ score: response.total_score })
      
      // Trigger power mode if game supports it
      if (response.power_mode) {
        this.onPowerMode?.()
      }
    } else {
      // Wrong answer - lose life
      this.setState({ lives: response.lives_remaining })
      
      if (response.lives_remaining <= 0) {
        this.setState({ isGameOver: true })
        this.onGameOver?.()
      }
    }
  }

  /**
   * Fallback local answer handling if API fails
   */
  protected handleLocalAnswer(answerIndex: number): void {
    if (!this.currentQuestion) return

    const isCorrect = answerIndex === this.currentQuestion.correct

    if (isCorrect) {
      this.setState({ score: this.state.score + this.currentQuestion.points })
      this.onPowerMode?.()
    } else {
      this.setState({ lives: this.state.lives - 1 })
      if (this.state.lives <= 0) {
        this.setState({ isGameOver: true })
        this.onGameOver?.()
      }
    }

    this.showQuestion = false
    this.currentQuestion = null
    this.setState({ isPaused: false })
  }

  /**
   * Get current session stats
   */
  async getStats(): Promise<any> {
    if (!this.sessionId) return null

    try {
      const stats = await gameAPI.getSessionStats(this.sessionId)
      return stats
    } catch (error) {
      console.error('Failed to get stats:', error)
      return null
    }
  }

  /**
   * End the current session
   */
  async endSession(): Promise<void> {
    if (!this.sessionId) return

    try {
      await gameAPI.endSession(this.sessionId)
      console.log('Session ended')
    } catch (error) {
      console.error('Failed to end session:', error)
    }
  }

  // Hooks for game-specific behavior
  protected onPowerMode?(): void
  protected onGameOver?(): void

  cleanup(): void {
    // End session when cleaning up
    if (this.sessionId) {
      this.endSession()
    }
    // Override in subclasses if needed
    // Clean up Three.js resources (scenes, geometries, materials, etc.)
  }

  protected getState(): GameState {
    return { ...this.state }
  }

  protected setState(updates: Partial<GameState>): void {
    this.state = { ...this.state, ...updates }
  }
<<<<<<< HEAD

  /**
   * Render question overlay (common across all games)
   */
  protected renderQuestionOverlay(ctx: CanvasRenderingContext2D): void {
    if (!this.showQuestion || !this.currentQuestion) return

    // Dark overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.fillRect(0, 0, this.width, this.height)

    // Question box
    const boxWidth = Math.min(this.width - 100, 800)
    const boxHeight = 400
    const boxX = (this.width - boxWidth) / 2
    const boxY = (this.height - boxHeight) / 2

    ctx.fillStyle = '#1a1a2e'
    ctx.strokeStyle = '#4a9eff'
    ctx.lineWidth = 3
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight)
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight)

    // Title
    ctx.fillStyle = '#4a9eff'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(
      `${this.currentQuestion.category.toUpperCase()} QUESTION`,
      this.width / 2,
      boxY + 40
    )

    // Question text
    ctx.fillStyle = '#fff'
    ctx.font = '20px Arial'
    const words = this.currentQuestion.question.split(' ')
    let line = ''
    let y = boxY + 90
    const maxWidth = boxWidth - 60

    words.forEach((word) => {
      const testLine = line + word + ' '
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, this.width / 2, y)
        line = word + ' '
        y += 28
      } else {
        line = testLine
      }
    })
    ctx.fillText(line, this.width / 2, y)

    // Options
    const optionY = boxY + 180
    const optionHeight = 40
    const optionSpacing = 50

    this.currentQuestion.options.forEach((option, i) => {
      const y = optionY + i * optionSpacing

      // Option box
      ctx.fillStyle = '#2d2d44'
      ctx.strokeStyle = '#4a9eff'
      ctx.lineWidth = 2
      ctx.fillRect(boxX + 30, y, boxWidth - 60, optionHeight)
      ctx.strokeRect(boxX + 30, y, boxWidth - 60, optionHeight)

      // Option text
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 18px Arial'
      ctx.textAlign = 'left'
      ctx.fillText(
        `${i + 1}. ${option}`,
        boxX + 50,
        y + 26
      )
    })

    // Timer
    const timeElapsed = this.questionTimer / 1000
    const timeLeft = Math.max(0, this.currentQuestion.time_limit - timeElapsed)
    ctx.fillStyle = timeLeft < 5 ? '#ff4444' : '#ffff00'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(
      `Time: ${Math.ceil(timeLeft)}s`,
      this.width / 2,
      boxY + boxHeight - 20
    )

    // Instructions
    ctx.fillStyle = '#888'
    ctx.font = '16px Arial'
    ctx.fillText(
      'Press 1-4 to answer',
      this.width / 2,
      boxY + boxHeight + 30
    )
  }

  /**
   * Handle question input (common across all games)
   */
  protected handleQuestionInput(key: string): boolean {
    if (!this.showQuestion) return false

    if (['1', '2', '3', '4'].includes(key)) {
      const answerIndex = parseInt(key) - 1
      this.submitAnswer(answerIndex)
      return true
    }

    return false
  }

  /**
   * Update question timer (call in game update loop)
   */
  protected updateQuestionTimer(deltaTime: number): void {
    if (!this.showQuestion || !this.currentQuestion) return

    this.questionTimer += deltaTime

    // Timeout after time limit
    if (this.questionTimer / 1000 > this.currentQuestion.time_limit) {
      // Auto-submit wrong answer
      this.submitAnswer(-1) // Invalid answer = wrong
    }
  }
}
=======

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

// DO NOT add any exports or imports of game classes here!
>>>>>>> d863a3d7fda6963f8096b8436011c714958557a2
