import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '../types/database'
import { GameAnalytics } from '../types/game'

export class GameScoreService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Save a game session and its analytics to the database
   */
  async saveGameSession(userId: string, gameId: string, analytics: GameAnalytics) {
    // Insert game session
    const { data: session, error: sessionError } = await this.supabase
      .from('game_sessions')
      .insert({
        user_id: userId,
        game_id: gameId,
        score: analytics.score,
        accuracy: analytics.accuracy,
        correct_answers: analytics.correctAnswers,
        wrong_answers: analytics.wrongAnswers,
        max_streak: analytics.streakInfo.maxStreak,
        average_response_time: analytics.averageResponseTime,
      })
      .select()
      .single()

    if (sessionError) {
      throw new Error(`Failed to create game session: ${sessionError.message}`)
    }

    // Insert question attempts
    if (analytics.questionAttempts && analytics.questionAttempts.length > 0) {
      const attempts = analytics.questionAttempts.map((attempt) => ({
        session_id: session.id,
        question_id: attempt.questionId,
        topic: attempt.topic,
        difficulty: attempt.difficulty,
        is_correct: attempt.isCorrect,
        time_spent: attempt.timeSpent,
      }))

      const { error: attemptsError } = await this.supabase
        .from('question_attempts')
        .insert(attempts)

      if (attemptsError) {
        console.error('Error inserting question attempts:', attemptsError)
        // Don't fail the request if attempts fail, but log it
      }
    }

    // Update or create user stats
    await this.updateUserStats(userId, analytics)

    return session
  }

  /**
   * Update or create user statistics based on game analytics
   */
  private async updateUserStats(userId: string, analytics: GameAnalytics) {
    const { data: existingStats } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    const topicPerformance = analytics.topicPerformance || {}
    const weakTopics: string[] = []
    const strongTopics: string[] = []

    Object.entries(topicPerformance).forEach(([topic, stats]) => {
      if (stats.total > 0) {
        if (stats.accuracy < 0.5) {
          weakTopics.push(topic)
        } else if (stats.accuracy >= 0.8) {
          strongTopics.push(topic)
        }
      }
    })

    const totalQuestions = analytics.correctAnswers + analytics.wrongAnswers
    const totalCorrect = analytics.correctAnswers
    const totalWrong = analytics.wrongAnswers

    if (existingStats) {
      // Update existing stats
      const newTotalGames = existingStats.total_games_played + 1
      const newTotalScore = existingStats.total_score + analytics.score
      const newTotalQuestions = existingStats.total_questions_answered + totalQuestions
      const newTotalCorrect = existingStats.total_correct + totalCorrect
      const newTotalWrong = existingStats.total_wrong + totalWrong
      const newAccuracy = newTotalQuestions > 0 ? newTotalCorrect / newTotalQuestions : 0

      // Merge weak/strong topics
      const mergedWeakTopics = Array.from(
        new Set([...existingStats.weak_topics, ...weakTopics])
      )
      const mergedStrongTopics = Array.from(
        new Set([...existingStats.strong_topics, ...strongTopics])
      )

      const { error } = await this.supabase
        .from('user_stats')
        .update({
          total_games_played: newTotalGames,
          total_score: newTotalScore,
          total_questions_answered: newTotalQuestions,
          total_correct: newTotalCorrect,
          total_wrong: newTotalWrong,
          overall_accuracy: newAccuracy,
          weak_topics: mergedWeakTopics,
          strong_topics: mergedStrongTopics,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)

      if (error) {
        throw new Error(`Failed to update user stats: ${error.message}`)
      }
    } else {
      // Create new stats
      const { error } = await this.supabase.from('user_stats').insert({
        user_id: userId,
        total_games_played: 1,
        total_score: analytics.score,
        total_questions_answered: totalQuestions,
        total_correct: totalCorrect,
        total_wrong: totalWrong,
        overall_accuracy: analytics.accuracy,
        weak_topics: weakTopics,
        strong_topics: strongTopics,
      })

      if (error) {
        throw new Error(`Failed to create user stats: ${error.message}`)
      }
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const { data, error } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      throw new Error(`Failed to get user stats: ${error.message}`)
    }

    return data
  }

  /**
   * Get recent game sessions for a user
   */
  async getRecentSessions(userId: string, limit: number = 10) {
    const { data, error } = await this.supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get recent sessions: ${error.message}`)
    }

    return data
  }
}

