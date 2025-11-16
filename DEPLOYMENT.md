# Deployment Guide

Complete deployment guide for NYU Hacks Arcade. This guide covers deploying both frontend and backend to production.

## Architecture Overview

- **Frontend**: Next.js app deployed on Vercel
- **Backend**: FastAPI deployed on Vercel (serverless) or Railway/Render/Fly.io
- **Database**: Supabase (cloud-hosted)

## Quick Start

### Option 1: All on Vercel (Recommended)

**Deploy Backend to Vercel:**
```bash
cd backend
vercel --prod
```

**Deploy Frontend to Vercel:**
```bash
cd frontend
vercel --prod
```

**Set Environment Variables:**
- Frontend: `NEXT_PUBLIC_API_URL` = your backend Vercel URL
- Backend: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ALLOWED_ORIGINS`

### Option 2: Vercel Frontend + Railway/Render/Fly.io Backend

1. Deploy backend to Railway/Render/Fly.io (see platform-specific guides below)
2. Deploy frontend to Vercel
3. Set environment variables
4. Update CORS settings

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. Make sure `frontend/.env.local` is NOT committed (it's gitignored)
2. All environment variables will be set in Vercel dashboard

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI (Recommended)**
```bash
cd frontend
npm install -g vercel  # First time only
vercel login           # First time only
vercel                 # Preview deployment
vercel --prod          # Production deployment
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Set **Root Directory** to `frontend`
5. Configure environment variables (see below)
6. Click "Deploy"

### Step 3: Environment Variables

**IMPORTANT**: Environment variables must be set in the Vercel Dashboard, NOT in `vercel.json`.

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-url.vercel.app` | Backend API URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase anon key |

**Important Notes:**
- Use `NEXT_PUBLIC_` prefix for client-side accessible variables
- Set each variable for all environments (Production, Preview, Development)
- Use **Plain Text** type (not Secret) for `NEXT_PUBLIC_*` variables
- After adding variables, **redeploy** your project for changes to take effect

### Step 4: Build Settings

Vercel will auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

## Backend Deployment

### Option 1: Vercel Serverless Functions (Recommended)

The backend is configured to run on Vercel using serverless functions.

**Deploy:**
```bash
cd backend
vercel --prod
```

**Environment Variables:**
Set in Vercel Dashboard → Backend Project → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | Your Supabase URL | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Supabase service key |
| `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` | Comma-separated frontend URLs |

**Note:** The backend uses Mangum adapter to run FastAPI on Vercel serverless functions.

### Option 2: Railway (Alternative)

1. Go to https://railway.app
2. Create new project
3. Connect GitHub repository
4. Add service → Deploy from GitHub repo
5. Set **Root Directory** to `backend`
6. Add environment variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
7. Railway will auto-detect Python and install dependencies
8. Set start command: `python src/main.py` or `uvicorn src.main:app --host 0.0.0.0 --port $PORT`

**Using Railway CLI:**
```bash
npm i -g @railway/cli
cd backend
railway login
railway init
railway up
```

### Option 3: Render

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Settings:
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway)
6. Deploy

### Option 4: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. In `backend/` directory:
   ```bash
   fly launch
   # Follow prompts
   ```
3. Set secrets:
   ```bash
   fly secrets set SUPABASE_URL=your_url
   fly secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
   fly secrets set ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
4. Deploy: `fly deploy`

## Environment Variables Summary

### Frontend (Vercel)

```
NEXT_PUBLIC_API_URL=https://your-backend-url.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (Vercel/Railway/Render/Fly.io)

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
PORT=8000  # Usually auto-set by platform
```

## CORS Configuration

The backend automatically includes localhost origins for development. For production:

**Option A: Environment Variable (Recommended)**
```
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com
```

**Option B: Manual Update**
Edit `backend/src/main.py` and add your production URLs to the `allowed_origins` list.

