# Supabase Setup Guide

This guide will help you set up Supabase authentication and database for the NYU Hacks Arcade application.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - Name: `nyuhacks-arcade` (or any name you prefer)
   - Database Password: Choose a strong password
   - Region: Choose the closest region to your users
4. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 3: Set Up Environment Variables

1. In the `frontend` directory, create a `.env.local` file:
   ```bash
   cd frontend
   touch .env.local
   ```

2. Add the following to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

   Replace `your_project_url_here` and `your_anon_key_here` with the values you copied from Step 2.

## Step 4: Set Up the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `backend/database/schema.sql` into the editor
4. Click "Run" to execute the SQL

This will create:
- `game_sessions` table - stores each game session with scores
- `question_attempts` table - stores individual question attempts
- `user_stats` table - stores aggregated user statistics
- Row Level Security (RLS) policies to ensure users can only access their own data

## Step 5: Verify Setup

1. Start your development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
3. You should see a "Login" button in the top right
4. Try creating an account at `/signup`
5. After signing up, you should be redirected to the home page
6. Try accessing a game - you should be redirected to login if not authenticated

## Features

### Authentication
- **Login Page** (`/login`) - Users can log in with email and password
- **Signup Page** (`/signup`) - New users can create accounts
- **Protected Routes** - Game routes require authentication
- **Session Management** - Automatic session handling via middleware

### Score Tracking
- Game scores are automatically saved when a game ends
- Question attempts are tracked with:
  - Topic (SAT section)
  - Difficulty level
  - Correctness
  - Response time

### Statistics Dashboard
- **Stats Page** (`/stats`) - View your:
  - Total games played
  - Overall accuracy
  - Total score
  - Weak topics (need practice)
  - Strong topics (doing well)
  - Recent game sessions

## Database Schema

### game_sessions
Stores each completed game session:
- `user_id` - Reference to the user
- `game_id` - Which game was played
- `score` - Final score
- `accuracy` - Percentage of correct answers
- `correct_answers` / `wrong_answers` - Counts
- `max_streak` - Longest streak of correct answers
- `average_response_time` - Average time per question

### question_attempts
Stores individual question attempts:
- `session_id` - Reference to the game session
- `question_id` - The question that was answered
- `topic` - SAT topic/section
- `difficulty` - easy/medium/hard
- `is_correct` - Whether the answer was correct
- `time_spent` - Time taken in milliseconds

### user_stats
Aggregated statistics per user:
- `total_games_played` - Total number of games
- `total_score` - Sum of all scores
- `total_questions_answered` - Total questions attempted
- `total_correct` / `total_wrong` - Overall counts
- `overall_accuracy` - Overall accuracy percentage
- `weak_topics` - Array of topics with < 50% accuracy
- `strong_topics` - Array of topics with ≥ 80% accuracy

## Security

All tables use Row Level Security (RLS) to ensure:
- Users can only view their own data
- Users can only insert/update their own data
- No user can access another user's statistics

## Troubleshooting

### "Unauthorized" errors
- Make sure your `.env.local` file has the correct Supabase URL and anon key
- Verify that RLS policies were created correctly in the database

### Scores not saving
- Check the browser console for errors
- Verify that the user is authenticated (check if they can see the Stats page)
- Check the Supabase dashboard → Logs for any database errors

### Authentication not working
- Make sure middleware is running (check `frontend/middleware.ts`)
- Verify that the Supabase project has authentication enabled
- Check that email confirmation is set up correctly in Supabase settings

## Next Steps

- Customize the authentication flow (password reset, email verification)
- Add more analytics and statistics
- Implement leaderboards
- Add social features (compare with friends)

