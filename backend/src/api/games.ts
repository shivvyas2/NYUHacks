/**
 * Game API Routes
 * 
 * This file contains the API route handlers for game-related endpoints.
 * In Next.js, these routes are implemented in frontend/app/api/games/
 * but the service logic is maintained here for separation of concerns.
 */

import { GameScoreService } from '../services/gameScoreService'
import { GameAnalytics } from '../types/game'

/**
 * Example API route handler for saving game scores
 * 
 * This is a reference implementation. The actual Next.js route
 * is in frontend/app/api/games/save-score/route.ts
 */
export async function saveGameScoreHandler(
  supabase: any,
  userId: string,
  gameId: string,
  analytics: GameAnalytics
) {
  const gameScoreService = new GameScoreService(supabase)
  
  try {
    const session = await gameScoreService.saveGameSession(userId, gameId, analytics)
    return { success: true, sessionId: session.id }
  } catch (error: any) {
    throw new Error(`Failed to save game score: ${error.message}`)
  }
}

