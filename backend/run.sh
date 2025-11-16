#!/bin/bash

# Run FastAPI backend server

echo "Starting FastAPI backend server..."
echo ""

# Find Python executable - always prefer python3
if command -v python3 &> /dev/null; then
    PYTHON=python3
    PIP_CMD="python3 -m pip"
elif command -v python &> /dev/null; then
    PYTHON=python
    PIP_CMD="python -m pip"
else
    echo "Error: Python not found. Please install Python 3.8 or higher."
    exit 1
fi

# Check if virtual environment exists and is valid
USE_VENV=false
if [ -d "venv" ]; then
    # Check if venv Python exists and works
    if [ -f "venv/bin/python" ] && venv/bin/python --version &> /dev/null; then
        echo "Activating virtual environment..."
        source venv/bin/activate
        PYTHON=python
        PIP_CMD="python -m pip"
        USE_VENV=true
    else
        echo "Warning: Virtual environment exists but appears broken. Using system Python."
    fi
fi

# Check if dependencies are installed
if ! $PYTHON -c "import fastapi" 2>/dev/null; then
    echo "Installing dependencies..."
    $PIP_CMD install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install dependencies. Trying with --user flag..."
        $PIP_CMD install --user -r requirements.txt
    fi
fi

# Verify FastAPI is installed
if ! $PYTHON -c "import fastapi" 2>/dev/null; then
    echo "Error: FastAPI is not installed. Please install dependencies manually:"
    echo "  $PIP_CMD install -r requirements.txt"
    exit 1
fi

# Run the server
echo "Starting server on http://localhost:8000"
echo "API docs available at http://localhost:8000/docs"
echo ""
$PYTHON src/main.py

