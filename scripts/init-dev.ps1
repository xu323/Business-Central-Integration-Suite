# =============================================================
#  init-dev.ps1
#  一鍵初始化本機開發環境（Windows PowerShell）
#
#  Usage (in PowerShell, from project root):
#     .\scripts\init-dev.ps1
# =============================================================

$ErrorActionPreference = "Stop"

function Write-Step($msg) {
    Write-Host ""
    Write-Host "==> $msg" -ForegroundColor Cyan
}

function Test-Cmd($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

Write-Step "Checking prerequisites"
$missing = @()
foreach ($c in @("python", "node", "npm", "git")) {
    if (-not (Test-Cmd $c)) { $missing += $c }
}
if ($missing.Count -gt 0) {
    Write-Host "Missing: $($missing -join ', ')" -ForegroundColor Red
    Write-Host "Install Python 3.11+, Node.js 20+, and Git, then re-run." -ForegroundColor Yellow
    exit 1
}

# --- Backend setup ---
Write-Step "Setting up Python virtual environment in apps/api/.venv"
Push-Location apps/api
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt

# Build a default .env if missing
if (-not (Test-Path "..\..\.env")) {
    Copy-Item "..\..\.env.example" "..\..\.env"
    Write-Host "Created .env from .env.example" -ForegroundColor Green
}

# Bring up DB (sqlite, will auto-create on first run)
Write-Step "Bootstrapping local DB & seed data"
python -c "from app.seed import seed_if_empty; seed_if_empty()"
Pop-Location

# --- Frontend setup ---
Write-Step "Installing frontend dependencies"
Push-Location apps/web
npm install --no-audit --no-fund
Pop-Location

Write-Step "All set. Next steps:"
Write-Host "  Terminal 1 (API):   cd apps/api; .\.venv\Scripts\Activate.ps1; uvicorn app.main:app --reload" -ForegroundColor Yellow
Write-Host "  Terminal 2 (Web):   cd apps/web; npm run dev" -ForegroundColor Yellow
Write-Host "  Browser:            http://localhost:5173 (UI)   http://localhost:8000/docs (Swagger)" -ForegroundColor Yellow
