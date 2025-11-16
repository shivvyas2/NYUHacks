# SAT Learning Arcade 🎮🎓

**AI-powered gamified SAT prep** with adaptive questions! Play epic 3D games while an intelligent agent learns your weaknesses and personalizes your practice.

## 🎯 What Makes This Special?

- **🤖 AI Agent with Memory**: Uses Claude Haiku 4.5 to analyze performance & generate personalized questions
- **🎮 Epic 3D Games**: Zombie FPS, Whack-A-Mole, Balloon Pop - all educational!
- **📊 Adaptive Learning**: 60-30-10 strategy (60% weak topics, 30% mixed, 10% challenge)
- **🗄️ Supabase Backend**: Real-time database + auth ready
- **🔍 Web-Enhanced**: DuckDuckGo search for real SAT questions

## 🎮 Games

### **SAT Zombie Apocalypse** 🧟
First-person 3D shooter! Zombies labeled A/B/C/D - shoot the correct answer before they reach you!
- WASD movement, mouse aim, click to shoot
- Post-apocalyptic environment with boxes and barrels
- 60-second rounds with countdown timer

### **SAT Whack-A-Mole** 🔨
Whack the mole with the right answer before time runs out!
- 3D game board with 9 holes
- Fast-paced arcade action
- 60 seconds to answer as many as possible

### **SAT Balloon Pop** 🎈
Carnival shooter! Pop the balloon with the correct answer!
- 3D balloons floating in a carnival scene
- 3 shots per question
- Colorful and engaging

## 🚀 Quick Start

### Frontend (Games)

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

### Backend (AI Agent)

```bash
cd backend
./setup.sh   # Creates venv, installs deps
source venv/bin/activate

# Setup .env file (required!)
cat > .env << EOF
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...
EOF

# Test agent
python test_supabase_agent.py

# Run API (optional)
python main.py
```

Get OpenRouter key: https://openrouter.ai/keys  
Supabase setup: See `backend/README.md`

## 🛠️ Tech Stack

### Frontend
- Next.js 14 (App Router)
- Three.js (3D game engine)
- TypeScript
- Tailwind CSS

### Backend
- FastAPI (Python web framework)
- Supabase (PostgreSQL + Auth + pgvector)
- Claude Haiku 4.5 via OpenRouter (~$0.003 per 50 questions!)
- DuckDuckGo search (real SAT questions)

## 🧠 How the AI Agent Works

```
Flow:

1. BEFORE GAME: Agent analyzes Supabase data
   → Identifies weak topics (<60% accuracy)
   → Calculates recommended difficulty

2. BEFORE GAME: Claude Haiku 4.5 generates 50 questions
   → 60% focus on weak topics
   → 30% mixed/exploratory
   → 10% hard questions on strong topics

3. DURING GAME: User plays with personalized questions
   → Frontend tracks attempts
   → Records correct/wrong answers

4. AFTER GAME: Results saved to Supabase
   → Agent updates topic performance
   → Learns from this session

5. NEXT GAME: Agent generates EVEN BETTER questions
   → Cycle repeats - continuous improvement!
```

### Key Features

✅ **Adaptive Learning**: Questions adjust to your skill level  
✅ **Memory**: Tracks performance across all sessions  
✅ **Context-Aware**: Understands your learning journey  
✅ **Cost-Effective**: Haiku 4.5 is ~100x cheaper than GPT-4!  
✅ **Real Questions**: DuckDuckGo search finds actual SAT content

## 📁 Project Structure

```
├── frontend/
│   ├── app/                    # Next.js pages
│   ├── components/             # React components
│   ├── games/
│   │   ├── zombie/            # FPS shooter
│   │   ├── whackamole/        # Whack-A-Mole
│   │   └── carnival/          # Balloon Pop
│   └── lib/                   # Utilities
│
└── backend/
    ├── agent.py               # AI learning agent
    ├── supabase_client.py     # Supabase operations
    ├── config.py              # Environment config
    └── test_supabase_agent.py # Test script
```

## 🎯 Hackathon Demo Strategy

### 1. The Hook (30 sec)
"AI agent that learns your SAT weaknesses and generates personalized questions - while you shoot zombies!"

### 2. Show Games (1 min)
- Play zombie shooter, get some wrong on purpose
- Show 3D graphics and gameplay

### 3. Reveal the Magic (1 min)
- Backend dashboard: "AI noticed I'm weak in Algebra!"
- Generated 30 algebra questions for next round
- Play again - see more algebra zombies!

### 4. Show the Tech (30 sec)
- Claude Haiku 4.5 for AI reasoning
- Supabase for real-time data
- DuckDuckGo for authentic SAT questions

### 5. Impact (30 sec)
- Makes SAT prep fun
- Personalized learning for everyone
- Cost-effective scaling

## 🚀 Future Features

- [ ] Frontend ↔ Backend integration (API calls)
- [ ] Supabase Auth for user login
- [ ] Vector embeddings (semantic memory with pgvector)
- [ ] Insights dashboard
- [ ] Spaced repetition algorithm
- [ ] Multiplayer mode
- [ ] Mobile app

## 📚 Documentation

- [Backend README](backend/README.md) - AI agent details
- [Frontend README](frontend/README.md) - Game architecture
- [ARCHITECTURE.md](ARCHITECTURE.md) - System design

## 👥 Team

Built for **NYU Hacks 2025**! 🎓

---

**License**: MIT
