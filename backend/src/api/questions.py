"""
Question bank endpoints
Supports both static questions and AI-generated personalized questions
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from src.models.schemas import QuestionResponse, Question
from src.utils.database import get_db
from src.api.auth import get_current_user
from src.services.agent import SATLearningAgent
from supabase import Client
from typing import Optional

router = APIRouter()

@router.get("/", response_model=QuestionResponse)
async def get_questions(
    topic: Optional[str] = Query(None, description="Filter by topic"),
    difficulty: Optional[str] = Query(None, description="Filter by difficulty (easy, medium, hard)"),
    limit: int = Query(10, ge=1, le=100, description="Number of questions to return"),
    use_agent: bool = Query(False, description="Use AI agent to generate personalized questions"),
    current_user: dict = Depends(get_current_user),
    db: Client = Depends(get_db)
):
    """Get questions from the question bank
    
    If use_agent=true, the AI agent will analyze user performance and generate
    personalized questions based on weak topics.
    """
    try:
        questions = []
        
        # Use AI agent to generate personalized questions
        if use_agent:
            try:
                agent = SATLearningAgent(str(current_user["id"]))
                generated_questions = await agent.generate_questions(num_questions=limit, use_web_search=False)
                
                # Convert agent questions to API format
                for q in generated_questions:
                    questions.append(Question(
                        id=q.get("id", 0),
                        question=q.get("question", ""),
                        options=q.get("options", []),
                        correctAnswer=q.get("correct_answer", 0),
                        topic=q.get("topic", "General"),
                        difficulty=q.get("difficulty", "medium"),
                        explanation=q.get("explanation", "")
                    ))
            except Exception as agent_error:
                # If agent fails, fall back to static questions
                print(f"Agent error (falling back to static): {agent_error}")
                use_agent = False
        
        # Fall back to static questions if agent not used or failed
        if not use_agent or not questions:
            # TODO: Load questions from database or game files
            # For now, return empty list
            # You can import from frontend/games/carnival/questions.ts or whackamole/questions.ts
            pass
        
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

