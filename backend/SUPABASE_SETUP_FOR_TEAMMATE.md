# Supabase Setup Guide 🚀

Hey teammate! The AI agent backend is **already coded and ready** - just needs your Supabase credentials.

## What You Need to Do

### 1️⃣ Get Supabase Credentials

Go to your Supabase project → **Settings** → **API**

You need:
- **Project URL**: `https://xxxxx.supabase.co`
- **anon (public) key**: `eyJhbGc...` 
- **service_role key**: `eyJhbGc...` (⚠️ Secret! Don't commit!)

### 2️⃣ Update `.env` File

Add to `backend/.env`:

```bash
# OpenRouter (for AI agent)
OPENROUTER_API_KEY=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

# Supabase - Frontend (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase - Backend (Python)
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...  # ← Use service_role key here!
```

**Note**: `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` should be the **same value**, just different variable names for frontend vs backend.

### 3️⃣ Run Database Schema (if needed)

If tables don't exist yet, run this SQL in Supabase SQL Editor:

```sql
-- Game sessions
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  game_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  accuracy DECIMAL,
  correct_answers INTEGER,
  wrong_answers INTEGER,
  max_streak INTEGER,
  avg_response_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Question attempts
CREATE TABLE IF NOT EXISTS question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  session_id UUID REFERENCES game_sessions(id),
  question_id INTEGER,
  topic TEXT,
  difficulty TEXT,
  is_correct BOOLEAN,
  time_spent INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User stats
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  topic TEXT NOT NULL,
  total_attempts INTEGER DEFAULT 0,
  correct_attempts INTEGER DEFAULT 0,
  accuracy DECIMAL,
  avg_time INTEGER,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, topic)
);

-- Enable RLS (Row Level Security)
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Policies (users can only see their own data)
CREATE POLICY "Users can view own sessions" ON game_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own attempts" ON question_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON question_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON user_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own stats" ON user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own stats" ON user_stats FOR UPDATE USING (auth.uid() = user_id);
```

### 4️⃣ Test It

```bash
cd backend
source venv/bin/activate
python quick_test.py
```

Should see:
- ✅ Supabase client initialized
- ✅ Generated X questions!
- ✅ Agent is working!

## That's It! 🎉

The code is already written to:
- ✅ Read user performance from Supabase
- ✅ Generate personalized questions with Claude Haiku 4.5
- ✅ Save game results back to Supabase
- ✅ Track topic performance over time

You just needed to add the credentials!

## Questions?

Ping your teammate or check `backend/README.md` for more details.

