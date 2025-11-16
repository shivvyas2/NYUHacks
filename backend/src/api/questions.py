"""
Question bank endpoints
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from src.models.schemas import QuestionResponse, Question
from src.utils.database import get_db
from src.api.auth import get_current_user
from supabase import Client
from typing import Optional

router = APIRouter()

@router.get("/", response_model=QuestionResponse)
async def get_questions(
    topic: Optional[str] = Query(None, description="Filter by topic"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (easy, medium, hard)"),
    limit: int = Query(10, ge=1, le=100, description="Number of questions to return"),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """Get questions from the question bank"""
    try:
        # For now, we'll read from the existing question files
        # In the future, this could be stored in the database
        
        # Import questions from the game files
        # This is a placeholder - you'll need to adapt based on your question structure
        questions = []
        
        # TODO: Load questions from database or game files
        # For now, return empty list
        # You can import from frontend/games/carnival/questions.ts or whackamole/questions.ts
        
        return QuestionResponse(
            questions=questions,
            total=len(questions)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/topics")
async def get_topics(
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """Get available topics"""
    try:
        # Get unique topics from question_attempts or a topics table
        result = (
            db.table("question_attempts")
            .select("topic")
            .execute()
        )
        
        topics = list(set([attempt["topic"] for attempt in result.data]))
        
        return {"topics": topics}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

