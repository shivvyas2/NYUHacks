from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum
import uvicorn
import uuid
import random

app = FastAPI(
    title="Educational Game API",
    description="Backend for SAT-style educational games",
    version="1.0.0"
)

# CORS middleware for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for hackathon
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== ENUMS ====================

class GameType(str, Enum):
    SUBWAY_SURFERS = "subway-surfers"
    SQUID_GAME = "squid-game"
    MARIO = "mario"
    PAC_MAN = "pac-man"

class QuestionCategory(str, Enum):
    MATH = "math"
    READING = "reading"
    WRITING = "writing"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

# ==================== MODELS ====================

class Question(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    category: QuestionCategory
    difficulty: DifficultyLevel
    question: str  # Match frontend "question" field
    options: List[str]
    correct: int  # Match frontend "correct" field (index 0-3)
    explanation: str
    points: int = 10
    time_limit: int = 30

class QuestionResponse(BaseModel):
    question_id: str
    selected_answer: int
    time_taken: float
    is_correct: bool

class GameSession(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_name: str
    game_type: GameType
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    current_question_index: int = 0
    score: int = 0
    lives: int = 3
    questions_asked: int = 0
    correct_answers: int = 0
    wrong_answers: int = 0
    questions: List[Question] = []
    answers: List[QuestionResponse] = []
    is_active: bool = True

class CreateSessionRequest(BaseModel):
    player_name: str
    game_type: GameType
    difficulty: Optional[DifficultyLevel] = DifficultyLevel.MEDIUM

class SubmitAnswerRequest(BaseModel):
    question_id: str
    selected_answer: int
    time_taken: float

class LeaderboardEntry(BaseModel):
    player_name: str
    game_type: GameType
    score: int
    questions_answered: int
    accuracy: float
    completed_at: datetime

# ==================== IN-MEMORY STORAGE ====================

sessions: Dict[str, GameSession] = {}
leaderboard: List[LeaderboardEntry] = []

# SAT-style questions bank matching frontend format
QUESTIONS_BANK = {
    QuestionCategory.MATH: {
        DifficultyLevel.EASY: [
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.EASY,
                question="If 2x + 5 = 13, what is x?",
                options=["2", "4", "6", "8"],
                correct=1,
                explanation="Subtract 5 from both sides: 2x = 8, then divide by 2: x = 4",
                points=10
            ),
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.EASY,
                question="What is 15% of 200?",
                options=["25", "30", "35", "40"],
                correct=1,
                explanation="15% = 0.15, so 0.15 × 200 = 30",
                points=10
            ),
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.EASY,
                question="If x + 5 = 12, what is the value of x?",
                options=["5", "7", "12", "17"],
                correct=1,
                explanation="Subtract 5 from both sides: x = 12 - 5 = 7",
                points=10
            ),
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.EASY,
                question="What is 25% of 80?",
                options=["15", "20", "25", "30"],
                correct=1,
                explanation="25% = 0.25, so 0.25 × 80 = 20",
                points=10
            ),
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.EASY,
                question="If a rectangle has length 8 and width 3, what is its area?",
                options=["11", "22", "24", "27"],
                correct=2,
                explanation="Area = length × width = 8 × 3 = 24",
                points=10
            ),
        ],
        DifficultyLevel.MEDIUM: [
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.MEDIUM,
                question="If 3x - 7 = 2x + 5, what is x?",
                options=["2", "12", "8", "5"],
                correct=1,
                explanation="3x - 2x = 5 + 7, so x = 12",
                points=15
            ),
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.MEDIUM,
                question="If a = 3b and b = 4, what is a?",
                options=["7", "12", "16", "20"],
                correct=1,
                explanation="Substitute b = 4 into a = 3b: a = 3(4) = 12",
                points=15
            ),
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.MEDIUM,
                question="A circle has a radius of 7. What is its circumference? (Use π ≈ 3.14)",
                options=["14", "21.98", "43.96", "153.86"],
                correct=2,
                explanation="Circumference = 2πr = 2 × 3.14 × 7 ≈ 43.96",
                points=15
            ),
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.MEDIUM,
                question="Solve: (x + 2)² = 16. What are the values of x?",
                options=["2, -6", "4, -8", "2, -2", "4, 0"],
                correct=0,
                explanation="Take square root: x + 2 = ±4, so x = 2 or x = -6",
                points=15
            ),
        ],
        DifficultyLevel.HARD: [
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.HARD,
                question="If f(x) = 2x² - 3x + 1, what is f(3)?",
                options=["4", "10", "16", "28"],
                correct=1,
                explanation="f(3) = 2(3²) - 3(3) + 1 = 2(9) - 9 + 1 = 18 - 9 + 1 = 10",
                points=20
            ),
            Question(
                category=QuestionCategory.MATH,
                difficulty=DifficultyLevel.HARD,
                question="If f(x) = 2x - 3, what is f(5)?",
                options=["7", "8", "10", "13"],
                correct=0,
                explanation="f(5) = 2(5) - 3 = 10 - 3 = 7",
                points=20
            ),
        ],
    },
    QuestionCategory.READING: {
        DifficultyLevel.EASY: [
            Question(
                category=QuestionCategory.READING,
                difficulty=DifficultyLevel.EASY,
                question="Which word is a synonym for 'happy'?",
                options=["Sad", "Joyful", "Angry", "Tired"],
                correct=1,
                explanation="'Joyful' means the same as happy.",
                points=10
            ),
            Question(
                category=QuestionCategory.READING,
                difficulty=DifficultyLevel.EASY,
                question="What is the main idea of a paragraph called?",
                options=["Detail", "Topic sentence", "Conclusion", "Introduction"],
                correct=1,
                explanation="The topic sentence contains the main idea of a paragraph.",
                points=10
            ),
        ],
        DifficultyLevel.MEDIUM: [
            Question(
                category=QuestionCategory.READING,
                difficulty=DifficultyLevel.MEDIUM,
                question="Which word is most similar to 'ephemeral'?",
                options=["eternal", "temporary", "solid", "beautiful"],
                correct=1,
                explanation="'Ephemeral' means lasting for a very short time, so 'temporary' is the closest synonym.",
                points=15
            ),
            Question(
                category=QuestionCategory.READING,
                difficulty=DifficultyLevel.MEDIUM,
                question="'The author's tone in the passage is primarily...' What does 'tone' refer to?",
                options=["The volume of the text", "The author's attitude", "The length of sentences", "The number of paragraphs"],
                correct=1,
                explanation="Tone refers to the author's attitude or feeling toward the subject.",
                points=15
            ),
            Question(
                category=QuestionCategory.READING,
                difficulty=DifficultyLevel.MEDIUM,
                question="'Ameliorate' most nearly means:",
                options=["worsen", "improve", "maintain", "destroy"],
                correct=1,
                explanation="'Ameliorate' means to make something better or improve it.",
                points=15
            ),
        ],
        DifficultyLevel.HARD: [
            Question(
                category=QuestionCategory.READING,
                difficulty=DifficultyLevel.HARD,
                question="An author uses irony when they...",
                options=["Write very seriously", "Say the opposite of what they mean", "Use many adjectives", "Tell a story"],
                correct=1,
                explanation="Irony is when the intended meaning is opposite to the literal meaning.",
                points=20
            ),
        ],
    },
    QuestionCategory.WRITING: {
        DifficultyLevel.EASY: [
            Question(
                category=QuestionCategory.WRITING,
                difficulty=DifficultyLevel.EASY,
                question="Which sentence is grammatically correct?",
                options=[
                    "Me and him went to the store",
                    "He and I went to the store",
                    "Him and me went to the store",
                    "Me and he went to the store"
                ],
                correct=1,
                explanation="'He and I' is the correct subject pronoun form.",
                points=10
            ),
        ],
        DifficultyLevel.MEDIUM: [
            Question(
                category=QuestionCategory.WRITING,
                difficulty=DifficultyLevel.MEDIUM,
                question="Which sentence is grammatically correct?",
                options=["Me and him went", "Him and I went", "He and I went", "I and he went"],
                correct=2,
                explanation="'He and I' is the grammatically correct form for compound subjects.",
                points=15
            ),
            Question(
                category=QuestionCategory.WRITING,
                difficulty=DifficultyLevel.MEDIUM,
                question="Choose the sentence with correct punctuation:",
                options=[
                    "The dog ran fast it was excited.",
                    "The dog ran fast; it was excited.",
                    "The dog ran fast, it was excited.",
                    "The dog ran fast it was, excited."
                ],
                correct=1,
                explanation="A semicolon correctly joins two independent clauses.",
                points=15
            ),
        ],
        DifficultyLevel.HARD: [
            Question(
                category=QuestionCategory.WRITING,
                difficulty=DifficultyLevel.HARD,
                question="Which sentence uses 'affect' correctly?",
                options=[
                    "The medication had no affect on the patient.",
                    "The weather can affect your mood.",
                    "She showed no affect during the speech.",
                    "The affect was immediate and noticeable."
                ],
                correct=1,
                explanation="'Affect' as a verb means to influence. 'Effect' is usually a noun.",
                points=20
            ),
        ],
    },
}

