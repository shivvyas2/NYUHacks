/**
 * Question fetching utility
 * Fetches questions from backend AI agent or falls back to local questions
 */

import { apiClient } from './client'

export interface SATQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  topic: string
  difficulty: string
  explanation: string
}

/**
 * Fetch AI-generated personalized questions
 * Falls back to local questions if backend is unavailable
 */
export async function fetchAIQuestions(
  limit: number = 50,
  fallbackQuestions?: SATQuestion[]
): Promise<SATQuestion[]> {
  try {
    console.log(`🤖 Fetching ${limit} AI-generated questions...`)
    
    const response = await apiClient.getAIQuestions(limit, false)
    
    if (response.questions && response.questions.length > 0) {
      console.log(`✅ Got ${response.questions.length} AI questions!`)
      return response.questions
    }
    
    throw new Error('No questions returned from AI')
  } catch (error) {
    console.warn('⚠️ AI questions unavailable, using fallback:', error)
    return fallbackQuestions || []
  }
}

/**
 * Fetch questions with caching
 * Useful for games that need persistent questions across restarts
 */
export async function fetchQuestionsWithCache(
  gameId: string,
  limit: number = 50,
  fallbackQuestions?: SATQuestion[]
): Promise<SATQuestion[]> {
  const cacheKey = `ai_questions_${gameId}`
  
  // Check cache first (valid for 5 minutes)
  const cached = sessionStorage.getItem(cacheKey)
  if (cached) {
    try {
      const { questions, timestamp } = JSON.parse(cached)
      const age = Date.now() - timestamp
      if (age < 5 * 60 * 1000) { // 5 minutes
        console.log(`📦 Using cached questions (${Math.floor(age / 1000)}s old)`)
        return questions
      }
    } catch (e) {
      // Invalid cache, continue to fetch
    }
  }
  
  // Fetch fresh questions
  const questions = await fetchAIQuestions(limit, fallbackQuestions)
  
  // Cache them
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({
      questions,
      timestamp: Date.now()
    }))
  } catch (e) {
    // Storage might be full, ignore
  }
  
  return questions
}

