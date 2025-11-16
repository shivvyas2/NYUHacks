# Testing Guide - Backend & Frontend Integration

This guide will help you test if both backend and frontend are working together correctly.

## Prerequisites

1. ✅ Supabase project created
2. ✅ Database schema run (from `backend/database/schema.sql`)
3. ✅ Environment variables configured in both:
   - `backend/.env`
   - `frontend/.env.local`

## Step 1: Start the Frontend Server

```bash
cd frontend
npm run dev
```

The server should start on `http://localhost:3000`

## Step 2: Test Authentication Flow

### 2.1 Test Signup
1. Navigate to `http://localhost:3000/signup`
2. Fill in:
   - Email: `test@example.com`
   - Password: `test123456` (min 6 characters)
   - Confirm Password: `test123456`
3. Click "SIGN UP"
4. **Expected:** Success message, then redirect to login page

### 2.2 Test Login
1. Navigate to `http://localhost:3000/login`
2. Enter your credentials:
   - Email: `test@example.com`
   - Password: `test123456`
3. Click "LOGIN"
4. **Expected:** Redirect to home page (`/`)

### 2.3 Verify Authentication State
1. On the home page, check the top right corner
2. **Expected:** You should see "📊 Stats" and "Logout" buttons (not "Login")

## Step 3: Test Protected Routes

### 3.1 Test Game Access (Authenticated)
1. While logged in, click on any game (e.g., "SAT Whack-A-Mole")
2. **Expected:** Game should load and start playing

### 3.2 Test Game Access (Unauthenticated)
1. Click "Logout" button
2. Try to access a game directly: `http://localhost:3000/games/whackamole`
3. **Expected:** Redirect to `/login` page with redirect parameter

## Step 4: Test Score Saving

### 4.1 Play a Game
1. Log in again
2. Start a game (e.g., "SAT Whack-A-Mole" or "SAT Balloon Pop")
3. Answer some questions
4. Complete the game (or let it end)

### 4.2 Verify Score Saved
1. Check the browser console (F12 → Console tab)
2. **Expected:** No errors about saving scores
3. Check the game over modal
4. **Expected:** Should show "✅ Score saved! Check your stats to see your progress"

### 4.3 Check Database
1. Go to Supabase Dashboard → Table Editor
2. Check `game_sessions` table
3. **Expected:** Should see a new row with your game session data
4. Check `question_attempts` table
5. **Expected:** Should see rows for each question you answered
6. Check `user_stats` table
7. **Expected:** Should see your user stats with updated totals

## Step 5: Test Statistics Page

### 5.1 Access Stats Page
1. Click "📊 Stats" button on home page
2. Or navigate to `http://localhost:3000/stats`
3. **Expected:** Should load your statistics page

### 5.2 Verify Stats Display
**Expected to see:**
- Total games played
- Overall accuracy
- Total score
- Total questions answered
- Weak topics (if any)
- Strong topics (if any)
- Recent game sessions list

## Step 6: Test API Endpoint Directly

### 6.1 Get Your Auth Token
1. Open browser DevTools (F12)
2. Go to Application/Storage tab
3. Find Cookies → `localhost`
4. Look for Supabase auth token

### 6.2 Test API with curl (Optional)
```bash
# Replace YOUR_TOKEN with actual token from cookies
curl -X POST http://localhost:3000/api/games/save-score \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "gameId": "whackamole",
    "analytics": {
      "gameId": "whackamole",
      "score": 1000,
      "accuracy": 0.75,
      "correctAnswers": 3,
      "wrongAnswers": 1,
      "questionAttempts": [],
      "topicPerformance": {},
      "streakInfo": { "maxStreak": 2 },
      "averageResponseTime": 5000
    }
  }'
```

**Expected:** `{"success":true,"sessionId":"..."}`

## Step 7: Check for Errors

### 7.1 Browser Console
1. Open DevTools (F12) → Console tab
2. **Expected:** No red errors
3. Look for any Supabase connection errors

### 7.2 Network Tab
1. Open DevTools (F12) → Network tab
2. Filter by "Fetch/XHR"
3. Look for `/api/games/save-score` request
4. **Expected:** Status 200 (success)

### 7.3 Supabase Dashboard
1. Go to Supabase Dashboard → Logs
2. Check for any database errors
3. **Expected:** No errors related to your operations

## Common Issues & Solutions

### Issue: "Unauthorized" errors
**Solution:**
- Check that `.env.local` has correct Supabase URL and anon key
- Verify user is logged in
- Check browser cookies for auth token

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
- Check that anon key is correct
- Ensure database is active in Supabase

## Quick Test Checklist

- [ ] Frontend server starts without errors
- [ ] Can sign up new user
- [ ] Can log in with credentials
- [ ] Home page shows auth buttons correctly
- [ ] Can access games when logged in
- [ ] Cannot access games when logged out (redirects to login)
- [ ] Can play a game and complete it
- [ ] Game over modal shows "Score saved" message
- [ ] Database has new game_session entry
- [ ] Database has question_attempt entries
- [ ] Database has/updated user_stats entry
- [ ] Stats page loads and shows data
- [ ] No console errors
- [ ] API endpoint returns success

## Automated Testing (Future)

Consider adding:
- Unit tests for services
- Integration tests for API routes
- E2E tests with Playwright/Cypress