# ==================== HELPER FUNCTIONS ====================

def get_random_question(difficulty: DifficultyLevel, exclude_ids: List[str] = []) -> Question:
    """Get a random question that hasn't been asked yet"""
    all_questions = []
    for category in QuestionCategory:
        questions = QUESTIONS_BANK.get(category, {}).get(difficulty, [])
        all_questions.extend(questions)
    
    # Filter out already asked questions
    available = [q for q in all_questions if q.id not in exclude_ids]
    
    if not available:
        # If all questions used, reset and pick from all
        available = all_questions
    
    selected = random.choice(available)
    # Create new instance with new ID
    return Question(**selected.dict(exclude={'id'}), id=str(uuid.uuid4()))

# ==================== API ENDPOINTS ====================

@app.get("/")
def read_root():
    return {
        "message": "Educational Game API - Ready for Hackathon!",
        "status": "running",
        "version": "1.0.0",
        "games_supported": [game.value for game in GameType],
        "endpoints": {
            "health": "GET /health",
            "create_session": "POST /api/sessions",
            "get_question": "GET /api/sessions/{session_id}/question",
            "submit_answer": "POST /api/sessions/{session_id}/answer",
            "get_stats": "GET /api/sessions/{session_id}/stats",
            "leaderboard": "GET /api/leaderboard"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "active_sessions": len([s for s in sessions.values() if s.is_active]),
        "total_sessions": len(sessions)
    }

@app.post("/api/sessions")
def create_session(request: CreateSessionRequest):
    """Create a new game session"""
    session = GameSession(
        player_name=request.player_name,
        game_type=request.game_type,
        questions=[]  # Questions generated on-demand
    )
    
    sessions[session.session_id] = session
    
    return {
        "session_id": session.session_id,
        "player_name": session.player_name,
        "game_type": session.game_type,
        "score": session.score,
        "lives": session.lives,
        "message": "Session created! Start playing and call /question when you hit an obstacle."
    }

@app.get("/api/sessions/{session_id}")
def get_session(session_id: str):
    """Get full session details"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    return session

@app.get("/api/sessions/{session_id}/question")
def get_question(session_id: str):
    """Get a new question when player hits obstacle - matches frontend format exactly"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Session has ended")
    
    # Generate a new question on-demand
    asked_ids = [q.id for q in session.questions]
    difficulty = DifficultyLevel.MEDIUM  # Can be made dynamic based on score/level
    
    question = get_random_question(difficulty, asked_ids)
    session.questions.append(question)
    session.questions_asked += 1
    
    # Return in exact frontend format
    return {
        "question": question.question,
        "options": question.options,
        "correct": question.correct,
        "category": question.category,
        "question_id": question.id,
        "points": question.points,
        "time_limit": question.time_limit
    }

