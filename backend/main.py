from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from database import get_db, User, GameSession, QuestionAttempt
from agent import SATLearningAgent

app = FastAPI(title="SAT Learning Agent API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# MODELS
# ============================================================================

class UserCreate(BaseModel):
    username: str

class GameResult(BaseModel):
    user_id: int
    game_type: str
    score: int
    correct_answers: int
    wrong_answers: int
    accuracy: float
    max_streak: int
    question_attempts: List[dict]

class QuestionRequest(BaseModel):
    user_id: int
    num_questions: int = 50

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    return {
        "message": "SAT Learning Agent API",
        "version": "1.0.0",
        "endpoints": {
            "POST /users": "Create user",
            "GET /users/{user_id}": "Get user info",
            "POST /questions": "Get personalized questions",
            "POST /game-results": "Submit game results",
            "GET /insights/{user_id}": "Get learning insights"
        }
    }

@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    
    # Check if user exists
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        return existing
    
    # Create new user
    db_user = User(username=user.username)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    """Get user information"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get stats
    sessions = db.query(GameSession).filter(GameSession.user_id == user_id).all()
    
    return {
        "user": user,
        "stats": {
            "total_sessions": len(sessions),
            "total_score": sum(s.score for s in sessions),
            "avg_accuracy": sum(s.accuracy for s in sessions) / len(sessions) if sessions else 0,
            "total_questions": sum(s.correct_answers + s.wrong_answers for s in sessions)
        }
    }

@app.post("/questions")
async def get_questions(request: QuestionRequest, db: Session = Depends(get_db)):
    """
    Get personalized SAT questions based on user performance
    Uses AI agent with memory and context
    """
    
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Initialize agent with user context
    agent = SATLearningAgent(db, request.user_id)
    
    # Generate personalized questions
    questions = await agent.generate_questions(request.num_questions)
    
    if not questions:
        raise HTTPException(status_code=500, detail="Failed to generate questions")
    
    return {
        "user_id": request.user_id,
        "num_questions": len(questions),
        "questions": questions,
        "generated_at": datetime.utcnow().isoformat()
    }

@app.post("/game-results")
def submit_game_results(result: GameResult, db: Session = Depends(get_db)):
    """
    Submit game results and update user performance
    Agent learns from this data for future question generation
    """
    
    # Verify user
    user = db.query(User).filter(User.id == result.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Save game session
    session = GameSession(
        user_id=result.user_id,
        game_type=result.game_type,
        score=result.score,
        correct_answers=result.correct_answers,
        wrong_answers=result.wrong_answers,
        accuracy=result.accuracy,
        max_streak=result.max_streak
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Update performance using agent
    agent = SATLearningAgent(db, result.user_id)
    
    # Add session_id to attempts
    for attempt in result.question_attempts:
        attempt['session_id'] = session.id
    
    agent.update_performance(result.question_attempts)
    
    return {
        "success": True,
        "session_id": session.id,
        "message": "Results submitted successfully"
    }

@app.get("/insights/{user_id}")
async def get_insights(user_id: int, db: Session = Depends(get_db)):
    """
    Get AI-generated learning insights
    Agent analyzes performance and provides personalized recommendations
    """
    
    # Verify user
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Initialize agent
    agent = SATLearningAgent(db, user_id)
    
    # Get performance analysis
    analysis = agent.analyze_performance()
    
    # Get AI-generated insights
    insights = await agent.get_learning_insights()
    
    return {
        "user_id": user_id,
        "performance_analysis": analysis,
        "ai_insights": insights
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

