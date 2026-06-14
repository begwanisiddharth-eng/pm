# Build the Next frontend to frontend/out (static export served by FastAPI).
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Push-Location (Join-Path $root "frontend")
try {
  npm install
  npm run build
} finally {
  Pop-Location
}
Write-Host "Frontend built to frontend/out"
