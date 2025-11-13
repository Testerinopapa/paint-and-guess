#!/bin/bash

# Bash script to start both frontend and backend development servers
echo "Starting Paint & Guess development servers..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Start backend server in background
echo "Starting backend server..."
cd backend && npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend server in background
echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

# Wait for servers to be ready
echo "Waiting for servers to start..."
sleep 5

# Open Chromium browser
FRONTEND_URL="http://localhost:8080"
echo "Checking for Chromium browser..."

# Detect OS and open Chromium only (no Chrome fallback)
CHROMIUM_FOUND=false
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - check for Chromium
    if open -a "Chromium" "$FRONTEND_URL" 2>/dev/null; then
        echo "Opening Chromium browser..."
        CHROMIUM_FOUND=true
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux - check for Chromium
    if command -v chromium >/dev/null 2>&1; then
        echo "Opening Chromium browser..."
        chromium "$FRONTEND_URL" 2>/dev/null
        CHROMIUM_FOUND=true
    elif command -v chromium-browser >/dev/null 2>&1; then
        echo "Opening Chromium browser..."
        chromium-browser "$FRONTEND_URL" 2>/dev/null
        CHROMIUM_FOUND=true
    fi
fi

if [ "$CHROMIUM_FOUND" = false ]; then
    echo "Chromium not found. Please install Chromium to auto-open the browser."
    echo "Frontend URL: $FRONTEND_URL"
fi

echo ""
echo "Both servers are running!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:8080"
echo "Browser should open automatically!"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait

