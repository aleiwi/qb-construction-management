#!/usr/bin/env bash
# QB - One-click Free Deployment (Linux / macOS / WSL)
# Usage: bash scripts/free-deploy.sh  (or DOMAIN=xxx ./scripts/free-deploy.sh for VPS)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==================================================="
echo "  QB - Free Deployment (GitHub Pages + GHCR)"
echo "==================================================="

# 1) Checks
echo "[1/5] Checking prerequisites..."
command -v git >/dev/null || { echo "git not found"; exit 1; }
command -v node >/dev/null || { echo "node not found"; exit 1; }
command -v npm >/dev/null || { echo "npm not found"; exit 1; }
echo "  git: $(git --version)"
echo "  node: $(node --version)"

# 2) Build frontend for GH Pages
echo "[2/5] Building frontend for GitHub Pages..."
cd "$ROOT/frontend"
[ -d node_modules ] || npm ci
export VITE_GH_PAGES=true
# VITE_API_URL can be exported before running, or set later via GitHub Variable / localStorage
[ -n "${VITE_API_URL:-}" ] && echo "  VITE_API_URL=$VITE_API_URL"
npm run build
test -f dist/index.html || { echo "Build failed"; exit 1; }
cp dist/index.html dist/404.html
touch dist/.nojekyll
# Remove heavy villa assets for fast push
rm -f dist/villa-real.glb dist/villa-render.png dist/villa3d.html && echo "  Removed villa assets for fast push" || true
echo "  Build OK: $(du -sh dist | cut -f1)"

# 3) Push to gh-pages branch
echo "[3/5] Pushing to gh-pages branch..."
cd "$ROOT"
TMP=$(mktemp -d)
cp -r frontend/dist/* "$TMP/"
cp frontend/dist/.nojekyll "$TMP/" 2>/dev/null || touch "$TMP/.nojekyll"
CURRENT=$(git branch --show-current)
cleanup() { git checkout "$CURRENT" 2>/dev/null || true; rm -rf "$TMP"; }
trap cleanup EXIT
git checkout --orphan gh-pages 2>/dev/null
git rm -rf . 2>/dev/null || true
rm -rf ./* 2>/dev/null || true
cp -r "$TMP"/* ./
cp "$TMP/.nojekyll" ./ 2>/dev/null || touch .nojekyll
git add .nojekyll 404.html index.html assets 2>/dev/null || git add -A
git commit -m "deploy: frontend to gh-pages (GH Pages free hosting)" || true
git push origin gh-pages --force
echo "  Pushed gh-pages ✅"

# 4) Push master to trigger GHCR + Actions Pages
echo "[4/5] Triggering GitHub Actions (GHCR + Pages)..."
cd "$ROOT"
git checkout "$CURRENT"
if [ -n "$(git status --porcelain)" ]; then
  git add -A
  git commit -m "chore: trigger free deploy" || true
fi
git push origin master
echo "  Pushed master ✅ -> Actions will build GHCR image (ghcr.io/aleiwi/qb-backend:latest)"

# 5) Summary
echo ""
echo "==================================================="
echo "  Done! Next steps (manual, 2 min):"
echo "  1. Enable Pages: https://github.com/aleiwi/qb-construction-management/settings/pages"
echo "     Source: Deploy from a branch -> gh-pages / (root)  OR  GitHub Actions"
echo "  2. Frontend: https://aleiwi.github.io/qb-construction-management/"
echo "  3. Backend GHCR: ghcr.io/aleiwi/qb-backend:latest (make Public)"
echo "  4. For full stack, see FREE_DEPLOYMENT.md (Neon + Koyeb, 5 min)"
echo "==================================================="
