# Developer Guide

Complete guide for local development, testing, and troubleshooting NYU Hacks Arcade.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Testing](#testing)
3. [Troubleshooting](#troubleshooting)
4. [Common Issues](#common-issues)

## Local Development Setup

### Prerequisites

- **Node.js 18+** - For the frontend
- **Python 3.8+** - For the backend
- **Supabase Account** - For authentication and database

### Quick Start

**Option 1: Using the Startup Script (Recommended)**
```bash
# Make the script executable (first time only)
chmod +x start_local.sh

# Run both frontend and backend
./start_local.sh
```

**Option 2: Manual Setup**

#### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create a `.env` file:**
   ```bash
   touch .env
   ```

3. **Add your Supabase credentials to `.env`:**
   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   # OR use anon key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Run the backend:**
   ```bash
   ./run.sh
   # OR
   python3 src/main.py
   ```

   The backend will start on `http://localhost:8000`
   - API docs: `http://localhost:8000/docs`
   - Health check: `http://localhost:8000/api/health`

#### Frontend Setup

1. **Open a new terminal and navigate to frontend:**
   ```bash
   cd frontend
   ```

2. **Install dependencies (first time only):**
   ```bash
   npm install
   ```

3. **Create a `.env.local` file (optional - defaults to localhost:8000):**
   ```bash
   touch .env.local
   ```

4. **Add environment variables to `.env.local` (optional):**
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run the frontend:**
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:3000`

### Verification

1. **Backend is running:**
   - Visit: `http://localhost:8000` - Should show API info
   - Visit: `http://localhost:8000/docs` - Should show Swagger UI

2. **Frontend is running:**
   - Visit: `http://localhost:3000` - Should show the app
   - Check browser console - Should not have CORS errors

3. **Test authentication:**
   - Go to `http://localhost:3000/signup`
   - Create an account
   - Try logging in

## Testing

### Prerequisites

1. ✅ Supabase project created
2. ✅ Database schema run (from `backend/database/schema.sql`)
3. ✅ Environment variables configured in both:
   - `backend/.env`
   - `frontend/.env.local`

### Test Authentication Flow

#### Test Signup
1. Navigate to `http://localhost:3000/signup`
2. Fill in:
   - Email: `test@example.com`
   - Password: `test123456` (min 6 characters)
   - Confirm Password: `test123456`
3. Click "SIGN UP"
4. **Expected:** Success message, then redirect to login page (or dashboard if email confirmation is disabled)

#### Test Login
1. Navigate to `http://localhost:3000/login`
2. Enter your credentials:
   - Email: `test@example.com`
   - Password: `test123456`
3. Click "LOGIN"
4. **Expected:** Redirect to dashboard or home page

#### Verify Authentication State
1. On the home page, check the top right corner
2. **Expected:** You should see "📊 Stats" and "Logout" buttons (not "Login")

### Test Protected Routes

#### Test Game Access (Authenticated)
1. While logged in, click on any game (e.g., "SAT Whack-A-Mole")
2. **Expected:** Game should load and start playing

#### Test Game Access (Unauthenticated)
1. Click "Logout" button
2. Try to access a game directly: `http://localhost:3000/games/whackamole`
3. **Expected:** Redirect to `/login` page with redirect parameter (if middleware is enabled)

### Test Score Saving

#### Play a Game
1. Log in again
2. Start a game (e.g., "SAT Whack-A-Mole" or "SAT Balloon Pop")
3. Answer some questions
4. Complete the game (or let it end)

#### Verify Score Saved
1. Check the browser console (F12 → Console tab)
2. **Expected:** No errors about saving scores
3. Check the game over modal
4. **Expected:** Should show "✅ Score saved! Check your stats to see your progress"

#### Check Database
1. Go to Supabase Dashboard → Table Editor
2. Check `game_sessions` table
3. **Expected:** Should see a new row with your game session data
4. Check `question_attempts` table
5. **Expected:** Should see rows for each question you answered
6. Check `user_stats` table
7. **Expected:** Should see your user stats with updated totals

### Test Statistics Page

#### Access Stats Page
1. Click "📊 Stats" button on home page
2. Or navigate to `http://localhost:3000/stats`
3. **Expected:** Should load your statistics page

#### Verify Stats Display
**Expected to see:**
- Total games played
- Overall accuracy
- Total score
- Total questions answered
- Weak topics (if any)
- Strong topics (if any)
- Recent game sessions list

### Test API Endpoint Directly

#### Get Your Auth Token
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Find Local Storage → `auth_token`
4. Copy the token value

#### Test API with curl
```bash
# Replace YOUR_TOKEN with actual token from localStorage
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** `{"id":"...","email":"test@example.com"}`

### Quick Test Checklist

- [ ] Frontend server starts without errors
- [ ] Backend server starts without errors
- [ ] Can sign up new user
- [ ] Can log in with credentials
- [ ] Home page shows auth buttons correctly
- [ ] Can access games when logged in
- [ ] Can play a game and complete it
- [ ] Game over modal shows "Score saved" message
- [ ] Database has new game_session entry
- [ ] Database has question_attempt entries
- [ ] Database has/updated user_stats entry
- [ ] Stats page loads and shows data
- [ ] No console errors
- [ ] API endpoints return success

## Troubleshooting

### CORS Errors

If you're seeing CORS errors like:
- "Fetch API cannot load http://localhost:8000/api/auth/me due to access control checks"
- "Preflight response is not successful"

#### Solution 1: Check if FastAPI server is running
```bash
cd backend
./check_server.sh
```

Or manually:
```bash
curl http://localhost:8000/
```

#### Solution 2: Restart FastAPI server
After making CORS changes, restart the server:
```bash
cd backend
# Stop the server (Ctrl+C)
./run.sh
```

#### Solution 3: Verify frontend environment variables
Make sure `frontend/.env.local` has:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then restart the Next.js dev server:
```bash
cd frontend
npm run dev
```

#### Solution 4: Check browser console
Open browser DevTools (F12) → Network tab:
- Look for failed requests
- Check if OPTIONS preflight requests are returning 200
- Verify the request URL is correct

### Connection Errors

If you see "Could not connect to the server":

1. **Check if FastAPI is running:**
   ```bash
   lsof -ti:8000
   ```
   Should return a process ID

2. **Start FastAPI server:**
   ```bash
   cd backend
   ./run.sh
   ```

3. **Check firewall/port blocking:**
   - Make sure port 8000 is not blocked
   - Try accessing http://localhost:8000 in browser

### Authentication Errors

If authentication is not working:

1. **Check Supabase credentials:**
   - Verify `backend/.env` has correct Supabase URL and keys
   - Test Supabase connection: `curl http://localhost:8000/api/health`

2. **Check token storage:**
   - Open browser DevTools → Application → Local Storage
   - Verify `auth_token` is stored after login

3. **Check API client:**
   - Verify `frontend/lib/api/client.ts` is using correct base URL
   - Check browser console for API errors

### Port Already in Use

**Port 8000 (Backend):**
```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process or change port in src/main.py
```

**Port 3000 (Frontend):**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process or use different port
PORT=3001 npm run dev
```

## Common Issues

### Issue: "ModuleNotFoundError: No module named 'fastapi'"
**Solution:** Install dependencies:
```bash
cd backend
python3 -m pip install -r requirements.txt
```

### Issue: "ImportError: cannot import name 'auth'"
**Solution:** Make sure you're running from the backend directory:
```bash
cd backend
python3 src/main.py
```

### Issue: "Supabase URL and Key are required"
**Solution:** Set environment variables in `backend/.env`:
```env
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
```

### Issue: Frontend can't connect to backend
**Solution:** 
1. Verify backend is running on port 8000
2. Check `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8000`
3. Restart Next.js dev server after changing .env.local

### Issue: "Unauthorized" errors
**Solution:**
- Check that `.env.local` has correct Supabase URL and anon key
- Verify user is logged in
- Check browser localStorage for auth token

### Issue: Scores not saving
**Solution:**
- Check browser console for errors
- Verify database schema was run correctly
- Check Supabase logs for database errors
- Ensure RLS policies are set up correctly

### Issue: Can't access games
**Solution:**
- Verify middleware is working (check `frontend/middleware.ts`)
- Check that user is authenticated
- Try logging out and back in

### Issue: Stats page shows no data
**Solution:**
- Play at least one game first
- Check database tables directly in Supabase
- Verify user_stats table has data for your user_id

### Issue: Database connection errors
**Solution:**
- Verify Supabase URL is correct (no trailing slash)
- Check that service role key is correct
- Ensure database is active in Supabase

### Issue: Python/pip not found
**Solution:**
1. Make sure Python 3.8+ is installed: `python3 --version`
2. Use `python3` and `pip3` explicitly
3. Or create a virtual environment: `python3 -m venv venv`

### Issue: Dependencies installation fails
**Solution:**
- Make sure you're using the correct Python version
- Try upgrading pip: `pip install --upgrade pip`
- Use virtual environment to avoid conflicts

### Issue: Module not found errors (Frontend)
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Quick Health Check

Run this to check everything:

```bash
# Check backend
cd backend
./check_server.sh

# Check frontend
cd ../frontend
curl http://localhost:3000 2>/dev/null | head -5 || echo "Frontend not running"
```

## Still Having Issues?

1. Check server logs in the terminal where FastAPI is running
2. Check browser console for detailed error messages
3. Verify all environment variables are set correctly
4. Make sure both servers are running:
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000
5. Check Supabase dashboard for database errors
6. Review the [Deployment Guide](DEPLOYMENT.md) for production-specific issues

## Development Tips

### Running Backend with Auto-reload
```bash
cd backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Running Frontend with Different Port
```bash
cd frontend
PORT=3001 npm run dev
```

### Viewing API Documentation
Once backend is running:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Database Setup
Make sure you've run the database schema in Supabase:
1. Go to Supabase Dashboard → SQL Editor
2. Run `backend/database/schema.sql`
3. Verify tables are created

