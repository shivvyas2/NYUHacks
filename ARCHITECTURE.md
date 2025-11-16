# SAT Learning Arcade - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                      (Next.js + Three.js)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Zombie     │  │  Whack-A-    │  │   Balloon    │     │
│  │ Apocalypse   │  │     Mole     │  │     Pop      │     │
│  │   (3D FPS)   │  │  (3D Action) │  │ (3D Shooter) │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │              │
│         └─────────────────┴─────────────────┘              │
│                           │                                │
│                    ┌──────▼───────┐                        │
│                    │  Game State  │                        │
│                    │  Management  │                        │
│                    └──────┬───────┘                        │
│                           │                                │
└───────────────────────────┼────────────────────────────────┘
                            │ HTTP/REST API
                            │
┌───────────────────────────▼────────────────────────────────┐
│                        BACKEND                             │
│                    (FastAPI + Python)                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │              AI LEARNING AGENT                     │   │
│  │            (Claude Haiku 4.5)                      │   │
│  ├────────────────────────────────────────────────────┤   │
│  │                                                    │   │
│  │  1. Performance Analyzer                          │   │
│  │     - Tracks accuracy per topic                   │   │
│  │     - Identifies weak areas (<60%)                │   │
│  │     - Identifies strong areas (>80%)              │   │
│  │                                                    │   │
│  │  2. Context & Memory System                       │   │
│  │     - Stores all question attempts                │   │
│  │     - Maintains learning history                  │   │
│  │     - Builds student profile over time            │   │
│  │                                                    │   │
│  │  3. Adaptive Question Generator                   │   │
│  │     - 60% focus on weak topics                    │   │
│  │     - 30% exploratory/mixed topics                │   │
│  │     - 10% challenging strong topics               │   │
│  │                                                    │   │
│  │  4. Insights Engine                               │   │
│  │     - Study recommendations                       │   │
│  │     - Motivational feedback                       │   │
│  │     - Next milestone suggestions                  │   │
│  │                                                    │   │
│  └────────────────┬───────────────────────────────────┘   │
│                   │                                        │
│         ┌─────────▼─────────┐                             │
│         │   SUPABASE         │                             │
│         │  (PostgreSQL +     │                             │
│         │   Auth + pgvector) │                             │
│         ├────────────────────┤                             │
│         │ • Users (Auth)     │                             │
│         │ • game_sessions    │                             │
│         │ • question_attempts│                             │
│         │ • user_stats       │                             │
│         └────────────────────┘                             │
│                                                            │
└────────────────────────────────────────────────────────────┘
                     │
                     │ API Request
                     ▼
         ┌───────────────────────┐
         │   OpenRouter API      │
         │  (Claude Haiku 4.5)   │
         └───────────────────────┘
```

## 🔄 Data Flow

### Game Session Flow

```
GAME 1 (First Time User):
═══════════════════════════════════════════════════════════
1. USER CLICKS "START GAME"
   ├─> Backend: Fetch questions (POST /questions)
   │   ├─> Agent: Analyze history (no history yet!)
   │   ├─> Agent: Generate 50 RANDOM/MIXED questions
   │   └─> Return: Questions covering all topics
   └─> Frontend: Load questions, start game

2. USER PLAYS GAME
   ├─> Frontend: Track each question attempt
   │   ├─> Question ID, topic, difficulty
   │   ├─> Is answer correct?
   │   ├─> Time spent on question
   │   └─> Current streak
   └─> Frontend: Update score, health, ammo

3. GAME ENDS
   ├─> Frontend: Compile session statistics
   ├─> Backend: Submit results (POST /game-results)
   │   ├─> Save GameSession record
   │   ├─> Save 50 QuestionAttempt records
   │   ├─> Update UserTopicPerformance
   │   │   Example: Algebra 40%, Geometry 80%, Grammar 70%
   │   └─> ⭐ Agent memory NOW HAS DATA!
   └─> Frontend: Show game over modal

GAME 2 (Agent Has Learned!):
═══════════════════════════════════════════════════════════
4. USER CLICKS "PLAY AGAIN"
   ├─> Backend: Fetch questions (POST /questions)
   │   ├─> Agent: Analyze history (now we have data!)
   │   │   - "User weak in Algebra (40%)"
   │   │   - "User strong in Geometry (80%)"
   │   ├─> Agent: Calculate distribution
   │   │   - 30 Algebra questions (60%)
   │   │   - 15 mixed questions (30%)
   │   │   - 5 hard Geometry questions (10%)
   │   ├─> OpenRouter: Generate PERSONALIZED questions
   │   └─> Return: 50 questions tailored to weak topics!
   └─> Frontend: Load personalized questions

5. USER PLAYS GAME (with better questions!)
   └─> Notice: Way more Algebra questions!

6. GAME ENDS
   ├─> Submit results
   └─> Agent learns even more!

7. GAME 3, 4, 5... (Agent keeps improving!)
   └─> Questions get smarter every time!
```

## 🧠 AI Agent Decision Making

### Topic Distribution Algorithm

```python
# Agent analyzes user performance
weak_topics = [topic for topic in user_topics if accuracy < 60%]
strong_topics = [topic for topic in user_topics if accuracy > 80%]

