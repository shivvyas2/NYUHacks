# Quick Deployment Guide

## 🚀 Deploy in 5 Minutes

### Step 1: Deploy Backend (Railway - Easiest)

1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. **Important**: Set **Root Directory** to `backend`
5. Add Environment Variables:
   - `SUPABASE_URL` = your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service role key
6. Click "Deploy"
7. Copy your Railway URL (e.g., `https://your-app.railway.app`)

### Step 2: Deploy Frontend (Vercel)

1. Go to https://vercel.com
2. Click "New Project" → Import from GitHub
3. Select your repository
4. **Important**: Set **Root Directory** to `frontend`
5. Add Environment Variables:
   - `NEXT_PUBLIC_API_URL` = your Railway URL from Step 1
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
6. Click "Deploy"

### Step 3: Update Backend CORS

1. Go back to Railway dashboard
2. Add Environment Variable:
   - `ALLOWED_ORIGINS` = your Vercel URL (e.g., `https://your-app.vercel.app`)
3. Railway will auto-restart

### Step 4: Test

1. Visit your Vercel URL
2. Try signing up
3. Play a game
4. Check stats

## ✅ Done!

Your app is now live! 🎉

## Environment Variables Checklist

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Backend (Railway)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `ALLOWED_ORIGINS` (add after frontend is deployed)

## Troubleshooting

**Frontend can't connect to backend?**
- Check `NEXT_PUBLIC_API_URL` matches your Railway URL
- Verify backend is running (check Railway logs)

**CORS errors?**
- Add your Vercel URL to `ALLOWED_ORIGINS` in Railway
- Restart backend

**Backend not starting?**
- Check Railway logs
- Verify environment variables are set
- Make sure root directory is `backend`

