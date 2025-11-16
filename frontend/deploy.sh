#!/bin/bash

# Vercel Deployment Script for SATistics Frontend

echo "🚀 Starting Vercel Deployment..."
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Check if vercel CLI is available
if ! command -v vercel &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Error: Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "🌐 Deploying to Vercel..."
echo ""
echo "⚠️  IMPORTANT: Make sure you have set these environment variables in Vercel Dashboard:"
echo "   - NEXT_PUBLIC_API_URL"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "Press Enter to continue with deployment, or Ctrl+C to cancel..."
read

# Deploy using npx vercel (works without global install)
npx vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Go to your Vercel dashboard"
echo "   2. Check Settings → Environment Variables"
echo "   3. Ensure all required variables are set"
echo "   4. Redeploy if needed"

