export interface Database {
  public: {
    Tables: {
      game_sessions: {
        Row: {
          id: string
          user_id: string
          game_id: string
          score: number
          accuracy: number
          correct_answers: number
          wrong_answers: number
          max_streak: number
          average_response_time: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          game_id: string
          score: number
          accuracy: number
          correct_answers: number
          wrong_answers: number
          max_streak: number
          average_response_time: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          game_id?: string
          score?: number
          accuracy?: number
          correct_answers?: number
          wrong_answers?: number
          max_streak?: number
          average_response_time?: number
          created_at?: string
        }
      }
      question_attempts: {
        Row: {
          id: string
          session_id: string
          question_id: number
          topic: string
          difficulty: string
          is_correct: boolean
          time_spent: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          question_id: number
          topic: string
          difficulty: string
          is_correct: boolean
          time_spent: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: number
          topic?: string
          difficulty?: string
          is_correct?: boolean
          time_spent?: number
          created_at?: string
        }
      }
      user_stats: {
        Row: {
          id: string
          user_id: string
          total_games_played: number
          total_score: number
          total_questions_answered: number
          total_correct: number
          total_wrong: number
          overall_accuracy: number
          favorite_game: string | null
          weak_topics: string[]
          strong_topics: string[]
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_games_played?: number
          total_score?: number
          total_questions_answered?: number
          total_correct?: number
          total_wrong?: number
          overall_accuracy?: number
          favorite_game?: string | null
          weak_topics?: string[]
          strong_topics?: string[]
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_games_played?: number
          total_score?: number
          total_questions_answered?: number
          total_correct?: number
          total_wrong?: number
          overall_accuracy?: number
          favorite_game?: string | null
          weak_topics?: string[]
          strong_topics?: string[]
          updated_at?: string
        }
      }
    }
  }
}

