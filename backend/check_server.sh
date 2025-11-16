#!/bin/bash

# Quick script to check if FastAPI server is running

echo "Checking FastAPI server status..."
echo ""

# Check if port 8000 is in use
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "✅ Port 8000 is in use"
    echo ""
    echo "Testing server response..."
    if curl -s http://localhost:8000/ > /dev/null 2>&1; then
        echo "✅ Server is responding at http://localhost:8000"
        echo ""
        echo "Testing CORS..."
        if curl -s -X OPTIONS http://localhost:8000/api/auth/signup \
           -H "Origin: http://localhost:3000" \
           -H "Access-Control-Request-Method: POST" \
           -H "Access-Control-Request-Headers: Content-Type" \
           -v 2>&1 | grep -q "200\|204"; then
            echo "✅ CORS preflight is working"
        else
            echo "⚠️  CORS preflight might have issues"
        fi
    else
        echo "❌ Server is not responding"
    fi
else
    echo "❌ Port 8000 is not in use"
    echo ""
    echo "Start the server with:"
    echo "  cd backend && ./start.sh"
fi

