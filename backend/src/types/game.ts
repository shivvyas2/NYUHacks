export interface QuestionAttempt {
  questionId: number
  topic: string
  difficulty: string
  isCorrect: boolean
  timeSpent: number
}

export interface TopicPerformance {
  [topic: string]: {
    correct: number
    total: number
    accuracy: number
  }
}

export interface GameAnalytics {
  gameId: string
  score: number
  accuracy: number
  correctAnswers: number
  wrongAnswers: number
  questionAttempts: QuestionAttempt[]
  topicPerformance: TopicPerformance
  streakInfo: {
    maxStreak: number
  }
  averageResponseTime: number
}

