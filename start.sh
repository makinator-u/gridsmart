#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  GridSmart — Unified Full-Stack Launcher (Backend + Frontend)
# ─────────────────────────────────────────────────────────────

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

echo "⚡ Starting GridSmart Full-Stack Application..."

# 1. Clean up any existing processes on ports 8000 & 5173
echo "🔍 Checking ports 8000 and 5173..."
for PORT in 8000 5173; do
  PID=$(lsof -ti tcp:$PORT 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "⚠️  Stopping existing process on port $PORT (PID $PID)..."
    kill -9 "$PID" 2>/dev/null || true
  fi
done

# 2. Setup & Start Backend
echo "🐍 Setting up backend..."
cd "$BACKEND_DIR"
if [ ! -d ".venv" ]; then
  echo "📦 Creating Python virtual environment..."
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo "🚀 Launching FastAPI backend on http://127.0.0.1:8000 ..."
.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload &
BACKEND_PID=$!

# 3. Setup & Start Frontend
echo "⚛️  Setting up frontend..."
cd "$FRONTEND_DIR"
if [ ! -d "node_modules" ]; then
  echo "📦 Installing npm dependencies..."
  npm install
fi

echo "🚀 Launching Vite frontend on http://localhost:5173 ..."
npm run dev &
FRONTEND_PID=$!

# Cleanup on Ctrl+C
trap 'echo -e "\n🛑 Stopping GridSmart..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0' SIGINT SIGTERM

echo ""
echo "================================================================"
echo " ✅ GridSmart is ONLINE!"
echo " 🌐 Frontend Web UI:  http://localhost:5173"
echo " 🔌 Backend API Docs: http://127.0.0.1:8000/docs"
echo "================================================================"
echo "Press Ctrl+C to stop both servers."
echo ""

wait
