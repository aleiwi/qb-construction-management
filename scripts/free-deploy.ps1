# QB - One-click Free Deployment (Windows PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File scripts/free-deploy.ps1
# Requires: git, node, npm

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  QB - Free Deployment (GitHub Pages + GHCR)" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

# 1) Checks
Write-Host "`n[1/5] Checking prerequisites..." -ForegroundColor Yellow
if (-not (Get-Command git -ErrorAction SilentlyContinue)) { throw "git not found" }
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "node not found" }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm not found" }
Write-Host "  git: $(git --version)" -ForegroundColor Green
Write-Host "  node: $(node --version)" -ForegroundColor Green

# 2) Install & build frontend for GH Pages
Write-Host "`n[2/5] Building frontend for GitHub Pages..." -ForegroundColor Yellow
Set-Location "$root/frontend"
if (-not (Test-Path "node_modules")) { npm ci }
$env:VITE_GH_PAGES = "true"
# VITE_API_URL can be set via env before running this script, or later via GitHub Variable / localStorage
if ($env:VITE_API_URL) { Write-Host "  VITE_API_URL=$env:VITE_API_URL" -ForegroundColor DarkGray }
npm run build
if (-not (Test-Path "dist/index.html")) { throw "Build failed - dist/index.html not found" }
Copy-Item "dist/index.html" "dist/404.html" -Force
"" | Out-File -FilePath "dist/.nojekyll" -Encoding ascii
# Remove heavy villa assets for fast Pages push (optional, keep for local)
if (Test-Path "dist/villa-real.glb") { Remove-Item "dist/villa-real.glb" -Force; Write-Host "  Removed villa-real.glb (44M) for fast push" -ForegroundColor DarkGray }
if (Test-Path "dist/villa-render.png") { Remove-Item "dist/villa-render.png" -Force }
if (Test-Path "dist/villa3d.html") { Remove-Item "dist/villa3d.html" -Force }
Write-Host "  Build OK: $( (Get-ChildItem dist -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB ) MB" -ForegroundColor Green

# 3) Push to gh-pages branch
Write-Host "`n[3/5] Pushing to gh-pages branch..." -ForegroundColor Yellow
Set-Location $root
$tmp = Join-Path $env:TEMP "qb-dist-$(Get-Random)"
New-Item -ItemType Directory -Path $tmp | Out-Null
Copy-Item "frontend/dist/*" $tmp -Recurse -Force
Copy-Item "frontend/dist/.nojekyll" $tmp -Force -ErrorAction SilentlyContinue
if (-not (Test-Path "$tmp/.nojekyll")) { "" | Out-File "$tmp/.nojekyll" -Encoding ascii }

$current = git branch --show-current
try {
    git checkout --orphan gh-pages 2>$null | Out-Null
    git rm -rf . 2>$null | Out-Null
    Remove-Item * -Recurse -Force -ErrorAction SilentlyContinue
    Copy-Item "$tmp/*" . -Recurse -Force
    if (Test-Path "$tmp/.nojekyll") { Copy-Item "$tmp/.nojekyll" . -Force }
    git add .nojekyll 404.html index.html assets 2>$null
    git commit -m "deploy: frontend to gh-pages (GH Pages free hosting)" | Out-Null
    git push origin gh-pages --force
    Write-Host "  Pushed gh-pages ✅" -ForegroundColor Green
} finally {
    git checkout $current 2>$null | Out-Null
    Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
}

# 4) Push master to trigger GHCR + Actions Pages
Write-Host "`n[4/5] Triggering GitHub Actions (GHCR + Pages)..." -ForegroundColor Yellow
Set-Location $root
# Ensure master is up to date (Actions will build GHCR image)
$hasChanges = (git status --porcelain | Measure-Object).Count -gt 0
if ($hasChanges) {
    git add -A
    git commit -m "chore: trigger free deploy"
}
git push origin master
Write-Host "  Pushed master ✅ -> Actions will build GHCR image (ghcr.io/aleiwi/qb-backend:latest)" -ForegroundColor Green

# 5) Summary
Write-Host "`n===================================================" -ForegroundColor Cyan
Write-Host "  Done! Next steps (manual, 2 min):" -ForegroundColor Cyan
Write-Host "  1. Enable Pages: https://github.com/aleiwi/qb-construction-management/settings/pages" -ForegroundColor White
Write-Host "     Source: Deploy from a branch -> gh-pages / (root)  OR  GitHub Actions" -ForegroundColor Gray
Write-Host "  2. Frontend will be live at: https://aleiwi.github.io/qb-construction-management/" -ForegroundColor White
Write-Host "  3. Backend GHCR: ghcr.io/aleiwi/qb-backend:latest (make Public in Packages)" -ForegroundColor White
Write-Host "  4. For full stack, follow FREE_DEPLOYMENT.md (Neon + Koyeb, 5 min, free)" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
