#!/bin/bash

# Kill any existing flex-related processes
echo "🧹 Cleaning up existing processes..."
pkill -f "flex" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true

# Wait a moment for processes to terminate
sleep 2

# Start the development server
echo "🚀 Starting development server..."
cd "$(dirname "$0")/.."
npm run dev

# Cleanup function
cleanup() {
    echo "🛑 Shutting down server..."
    pkill -f "flex" 2>/dev/null || true
    pkill -f "nest start" 2>/dev/null || true
    exit 0
}

# Trap SIGINT and SIGTERM signals
trap cleanup SIGINT SIGTERM

# Wait for the background process
wait
