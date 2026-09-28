#!/bin/bash
# ─────────────────────────────────────────────
#  GridSmart — Backend Launcher
# ─────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

VENV_DIR=".venv"

# 1. Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
  echo "📦  Creating virtual environment..."
  python3 -m venv "$VENV_DIR"
fi

# 2. Activate virtual environment
source "$VENV_DIR/bin/activate"

# 3. Install / upgrade dependencies
echo "🔄  Installing dependencies from requirements.txt..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# 4. Free port 8000 if already in use
PORT=8000
EXISTING_PID=$(lsof -ti tcp:$PORT 2>/dev/null || true)
if [ -n "$EXISTING_PID" ]; then
  echo "⚠️   Port $PORT in use (PID $EXISTING_PID) — stopping it first..."
  kill -9 "$EXISTING_PID" 2>/dev/null || true
  sleep 1
fi

# 5. Start Uvicorn
echo ""
echo "✅  Backend running at → http://127.0.0.1:8000"
echo "📄  API docs          → http://127.0.0.1:8000/docs"
echo "────────────────────────────────────────────────"
echo ""

exec .venv/bin/uvicorn app.main:app \
  --host 127.0.0.1 \
  --port 8000 \
  --reload
