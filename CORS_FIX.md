# CORS 400 Bad Request Fix

## Issue
Browser is getting `400 Bad Request` on OPTIONS preflight requests, even though manual curl tests return `200 OK`.

## Root Cause
FastAPI might be trying to resolve dependencies (like `get_db()`) even for OPTIONS requests, which can cause validation errors.

## Solution Applied

1. **Added explicit OPTIONS handlers** - These bypass dependency injection
2. **Updated CORS middleware** - Explicitly allows OPTIONS method
3. **Made HTTPBearer optional** - `auto_error=False` prevents errors on missing tokens

## Files Changed

- `backend/src/api/auth.py` - Added OPTIONS handlers for signup/login
- `backend/src/main.py` - Updated CORS middleware configuration

## Testing

After restarting the server, test with:

```bash
curl -X OPTIONS http://localhost:8000/api/auth/signup \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  -v
```

Should return `200 OK` with proper CORS headers.

## Next Steps

1. **Restart FastAPI server** to apply changes
2. **Clear browser cache** and try again
3. **Check browser console** - should see successful requests now

If still getting 400:
- Check server logs for specific error
- Verify `.env` file has correct Supabase credentials
- Make sure server restarted after changes

