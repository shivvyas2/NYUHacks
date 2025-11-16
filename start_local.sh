#!/bin/bash

# Start both frontend and backend for local development

echo "🚀 Starting NYU Hacks Arcade on Localhost"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the project root
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Check if ports are available
if check_port 8000; then
    echo "${YELLOW}⚠️  Port 8000 is already in use. Backend might already be running.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if check_port 3000; then
    echo "${YELLOW}⚠️  Port 3000 is already in use. Frontend might already be running.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check for .env file in backend
if [ ! -f "backend/.env" ]; then
    echo "${YELLOW}⚠️  Warning: backend/.env file not found${NC}"
    echo "Creating backend/.env from template..."
    cat > backend/.env << EOF
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# OR use anon key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# CORS Configuration (optional)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
EOF
    echo "${YELLOW}⚠️  Please edit backend/.env and add your Supabase credentials${NC}"
    echo ""
fi

# Start backend in background
echo "${BLUE}📦 Starting backend server...${NC}"
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || {
    echo "Using system Python..."
}

# Install dependencies if needed
if ! python -c "import fastapi" 2>/dev/null; then
    echo "Installing backend dependencies..."
    pip install -r requirements.txt
fi

# Start backend
python src/main.py > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend started successfully
if ! check_port 8000; then
    echo "${YELLOW}⚠️  Backend might not have started. Check backend.log for errors.${NC}"
else
    echo "${GREEN}✅ Backend running on http://localhost:8000${NC}"
fi

# Start frontend
echo "${BLUE}📦 Starting frontend server...${NC}"
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Check for .env.local
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local..."
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000
# Add your Supabase credentials if needed:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EOF
fi

# Start frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait a moment for frontend to start
sleep 3

# Check if frontend started successfully
if ! check_port 3000; then
    echo "${YELLOW}⚠️  Frontend might not have started. Check frontend.log for errors.${NC}"
else
    echo "${GREEN}✅ Frontend running on http://localhost:3000${NC}"
fi

echo ""
echo "=========================================="
echo "${GREEN}🎉 Both servers are starting!${NC}"
echo ""
echo "Frontend: ${BLUE}http://localhost:3000${NC}"
echo "Backend:  ${BLUE}http://localhost:8000${NC}"
echo "API Docs: ${BLUE}http://localhost:8000/docs${NC}"
echo ""
echo "Logs:"
echo "  - Backend:  tail -f backend.log"
echo "  - Frontend: tail -f frontend.log"
echo ""
echo "To stop servers, press Ctrl+C or run:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Wait for user to stop
echo "Press Ctrl+C to stop all servers..."
wait