@app.post("/api/sessions/{session_id}/answer")
def submit_answer(session_id: str, answer: SubmitAnswerRequest):
    """Submit an answer - matches game logic"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Session has ended")
    
    # Find the question
    question = next((q for q in session.questions if q.id == answer.question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    
    # Check if answer is correct
    is_correct = answer.selected_answer == question.correct
    
    # Calculate points
    points_earned = 0
    if is_correct:
        # Base points + time bonus
        time_bonus = max(0, int((question.time_limit - answer.time_taken) / 2))
        points_earned = question.points + time_bonus
        session.score += points_earned
        session.correct_answers += 1
    else:
        # Wrong answer - lose a life
        session.lives -= 1
        session.wrong_answers += 1
        
        if session.lives <= 0:
            session.is_active = False
            session.ended_at = datetime.utcnow()
            
            # Add to leaderboard
            add_to_leaderboard(session)
    
    # Record the answer
    response = QuestionResponse(
        question_id=answer.question_id,
        selected_answer=answer.selected_answer,
        time_taken=answer.time_taken,
        is_correct=is_correct
    )
    session.answers.append(response)
    
    return {
        "is_correct": is_correct,
        "correct_answer": question.correct,
        "explanation": question.explanation,
        "points_earned": points_earned,
        "total_score": session.score,
        "lives_remaining": session.lives,
        "session_active": session.is_active,
        "power_mode": is_correct  # Give power mode on correct answer
    }

@app.get("/api/sessions/{session_id}/stats")
def get_session_stats(session_id: str):
    """Get detailed statistics for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    total_answered = len(session.answers)
    accuracy = (session.correct_answers / total_answered * 100) if total_answered > 0 else 0
    
    avg_time = (sum(ans.time_taken for ans in session.answers) / total_answered) if total_answered > 0 else 0
    
    duration = None
    if session.ended_at:
        duration = (session.ended_at - session.started_at).total_seconds()
    
    return {
        "session_id": session.session_id,
        "player_name": session.player_name,
        "game_type": session.game_type,
        "score": session.score,
        "lives_remaining": session.lives,
        "questions_answered": total_answered,
        "correct_answers": session.correct_answers,
        "wrong_answers": session.wrong_answers,
        "accuracy": round(accuracy, 2),
        "average_time_per_question": round(avg_time, 2),
        "session_duration_seconds": duration,
        "is_active": session.is_active
    }

