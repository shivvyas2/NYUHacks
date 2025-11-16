# Troubleshooting Guide

## CORS Errors

If you're seeing CORS errors like:
- "Fetch API cannot load http://localhost:8000/api/auth/me due to access control checks"
- "Preflight response is not successful"

### Solution 1: Check if FastAPI server is running

```bash
cd backend
./check_server.sh
```

Or manually:
```bash
curl http://localhost:8000/
```

### Solution 2: Restart FastAPI server

After making CORS changes, restart the server:

```bash
cd backend
# Stop the server (Ctrl+C)
./start.sh
```

### Solution 3: Verify frontend environment variables

Make sure `frontend/.env.local` has:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then restart the Next.js dev server:
```bash
cd frontend
npm run dev
```

### Solution 4: Check browser console

Open browser DevTools (F12) → Network tab:
- Look for failed requests
- Check if OPTIONS preflight requests are returning 200
- Verify the request URL is correct

## Connection Errors

If you see "Could not connect to the server":

1. **Check if FastAPI is running:**
   ```bash
   lsof -ti:8000
   ```
   Should return a process ID

2. **Start FastAPI server:**
   ```bash
   cd backend
   ./start.sh
   ```

3. **Check firewall/port blocking:**
   - Make sure port 8000 is not blocked
   - Try accessing http://localhost:8000 in browser

## Authentication Errors

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

