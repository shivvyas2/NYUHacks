"""
User statistics endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from src.models.schemas import UserStatsResponse, GameSessionResponse
from src.utils.database import get_db
from src.api.auth import get_current_user
from supabase import Client
from typing import List

router = APIRouter()

@router.get("/user", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """Get user statistics"""
    try:
        result = db.table("user_stats").select("*").eq("user_id", current_user["id"]).execute()
        
        if not result.data:
            # Return default stats if none exist
            return UserStatsResponse(
                total_games_played=0,
                total_score=0,
                total_questions_answered=0,
                total_correct=0,
                total_wrong=0,
                overall_accuracy=0.0,
                favorite_game=None,
                weak_topics=[],
                strong_topics=[],
                updated_at=""
            )
        
        stats = result.data[0]
        return UserStatsResponse(**stats)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions", response_model=List[GameSessionResponse])
async def get_recent_sessions(
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """Get recent game sessions"""
    try:
        result = (
            db.table("game_sessions")
            .select("*")
            .eq("user_id", current_user["id"])
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )
        
        return [GameSessionResponse(**session) for session in result.data]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

