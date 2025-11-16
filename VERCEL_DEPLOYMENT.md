# Vercel Deployment Guide

This guide covers deploying both the frontend (Next.js) and backend (FastAPI) for NYU Hacks Arcade.

## Architecture

- **Frontend**: Next.js app deployed on Vercel
- **Backend**: FastAPI deployed separately (Railway, Render, Fly.io, or similar)
- **Database**: Supabase (cloud-hosted)

## Frontend Deployment (Vercel)

### Step 1: Prepare Frontend

1. Make sure `frontend/.env.local` is NOT committed (it's gitignored)
2. All environment variables will be set in Vercel dashboard

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
cd frontend
npm install -g vercel
vercel
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `frontend`
5. Configure environment variables (see below)
6. Deploy

### Step 3: Environment Variables in Vercel

In Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: 
- `NEXT_PUBLIC_API_URL` should point to your deployed backend
- Use `NEXT_PUBLIC_` prefix for client-side accessible variables

### Step 4: Build Settings

Vercel will auto-detect Next.js, but verify:
- **Framework Preset**: Next.js
- **Root Directory**: `frontend`
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

## Backend Deployment Options

Vercel doesn't natively support Python/FastAPI. Choose one:

### Option 1: Railway (Recommended)

1. Go to https://railway.app
2. Create new project
3. Connect GitHub repository
4. Add service → Deploy from GitHub repo
5. Set root directory to `backend`
6. Add environment variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
7. Railway will auto-detect Python and install dependencies
8. Set start command: `python src/main.py` or `uvicorn src.main:app --host 0.0.0.0 --port $PORT`

### Option 2: Render

1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repository
4. Settings:
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (same as Railway)

### Option 3: Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. In `backend/` directory:
   ```bash
   fly launch
   ```
3. Follow prompts
4. Set secrets:
   ```bash
   fly secrets set SUPABASE_URL=your_url
   fly secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
   ```

### Option 4: Vercel Serverless Functions (Advanced)

If you want everything on Vercel, you'd need to convert FastAPI to Vercel serverless functions. This is more complex but possible.

## Environment Variables Summary

### Frontend (Vercel)
```
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (Railway/Render/Fly.io)
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
PORT=8000  # Usually auto-set by platform
```

## CORS Configuration

After deploying backend, update CORS in `backend/src/main.py`:

```python
allow_origins=[
    "http://localhost:3000",  # Local dev
    "https://your-frontend.vercel.app",  # Production
    "https://your-frontend-domain.com",  # Custom domain
]
```

## Post-Deployment Checklist

- [ ] Frontend deployed on Vercel
- [ ] Backend deployed (Railway/Render/Fly.io)
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

## Troubleshooting

### CORS Errors in Production
- Update `allow_origins` in backend with your Vercel URL
- Restart backend after CORS changes

### Environment Variables Not Working
- Vercel: Variables must start with `NEXT_PUBLIC_` to be accessible in browser
- Backend: Check platform logs for missing variables

### Backend Not Starting
- Check platform logs
- Verify Python version (3.8+)
- Ensure `requirements.txt` is in backend root
- Check start command is correct

## Quick Deploy Commands

### Frontend (Vercel CLI)
```bash
cd frontend
vercel --prod
```

### Backend (Railway CLI)
```bash
cd backend
railway up
```

## Custom Domain Setup

1. **Frontend**: Vercel → Settings → Domains
2. **Backend**: Update CORS with new domain
3. **Update Frontend**: Change `NEXT_PUBLIC_API_URL` if needed

