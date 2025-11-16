#!/bin/bash

echo "╔════════════════════════════════════════════════╗"
echo "║   SAT Learning Agent - Backend Setup          ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Check if we're in the backend directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found!"
    echo "   Please run this script from the backend/ directory"
    exit 1
fi

# Step 1: Check Python
echo "📍 Step 1/5: Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8 or higher."
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo "✅ Found: $PYTHON_VERSION"
echo ""

# Step 2: Create virtual environment
echo "📍 Step 2/5: Creating virtual environment..."
if [ -d "venv" ]; then
    echo "⚠️  Removing old virtual environment..."
    rm -rf venv
fi
python3 -m venv venv
echo "✅ Virtual environment created!"
echo ""

# Step 3: Activate and install dependencies
echo "📍 Step 3/5: Installing dependencies..."
source venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt
echo "✅ Dependencies installed!"
echo ""

# Step 4: Verify API key
echo "📍 Step 4/5: Verifying API configuration..."
python3 << EOF
try:
    from config import OPENROUTER_API_KEY
    if OPENROUTER_API_KEY and len(OPENROUTER_API_KEY) > 20:
        print(f"✅ API Key configured: {OPENROUTER_API_KEY[:25]}...")
    else:
        print("❌ API Key not configured in config.py")
        exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    exit(1)
EOF

if [ $? -ne 0 ]; then
    echo ""
    echo "⚠️  Please add your OpenRouter API key to config.py"
    exit 1
fi
echo ""

# Step 5: Test the agent
echo "📍 Step 5/5: Testing AI agent..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
python test_agent.py

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "╔════════════════════════════════════════════════╗"
    echo "║          ✅ SETUP COMPLETE! ✅                 ║"
    echo "╚════════════════════════════════════════════════╝"
    echo ""
    echo "🚀 To start the server:"
    echo "   source venv/bin/activate"
    echo "   python main.py"
    echo ""
    echo "📚 Or use the start script:"
    echo "   bash start.sh"
    echo ""
    echo "🌐 Server will run at: http://localhost:8000"
    echo "📖 API docs will be at: http://localhost:8000/docs"
    echo ""
else
    echo ""
    echo "❌ Setup failed. Please check the errors above."
    exit 1
fi

