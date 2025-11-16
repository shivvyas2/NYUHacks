"""
Pydantic schemas for request/response validation
"""

from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime

# Authentication Schemas
class UserSignup(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# Game Schemas
class QuestionAttempt(BaseModel):
    questionId: int
    topic: str
    difficulty: str
    isCorrect: bool
    timeSpent: int

class TopicPerformance(BaseModel):
    correct: int
    total: int
    accuracy: float

class GameAnalytics(BaseModel):
    gameId: str
    score: int
    accuracy: float
    correctAnswers: int
    wrongAnswers: int
    questionAttempts: List[QuestionAttempt]
    topicPerformance: Dict[str, TopicPerformance]
    streakInfo: dict
    averageResponseTime: int

class SaveScoreRequest(BaseModel):
    gameId: str
    analytics: GameAnalytics

class SaveScoreResponse(BaseModel):
    success: bool
    sessionId: str

# Statistics Schemas
class UserStatsResponse(BaseModel):
    total_games_played: int
    total_score: int
    total_questions_answered: int
    total_correct: int
    total_wrong: int
    overall_accuracy: float
    favorite_game: Optional[str]
    weak_topics: List[str]
    strong_topics: List[str]
    updated_at: str

class GameSessionResponse(BaseModel):
    id: str
    game_id: str
    score: int
    accuracy: float
    correct_answers: int
    wrong_answers: int
    max_streak: int
    created_at: str

# Question Bank Schemas
class Question(BaseModel):
    id: int
    question: str
    options: List[str]
    correctAnswer: int
    topic: str
    difficulty: str
    explanation: str

class QuestionResponse(BaseModel):
    questions: List[Question]
    total: int

