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

# 4. Start Uvicorn
echo ""
echo "✅  Backend running at → http://127.0.0.1:8000"
echo "📄  API docs          → http://127.0.0.1:8000/docs"
echo "────────────────────────────────────────────────"
echo ""

exec .venv/bin/uvicorn app.main:app \
  --host 127.0.0.1 \
  --port 8000 \
  --reload
