#!/bin/bash

# Quick Test Script for Backend & Frontend
# This script helps verify the setup is correct

echo "NYU Hacks Arcade - Quick Test Script"
echo "========================================"
echo ""

# Check environment files
echo "1. Checking environment files..."
if [ -f "backend/.env" ]; then
    echo "   backend/.env exists"
    if grep -q "your_supabase" backend/.env 2>/dev/null; then
        echo "   Warning: backend/.env may still have placeholder values"
    else
        echo "   backend/.env appears to be configured"
    fi
else
    echo "   backend/.env not found"
fi

if [ -f "frontend/.env.local" ]; then
    echo "   frontend/.env.local exists"
    if grep -q "your_supabase" frontend/.env.local 2>/dev/null; then
        echo "   Warning: frontend/.env.local may still have placeholder values"
    else
        echo "   frontend/.env.local appears to be configured"
    fi
else
    echo "   frontend/.env.local not found"
fi

echo ""

# Check if frontend dependencies are installed
echo "2. Checking frontend dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo "   Frontend dependencies installed"
else
    echo "   Frontend dependencies not installed"
    echo "   Run: cd frontend && npm install"
fi

echo ""

# Check database schema file
echo "3. Checking database schema..."
if [ -f "backend/database/schema.sql" ]; then
    echo "   Database schema file exists"
    echo "   Remember to run this in Supabase SQL Editor!"
else
    echo "   Database schema file not found"
fi

echo ""

# Check key files
echo "4. Checking key files..."
files=(
    "frontend/middleware.ts"
    "frontend/app/api/games/save-score/route.ts"
    "frontend/lib/supabase/client.ts"
    "frontend/lib/supabase/server.ts"
    "backend/src/services/gameScoreService.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "   $file"
    else
        echo "   $file not found"
    fi
done

echo ""
echo "========================================"
echo "Next Steps:"
echo ""
echo "1. Make sure database schema is run in Supabase"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Open http://localhost:3000"
echo "4. Test signup/login flow"
echo "5. Play a game and verify scores are saved"
echo ""
echo "See TESTING_GUIDE.md for detailed testing steps"
echo ""

