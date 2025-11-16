"""
Game endpoints - save scores and analytics
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from src.models.schemas import SaveScoreRequest, SaveScoreResponse
from src.services.game_service import GameService
from src.utils.database import get_db
from src.api.auth import get_current_user
from supabase import Client

router = APIRouter()
security = HTTPBearer()

@router.post("/save-score", response_model=SaveScoreResponse)
async def save_score(
    request: SaveScoreRequest,
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """Save game score and analytics"""
    game_service = GameService(db)
    result = await game_service.save_game_session(
        user_id=current_user["id"],
        game_id=request.gameId,
        analytics=request.analytics
    )
    
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to save score"))
    
    return SaveScoreResponse(
        success=True,
        sessionId=result["sessionId"]
    )

