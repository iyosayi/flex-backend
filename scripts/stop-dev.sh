#!/bin/bash

echo "🛑 Stopping all flex-related processes..."

# Kill all flex-related processes
pkill -f "flex" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true

# Wait for processes to terminate
sleep 2

# Force kill if still running
pkill -9 -f "flex" 2>/dev/null || true
pkill -9 -f "nest start" 2>/dev/null || true

echo "✅ All processes stopped"
