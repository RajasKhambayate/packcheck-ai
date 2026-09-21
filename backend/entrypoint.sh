#!/usr/bin/env sh
# Runs once per container start. app/seed.py already skips users that exist,
# so this is safe to run on every boot/redeploy.
set -e

echo "==> Ensuring default accounts exist..."
python -m app.seed

echo "==> Starting API server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
