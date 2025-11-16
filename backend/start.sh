#!/bin/bash

echo "🚀 Starting SAT Learning Agent Backend..."
echo ""

# Check for Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"

# Check for API key in config
echo ""
echo "🔑 Checking API configuration..."
python3 -c "from config import OPENROUTER_API_KEY; print('✅ OpenRouter API key configured!' if OPENROUTER_API_KEY else '❌ No API key found')"

# Check for dependencies
echo ""
echo "📦 Checking dependencies..."

if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "❌ Dependencies not installed."
    echo "   Run: pip install -r requirements.txt"
    exit 1
fi

echo "✅ Dependencies installed"

# Start server
echo ""
echo "🎮 Starting server on http://localhost:8000"
echo "📚 API docs at http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python3 main.py

