#!/usr/bin/env bash
#
# deploy.sh — PackCheck AI deployment helper
#
# Usage:
#   ./deploy.sh local                 Rebuild & run with Docker Compose on this machine
#   ./deploy.sh github <repo-url>     Init git (if needed), commit, push to GitHub
#   ./deploy.sh remote <user@host>    Rsync the project to a remote server and
#                                     (re)start it there with Docker Compose over SSH
#
# Examples:
#   ./deploy.sh local
#   ./deploy.sh github git@github.com:yourname/packcheck-ai.git
#   ./deploy.sh remote ubuntu@203.0.113.10
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ---------- output helpers ----------
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[0;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}==>${NC} $1"; }
warn()  { echo -e "${YELLOW}==> WARNING:${NC} $1"; }
fail()  { echo -e "${RED}==> ERROR:${NC} $1"; exit 1; }
need()  { command -v "$1" >/dev/null 2>&1 || fail "'$1' is required but not installed."; }

# ---------- health check ----------
wait_for_health() {
  local url="$1"
  local tries=30
  info "Waiting for backend health check at $url ..."
  for i in $(seq 1 "$tries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      info "Backend is healthy."
      return 0
    fi
    sleep 2
  done
  warn "Backend did not report healthy after $((tries * 2))s. Check logs with: docker compose logs -f backend"
  return 1
}

# ---------- local deploy ----------
deploy_local() {
  need docker
  docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 not found. Update Docker Desktop / install the compose plugin."

  info "Cleaning up any stuck/orphaned containers from a previous run..."
  if ! docker compose down --remove-orphans 2>/tmp/deploy_down_err.log; then
    if grep -qi "permission denied" /tmp/deploy_down_err.log; then
      warn "Permission denied stopping old containers — they were probably started with different privileges (e.g. sudo vs non-sudo, or your user isn't in the 'docker' group)."
      warn "Fix options:"
      warn "  1) Run this script with sudo: sudo ./deploy.sh local"
      warn "  2) Add yourself to the docker group so sudo is never needed:"
      warn "       sudo usermod -aG docker \$USER && newgrp docker"
      warn "     (then log out/in or reboot, and re-run ./deploy.sh local)"
      rm -f /tmp/deploy_down_err.log
      exit 1
    fi
  fi
  rm -f /tmp/deploy_down_err.log

  info "Building and starting containers (this can take a few minutes on first run)..."
  docker compose up --build -d

  wait_for_health "http://localhost/api/health" || true

  info "Recent backend logs:"
  docker compose logs --tail=20 backend

  echo
  info "Done. Open http://localhost in your browser."
  info "Login: admin@packcheck.ai / Admin@123 (change this before real use)"
  info "Stop with: docker compose down"
}

# ---------- GitHub deploy ----------
deploy_github() {
  local repo_url="${1:-}"
  [ -n "$repo_url" ] || fail "Usage: ./deploy.sh github <repo-url>  (e.g. git@github.com:you/packcheck-ai.git)"
  need git

  if [ ! -d .git ]; then
    info "Initializing git repository..."
    git init
    git branch -M main
  fi

  if ! git remote | grep -q '^origin$'; then
    info "Adding remote 'origin' -> $repo_url"
    git remote add origin "$repo_url"
  else
    local current
    current="$(git remote get-url origin)"
    if [ "$current" != "$repo_url" ]; then
      warn "Remote 'origin' already points to $current — leaving it as-is."
      warn "To change it: git remote set-url origin $repo_url"
    fi
  fi

  info "Staging and committing changes..."
  git add -A
  if git diff --cached --quiet; then
    info "Nothing new to commit."
  else
    local msg="Deploy: $(date -u '+%Y-%m-%d %H:%M UTC')"
    git commit -m "$msg"
  fi

  info "Pushing to origin/main..."
  git push -u origin main

  echo
  info "Pushed. GitHub Actions CI will now build both apps automatically."
  info "For a hosted one-click deploy, connect this repo on Render: New -> Blueprint (uses render.yaml)."
}

# ---------- remote server deploy ----------
deploy_remote() {
  local target="${1:-}"
  [ -n "$target" ] || fail "Usage: ./deploy.sh remote <user@host>  (e.g. ubuntu@203.0.113.10)"
  need rsync
  need ssh

  local remote_dir="~/packcheck-ai"

  info "Syncing project files to $target:$remote_dir ..."
  rsync -az --delete \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '__pycache__' \
    --exclude 'backend/.venv' \
    --exclude 'frontend/dist' \
    --exclude 'backend/app/static/uploads' \
    --exclude 'backend/app/static/reports' \
    ./ "$target:$remote_dir/"

  info "Building and (re)starting containers on $target ..."
  ssh "$target" "cd $remote_dir && command -v docker >/dev/null || { echo 'Docker is not installed on the remote host. Install Docker + the compose plugin first.'; exit 1; }; docker compose up --build -d"

  info "Checking backend health on remote host..."
  if ssh "$target" "curl -fsS http://localhost/api/health >/dev/null 2>&1"; then
    info "Backend is healthy on $target."
  else
    warn "Could not confirm health from inside the remote host. Check with: ssh $target 'cd $remote_dir && docker compose logs -f backend'"
  fi

  echo
  info "Done. If the server has a public IP/domain, open it in your browser (port 80)."
  info "Remember to open port 80/443 in your firewall/security group, and put this behind HTTPS for real use."
}

# ---------- main ----------
case "${1:-}" in
  local)
    deploy_local
    ;;
  github)
    shift
    deploy_github "${1:-}"
    ;;
  remote)
    shift
    deploy_remote "${1:-}"
    ;;
  *)
    echo "Usage:"
    echo "  ./deploy.sh local                 Rebuild & run locally with Docker Compose"
    echo "  ./deploy.sh github <repo-url>      Commit & push to GitHub"
    echo "  ./deploy.sh remote <user@host>     Deploy to a remote server via SSH"
    exit 1
    ;;
esac
