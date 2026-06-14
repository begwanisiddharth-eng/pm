# Stop the FastAPI server (Windows). Kills whatever is listening on port 8000.
$conns = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($conns) {
  $conns | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  Write-Host "Server stopped"
} else {
  Write-Host "No running server found"
}
$pidFile = Join-Path $PSScriptRoot ".server.pid"
if (Test-Path $pidFile) { Remove-Item $pidFile }
