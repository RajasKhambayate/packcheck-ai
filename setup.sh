#!/usr/bin/env bash
# One-command local setup for PackCheck AI (no Docker required).
# Usage: ./setup.sh
set -e

echo "==> Setting up PackCheck AI backend"
cd backend
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
[ -f ".env" ] || cp .env.example .env
python -m app.seed
deactivate
cd ..

echo "==> Setting up PackCheck AI frontend"
cd frontend
npm install
cd ..

cat <<'EOF'

Setup complete.

Terminal 1 (backend):
  cd backend && source .venv/bin/activate && uvicorn app.main:app --reload

Terminal 2 (frontend):
  cd frontend && npm run dev

Then open http://localhost:5173
Login: admin@packcheck.ai / Admin@123

EOF
