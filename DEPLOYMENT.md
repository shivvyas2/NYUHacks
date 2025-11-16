# Deployment Guide - Vercel + Backend Platform

Complete deployment guide for NYU Hacks Arcade on Vercel (frontend) and a backend platform (Railway/Render/Fly.io).

## Quick Start

### 1. Deploy Backend First

Choose a platform and deploy the backend:

**Railway (Recommended - Easiest)**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
cd backend
railway login
railway init
railway up
```

**Or use Railway Dashboard:**
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select repository, set root to `backend`
4. Add environment variables
5. Deploy

### 2. Get Backend URL

After deployment, copy your backend URL:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- Fly.io: `https://your-app.fly.dev`

### 3. Deploy Frontend to Vercel

**Using Vercel Dashboard:**
1. Go to https://vercel.com
2. New Project → Import from GitHub
3. Select your repository
4. **Root Directory**: `frontend`
5. **Framework Preset**: Next.js (auto-detected)
6. Add Environment Variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
7. Deploy

**Using Vercel CLI:**
```bash
cd frontend
npm i -g vercel
vercel
# Follow prompts, set root to 'frontend'
# Add environment variables when prompted
vercel --prod
```

### 4. Update Backend CORS

After frontend is deployed, update backend CORS:

**In Railway/Render/Fly.io environment variables:**
```
ALLOWED_ORIGINS=https://your-frontend.vercel.app,https://your-custom-domain.com
```

Or manually update `backend/src/main.py` and redeploy.

## Environment Variables

### Frontend (Vercel)

In Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.railway.app` | Backend API URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Supabase anon key |

### Backend (Railway/Render/Fly.io)

| Variable | Value | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | Your Supabase URL | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | Supabase service key |
| `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app` | Comma-separated frontend URLs |
| `PORT` | `8000` or `$PORT` | Server port (usually auto-set) |

## Platform-Specific Guides

### Railway Deployment

1. **Create Account**: https://railway.app
2. **New Project** → Deploy from GitHub
3. **Select Repository** → Choose `backend` as root directory
4. **Add Variables**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ALLOWED_ORIGINS` (after frontend is deployed)
5. **Deploy** → Railway auto-detects Python and deploys

Railway will:
- Auto-detect Python
- Install from `requirements.txt`
- Run `uvicorn src.main:app` (or use `railway.json`)

### Render Deployment

1. **Create Account**: https://render.com
2. **New** → Web Service
3. **Connect GitHub** → Select repository
4. **Settings**:
   - Root Directory: `backend`
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`
5. **Add Environment Variables** (same as Railway)
6. **Deploy**

### Fly.io Deployment

1. **Install CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Login**: `fly auth login`
3. **In backend directory**:
   ```bash
   fly launch
   # Follow prompts
   ```
4. **Set Secrets**:
   ```bash
   fly secrets set SUPABASE_URL=your_url
   fly secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
   fly secrets set ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
5. **Deploy**: `fly deploy`

## Post-Deployment Steps

### 1. Update Backend CORS

After frontend is deployed, add your Vercel URL to backend CORS:

**Option A: Environment Variable (Recommended)**
```
ALLOWED_ORIGINS=https://your-app.vercel.app
```

**Option B: Manual Update**
Edit `backend/src/main.py` and add your Vercel URL to `allowed_origins`.

### 2. Test Deployment

1. **Frontend**: Visit your Vercel URL
2. **Backend Health**: `https://your-backend-url/api/health`
3. **API Docs**: `https://your-backend-url/docs`
4. **Test Signup/Login**: Try creating an account
5. **Test Game**: Play a game and verify scores save

### 3. Database Setup

Make sure you've run the database schema in Supabase:
1. Go to Supabase Dashboard → SQL Editor
2. Run `backend/database/schema.sql`
3. Verify tables are created

## Troubleshooting

### Frontend Can't Connect to Backend

1. Check `NEXT_PUBLIC_API_URL` in Vercel matches your backend URL
2. Verify backend is running (check platform logs)
3. Check CORS configuration in backend

### CORS Errors

1. Add frontend URL to `ALLOWED_ORIGINS` in backend
2. Restart backend after CORS changes
3. Clear browser cache

### Backend Not Starting

1. Check platform logs for errors
2. Verify environment variables are set
3. Check Python version (needs 3.8+)
4. Verify `requirements.txt` is correct

### Environment Variables Not Working

- **Vercel**: Variables must start with `NEXT_PUBLIC_` for client access
- **Backend**: Check platform logs for missing variables
- Restart services after adding variables

## Custom Domains

### Frontend (Vercel)

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS as instructed
4. Update `ALLOWED_ORIGINS` in backend with new domain

### Backend

Most platforms support custom domains:
- **Railway**: Settings → Domains
- **Render**: Settings → Custom Domain
- **Fly.io**: `fly domains add your-domain.com`

## Monitoring

### Vercel Analytics

Enable in Vercel Dashboard → Analytics

### Backend Logs

- **Railway**: View logs in dashboard
- **Render**: Logs tab in dashboard
- **Fly.io**: `fly logs`

## Cost Estimates

- **Vercel**: Free tier available (generous limits)
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

## Support

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Fly.io Docs: https://fly.io/docs