@app.get("/api/leaderboard")
def get_leaderboard(game_type: Optional[GameType] = None, limit: int = 10):
    """Get leaderboard"""
    filtered = leaderboard
    
    if game_type:
        filtered = [entry for entry in leaderboard if entry.game_type == game_type]
    
    # Sort by score descending
    sorted_leaderboard = sorted(filtered, key=lambda x: x.score, reverse=True)
    
    return {
        "leaderboard": sorted_leaderboard[:limit],
        "total_entries": len(filtered)
    }

@app.post("/api/sessions/{session_id}/end")
def end_session(session_id: str):
    """Manually end a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    
    if session.is_active:
        session.is_active = False
        session.ended_at = datetime.utcnow()
        add_to_leaderboard(session)
    
    return {
        "message": "Session ended",
        "final_score": session.score,
        "stats": get_session_stats(session_id)
    }

def add_to_leaderboard(session: GameSession):
    """Add completed session to leaderboard"""
    total_answered = len(session.answers)
    accuracy = (session.correct_answers / total_answered * 100) if total_answered > 0 else 0
    
    entry = LeaderboardEntry(
        player_name=session.player_name,
        game_type=session.game_type,
        score=session.score,
        questions_answered=total_answered,
        accuracy=accuracy,
        completed_at=session.ended_at or datetime.utcnow()
    )
    
    leaderboard.append(entry)
    
    # Keep only top 100 entries
    leaderboard.sort(key=lambda x: x.score, reverse=True)
    if len(leaderboard) > 100:
        leaderboard.pop()

if __name__ == "__main__":
    print("🚀 Starting Educational Game API Server...")
    print("📚 Games supported: Subway Surfers, Mario, Pac-Man, Squid Game")
    print("🎯 API Documentation: http://localhost:8000/docs")
    print("💡 Health Check: http://localhost:8000/health")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")