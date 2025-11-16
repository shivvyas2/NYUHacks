export interface SATQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  explanation: string
}

export interface ZombieGameState {
  score: number
  correctAnswers: number
  wrongAnswers: number
  currentQuestionIndex: number
  totalQuestions: number
  streak: number
  maxStreak: number
  ammo: number
  health: number
  isGameOver: boolean
}

export interface QuestionAttempt {
  questionId: number
  topic: string
  difficulty: string
  isCorrect: boolean
  timeSpent: number
}

export interface GameAnalytics {
  gameId: string
  score: number
  accuracy: number
  correctAnswers: number
  wrongAnswers: number
  questionAttempts: QuestionAttempt[]
  topicPerformance: {
    [topic: string]: {
      correct: number
      total: number
      accuracy: number
    }
  }
  streakInfo: {
    maxStreak: number
  }
  averageResponseTime: number
}

