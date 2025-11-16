// frontend/lib/api.ts
// API service for communicating with the FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface SAT_Question {
  question: string
  options: string[]
  correct: number
  category: 'math' | 'reading' | 'writing'
  question_id: string
  points: number
  time_limit: number
}

export interface SessionResponse {
  session_id: string
  player_name: string
  game_type: string
  score: number
  lives: number
  message: string
}

export interface AnswerResponse {
  is_correct: boolean
  correct_answer: number
  explanation: string
  points_earned: number
  total_score: number
  lives_remaining: number
  session_active: boolean
  power_mode: boolean
}

export interface SessionStats {
  session_id: string
  player_name: string
  game_type: string
  score: number
  lives_remaining: number
  questions_answered: number
  correct_answers: number
  wrong_answers: number
  accuracy: number
  average_time_per_question: number
  session_duration_seconds: number | null
  is_active: boolean
}

export interface LeaderboardEntry {
  player_name: string
  game_type: string
  score: number
  questions_answered: number
  accuracy: number
  completed_at: string
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  total_entries: number
}

export class GameAPI {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Create a new game session
   */
  async createSession(
    playerName: string,
    gameType: 'subway-surfers' | 'squid-game' | 'mario' | 'pac-man',
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Promise<SessionResponse> {
    const response = await fetch(`${this.baseUrl}/api/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        player_name: playerName,
        game_type: gameType,
        difficulty,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get a new question when player hits an obstacle
   */
  async getQuestion(sessionId: string): Promise<SAT_Question> {
    const response = await fetch(
      `${this.baseUrl}/api/sessions/${sessionId}/question`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get question: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Submit an answer to a question
   */
  async submitAnswer(
    sessionId: string,
    questionId: string,
    selectedAnswer: number,
    timeTaken: number
  ): Promise<AnswerResponse> {
    const response = await fetch(
      `${this.baseUrl}/api/sessions/${sessionId}/answer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question_id: questionId,
          selected_answer: selectedAnswer,
          time_taken: timeTaken,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to submit answer: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get session statistics
   */
  async getSessionStats(sessionId: string): Promise<SessionStats> {
    const response = await fetch(
      `${this.baseUrl}/api/sessions/${sessionId}/stats`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get stats: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * End a game session
   */
  async endSession(sessionId: string): Promise<{ message: string; final_score: number; stats: SessionStats }> {
    const response = await fetch(
      `${this.baseUrl}/api/sessions/${sessionId}/end`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to end session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    gameType?: 'subway-surfers' | 'squid-game' | 'mario' | 'pac-man',
    limit: number = 10
  ): Promise<LeaderboardResponse> {
    const params = new URLSearchParams()
    if (gameType) params.append('game_type', gameType)
    params.append('limit', limit.toString())

    const response = await fetch(
      `${this.baseUrl}/api/leaderboard?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get leaderboard: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; active_sessions: number }> {
    const response = await fetch(`${this.baseUrl}/health`)

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`)
    }

    return response.json()
  }
}

// Export singleton instance
export const gameAPI = new GameAPI()

// Helper hook for React components
export function useGameAPI() {
  return gameAPI
}