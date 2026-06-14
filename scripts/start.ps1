# Start the FastAPI server (Windows). Serves the app at http://localhost:8000
# Pass -Build to (re)build the frontend first.
param([switch]$Build)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$backend = Join-Path $root "backend"
if ($Build) { & (Join-Path $PSScriptRoot "build-frontend.ps1") }
$proc = Start-Process -FilePath "uv" `
  -ArgumentList "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000" `
  -WorkingDirectory $backend -PassThru
$proc.Id | Out-File -FilePath (Join-Path $PSScriptRoot ".server.pid") -Encoding ascii
Write-Host "Server started (PID $($proc.Id)) on http://localhost:8000"