# For 50 questions:
- 30 questions (60%) → Focus on weak_topics
- 15 questions (30%) → Mixed/exploratory topics
- 5 questions (10%) → Challenge on strong_topics

# Difficulty adjustment
if overall_accuracy < 50%:
    difficulty = "easy"
elif overall_accuracy > 75%:
    difficulty = "hard"
else:
    difficulty = "medium"
```

### Memory & Context

```python
# Each question attempt stores:
{
  "question_id": 42,
  "topic": "Algebra",
  "difficulty": "medium",
  "is_correct": True,
  "time_spent": 15.5,
  "timestamp": "2024-11-16T..."
}

# Agent builds context:
- "Student weak in Geometry (45% accuracy)"
- "Student strong in Grammar (85% accuracy)"
- "Recent trend: improving in Algebra"
- "Recommended: 20 more geometry problems"
```

## 🎮 Game Architecture

### Three.js Game Engine Structure

```typescript
class ZombieGame {
  // Core Three.js
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  
  // Game State
  zombies: Zombie[]
  bullets: Bullet[]
  currentQuestion: SATQuestion
  
  // Player State
  health: number
  score: number
  streak: number
  
  // Game Loop
  init() → Setup scene, lights, objects
  update(deltaTime) → Move zombies, bullets, check collisions
  render() → Draw frame
  
  // Input Handling
  handleMouseMove() → FPS camera look
  handleKeyboard() → WASD movement
  handleClick() → Shoot bullets
  
  // Game Logic
  spawnZombies() → Create zombies with answer labels
  checkHit() → Raycasting for bullet hits
  updateScore() → Track correct/wrong answers
}
```

## 🔐 Security & Privacy

### Data Stored
- ✅ **Username** (no password, simple demo)
- ✅ **Game statistics** (score, accuracy, etc.)
- ✅ **Question performance** (anonymized)
- ❌ **No personal information**
- ❌ **No email or payment data**

### API Security
- CORS enabled for localhost development
- Can add JWT tokens for production
- Rate limiting on question generation
- Input validation with Pydantic

## 📊 Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
├─────────────┤
│ id (PK)     │
│ username    │
│ created_at  │
└──────┬──────┘
       │ 1
       │
       │ N
┌──────▼──────────┐       ┌─────────────────────┐
│  GameSession    │       │ UserTopicPerformance│
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │       │ id (PK)             │
│ user_id (FK)    │       │ user_id (FK)        │
│ game_type       │       │ topic               │
│ score           │       │ total_attempts      │
│ accuracy        │       │ correct_attempts    │
│ max_streak      │       │ accuracy            │
└────────┬────────┘       │ avg_time            │
         │ 1              └─────────────────────┘
         │                         ▲
         │ N                       │
┌────────▼────────┐                │
│ QuestionAttempt │────────────────┘
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ session_id (FK) │
│ question_id     │
│ topic           │
│ difficulty      │
│ is_correct      │
│ time_spent      │
└─────────────────┘
```

## 🚀 Deployment Architecture (Future)

```
┌──────────────┐
│   Vercel     │  ← Frontend (Next.js)
└──────┬───────┘
       │ HTTPS
       │
┌──────▼───────┐
│  Supabase    │  ← Backend Database + Auth
└──────┬───────┘
       │
┌──────▼───────┐
│  OpenRouter  │  ← AI Agent (Claude Haiku 4.5)
└──────────────┘
```

## 🎯 Performance Optimizations

### Frontend
- Dynamic imports for Three.js (code splitting)
- WebGL for 3D rendering
- Request animation frame for smooth 60fps
- Efficient collision detection
- Object pooling for bullets/zombies

### Backend
- Supabase connection pooling
- Database indexes on user_id and topic
- Response caching for user stats
- Async/await for AI calls
- DuckDuckGo search with retry logic

## 📈 Metrics & Analytics

### What We Track
1. **User Metrics**
   - Total questions attempted
   - Overall accuracy
   - Average time per question
   - Longest streak

2. **Topic Metrics**
   - Accuracy per SAT topic
   - Most improved topic
   - Weakest topic
   - Topic coverage

3. **Game Metrics**
   - Games played per type
   - Average score per game
   - Session duration
   - Completion rate

4. **AI Metrics**
   - Question generation time
   - Question quality (user feedback)
   - Adaptation effectiveness
   - Context relevance

## 🔮 Future Enhancements

### Multi-Agent System
```
┌─────────────────┐
│ Question Gen    │  → Generates SAT questions
│ Agent           │
└─────────────────┘

┌─────────────────┐
│ Tutor Agent     │  → Explains wrong answers
└─────────────────┘

┌─────────────────┐
│ Motivator Agent │  → Provides encouragement
└─────────────────┘

┌─────────────────┐
│ Strategy Agent  │  → Plans study schedule
└─────────────────┘
```

### Vector Database for Semantic Memory (pgvector)
```
Supabase pgvector for embeddings:
- Question patterns (similar mistakes)
- Learning style identification
- Find questions user struggles with
- Semantic search for related topics
- Long-term memory across sessions
```

---

**Built with ❤️ for NYU Hacks 2025**