## Post-Deployment Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed (Vercel/Railway/Render/Fly.io)
- [ ] Environment variables set in both platforms
- [ ] CORS updated with production frontend URL
- [ ] Database schema run in Supabase
- [ ] Test signup/login flow
- [ ] Test game score saving
- [ ] Verify API health endpoints

## Testing Production

1. **Frontend**: Visit your Vercel URL
2. **Backend Health**: `https://your-backend-url/api/health`
3. **API Docs**: `https://your-backend-url/docs`
4. **Test Authentication**: Try signing up and logging in
5. **Test Games**: Play a game and verify scores save

## Troubleshooting

### Frontend Can't Connect to Backend

1. Check `NEXT_PUBLIC_API_URL` in Vercel matches your backend URL exactly
2. Verify backend is running (check platform logs)
3. Check CORS configuration in backend
4. Clear browser cache and try again

### CORS Errors in Production

1. Add frontend URL to `ALLOWED_ORIGINS` in backend environment variables
2. Restart backend after CORS changes
3. Verify CORS middleware is configured correctly in `backend/src/main.py`
4. Check browser console for specific CORS error messages

### Environment Variables Not Working

**Vercel:**
- Variables must start with `NEXT_PUBLIC_` to be accessible in browser
- Use **Plain Text** type (not Secret) for `NEXT_PUBLIC_*` variables
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

**Backend:**
- Check platform logs for missing variables
- Verify variable names match exactly
- Restart service after adding variables

### Backend Not Starting

1. Check platform logs for errors
2. Verify Python version (needs 3.8+)
3. Ensure `requirements.txt` is in backend root
4. Check start command is correct
5. Verify all environment variables are set

### Database Connection Errors

1. Verify `.env` file has correct Supabase credentials
2. Check that database schema has been run in Supabase
3. Ensure Supabase project is active
4. Verify service role key has correct permissions

## Custom Domains

### Frontend (Vercel)

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS as instructed by Vercel
4. Update `ALLOWED_ORIGINS` in backend with new domain

### Backend

Most platforms support custom domains:
- **Vercel**: Automatically handles custom domains
- **Railway**: Settings → Domains
- **Render**: Settings → Custom Domain
- **Fly.io**: `fly domains add your-domain.com`

## Monitoring & Logs

### Vercel

- **Analytics**: Enable in Vercel Dashboard → Analytics
- **Logs**: View in Vercel Dashboard → Deployments → View Function Logs

### Backend Platforms

- **Railway**: View logs in dashboard
- **Render**: Logs tab in dashboard
- **Fly.io**: `fly logs`

## Cost Estimates

- **Vercel**: Free tier available (generous limits for hobby projects)
- **Railway**: $5/month (free trial available)
- **Render**: Free tier available (with limitations)
- **Fly.io**: Pay-as-you-go (free tier available)
- **Supabase**: Free tier available (generous limits)

## Security Checklist

- [ ] All `.env` files are gitignored
- [ ] Environment variables set in platform dashboards (not in code)
- [ ] CORS configured with specific origins (not `*`)
- [ ] Supabase RLS policies enabled
- [ ] Service role key only in backend (never in frontend)
- [ ] HTTPS enabled on all platforms
- [ ] Regular security updates for dependencies

## Quick Deploy Commands

### Frontend (Vercel CLI)
```bash
cd frontend
vercel --prod
```

### Backend (Vercel CLI)
```bash
cd backend
vercel --prod
```

### Backend (Railway CLI)
```bash
cd backend
railway up
```

## Support & Documentation

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Render Docs**: https://render.com/docs
- **Fly.io Docs**: https://fly.io/docs
- **Supabase Docs**: https://supabase.com/docs

## Next Steps

After deployment:
1. Set up monitoring and alerts
2. Configure custom domain (optional)
3. Set up CI/CD for automatic deployments
4. Enable analytics and error tracking
5. Review and optimize performance
